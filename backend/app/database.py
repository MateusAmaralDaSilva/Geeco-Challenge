import os
from dotenv import load_dotenv
from supabase import create_client

def get_supabase_client():
    load_dotenv()
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("As credenciais do Supabase não foram encontradas no .env")
    
    try:        
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return client
    except Exception as e:  
        raise ConnectionError(f"Erro ao conectar ao Supabase: {e}")
