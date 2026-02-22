from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer
import brazilcep
import re
import os
import uuid
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
# Importações internas
from app.fornecedorcrud import FornecedorCRUD
from app.representantecrud import RepresentanteCRUD
from app.produtocrud import ProdutoCRUD
from app.produtofornecedocrud import ProdutoFornecedorCRUD
from app.documentoscrud import DocumentoCRUD
from app.schemas import (
    FornecedorSchema, RepresentanteSchema, RepresentanteCreateSchema, 
    ProdutoSchema, ProdutoCreateSchema, ProdutoFornecedorSchema, DocumentosSchema
)
from app.database import get_supabase_client

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

router = APIRouter()
security = HTTPBearer()

# --- UTILITÁRIOS ---

def formatar_cnpj(cnpj: str) -> str:
    cnpj = re.sub(r'\D', '', str(cnpj))
    if len(cnpj) != 14:
        raise ValueError("CNPJ deve conter 14 dígitos.")
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"

def verificar_token(credenciais: HTTPBearer = Depends(security)):
    token = credenciais.credentials
    try:
        supabase = get_supabase_client()
        resposta = supabase.auth.get_user(token)
        
        if not resposta or not resposta.user:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return resposta.user
    except Exception as e:
        print(f"🔴 ERRO DE VALIDAÇÃO: {str(e)}")
        raise HTTPException(status_code=401, detail="Acesso não autorizado ou token expirado.")

# --- VÍNCULOS & DOCUMENTOS ---

@router.get("/fornecedores/{cnpj}/produtos")
async def listar_produtos_fornecedor(cnpj: str, user = Depends(verificar_token)):
    try:
        return ProdutoFornecedorCRUD(get_supabase_client()).buscar_produto_fornecedor(cnpj_fornecedor=formatar_cnpj(cnpj))
    except Exception as e:
        print(f"🔴 ERRO AO BUSCAR PRODUTOS: {str(e)}") # Isso vai aparecer na tela preta do terminal
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/produtos/{id}/fornecedores")
async def listar_fornecedores_do_produto(id: int, user = Depends(verificar_token)):
    try:
        return ProdutoFornecedorCRUD(get_supabase_client()).buscar_produto_fornecedor(id_produto=id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from datetime import datetime
import os

@router.post("/documentos/upload")
async def upload_documento(
    cnpj: str = Form(...),
    validade: str = Form(...),
    tipo_documento: str = Form(...),  # Mantemos apenas o tipo_documento
    file: UploadFile = File(...), 
    user = Depends(verificar_token)
):
    try:
        cnpj_limpo = "".join(filter(str.isdigit, cnpj))
        document = DocumentoCRUD(get_supabase_client())
        
        data_formatada = datetime.now().strftime("%Y%m%d-%H%M%S")
        nome, extensao = os.path.splitext(file.filename)
        nome = nome.replace(" ", "_")
        
        caminho_no_bucket = f"{cnpj_limpo}/{nome}-{data_formatada}{extensao}"

        arquivo_bytes = await file.read()
        document.upload_arquivo(caminho_no_bucket, arquivo_bytes, file.content_type)
        cnpj_formatado = formatar_cnpj(cnpj_limpo)
        
        dados_documento = {
            "cnpj_fornecedor": cnpj_formatado,
            "nome_arquivo": file.filename,
            "caminho_storage": caminho_no_bucket,
            "tipo_arquivo": file.content_type,
            "validade": validade,
            "tipo_documento": tipo_documento
        }
        
        res_db = document.salvar_metadados(dados_documento)
        if not res_db.data:
            raise Exception("Falha ao registrar metadados no banco de dados")

        return {
            "message": "Documento enviado com sucesso", 
            "id": res_db.data[0]['id'],
            "caminho": caminho_no_bucket
        }

    except Exception as e:
        print(f"Erro detalhado: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro no upload: {str(e)}")

@router.put("/documentos/{id}")
async def atualizar_documento(
    id: int,
    nome_arquivo: str = Form(...),
    validade: str = Form(...),
    file: Optional[UploadFile] = File(None), 
    user = Depends(verificar_token)
):
    try:
        dados = {
            "nome_arquivo": nome_arquivo,
            "validade": validade
        }
        
        novo_arquivo_bytes = None
        filename = None
        content_type = None

        if file and file.filename:
            novo_arquivo_bytes = await file.read()
            filename = file.filename
            content_type = file.content_type

        return DocumentoCRUD(get_supabase_client()).atualizar_documento(
            id, dados, novo_arquivo_bytes, filename, content_type
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/documentos/{id}")
async def deletar_documento(id: int, user = Depends(verificar_token)):
    try:
        return DocumentoCRUD(get_supabase_client()).deletar_documento(id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/fornecedores/{cnpj}/documentos")
async def listar_documentos_fornecedor(cnpj: str, user = Depends(verificar_token)):
    try:
        cnpj_f = formatar_cnpj(cnpj)
        return DocumentoCRUD(get_supabase_client()).listar_por_fornecedor(cnpj_f)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/fornecedores/{cnpj}/produtos/{id_produto}")
async def vincular_produto_ao_fornecedor(cnpj: str, id_produto: int, user = Depends(verificar_token)):
    try:
        dados = {"cnpj_fornecedor": formatar_cnpj(cnpj), "id_produto": id_produto}
        return ProdutoFornecedorCRUD(get_supabase_client()).criar_produto_fornecedor(dados)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/fornecedores/{cnpj}/produtos/{id_produto}")
async def desvincular_produto_do_fornecedor(cnpj: str, id_produto: int, user = Depends(verificar_token)):
    try:
        return ProdutoFornecedorCRUD(get_supabase_client()).deletar_produto_fornecedor(formatar_cnpj(cnpj), id_produto)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- FORNECEDORES ---

@router.post("/fornecedores/cadastro")
async def cadastrar_fornecedor(payload: dict, user = Depends(verificar_token)):
    try:
        f_data = payload.get("fornecedor_dict")
        if not f_data: 
            raise HTTPException(status_code=400, detail="Dados do fornecedor são obrigatórios.")
        
        f_data["cnpj"] = formatar_cnpj(f_data["cnpj"])
        
        fornecedor = FornecedorSchema(**f_data)
        
        db = get_supabase_client()
        FornecedorCRUD(db).criar_fornecedor(fornecedor.model_dump())
        
        return {"status": "sucesso", "message": "Fornecedor cadastrado com sucesso."}
    except Exception as e:
        print(f"🔴 ERRO REAL NO SERVIDOR: {e}") 
        raise HTTPException(status_code=400, detail=f"Erro no cadastro: {str(e)}")

@router.get("/fornecedores")
async def listar_fornecedores(cnpj: Optional[str] = None, user = Depends(verificar_token)):
    crud = FornecedorCRUD(get_supabase_client())
    return crud.buscar_fornecedor(cnpj) if cnpj else crud.buscar_fornecedor()

@router.get("/fornecedores/{cnpj:path}")
async def buscar_fornecedor_por_cnpj(cnpj: str, user = Depends(verificar_token)):
    try:
        cnpj_limpo = cnpj.replace("%2F", "/")
        cnpj_f = formatar_cnpj(cnpj_limpo)
        resultado = FornecedorCRUD(get_supabase_client()).buscar_fornecedor(cnpj_f)
        if not resultado:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado.")
        return resultado[0] if isinstance(resultado, list) else resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/fornecedores/{cnpj}")
async def atualizar_fornecedor(cnpj: str, fornecedor: FornecedorSchema, user = Depends(verificar_token)):
    try:
        cnpj_f = formatar_cnpj(cnpj)
        endereco = brazilcep.get_address_from_cep(fornecedor.localização)
        fornecedor.localização = f"{endereco['city']} - {endereco['uf']}"
        return FornecedorCRUD(get_supabase_client()).atualizar_fornecedor(cnpj_f, fornecedor.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro na atualização: {str(e)}")

@router.delete("/fornecedores/{cnpj}")
async def deletar_fornecedor(cnpj: str, user = Depends(verificar_token)):
    cnpj_f = formatar_cnpj(cnpj)
    return FornecedorCRUD(get_supabase_client()).deletar_fornecedor(cnpj_f)

# --- REPRESENTANTES ---

@router.post("/representantes/cadastro")
async def cadastrar_representante(representante: RepresentanteCreateSchema, user = Depends(verificar_token)):
    try:
        dados = representante.model_dump()
        dados["cnpj_fornecedor"] = formatar_cnpj(dados["cnpj_fornecedor"]) 
        
        return RepresentanteCRUD(get_supabase_client()).criar_representante(dados)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/representantes")
async def listar_representantes(cnpj_fornecedor: Optional[str] = None, user = Depends(verificar_token)):
    crud = RepresentanteCRUD(get_supabase_client())
    if cnpj_fornecedor:
        return crud.buscar_representante(formatar_cnpj(cnpj_fornecedor))
    return crud.buscar_representante()

@router.put("/representantes/{id}")
async def atualizar_representante(id: int, representante: RepresentanteSchema, user = Depends(verificar_token)):
    return RepresentanteCRUD(get_supabase_client()).atualizar_representante(id, representante.model_dump())

@router.delete("/representantes/{id}")
async def deletar_representante(id: int, user = Depends(verificar_token)):
    return RepresentanteCRUD(get_supabase_client()).deletar_representante(id)

# --- PRODUTOS ---

@router.get("/produtos")
async def listar_produtos(user = Depends(verificar_token)):
    return ProdutoCRUD(get_supabase_client()).buscar_produto()

@router.post("/produtos/cadastro")
async def cadastrar_produto(produto: ProdutoCreateSchema, user = Depends(verificar_token)):
    return ProdutoCRUD(get_supabase_client()).criar_produto(produto.model_dump())

@router.get("/produtos/{id}")
async def buscar_produto_por_id(id: int, user = Depends(verificar_token)):
    return ProdutoCRUD(get_supabase_client()).buscar_produto(id)

@router.put("/produtos/{id}")
async def atualizar_produto(id: int, produto: ProdutoSchema, user = Depends(verificar_token)):
    return ProdutoCRUD(get_supabase_client()).atualizar_produto(id, produto.model_dump())

@router.delete("/produtos/{id}")
async def deletar_produto(id: int, user = Depends(verificar_token)):
    return ProdutoCRUD(get_supabase_client()).deletar_produto(id)
