from supabase import Client
from fastapi import HTTPException
from app.schemas import ProdutoFornecedorSchema

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
        query = self.supabase.table("produtos_fornecedores").select("*, fornecedores(*), produtos(*)")
            
        if cnpj_fornecedor and not id_produto:
            res = query.eq("cnpj_fornecedor", cnpj_fornecedor).execute()
            if res.data:
                return [item["produtos"] for item in res.data if item.get("produtos")]
            return []
            
        elif id_produto and not cnpj_fornecedor:
            res = query.eq("id_produto", id_produto).execute()
            if res.data:
                return [item["fornecedores"] for item in res.data if item.get("fornecedores")]
            return []
            
        else:
            res = query.eq("cnpj_fornecedor", cnpj_fornecedor).eq("id_produto", id_produto).execute()
            return res.data if res.data else []