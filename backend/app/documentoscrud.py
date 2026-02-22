from supabase import Client

class DocumentoCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.table = "documentos"
        self.bucket = "Documentos"

    def salvar_metadados(self, dados: dict):
        """Salva as informações do arquivo na tabela SQL"""
        return self.supabase.table(self.table).insert(dados).execute()

    def upload_arquivo(self, caminho_destino: str, arquivo_bytes: bytes, content_type: str):
        return self.supabase.storage.from_(self.bucket).upload(
            path=caminho_destino,
            file=arquivo_bytes,
            file_options={"content-type": content_type}
        )

    def listar_por_fornecedor(self, cnpj: str):
        return self.supabase.table(self.table).select("*").eq("cnpj_fornecedor", cnpj).execute()
    
    def listar_documentos_expirando(self, dias: int):
        query = f"""
            SELECT * FROM {self.table}
            WHERE validade <= NOW() + INTERVAL '{dias} days'
            AND validade >= NOW()
        """
        return self.supabase.rpc("sql", {"query": query}).execute()
    
    def listar_todos_documentos(self):
        return self.supabase.table(self.table).select("*").execute()

    def deletar_documento(self, id_doc: int, caminho_storage: str):
        self.supabase.table(self.table).delete().eq("id", id_doc).execute()
        self.supabase.storage.from_(self.bucket).remove([caminho_storage])
        return True