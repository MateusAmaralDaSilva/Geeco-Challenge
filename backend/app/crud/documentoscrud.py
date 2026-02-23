from supabase import Client
from datetime import datetime
from os import path
import re
import unicodedata

def limpar_nome_arquivo(nome: str) -> str:
    nome_limpo = unicodedata.normalize('NFKD', nome).encode('ASCII', 'ignore').decode('utf-8')
    nome_limpo = re.sub(r'[^\w\.-]', '_', nome_limpo)
    return re.sub(r'_+', '_', nome_limpo).lower()

class DocumentoCRUD:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.table = "documentos"
        self.bucket = "Documentos"

    def salvar_metadados(self, dados: dict):
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

    def deletar_documento(self, doc_id: int):
        try:
            # Pega as informações do documento no banco antes de apagar
            doc_info = self.supabase.table(self.table).select("caminho_storage").eq("id", doc_id).execute()
            
            # Se o documento existir e tiver um caminho físico, apaga no Bucket
            if doc_info.data and doc_info.data[0].get("caminho_storage"):
                caminho_fisico = doc_info.data[0]["caminho_storage"]
                
                self.supabase.storage.from_(self.bucket).remove([caminho_fisico])

            # Apaga registro no banco de dados
            self.supabase.table(self.table).delete().eq("id", doc_id).execute()
            
            return {"message": "Documento apagado do banco e do bucket com sucesso!"}
        except Exception as e:
            raise Exception(f"Erro ao deletar: {str(e)}")
            
    def atualizar_documento(self, doc_id: int, dados: dict, novo_arquivo: bytes = None, filename: str = None, content_type: str = None):
        try:
            # Se recebemos um arquivo novo, fazemos a substituição no Bucket
            if novo_arquivo:
                # Pega os dados atuais para achar o caminho antigo e o CNPJ
                doc_atual = self.supabase.table(self.table).select("*").eq("id", doc_id).execute()
                if not doc_atual.data:
                    raise Exception("Documento não encontrado.")
                
                doc_info = doc_atual.data[0]
                caminho_antigo = doc_info.get("caminho_storage")
                cnpj_fornecedor = doc_info.get("cnpj_fornecedor")

                # Deleta o arquivo antigo do bucket
                if caminho_antigo:
                    self.supabase.storage.from_(self.bucket).remove([caminho_antigo])

                data_formatada = datetime.now().strftime("%d-%m-%Y_%H-%M-%S") 
                nome_base, extensao = path.splitext(filename)
                nome_seguro = limpar_nome_arquivo(nome_base)
                
                novo_caminho = f"{cnpj_fornecedor}/{nome_seguro}-{data_formatada}{extensao}"
                
                # Usa a sua função já existente de upload (que já usa self.bucket)
                self.upload_arquivo(novo_caminho, novo_arquivo, content_type)
                
                # Atualiza os dados para o banco refletir o novo caminho do bucket
                dados["caminho_storage"] = novo_caminho
                dados["tipo_arquivo"] = content_type

            # Atualiza o banco de dados (seja só os textos ou textos + novo caminho)
            res = self.supabase.table(self.table).update(dados).eq("id", doc_id).execute()
            if not res.data:
                raise Exception("Documento não encontrado no banco de dados.")
            return {"message": "Documento atualizado com sucesso"}
        except Exception as e:
            raise Exception(f"Erro ao atualizar: {str(e)}")