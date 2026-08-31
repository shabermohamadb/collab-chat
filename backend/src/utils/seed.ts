import prisma from '../models/prisma.js';
import { hashPassword } from './password.js';
import { getOrCreateAiUser } from '../services/aiService.js';
import { MemberRole, RoomType, UserStatus } from '@prisma/client';

const seed = async () => {
  console.log('🌱 Starting database seeding...');

  // Initialize AI User
  const aiUser = await getOrCreateAiUser();
  console.log(`🤖 AI user initialized: ${aiUser.displayName} (@${aiUser.username})`);

  // Create demo users with real password hashes
  const demoPassword = await hashPassword('password123');

  const demoUsersData = [
    {
      username: 'shaber',
      name: 'Shaber',
      email: 'shaber@example.com',
      passwordHash: demoPassword,
      bio: 'Lead Engineer building real-time collaboration tools',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shaber',
      status: UserStatus.ONLINE,
    },
    {
      username: 'arun',
      name: 'Arun',
      email: 'arun@example.com',
      passwordHash: demoPassword,
      bio: 'Product Designer & Frontend architect',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
      status: UserStatus.ONLINE,
    },
    {
      username: 'karthi',
      name: 'Karthi',
      email: 'karthi@example.com',
      passwordHash: demoPassword,
      bio: 'Backend & Distributed Systems Engineer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthi',
      status: UserStatus.AWAY,
    },
  ];

  const createdUsers: any[] = [];
  for (const u of demoUsersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    createdUsers.push(user);
    console.log(`👤 Seeded user: ${user.name} (@${user.username})`);
  }

  const owner = createdUsers[0];

  // Seed sample rooms
  const roomsData = [
    {
      name: 'Website Project',
      slug: 'website-project',
      description: 'Design and architectural planning for tournament & event website',
      isPrivate: false,
    },
    {
      name: 'General',
      slug: 'general',
      description: 'Workspace-wide general announcements and casual conversations',
      isPrivate: false,
    },
    {
      name: 'Engineering',
      slug: 'engineering',
      description: 'Technical architecture, APIs, TypeScript, and system discussions',
      isPrivate: false,
    },
    {
      name: 'Design & UX',
      slug: 'design-ux',
      description: 'UI/UX mockups, typography, interaction design, and user flows',
      isPrivate: false,
    },
  ];

  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { slug: r.slug },
      update: {},
      create: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        isPrivate: r.isPrivate,
        type: RoomType.CHANNEL,
        createdById: owner.id,
      },
    });

    console.log(`💬 Seeded room: #${room.name}`);

    // Add all demo users as members
    for (const u of createdUsers) {
      await prisma.roomMember.upsert({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: u.id,
          },
        },
        update: {},
        create: {
          roomId: room.id,
          userId: u.id,
          role: u.id === owner.id ? MemberRole.OWNER : MemberRole.MEMBER,
        },
      });
    }

    // Seed conversation in Website Project
    if (r.slug === 'website-project') {
      const existingMessages = await prisma.message.count({ where: { roomId: room.id } });
      if (existingMessages === 0) {
        const arun = createdUsers.find((u) => u.username === 'arun') || createdUsers[0];
        const shaber = createdUsers.find((u) => u.username === 'shaber') || createdUsers[0];
        const karthi = createdUsers.find((u) => u.username === 'karthi') || createdUsers[0];

        await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: arun.id,
            content: "Let's build a tournament website.",
            createdAt: new Date(Date.now() - 1000 * 60 * 15),
          },
        });

        await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: shaber.id,
            content: 'We need registration and payment.',
            createdAt: new Date(Date.now() - 1000 * 60 * 12),
          },
        });

        await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: karthi.id,
            content: 'We should also have an admin dashboard.',
            createdAt: new Date(Date.now() - 1000 * 60 * 10),
          },
        });

        await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: shaber.id,
            content: '@AI suggest a good structure.',
            createdAt: new Date(Date.now() - 1000 * 60 * 8),
          },
        });

        const m5 = await prisma.message.create({
          data: {
            roomId: room.id,
            senderId: aiUser.id,
            content: `Based on the discussion by Arun, Shaber, and Karthi, here is a recommended architecture structure:

### 🏆 Tournament Platform Structure
1. **Participant Portal**:
   - User registration & team management
   - Real-time tournament brackets and live scores
   - Stripe / payment gateway checkout for entry fees
2. **Admin & Organizer Dashboard**:
   - Tournament creation, bracket seeding, and match reporting
   - Revenue analytics and payout tracking
   - Real-time moderation & user management
3. **Real-time Live Engine**:
   - WebSocket events for instant score updates and chat channels

\`\`\`text
tournament-platform/
├── apps/
│   ├── web-client/      # React + Tailwind participant portal
│   └── admin-portal/    # React admin dashboard
└── services/
    ├── api-gateway/     # Node/Express REST & WebSockets
    ├── payments/        # Stripe payment integration
    └── tournament-hub/  # Bracketing & match engine
\`\`\`

Would you like me to elaborate on the payment checkout flow or the bracket generator logic?`,
            isAiMessage: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 7),
          },
        });

        await prisma.messageReaction.create({
          data: {
            messageId: m5.id,
            userId: shaber.id,
            emoji: '👍',
          },
        });

        await prisma.messageReaction.create({
          data: {
            messageId: m5.id,
            userId: arun.id,
            emoji: '🚀',
          },
        });

        console.log('✅ Seeded demo conversation with @AI in #Website Project');
      }
    }
  }

  console.log('✨ Seeding completed successfully!');
};

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
