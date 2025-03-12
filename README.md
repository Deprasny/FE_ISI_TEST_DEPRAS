# 📋 Task Management System

A modern Next.js application for task management with role-based permissions and comprehensive task history tracking.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 Features

- 🔐 **Secure Authentication**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Protected API routes

- 👥 **Role-based Authorization**
  - LEAD role with full access
  - TEAM role with limited permissions
  - Hierarchical task management

- ✨ **Task Management**
  - Multiple status options (NOT_STARTED, ON_PROGRESS, DONE, REJECT)
  - Detailed task descriptions
  - Assignment tracking
  - Real-time updates

- 📝 **Task History**
  - Comprehensive change tracking
  - Audit trail for all modifications
  - User action logging

- 🛠 **Technical Stack**
  - Next.js 14 with App Router
  - TypeScript for type safety
  - PostgreSQL with Prisma ORM
  - Tailwind CSS for styling
  - React Query for data fetching

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start the database**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations and seed**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔑 Authentication

### Test Credentials

- **Lead User**
  ```
  Email: lead@example.com
  Password: password123
  ```

- **Team Members**
  ```
  Email: team1@example.com
  Password: password123

  Email: team2@example.com
  Password: password123
  ```

## 🛣 API Routes

### 🔐 Authentication Endpoints
\`\`\`
POST /api/auth/register - Register new user
POST /api/auth/login    - Login and get JWT
\`\`\`

### 📋 Task Endpoints
\`\`\`
GET    /api/tasks      - List tasks
POST   /api/tasks      - Create task (LEAD)
GET    /api/tasks/:id  - Get task details
PUT    /api/tasks/:id  - Update task
DELETE /api/tasks/:id  - Delete task (LEAD)
\`\`\`

### 👥 User Endpoints
\`\`\`
GET /api/users - List all users (LEAD)
\`\`\`

### 📜 History Endpoints
\`\`\`
GET /api/history          - Get task history
GET /api/history?taskId=x - Get specific task history
\`\`\`

## 📊 Database Schema

### User Model
- id: UUID
- email: String (unique)
- password: String (hashed)
- name: String
- role: Enum (LEAD, TEAM)
- timestamps

### Task Model
- id: UUID
- title: String
- description: String
- status: Enum (NOT_STARTED, ON_PROGRESS, DONE, REJECT)
- createdById: UUID
- assignedToId: UUID (optional)
- timestamps

### TaskHistory Model
- id: UUID
- taskId: UUID
- userId: UUID
- action: String
- changes: JSON
- timestamp: DateTime

## 🚀 Deployment

### Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and Link**
   ```bash
   railway login
   railway link
   ```

3. **Set Environment Variables**
   - Add PostgreSQL database
   - Configure JWT_SECRET
   - Other environment variables as needed

4. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| PORT | Application port (default: 3000) | No |

## 🛠 Development

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run db:migrate\` - Run database migrations
- \`npm run db:seed\` - Seed the database

### Docker Commands

- Start containers:
  ```bash
  docker-compose up -d
  ```

- Stop containers:
  ```bash
  docker-compose down
  ```

- View logs:
  ```bash
  docker-compose logs -f
  ```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ using [Next.js](https://nextjs.org)
