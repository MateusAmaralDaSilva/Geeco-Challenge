import pandas as pd
import openpyxl
import re

def load_xls(file_path):
    try:
        df = pd.read_excel(file_path, header=None)
        
        header_idx = 0
        for idx, row in df.iterrows():
            valores = [str(val).strip().upper() for val in row.values if pd.notna(val)]
            
            if 'CNPJ' in valores or 'EMPRESA' in valores:
                header_idx = idx
                break
        
        df.columns = df.iloc[header_idx]
        
        df = df[header_idx + 1:].copy()
        
        df.columns = [str(c).strip() for c in df.columns]
        df = df.dropna(how='all')
        df = df.reset_index(drop=True)

        for col in df.columns:
            if 'PRODUTO' in col.upper() or 'SERVIÇO' in col.upper():
                df.rename(columns={col: 'ProdServ'}, inplace=True)
                break
                
        return df
        
    except Exception as e:
        print(f"Erro ao carregar o arquivo Excel: {e}")
        return None

def processar_dados(df):
    """
    Transforma o DataFrame bruto do Excel em 4 DataFrames estruturados 
    conforme as tabelas do banco de dados (Modelo Relacional).
    """
    
    fornecedores_list = []
    representantes_list = []
    produtos_dict = {}
    produtos_fornecedores_list = []
    
    produto_id_counter = 1
    
    for _, row in df.iterrows():
        
        # 1. TABELA FORNECEDORES
        cnpj_raw = str(row.get("CNPJ", ""))
        if pd.isna(cnpj_raw) or cnpj_raw.lower() == 'nan':
            continue
            
        cnpj = cnpj_raw.strip()
        
        empresa = str(row.get("Empresa", "")).strip()
        localizacao = str(row.get("Localização", "")).strip()
        link_site = str(row.get("Site", "")).strip()
        descricao = str(row.get("Descrição", "")).strip()
        categoria = str(row.get("Categoria", "")).strip()
        
        # Tratamento de nulos
        empresa = None if empresa.lower() == 'nan' or not empresa else empresa
        localizacao = None if localizacao.lower() == 'nan' or not localizacao else localizacao
        link_site = None if link_site.lower() == 'nan' or not link_site else link_site
        descricao = None if descricao.lower() == 'nan' or not descricao else descricao
        categoria = None if categoria.lower() == 'nan' or not categoria else categoria

        fornecedores_list.append({
            "CNPJ": cnpj,
            "empresa": empresa,
            "localização": localizacao,
            "link_site": link_site,
            "descrição": descricao,
            "categoria": categoria,
            "favorito": False
        })
        
        # 2. TABELA REPRESENTANTE (Regras Específicas)
        raw_rep = str(row.get("Representante", ""))
        raw_contato = str(row.get("Contato", ""))
        raw_email = str(row.get("Email", ""))
        
        # Limpeza de Contato (Remove +55 e parênteses)
        if raw_contato.lower() != 'nan':
            raw_contato = re.sub(r'\+55|\(|\)', '', raw_contato)
        else:
            raw_contato = ""
            
        # Separação das listas
        reps = [r.strip() for r in raw_rep.split('/') if r.strip() and r.lower() != 'nan']
        contatos = [c.strip() for c in raw_contato.split('/') if c.strip()]
        emails = [e.strip() for e in raw_email.split('/') if e.strip() and e.lower() != 'nan']

        # Regra 1: Apenas 1 representante
        if len(reps) == 1:
            representantes_list.append({
                "CNPJ_Fornecedor": cnpj,
                "nome": reps[0],
                "contato": contatos[0] if contatos else None,
                "email": emails[0] if emails else None,
                "atual": True
            })
            
        # Regra 2: 2 Representantes
        elif len(reps) == 2:
            rep1, rep2 = reps[0], reps[1]
            
            # Se houverem 2 contatos, cada um ganha o seu
            if len(contatos) >= 2:
                rep1_contato = contatos[0]
                rep2_contato = contatos[1]
                rep1_email = emails[0] if len(emails) > 0 else None
                rep2_email = emails[1] if len(emails) > 1 else None
            
            # Se houver apenas 1 contato: Rep1 ganha Email, Rep2 ganha Contato
            else:
                rep1_email = emails[0] if emails else None
                rep1_contato = None
                
                rep2_email = None
                rep2_contato = contatos[0] if contatos else None
                
            representantes_list.append({
                "CNPJ_Fornecedor": cnpj, "nome": rep1, "contato": rep1_contato, "email": rep1_email, "atual": True
            })
            representantes_list.append({
                "CNPJ_Fornecedor": cnpj, "nome": rep2, "contato": rep2_contato, "email": rep2_email, "atual": True
            })
            
        # Regra de Fallback para > 2 representantes
        elif len(reps) > 2:
            for i, rep in enumerate(reps):
                c = contatos[i] if i < len(contatos) else None
                e = emails[i] if i < len(emails) else None
                representantes_list.append({
                    "CNPJ_Fornecedor": cnpj, "nome": rep, "contato": c, "email": e, "atual": True
                })
                
        # 3. TABELAS PRODUTOS E PRODUTOS_FORNECEDORES
        raw_produtos = str(row.get("ProdServ", ""))
        if raw_produtos.lower() != 'nan':
            # Separa por vírgula ou ponto-e-vírgula
            produtos_separados = [p.strip() for p in re.split(r"[;,]", raw_produtos) if p.strip()]
            
            for prod in produtos_separados:
                # Regra: Sempre minúsculo para evitar duplicatas (Ex: "Fio" e "fio")
                prod_lower = prod.lower()
                
                # Se o produto for novo, registra no dicionário e gera um ID
                if prod_lower not in produtos_dict:
                    produtos_dict[prod_lower] = produto_id_counter
                    produto_id_counter += 1
                
                id_do_produto = produtos_dict[prod_lower]
                
                # Cria o vínculo (N:N)
                produtos_fornecedores_list.append({
                    "CNPJ_Fornecedor": cnpj,
                    "id_produto": id_do_produto
                })
                
    # 4. CONVERTE TUDO PARA DATAFRAMES
    df_fornecedores = pd.DataFrame(fornecedores_list)
    df_representantes = pd.DataFrame(representantes_list)
    
    # Adiciona a coluna 'id' começando do 0 na primeira posição!
    if not df_representantes.empty:
        df_representantes.insert(0, 'id', range(len(df_representantes)))
    
    # Transforma o dicionário de produtos em um DataFrame com colunas 'id' e 'nome'
    df_produtos = pd.DataFrame([{"id": v, "nome": k} for k, v in produtos_dict.items()])
    
    # Remove duplicatas na tabela de vínculo caso a planilha tenha o mesmo produto 2x pro mesmo fornecedor
    df_produtos_fornecedores = pd.DataFrame(produtos_fornecedores_list).drop_duplicates()

    return df_fornecedores, df_representantes, df_produtos, df_produtos_fornecedores

if __name__ == "__main__":
    caminho_planilha = "desafio.xlsx"
    
    df_bruto = load_xls(caminho_planilha)
    
    if df_bruto is not None:
        df_fornecedores, df_reps, df_produtos, df_vinculos = processar_dados(df_bruto)

        df_fornecedores.to_csv("fornecedores_tabela.csv", index=False, encoding='utf-8-sig')
        df_reps.to_csv("representantes_tabela.csv", index=False, encoding='utf-8-sig')
        df_produtos.to_csv("produtos_tabela.csv", index=False, encoding='utf-8-sig')
        df_vinculos.to_csv("produtos_fornecedores_tabela.csv", index=False, encoding='utf-8-sig')
        
        print("🎉 Ficheiros gerados com sucesso! Já pode abri-los no seu Excel.")