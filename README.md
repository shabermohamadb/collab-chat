# CollabSpace — Multi-User Collaborative Chat Platform

A production-grade, real-time multi-user collaborative chat platform designed for team communication, workspace room organization, and seamless `@AI` assistant participation inside shared conversation threads.

---

## 🌟 Key Highlights

- **👥 Multi-User Real-Time Collaboration**: Instant message sync powered by Socket.IO with sub-millisecond latencies.
- **🤖 First-Class `@AI` Teammate**: Mention `@AI` in any room to receive contextual responses based on the entire conversation history of the team.
- **✨ Human-First Product Design**: Modern, distraction-free workspace design inspired by Slack and Linear. No oversized AI gimmicks—AI acts as a natural participant.
- **⚡ Rich Message Ecosystem**: Markdown rendering, syntax-highlighted code blocks with 1-click copying, emoji reactions, message editing, soft deletion, and file attachments.
- **🧵 Threaded Discussions**: Keep rooms organized with nested message reply threads and reply counters.
- **🟢 Live Presence & Typing Indicators**: Real-time Online/Away/Offline status and multi-user typing status indicators.
- **🛡️ Secure PostgreSQL & Prisma Stack**: Type-safe relational data models, bcryptjs password hashing, JWT sessions, and role-based permissions.
- **📱 Fully Responsive Layout**: Mobile drawer sidebar and adaptive chat stream designed for desktop, tablet, and mobile browsers.

---

## 📁 Repository Structure

```text
collab-chat/
│
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS + Socket.IO
│   ├── src/
│   │   ├── components/       # ChatArea, Composer, Sidebar, Header, Threads, Modals
│   │   ├── pages/            # Auth, ChatWorkspace, Settings
│   │   ├── layouts/          # Responsive App Layouts
│   │   ├── hooks/            # useChat, useSocket, useAuth, usePresence, useTyping
│   │   ├── services/         # API clients & WebSocket managers
│   │   ├── utils/            # Markdown, Date formatting, Avatar helpers
│   │   ├── types/            # TypeScript interfaces
│   │   ├── styles/           # Tailwind CSS & custom styling
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/                  # Node.js + Express + TypeScript + Socket.IO + Prisma
│   ├── src/
│   │   ├── controllers/      # Auth, Room, Message, User, Upload
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # AI Context Service, WebSocket broker, Room & Message services
│   │   ├── models/           # Prisma client & database schemas
│   │   ├── middleware/       # JWT auth, File uploads, Error handlers
│   │   ├── websocket/        # Real-time event handlers (Presence, Typing, Messages, Threads)
│   │   ├── utils/            # JWT, Security, Logger
│   │   ├── types/            # Type definitions
│   │   └── server.ts         # Express + Socket.IO Server bootstrap
│   ├── prisma/
│   │   └── schema.prisma     # Relational Postgres Schema
│   ├── package.json
│   └── README.md
│
├── config/
│   └── config.json           # Non-sensitive application configuration
├── Feedback.txt              # Future feature roadmap & feedback
├── .env                      # Local environment secrets
├── .env.example              # Template environment file
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v26)
- **npm**: v9+
- **PostgreSQL**: Local instance or Docker container

### 1. Database Setup
Ensure PostgreSQL is running. For Docker:
```bash
docker run -d --name collab-chat-postgres -p 5434:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=collab_chat postgres:16-alpine
```

### 2. Backend Installation & Start
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
The backend API and Socket.IO server will start at `http://localhost:5000`.

### 3. Frontend Installation & Start
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be live at `http://localhost:5173`.

---

## 💬 `@AI` Shared Context Workflow
When a member types `@AI <question>` in any room:
1. The backend parses the mention and retrieves the recent conversation context from PostgreSQL.
2. The AI generates a contextual answer referencing earlier user statements.
3. The response is saved as an AI message and broadcast to all members in the room in real time.
