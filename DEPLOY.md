# 🚀 Deploy no Render - Guia Passo a Passo

## 📋 Pré-requisitos

1. ✅ Conta no [Render](https://render.com)
2. ✅ Repositório Git (GitHub, GitLab, ou Bitbucket)
3. ✅ Código já commitado no repositório

## 🏗️ Arquitetura do Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   Database      │
│   Port: 3000    │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Redis         │
                    │   (Cache)       │
                    └─────────────────┘
```

## 🚀 Passo a Passo para Deploy

### 1. **Preparar o Repositório**

```bash
# Commitar todas as alterações
git add .
git commit -m "feat: prepare for Render deployment"
git push origin main
```

### 2. **Criar Serviços no Render**

#### 🗄️ **Banco de Dados PostgreSQL**
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `chat-postgres`
   - **Database Name**: `chatdb`
   - **User**: `chatuser`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Free`
4. Clique em **"Create Database"**
5. **Copie a External Database URL** (vai precisar depois)

#### 🔴 **Redis Cache**
1. Clique em **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `chat-redis`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Free`
3. Clique em **"Create Redis"**
4. **Copie a Redis URL** (vai precisar depois)

#### ⚙️ **Backend API**
1. Clique em **"New +"** → **"Web Service"**
2. Configure:
   - **Repository**: Conecte seu repositório Git
   - **Name**: `chat-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

3. **Environment Variables**:
   ```
   NODE_ENV = production
   PORT = 3001
   DATABASE_URL = [COLE A URL DO POSTGRES]
   REDIS_URL = [COLE A URL DO REDIS]
   JWT_SECRET = [GERE UMA CHAVE SECRETA]
   CORS_ORIGIN = https://[SEU-FRONTEND].onrender.com
   ```

4. Clique em **"Create Web Service"**

#### 🎨 **Frontend**
1. Clique em **"New +"** → **"Web Service"**
2. Configure:
   - **Repository**: Conecte seu repositório Git
   - **Name**: `chat-frontend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

3. **Environment Variables**:
   ```
   NODE_ENV = production
   NEXT_PUBLIC_API_URL = https://[SEU-BACKEND].onrender.com
   NEXT_PUBLIC_SOCKET_URL = https://[SEU-BACKEND].onrender.com
   ```

4. Clique em **"Create Web Service"**

### 3. **Configurar Domínios**

Após o deploy:
1. **Backend URL**: `https://chat-backend-XXXX.onrender.com`
2. **Frontend URL**: `https://chat-frontend-XXXX.onrender.com`

**⚠️ IMPORTANTE**: Atualize as variáveis de ambiente com as URLs corretas!

### 4. **Verificar Deploy**

1. **Backend Health Check**: `https://[backend-url]/health`
2. **API Documentation**: `https://[backend-url]/api/docs`
3. **Frontend**: `https://[frontend-url]`

## 🔧 Comandos Úteis

```bash
# Ver logs do backend
render logs --service chat-backend

# Ver logs do frontend
render logs --service chat-frontend

# Restart serviço
render restart --service chat-backend
```

## 🛠️ Troubleshooting

### ❌ Erro de Build
```bash
# Verificar se todas as dependências estão no package.json
npm install
npm run build
```

### ❌ Erro de Database
```bash
# Rodar migrations manualmente
npx prisma migrate deploy
npx prisma generate
```

### ❌ Erro de CORS
- Verifique se `CORS_ORIGIN` está configurado corretamente
- Deve apontar para a URL do frontend

## 📈 Monitoramento

- **Uptime**: Render monitora automaticamente
- **Logs**: Disponíveis no dashboard
- **Metrics**: CPU, Memory, Response time

## 💰 Custos

- **PostgreSQL**: $0 (Free tier - 1GB)
- **Redis**: $0 (Free tier - 25MB)
- **Backend**: $0 (Free tier - 750h/mês)
- **Frontend**: $0 (Free tier - 750h/mês)

**Total**: **$0/mês** 🎉

## 🚀 URLs Finais

Depois do deploy, você terá:
- **App**: https://chat-frontend-XXXX.onrender.com
- **API**: https://chat-backend-XXXX.onrender.com
- **Docs**: https://chat-backend-XXXX.onrender.com/api/docs
