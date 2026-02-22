from supabase import Client
from fastapi import HTTPException
from app.schemas import ProdutoSchema, ProdutoCreateSchema

class ProdutoCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    def criar_produto(self, produto_data: dict):
        schema = ProdutoCreateSchema(**produto_data)
        produto = schema.model_dump()
        self.supabase.table("produtos").insert(produto).execute()
        return {"message": "Produto criado com sucesso"}
    
    def deletar_produto(self, id: int):
        res = self.supabase.table("produtos").delete().eq("id", id).execute()
        if res.data:
            return {"message": "Produto deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
    def atualizar_produto(self, id: int, produto_data: dict):
        schema = ProdutoSchema(**produto_data)
        produto = schema.model_dump()
        res = self.supabase.table("produtos").update(produto).eq("id", id).execute()
        if res.data:
            return {"message": "Produto atualizado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        
    def buscar_produto(self, id = None):
        if id == None:
            res = self.supabase.table("produtos").select("*").execute()
        else:
            res = self.supabase.table("produtos").select("*").eq("id", id).execute()
        if res.data:
            return res.data
        else:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        