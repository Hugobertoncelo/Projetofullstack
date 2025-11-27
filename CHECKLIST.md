# ✅ Checklist de Deploy - Render

## 📋 Antes do Deploy

- [ ] ✅ Código está funcionando localmente
- [ ] ✅ Arquivos de testes removidos
- [ ] ✅ Pasta .github removida
- [ ] ✅ Dependências atualizadas
- [ ] ✅ Arquivos de produção criados
- [ ] ✅ Variáveis de ambiente configuradas

## 🏗️ Arquivos Criados para Deploy

- [ ] ✅ `render.yaml` - Configuração do Render
- [ ] ✅ `build-backend.sh` - Script de build do backend
- [ ] ✅ `build-frontend.sh` - Script de build do frontend
- [ ] ✅ `backend/.env.production` - Variáveis de ambiente do backend
- [ ] ✅ `frontend/.env.production` - Variáveis de ambiente do frontend
- [ ] ✅ `DEPLOY.md` - Guia completo de deploy
- [ ] ✅ `CHECKLIST.md` - Este checklist

## 🚀 Passo a Passo no Render

### 1. Preparar Repositório Git
- [ ] Fazer commit de todas as alterações
- [ ] Push para GitHub/GitLab
- [ ] Verificar se repositório está público ou conectado

### 2. Criar Banco de Dados
- [ ] PostgreSQL criado no Render
- [ ] Copiar External Database URL
- [ ] Redis criado no Render
- [ ] Copiar Redis URL

### 3. Deploy Backend
- [ ] Web Service criado
- [ ] Root directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Environment variables configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `DATABASE_URL=[POSTGRES_URL]`
  - [ ] `REDIS_URL=[REDIS_URL]`
  - [ ] `JWT_SECRET=[RANDOM_SECRET]`
  - [ ] `CORS_ORIGIN=https://[FRONTEND_URL]`

### 4. Deploy Frontend
- [ ] Web Service criado
- [ ] Root directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Environment variables configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_API_URL=https://[BACKEND_URL]`
  - [ ] `NEXT_PUBLIC_SOCKET_URL=https://[BACKEND_URL]`

### 5. Configurações Finais
- [ ] Atualizar CORS_ORIGIN no backend com URL real do frontend
- [ ] Verificar se todas as URLs estão corretas
- [ ] Testar endpoints principais
- [ ] Verificar logs por erros

## 🧪 Testes Pós-Deploy

- [ ] **Backend Health**: `https://[backend-url]/health`
- [ ] **API Docs**: `https://[backend-url]/api/docs`
- [ ] **Frontend**: `https://[frontend-url]`
- [ ] **Login**: Consegue fazer login
- [ ] **Chat**: Consegue enviar mensagens
- [ ] **Socket**: Mensagens em tempo real funcionando
- [ ] **Database**: Dados persistindo corretamente

## 📊 URLs Finais

```
Frontend: https://chat-frontend-[ID].onrender.com
Backend:  https://chat-backend-[ID].onrender.com
API Docs: https://chat-backend-[ID].onrender.com/api/docs
```

## 🛠️ Troubleshooting

### ❌ Build Failed
- [ ] Verificar logs de build
- [ ] Checar package.json scripts
- [ ] Verificar dependências faltando

### ❌ Runtime Error
- [ ] Verificar logs da aplicação
- [ ] Checar variáveis de ambiente
- [ ] Verificar conexão com database

### ❌ CORS Error
- [ ] Verificar CORS_ORIGIN no backend
- [ ] Verificar URLs no frontend
- [ ] Certificar que URLs estão com https://

## ✅ Deploy Completo!

Quando todos os itens estiverem ✅, seu chat estará rodando em produção! 🎉

**Custo total: $0/mês** (Free tier do Render)
