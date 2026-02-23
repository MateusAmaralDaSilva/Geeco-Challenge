from supabase import Client
from fastapi import HTTPException
from app.schemas import FornecedorSchema

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
        