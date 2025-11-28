# Fullstack Chat App

Este projeto é um sistema de chat moderno, fullstack, com autenticação, chat em tempo real, suporte a múltiplos usuários, temas, e interface responsiva.

## Principais Features

- Chat em tempo real (Socket.IO)
- Indicador de digitação
- Autenticação JWT
- Temas claro/escuro
- UI moderna e responsiva
- Modal de confirmação e animações
- Deploy pronto para Render.com
- Suporte a grupos e mensagens privadas
- Internacionalização (i18n)
- Código organizado para fácil manutenção
- Página de configurações de perfil
- Busca de conversas e usuários
- Notificações em tempo real
- Status online/offline
- Acessibilidade (WCAG 2.1)
- Testes automatizados (unitários e integração)

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Inicie o backend e frontend:
   ```bash
   npm run server:dev # na raiz ou backend
   npm run dev        # na raiz ou frontend
   ```
3. Acesse: http://localhost:3000

## Variáveis de ambiente

- Configure as variáveis em `.env` no backend e frontend para URLs, chaves JWT, banco de dados, etc.
- Exemplo de variáveis importantes:
  - `DATABASE_URL` (PostgreSQL)
  - `JWT_SECRET`
  - `NEXT_PUBLIC_SOCKET_URL`

## Deploy

- Pronto para deploy no Render.com (ver `render.yaml` e Dockerfiles)
- Suporte a Docker Compose para produção e desenvolvimento
- Scripts de build automatizados (`build-backend.sh`, `build-frontend.sh`)
- Nginx configurado para servir frontend e backend juntos (ver `nginx/nginx.conf`)

## Stack

- Next.js, React, Tailwind, Socket.IO, Prisma, PostgreSQL
- Typescript em todo o projeto
- Docker, Render.com
- Nginx (reverse proxy)

## Estrutura de Pastas

- `/backend`: API, WebSocket, autenticação, banco de dados, Prisma
- `/frontend`: Interface web, temas, hooks, componentes, i18n
- `/nginx`: Configuração do proxy reverso
- `docker-compose.yml`: Orquestração dos serviços
- `render.yaml`: Deploy automatizado no Render.com

## Testes

- Testes unitários e de integração recomendados (Jest, React Testing Library)
- Cobertura mínima sugerida: 80%
- Scripts de teste disponíveis em ambos os pacotes

## Segurança

- Autenticação JWT e proteção de rotas
- Validação de dados no backend
- CORS configurado
- Proteção contra XSS/CSRF
- Logs de acesso e erros

## Acessibilidade

- Componentes com foco em acessibilidade (WCAG 2.1)
- Suporte a navegação por teclado e leitores de tela

## Internacionalização

- Suporte a múltiplos idiomas (pt, en)
- Mensagens em `frontend/src/messages/`

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha feature'`
4. Push: `git push origin minha-feature`
5. Abra um Pull Request
