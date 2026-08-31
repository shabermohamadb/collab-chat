# CollabSpace Backend

Express + TypeScript + Socket.IO + PostgreSQL + Prisma ORM backend service for the multi-user collaborative chat platform.

## Architecture

- **`src/models/`**: Prisma database client and types.
- **`src/routes/`**: Express REST API routes for authentication, rooms, messages, users, and uploads.
- **`src/controllers/`**: Request handlers with input validation using Zod.
- **`src/services/`**: Business logic, database interactions, Socket.IO broadcasts, and Shared AI Context resolution.
- **`src/websocket/`**: Real-time event handlers for room channels, typing indicators, presence, and chat events.
- **`src/middleware/`**: JWT authentication, file upload filtering with Multer, and global error handling.

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma client & sync schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed demo data**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
