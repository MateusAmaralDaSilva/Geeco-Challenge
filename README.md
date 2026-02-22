**Front-end:**
* **Next.js (React)** - Framework para construção da interface.
* **Tailwind CSS** - Estilização moderna e responsiva.
* **Supabase Auth (SSR)** - Sistema de login e autenticação de usuários.
* **Lucide React** - Biblioteca de ícones.

**Back-end:**
* **Python + FastAPI** - Criação ágil e de alta performance da API Rest.
* **Supabase (PostgreSQL + Storage)** - Banco de dados e armazenamento de documentos.
* **Google GenAI (Gemini 1.5 Flash)** - Motor de Inteligência Artificial para o Chatbot.
* **Pydantic** - Validação de dados.
* **BrazilCEP** - Integração para busca automática de endereços.

##  Como executar o projeto localmente

Para rodar este projeto, você precisará do [Node.js](https://nodejs.org/) e do [Python 3](https://www.python.org/) instalados em sua máquina.

### 1. Clonando o Repositório
. git clone https://github.com/MateusAmaralDaSilva/Geeco-Challenge.git
. cd Geeco-Challenge

### 2. Configurando o Back-end (FastAPI)
. Abra um terminal e navegue até a pasta backend:
. cd backend

### 3. Criando um ambiente virtual (opcional)

# Windows
. python -m venv venv
. .\venv\Scripts\activate
# Linux/Mac
. python3 -m venv venv
. source venv/bin/activate


### 4. Instale as bibliotecas da aplicação
. pip install -r requirements.txt

### 5. Crie um arquivo .env na raiz da pasta backend com as seguintes chaves:
. SUPABASE_URL=https://xbttqvsrsphbnjijthgc.supabase.co

.SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidHRxdnNyc3BoYm5qaWp0aGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4Mjk3MywiZXhwIjoyMDg2NjU4OTczfQ.091YXX4bs9uzaE7V098P_mgPUY1i3S3sp9w-vhvVjl4

. JWT_SECRET=6d05ecb7-a60c-461d-9ac0-f02e91fb3e7e

. GEMINI_API_KEY=AIzaSyCdJNB7EHxp1cnGKy0cD2Kq_6y6fD1CyBY

### 6. Inicie o servidor:
. uvicorn app.main:app --reload --port 8001

### 7. Configurando front-end:
. Baixe as dependências com
. npm install

### 8. Crie um arquivo .env.local na raiz da pasta frontend com as seguintes chaves:
. NEXT_PUBLIC_SUPABASE_URL=https://xbttqvsrsphbnjijthgc.supabase.co

. NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_inDVkxyDnaeFABFZOJQ74w__hDKuUyP

. NEXT_PUBLIC_JWT_SECRET=6d05ecb7-a60c-461d-9ac0-f02e91fb3e7e

### 9. Execute o front-end
. no cmd insirisa: npm run dev

.O sistema estará disponível no seu navegador em http://localhost:3000.

## Atenção:
### 1. Erro: "O termo 'python' ou 'pip' não é reconhecido..."
* **O que significa:** O Windows não sabe onde o Python está instalado, ou ele não foi adicionado à variável `PATH` do sistema.
* **Como resolver:** 1. Se você usa Linux ou Mac, tente usar os comandos `python3` e `pip3` em vez de apenas `python` e `pip`.
  2. No Windows, reinstale o Python e, na primeira tela do instalador, marque a caixa **"Add Python to PATH"**. Reinicie o terminal e tente novamente.

### 2. Erro: "O termo 'npm' ou 'node' não é reconhecido..."
* **O que significa:** O Node.js não está instalado no seu computador ou não está no `PATH`.
* **Como resolver:** Acesse o site oficial do [Node.js](https://nodejs.org/), baixe a versão **LTS** e faça a instalação padrão (ela já adiciona o Node ao PATH automaticamente). Após instalar, feche e abra o terminal novamente.

### 3. Erro: "Port already in use" (Porta em uso)
* **O que significa:** As portas `3000` (Front-end) ou `8001` (Back-end) já estão sendo usadas por outro programa ou por uma execução anterior do projeto que não foi fechada corretamente.
* **Como resolver:** Feche todos os terminais abertos no seu VS Code ou reinicie o computador para limpar os processos travados na memória, e rode os servidores novamente.
