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

### 5. Rode localmente
```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Stack técnica

| Tecnologia | Uso |
|---|---|
| React + Vite | Framework Web |
| Firebase Auth | Cadastro e login de usuários |
| Firestore | Persistência de dados por usuário |
| React Router | Roteamento de páginas |
| CSS Modules | Estilização componentizada |

---

## 📁 Estrutura do projeto

```
src/
├── firebase/
│   └── config.js          # Configuração do Firebase
├── contexts/
│   └── AuthContext.jsx     # Contexto global de autenticação
├── services/
│   └── entriesService.js  # CRUD no Firestore
├── components/
│   ├── PrivateRoute.jsx    # Proteção de rotas
│   ├── Navbar.jsx          # Barra de navegação
│   ├── EntryCard.jsx       # Card de cada entrada
│   └── EntryModal.jsx      # Modal de criação/edição
└── pages/
    ├── Login.jsx           # Tela de login
    ├── Register.jsx        # Tela de cadastro
    └── Dashboard.jsx       # Tela principal (lista + filtros)
```

---

## ✅ Requisitos atendidos

- [x] **Autenticação**: Firebase Auth (e-mail/senha), cadastro e login
- [x] **Persistência**: Firestore, coleção `entries` por usuário
- [x] **Dados privados**: query filtrada por `userId == auth.uid` + regras Firestore
- [x] **CRUD completo**: Criar, Listar, Editar e Excluir entradas
- [x] **Interface funcional**: telas de cadastro, login e dashboard

### Funcionalidades extras
- ⭐ Avaliação com nota de 1 a 10 (estrelas)
- 😊 Registro de humor/sentimento ao assistir (8 opções)
- 🏷️ Filtro por tipo (Filme/Série), status e gênero
- 🔍 Busca por título
- 📊 Painel de estatísticas (total, assistidos, nota média)
- 📝 Resenha pessoal por entrada
- 🔄 Ordenação por mais recentes, melhor avaliados ou A–Z
