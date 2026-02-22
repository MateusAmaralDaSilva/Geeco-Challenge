**Front-end:**
* **Next.js (React)** - Framework para construção da interface.
* **Tailwind CSS** - Estilização moderna e responsiva.
* **Supabase Auth (SSR)** - Sistema de login e autenticação de usuários.
* **Lucide React** - Biblioteca de ícones.

**Back-end:**
* **Python + FastAPI** - Criação ágil e de alta performance da API Rest.
* **Supabase (PostgreSQL + Storage)** - Banco de dados e armazenamento de documentos.
* **Google GenAI (Gemini 1.5 Flash)** - Motor de Inteligência Artificial para o Chatbot.
* **Pydantic** - Validação rigorosa de dados.
* **BrazilCEP** - Integração para busca automática de endereços.

##  Como executar o projeto localmente

Para rodar este projeto, você precisará do [Node.js](https://nodejs.org/) e do [Python 3](https://www.python.org/) instalados em sua máquina.

### 1. Clonando o Repositório
git clone [https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git](https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git)
cd Geeco-Challenge

### 2. Configurando o Back-end (FastAPI)
Abra um terminal e navegue até a pasta backend:
cd backend

### 3. Criando um ambiente virtual (opcional)

# Windows
python -m venv venv
.\venv\Scripts\activate
# Linux/Mac
python3 -m venv venv
source venv/bin/activate


### 4. Instale as bibliotecas da aplicação
pip install -r requirements.txt

### 5. Crie um arquivo .env na raiz da pasta backend com as seguintes chaves:
SUPABASE_URL=https://xbttqvsrsphbnjijthgc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidHRxdnNyc3BoYm5qaWp0aGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4Mjk3MywiZXhwIjoyMDg2NjU4OTczfQ.091YXX4bs9uzaE7V098P_mgPUY1i3S3sp9w-vhvVjl4
JWT_SECRET=6d05ecb7-a60c-461d-9ac0-f02e91fb3e7e
GEMINI_API_KEY=AIzaSyCdJNB7EHxp1cnGKy0cD2Kq_6y6fD1CyBY

### 6. Inicie o servidor:
uvicorn app.main:app --reload --port 8001

### 7. Configurando front-end:
Baixe as dependências com
npm install

### 8. Crie um arquivo .env.local na raiz da pasta frontend com as seguintes chaves:
NEXT_PUBLIC_SUPABASE_URL=https://xbttqvsrsphbnjijthgc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_inDVkxyDnaeFABFZOJQ74w__hDKuUyP
NEXT_PUBLIC_JWT_SECRET=6d05ecb7-a60c-461d-9ac0-f02e91fb3e7e

### 9. 
npm run dev
O sistema estará disponível no seu navegador em http://localhost:3000.
