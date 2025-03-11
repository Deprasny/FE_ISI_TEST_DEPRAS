# Task Management System

A Next.js application for task management with role-based permissions and task history tracking.

## Features

- User authentication with JWT
- Role-based authorization (LEAD and TEAM roles)
- Task management with multiple status options (NOT_STARTED, ON_PROGRESS, DONE, REJECT)
- Task history tracking for all changes
- PostgreSQL database with Prisma ORM

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Tasks

- `GET /api/tasks` - Get all tasks (LEAD sees all, TEAM sees assigned)
- `POST /api/tasks` - Create a new task (LEAD only)
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task (LEAD can update everything, TEAM can update status and description)
- `DELETE /api/tasks/:id` - Delete a task (LEAD only)

### Users

- `GET /api/users` - Get all users (LEAD only)

### Task History

- `GET /api/history` - Get history of all tasks (LEAD) or assigned tasks (TEAM)
- `GET /api/history?taskId=xxx` - Get history for a specific task

## Change Tracking

The system automatically tracks all changes to tasks in the TaskHistory model:

- Task creation
- Status changes
- Assignment changes
- Title/description updates

All changes include:

- Who made the change
- When it was made
- Previous values
- New values
- Type of action performed

## Database Setup with Docker

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Run Prisma migrations
npx prisma migrate dev

# Seed the database (if needed)
npx prisma db seed
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
