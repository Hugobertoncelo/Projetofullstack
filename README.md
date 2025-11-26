# RealTime Chat System

A complete, production-ready real-time chat application built with modern web technologies.

## Features

### Core Functionality

- **Real-time messaging** with Socket.io
- **User authentication** with JWT and 2FA
- **Direct messages** and **group chats**
- **Message history** with pagination
- **Typing indicators** in real-time
- **Online/offline status** tracking
- **Message search** functionality

### Security & Performance

- **End-to-end message encryption**
- **Rate limiting** and **input sanitization**
- **Redis caching** for optimal performance
- **PostgreSQL** for reliable data storage
- **Responsive design** with mobile-first approach

### Advanced Features

- **Dark/Light theme** support
- **File sharing** capabilities
- **Message reactions** and replies
- **User profiles** with avatars
- **Group management** with admin controls

## Tech Stack

### Frontend

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time communication

### Backend

- **Node.js** with Express
- **TypeScript** throughout
- **Socket.io** server for WebSocket connections
- **Prisma ORM** for database management
- **PostgreSQL** as primary database
- **Redis** for caching and session management

### Infrastructure

- **Docker** for containerization
- **Docker Compose** for development environment
- **Nginx** for production reverse proxy
- **CI/CD** ready configuration

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd realtime-chat-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Start infrastructure services**

```bash
npm run docker:up
```

4. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Setup database**

```bash
npm run db:generate
npm run db:migrate
```

6. **Start development servers**

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Deployment

1. **Build and start with Docker Compose**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Environment Variables**
   Ensure all production environment variables are properly set in your deployment environment.

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # Reusable UI components
│   │   └── chat/              # Chat-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries and configurations
│   ├── server/                # Backend Express server
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Express middleware
│   │   └── services/          # Business logic services
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── docker-compose.yml         # Development Docker setup
└── docker-compose.prod.yml    # Production Docker setup
```

## Available Scripts

### Development

- `npm run dev` - Start Next.js development server
- `npm run server:dev` - Start backend server in development mode
- `npm run docker:up` - Start development infrastructure
- `npm run docker:down` - Stop development infrastructure

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

### Production

- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## API Documentation

The REST API provides endpoints for:

### Authentication (`/api/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user
- `POST /setup-2fa` - Setup two-factor authentication

### Users (`/api/users`)

- `GET /search` - Search users
- `GET /:userId` - Get user profile
- `PUT /me` - Update current user profile

### Conversations (`/api/conversations`)

- `GET /` - Get user conversations
- `POST /direct` - Create direct conversation
- `POST /group` - Create group conversation
- `GET /:id` - Get conversation details

### Messages (`/api/messages`)

- `GET /conversation/:id` - Get conversation messages
- `GET /search` - Search messages
- `PUT /:id` - Edit message
- `DELETE /:id` - Delete message

## WebSocket Events

The Socket.io implementation handles:

### Client to Server

- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a new message
- `start_typing` - Start typing indicator
- `stop_typing` - Stop typing indicator

### Server to Client

- `message_received` - New message received
- `user_typing` - User started typing
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## Security Features

- **JWT Authentication** with configurable expiration
- **Two-Factor Authentication** with TOTP
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS** configuration
- **Helmet.js** security headers
- **SQL injection** protection with Prisma
- **XSS protection** with input sanitization

## Performance Optimizations

- **Redis caching** for frequently accessed data
- **Message pagination** to handle large conversations
- **Connection pooling** for database efficiency
- **Image optimization** with Next.js
- **Code splitting** for faster initial loads
- **Lazy loading** of components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the linter and type checker
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Open an issue on GitHub
- Check the documentation
- Review the code examples in the repository

---

Built with ❤️ using Next.js, Socket.io, and modern web technologies.
