from supabase import Client
from fastapi import HTTPException
from app.schemas import RepresentanteSchema, RepresentanteCreateSchema

class RepresentanteCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    def criar_representante(self, representante_data: dict):
        schema = RepresentanteCreateSchema(**representante_data)
        representante = schema.model_dump()
        self.supabase.table("representante").insert(representante).execute()
        return {"message": "Representante criado com sucesso"}
    
    def deletar_representante(self, id: int):
        self.supabase.table("representante").delete().eq("id", id).execute()
        return {"message": "Representante deletado com sucesso"}
        
    def atualizar_representante(self, id: int, representante_data: dict):
        schema = RepresentanteSchema(**representante_data)
        representante = schema.model_dump()
        res = self.supabase.table("representante").update(representante).eq("id", id).execute()
        if res.data:
            return {"message": "Representante atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Representante não encontrado")
        
    def buscar_representante(self, cnpj_fornecedor = None):
        if cnpj_fornecedor == None:
            res = self.supabase.table("representante").select("*").execute()
        else:
            res = self.supabase.table("representante").select("*").eq("cnpj_fornecedor", cnpj_fornecedor).execute()

        return res.data if res.data else []