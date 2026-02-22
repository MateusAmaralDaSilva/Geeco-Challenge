from pydantic import BaseModel
from typing import Optional

class FornecedorSchema(BaseModel):
    cnpj: str
    empresa: str
    localização: str 
    link_site: str
    descrição: str
    categoria: str
    favorito: bool
    
class RepresentanteSchema(BaseModel):
    id: int
    cnpj_fornecedor: str
    nome: str
    contato: str
    email: str
    atual: bool

class RepresentanteCreateSchema(BaseModel):
    cnpj_fornecedor: str
    nome: str
    contato: str
    email: str
    atual: bool

class ProdutoSchema(BaseModel):
    id: int = None
    nome: str

class ProdutoCreateSchema(BaseModel):
    nome: str
    
class ProdutoFornecedorSchema(BaseModel):
    cnpj_fornecedor: str
    id_produto: int
    
class DocumentosSchema(BaseModel):
    cnpj_fornecedor: str
    nome_arquivo: str
    caminho_storage: str   
    tipo_arquivo: str
    validade: str
    representante_upload: str
    
    
    