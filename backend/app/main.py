from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import brazilcep
from backend.app.crud import FornecedorCRUD, RepresentanteCRUD, ProdutoCRUD, ProdutoFornecedorCRUD
from backend.app.schemas import FornecedorSchema, RepresentanteSchema, RepresentanteCreateSchema, ProdutoSchema, ProdutoCreateSchema, ProdutoFornecedorSchema
from backend.app.database import get_supabase_client

app = FastAPI(title="Sistema de Gestão de Fornecedores")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import re

def formatar_cnpj(cnpj: str) -> str:
    # Remove qualquer caractere que não seja número
    cnpj = re.sub(r'\D', '', cnpj)
    
    # Valida tamanho
    if len(cnpj) != 14:
        raise ValueError("CNPJ deve conter 14 dígitos.")
    
    # Aplica formatação
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"


@app.get("/")
async def root():
    return {"message": "API de Gestão de Fornecedores Online"}

@app.post("/fornecedores/cadastro")
async def cadastrar_fornecedor(fornecedor_dict: dict,  representante_dict: dict = None):
    fornecedor = FornecedorSchema(**fornecedor_dict)
    try:
        cep = fornecedor.localização
        endereco = brazilcep.get_address_from_cep(cep)
        fornecedor.localização = f"{endereco['city']} - {endereco['uf']}"
        fornecedor_crud = FornecedorCRUD(get_supabase_client())
        fornecedor_crud.criar_fornecedor(fornecedor.model_dump())
        
        if representante_dict:
            representante = RepresentanteCreateSchema(**representante_dict)
            representante.cnpj_fornecedor = fornecedor.cnpj
            representante_crud = RepresentanteCRUD(get_supabase_client())
            representante_crud.criar_representante(representante.model_dump())
        
        return {"message": "Fornecedor cadastrado com sucesso"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao validar CEP ou salvar: {str(e)}")
    
@app.get("/fornecedores")
async def listar_fornecedores(cnpj: str = None):
    fornecedor_crud = FornecedorCRUD(get_supabase_client())
    if cnpj:
        return fornecedor_crud.buscar_fornecedor(cnpj)
    return fornecedor_crud.buscar_fornecedor()

@app.delete("/fornecedores/{cnpj}")
async def deletar_fornecedor(cnpj: str):
    cnpj = formatar_cnpj(cnpj)
    fornecedor_crud = FornecedorCRUD(get_supabase_client())
    return fornecedor_crud.deletar_fornecedor(cnpj)

@app.put("/fornecedores/{cnpj}")
async def atualizar_fornecedor(cnpj: str, fornecedor_dict: dict):
    cnpj = formatar_cnpj(cnpj)
    fornecedor = FornecedorSchema(**fornecedor_dict)
    try:
        cep = fornecedor.localização
        endereco = brazilcep.get_address_from_cep(cep)
        fornecedor.localização = f"{endereco['city']} - {endereco['uf']}"
        fornecedor_crud = FornecedorCRUD(get_supabase_client())
        return fornecedor_crud.atualizar_fornecedor(cnpj, fornecedor.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao validar CEP ou atualizar: {str(e)}")

@app.get("/fornecedores/{cnpj}/representantes")
async def listar_representantes_fornecedor(cnpj: str):
    cnpj = formatar_cnpj(cnpj)
    fornecedor_crud = FornecedorCRUD(get_supabase_client())
    return fornecedor_crud.buscar_representante_fornecedor(cnpj)

@app.post("/representantes/cadastro")
async def cadastrar_representante(representante_dict: dict):
    representante = RepresentanteCreateSchema(**representante_dict)
    representante_crud = RepresentanteCRUD(get_supabase_client())
    return representante_crud.criar_representante(representante.model_dump())

@app.get("/representantes")
async def listar_representantes(cnpj_fornecedor: str = None):
    representante_crud = RepresentanteCRUD(get_supabase_client())
    if cnpj_fornecedor:
        return representante_crud.buscar_representante_fornecedor(cnpj_fornecedor)
    return representante_crud.buscar_representante_fornecedor()

@app.delete("/representantes/{id}")
async def deletar_representante(id: int):
    representante_crud = RepresentanteCRUD(get_supabase_client())
    return representante_crud.deletar_representante(id)

@app.put("/representantes/{id}")
async def atualizar_representante(id: int, representante_dict: dict):
    representante = RepresentanteSchema(**representante_dict)
    representante_crud = RepresentanteCRUD(get_supabase_client())
    return representante_crud.atualizar_representante(id, representante.model_dump())

@app.get("/produtos")
async def listar_produtos():
    produto_crud = ProdutoCRUD(get_supabase_client())
    return produto_crud.buscar_produtos()

@app.post("/produtos/cadastro")
async def cadastrar_produto(produto_dict: dict):
    produto = ProdutoSchema(**produto_dict)
    produto_crud = ProdutoCRUD(get_supabase_client())
    return produto_crud.criar_produto(produto.model_dump())

@app.delete("/produtos/{id}")
async def deletar_produto(id: int):
    produto_crud = ProdutoCRUD(get_supabase_client())
    return produto_crud.deletar_produto(id)

@app.put("/produtos/{id}")
async def atualizar_produto(id: int, produto_dict: dict):
    produto = ProdutoSchema(**produto_dict)
    produto_crud = ProdutoCRUD(get_supabase_client())
    return produto_crud.atualizar_produto(id, produto.model_dump())

@app.delete("/fornecedores/{cnpj}/produtos/{produto_id}")
async def desassociar_produto_fornecedor(cnpj: str, produto_id: int):
    cnpj = formatar_cnpj(cnpj)
    produto_fornecedor_crud = ProdutoFornecedorCRUD(get_supabase_client())
    return produto_fornecedor_crud.deletar_produto_fornecedor(cnpj, produto_id)

@app.get("/fornecedores/{cnpj}/produtos")
async def listar_produtos_fornecedor(cnpj: str = None):
    cnpj = formatar_cnpj(cnpj)
    produto_fornecedor_crud = ProdutoFornecedorCRUD(get_supabase_client())
    return produto_fornecedor_crud.buscar_produto_fornecedor(cnpj=cnpj)

@app.get("/produtos/{id}/fornecedores")
async def listar_fornecedores_produto(id: int = None): 
    produto_fornecedor_crud = ProdutoFornecedorCRUD(get_supabase_client())
    return produto_fornecedor_crud.buscar_produto_fornecedor(id=id)

@app.get("/fornecedores/favoritos")
async def listar_fornecedores_favoritos():
    fornecedor_crud = FornecedorCRUD(get_supabase_client())
    return fornecedor_crud.buscar_fornecedores_favoritos()
    
@app.get("/fornecedores")
async def listar_fornecedores_produto(): 
    produto_fornecedor_crud = ProdutoFornecedorCRUD(get_supabase_client())
    return produto_fornecedor_crud.buscar_produto_fornecedor()