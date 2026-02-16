from supabase import Client
from fastapi import HTTPException
from backend.app.schemas import FornecedorSchema, RepresentanteSchema, RepresentanteCreateSchema, ProdutoSchema, ProdutoCreateSchema, ProdutoFornecedorSchema
from backend.app.database import get_supabase_client

class FornecedorCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    def listar_todos(self):
        res = self.supabase.table("fornecedores").select("*, representante(*)").execute()
        return res.data

    def criar_fornecedor(self, fornecedor_data: dict):
        schema = FornecedorSchema(**fornecedor_data)
        fornecedor = schema.model_dump()
        self.supabase.table("fornecedores").insert(fornecedor).execute()
        return {"message": "Fornecedor criado com sucesso"}
    
    def deletar_fornecedor(self, cnpj: str):
        res = self.supabase.table("fornecedores").delete().eq("cnpj", cnpj).execute()
        if res.data:
            return {"message": "Fornecedor deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
        
    def atualizar_fornecedor(self, cnpj: str, fornecedor_data: dict):
        schema = FornecedorSchema(**fornecedor_data)
        fornecedor = schema.model_dump()
        res = self.supabase.table("fornecedores").update(fornecedor).eq("cnpj", cnpj).execute()
        if res.data:
            return {"message": "Fornecedor atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
        
    def buscar_fornecedor(self, cnpj = None):
        if cnpj == None:
            res = self.supabase.table("fornecedores").select("*").execute()
        else:
            res = self.supabase.table("fornecedores").select("*").eq("cnpj", cnpj).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
        
    def buscar_representante_fornecedor(self, cnpj_fornecedor: str):
        res = self.supabase.table("representante").select("*").eq("cnpj_fornecedor", cnpj_fornecedor).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Representante não encontrado")
        
    def buscar_fornecedores_favoritos(self):
        res = self.supabase.table("fornecedores").select("*").eq("favorito", True).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Nenhum fornecedor favorito encontrado")
        
class RepresentanteCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    def criar_representante(self, representante_data: dict):
        schema = RepresentanteCreateSchema(**representante_data)
        representante = schema.model_dump()
        self.supabase.table("representante").insert(representante).execute()
        return {"message": "Representante criado com sucesso"}
    
    def deletar_representante(self, cnpj_fornecedor: str):
        res = self.supabase.table("representante").delete().eq("cnpj_fornecedor", cnpj_fornecedor).execute()
        if res.data:
            return {"message": "Representante deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Representante não encontrado")
        
    def atualizar_representante(self, cnpj_fornecedor: str, representante_data: dict):
        schema = RepresentanteSchema(**representante_data)
        representante = schema.model_dump()
        res = self.supabase.table("representante").update(representante).eq("cnpj_fornecedor", cnpj_fornecedor).execute()
        if res.data:
            return {"message": "Representante atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Representante não encontrado")
        
    def buscar_representante(self, cnpj_fornecedor = None):
        if cnpj_fornecedor == None:
            res = self.supabase.table("representante").select("*").execute()
        else:
            res = self.supabase.table("representante").select("*").eq("cnpj_fornecedor", cnpj_fornecedor).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Representante não encontrado")
        
class ProdutoCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    def criar_produto(self, produto_data: dict):
        schema = ProdutoCreateSchema(**produto_data)
        produto = schema.model_dump()
        self.supabase.table("produto").insert(produto).execute()
        return {"message": "Produto criado com sucesso"}
    
    def deletar_produto(self, id: int):
        res = self.supabase.table("produto").delete().eq("id", id).execute()
        if res.data:
            return {"message": "Produto deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
    def atualizar_produto(self, id: int, produto_data: dict):
        schema = ProdutoSchema(**produto_data)
        produto = schema.model_dump()
        res = self.supabase.table("produto").update(produto).eq("id", id).execute()
        if res.data:
            return {"message": "Produto atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
    def buscar_produto(self, id = None):
        if id == None:
            res = self.supabase.table("produto").select("*").execute()
        else:
            res = self.supabase.table("produto").select("*").eq("id", id).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
class ProdutoFornecedorCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    def criar_produto_fornecedor(self, produto_fornecedor_data: dict):
        schema = ProdutoFornecedorSchema(**produto_fornecedor_data)
        produto_fornecedor = schema.model_dump()
        self.supabase.table("produtos_fornecedores").insert(produto_fornecedor).execute()
        return {"message": "Produto-Fornecedor criado com sucesso"}
    
    def deletar_produto_fornecedor(self, cnpj_fornecedor: str, id_produto: int):
        res = self.supabase.table("produtos_fornecedores").delete().eq("cnpj_fornecedor", cnpj_fornecedor).eq("id_produto", id_produto).execute()
        if res.data:
            return {"message": "Produto-Fornecedor deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto-Fornecedor não encontrado")
        
    def atualizar_produto_fornecedor(self, cnpj_fornecedor: str, id_produto: int, produto_fornecedor_data: dict):
        schema = ProdutoFornecedorSchema(**produto_fornecedor_data)
        produto_fornecedor = schema.model_dump()
        res = self.supabase.table("produtos_fornecedores").update(produto_fornecedor).eq("cnpj_fornecedor", cnpj_fornecedor).eq("id_produto",id_produto).execute()
        if res.data:
            return {"message": "Produto-Fornecedor atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto-Fornecedor não encontrado")
        
    def buscar_produto_fornecedor(self, cnpj_fornecedor = None, id_produto = None):
        if cnpj_fornecedor == None and id_produto == None:
            res = self.supabase.table("produtos_fornecedores").select("*").execute()
        elif cnpj_fornecedor != None and id_produto == None:
            res = self.supabase.table("produtos_fornecedores").select("*").eq("cnpj_fornecedor", cnpj_fornecedor).execute()
        elif cnpj_fornecedor == None and id_produto != None:
            res = self.supabase.table("produtos_fornecedores").select("*").eq("id_produto", id_produto).execute()
        else:
            res = self.supabase.table("produtos_fornecedores").select("*").eq("cnpj_fornecedor", cnpj_fornecedor).eq("id_produto", id_produto).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Produto-Fornecedor não encontrado")
        