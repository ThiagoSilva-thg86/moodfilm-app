# 🎬 MoodFilm

**Diário pessoal de filmes e séries com registro de humor**

App React Web com autenticação e dados privados por usuário, desenvolvido com Firebase Authentication + Firestore.

---

## 🚀 Como rodar

### 1. Clone o repositório
```bash
git clone <URL_DO_SEU_REPO>
cd moodfilm
npm install
```

### 2. Configure o Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto novo (ou use um existente)
3. Ative o **Authentication** → método **E-mail/Senha**
4. Crie o **Firestore Database** (modo produção ou teste)
5. Em "Configurações do Projeto" → "Seus apps" → adicione um app Web
6. Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:
```bash
cp .env.example .env
```

### 3. Configure as regras do Firestore

No console Firebase → Firestore → **Regras**, cole o conteúdo de `firestore.rules`.

### 4. Crie o índice necessário no Firestore

O app usa uma query com `where("userId", ...)` + `orderBy("createdAt")`.  
Ao rodar pela primeira vez, o Firebase vai mostrar um link no console do navegador para criar o índice automaticamente. Clique nele!

### 5. Testes automatizados & Qualidade
```bash
# Executa todos os testes automatizados da esteira
npm test

# Modo interativo (watch) durante o desenvolvimento
npm run test:watch

# Análise estática de código (Linter)
npm run lint
```

### 6. Rode localmente
```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Esteira de CI/CD (GitHub Actions)

O projeto conta com um pipeline automatizado de integração e entrega contínua configurado em [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) para garantir que nenhuma alteração ou nova funcionalidade quebre recursos existentes.

A esteira é disparada automaticamente a cada `push` ou `pull_request` nas branches `main` e `master`:

1. **Estágio 1 - Linter & Análise Estática**: Executa `oxlint` para verificar integridade e boas práticas.
2. **Estágio 2 - Testes Automatizados**: Executa a suíte de 25+ testes automatizados (unitários e de integração com Vitest e Testing Library), cobrindo:
   - Regra de negócio de unicidade e formato de apelidos no Firestore ($O(1)$)
   - Operações do diário de filmes e séries (CRUD)
   - Validações do formulário de cadastro e autenticação
   - Renderização e responsividade de componentes essenciais
3. **Estágio 3 - Build de Produção**: Compila o bundle Vite garantindo ausência de erros de importação, CSS e empacotamento, disponibilizando o artefato pronto para deploy.

---

## 🌐 Deploy no Firebase Hosting

A aplicação está configurada para hospedagem estática no **Firebase Hosting**.

### 1. Pré-requisito
Certifique-se de ter o Firebase CLI instalado e autenticado:
```bash
npm install -g firebase-tools
firebase login
```

### 2. Gerar build e publicar
Sempre que fizer alterações e quiser atualizar a versão em produção:
```bash
# Gera o build de produção na pasta /dist
npm run build

# Envia apenas os arquivos de hospedagem para a nuvem
firebase deploy --only hosting
```

A aplicação ficará disponível publicamente em:
- 🔗 **URL de Produção**: `https://moodfilm-app.web.app` (ou `https://moodfilm-app.firebaseapp.com`)

---

## 🛠️ Stack técnica

| Tecnologia | Uso |
|---|---|
| React + Vite | Framework Web SPA |
| Firebase Auth | Cadastro e login de usuários |
| Firestore | Persistência de dados privados em tempo real |
| Firebase Hosting | Hospedagem em nuvem com SSL automático |
| React Router | Roteamento de páginas |
| CSS Modules | Estilização componentizada |

---

## 📁 Estrutura do projeto

```
src/
├── firebase/
│   └── config.js              # Configuração do Firebase SDK
├── contexts/
│   └── AuthContext.jsx         # Contexto global de autenticação (login, cadastro, reset de senha)
├── constants/
│   └── technicalCriteria.js   # Critérios de avaliação técnica (direção, roteiro, etc.)
├── services/
│   ├── entriesService.js      # Operações CRUD no Firestore
│   └── tmdbService.js         # Integração com a API do TMDB (busca de filmes e séries)
├── components/
│   ├── PrivateRoute.jsx        # Proteção de rotas autenticadas
│   ├── Navbar.jsx              # Barra de navegação
│   ├── EntryCard.jsx           # Card de exibição de cada entrada
│   ├── EntryModal.jsx          # Modal de criação/edição de filmes e séries
│   ├── MovieInfo.jsx           # Detalhes de filmes importados do TMDB
│   ├── SeriesInfo.jsx          # Detalhes e temporadas de séries
│   └── SeriesSearch.jsx        # Campo de busca e sugestões com TMDB
└── pages/
    ├── Login.jsx               # Tela de login e recuperação de senha segura
    ├── Register.jsx            # Tela de cadastro de novos usuários
    ├── Dashboard.jsx           # Tela principal (lista, filtros e ordenação)
    ├── Analytics.jsx           # Métricas e gráficos de humor
    └── Profile.jsx             # Perfil do usuário (edição de apelido, e-mail e senha)
```

---

## ✅ Requisitos atendidos

- [x] **Autenticação**: Firebase Auth (e-mail/senha), cadastro, login e recuperação de senha
- [x] **Persistência**: Firestore, coleção `entries` por usuário
- [x] **Dados privados**: query filtrada por `userId == auth.uid` + regras Firestore
- [x] **CRUD completo**: Criar, Listar, Editar e Excluir entradas
- [x] **Interface funcional**: telas de cadastro, login, dashboard, analytics e perfil
- [x] **Deploy em Produção**: Hospedagem ativa no Firebase Hosting

### Funcionalidades extras
- 🔑 Recuperação de senha segura (prevenção contra enumeração de e-mails / OWASP)
- 🎬 Integração com TMDB API (busca e preenchimento automático de dados de filmes e séries)
- ⭐ Avaliação com nota de 1 a 10 (estrelas) e critérios técnicos detalhados
- 😊 Registro de humor/sentimento ao assistir (8 opções)
- 🏷️ Filtro por tipo (Filme/Série), status e gênero
- 🔍 Busca por título
- 📊 Painel de estatísticas e gráficos de humor (Analytics)
- 📝 Resenha pessoal por entrada
- 🔄 Ordenação por mais recentes, melhor avaliados ou A–Z
