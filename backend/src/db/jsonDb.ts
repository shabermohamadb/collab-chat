import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface JsonDatabaseSchema {
  users: any[];
  accounts: any[];
  sessions: any[];
  rooms: any[];
  roomMembers: any[];
  messages: any[];
  threads: any[];
  messageReactions: any[];
  attachments: any[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DEMO_PASSWORD_HASH = '$2a$10$pMBIatjUhfHC6/ttSuEFOOcccOzee.Q9r3mW7cdp1DaXZS8pkzqhy';

class JsonDatabase {
  private data: JsonDatabaseSchema = {
    users: [],
    accounts: [],
    sessions: [],
    rooms: [],
    roomMembers: [],
    messages: [],
    threads: [],
    messageReactions: [],
    attachments: [],
  };

  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
        this.ensureDefaultSeeds();
        logger.info(`[JSON-DB] Loaded database from ${DB_FILE}`);
      } catch (err) {
        logger.error('[JSON-DB] Failed to parse db.json, recreating initial seed:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private ensureDefaultSeeds() {
    let modified = false;
    const now = new Date().toISOString();
    const aiId = 'ai-assistant-user-001';

    // 1. Ensure AI user
    if (!this.data.users.some((u) => u.id === aiId || u.username === 'ai')) {
      this.data.users.push({
        id: aiId,
        email: 'gemini.ai@collabspace.internal',
        username: 'ai',
        name: 'Gemini Assistant',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini&backgroundColor=6a56d6,7b68ee',
        bio: 'AI Coding & Collaboration Assistant powered by Gemini',
        status: 'ONLINE',
        isAi: true,
        passwordHash: null,
        emailVerified: now,
        createdAt: now,
        updatedAt: now,
      });
      modified = true;
    }

    // 2. Ensure demo users
    const demoUsers = [
      {
        id: 'user-shaber-001',
        username: 'shaber',
        name: 'Shaber',
        email: 'shaber@example.com',
        passwordHash: DEMO_PASSWORD_HASH,
        bio: 'Lead Engineer building real-time collaboration tools',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shaber',
        status: 'ONLINE',
        isAi: false,
        emailVerified: null,
      },
      {
        id: 'user-arun-002',
        username: 'arun',
        name: 'Arun',
        email: 'arun@example.com',
        passwordHash: DEMO_PASSWORD_HASH,
        bio: 'Product Designer & Frontend architect',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
        status: 'ONLINE',
        isAi: false,
        emailVerified: null,
      },
      {
        id: 'user-karthi-003',
        username: 'karthi',
        name: 'Karthi',
        email: 'karthi@example.com',
        passwordHash: DEMO_PASSWORD_HASH,
        bio: 'Backend & Distributed Systems Engineer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthi',
        status: 'AWAY',
        isAi: false,
        emailVerified: null,
      },
    ];

    for (const u of demoUsers) {
      const idx = this.data.users.findIndex((x) => x.email === u.email);
      if (idx === -1) {
        this.data.users.push({ ...u, createdAt: now, updatedAt: now });
        modified = true;
      } else {
        // Ensure valid demo password
        this.data.users[idx].passwordHash = DEMO_PASSWORD_HASH;
      }
    }

    // 3. Ensure default rooms
    const defaultRooms = [
      {
        id: 'room-general-001',
        name: 'General',
        slug: 'general',
        description: 'Open discussion and workspace collaboration',
        type: 'CHANNEL',
        isPrivate: false,
        createdById: aiId,
        icon: '💬',
      },
      {
        id: 'room-website-project-003',
        name: 'Website Project',
        slug: 'website-project',
        description: 'Design and architectural planning for tournament & event website',
        type: 'CHANNEL',
        isPrivate: false,
        createdById: 'user-shaber-001',
        icon: '🚀',
      },
      {
        id: 'room-ai-lab-002',
        name: 'AI Lab & Prompts',
        slug: 'ai-lab',
        description: 'Explore AI assistance, brainstorming, and code generation',
        type: 'CHANNEL',
        isPrivate: false,
        createdById: aiId,
        icon: '✨',
      },
      {
        id: 'room-engineering-004',
        name: 'Engineering',
        slug: 'engineering',
        description: 'Technical architecture, APIs, TypeScript, and system discussions',
        type: 'CHANNEL',
        isPrivate: false,
        createdById: 'user-shaber-001',
        icon: '⚡',
      },
    ];

    for (const r of defaultRooms) {
      if (!this.data.rooms.some((x) => x.slug === r.slug)) {
        this.data.rooms.push({ ...r, createdAt: now, updatedAt: now });
        modified = true;
      }
    }

    // 4. Ensure memberships for all users in public rooms
    for (const r of this.data.rooms) {
      if (!r.isPrivate) {
        for (const u of this.data.users) {
          if (!this.data.roomMembers.some((m) => m.roomId === r.id && m.userId === u.id)) {
            this.data.roomMembers.push({
              id: `m-${r.id.slice(0, 8)}-${u.id.slice(0, 8)}`,
              roomId: r.id,
              userId: u.id,
              role: u.id === r.createdById ? 'OWNER' : 'MEMBER',
              joinedAt: now,
            });
            modified = true;
          }
        }
      }
    }

    // 5. Ensure sample messages in website-project
    if (this.data.messages.length === 0) {
      this.data.messages = [
        {
          id: 'msg-welcome-001',
          roomId: 'room-general-001',
          userId: aiId,
          senderId: aiId,
          content: 'Welcome to **CollabSpace**! 👋 Real-time multi-user collaboration with persistent JSON storage and AI assistant.',
          type: 'TEXT',
          isAiResponse: true,
          aiPrompt: null,
          threadId: null,
          isPinned: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'msg-proj-001',
          roomId: 'room-website-project-003',
          userId: 'user-arun-002',
          senderId: 'user-arun-002',
          content: "Let's build a tournament website.",
          type: 'TEXT',
          isAiResponse: false,
          aiPrompt: null,
          threadId: null,
          isPinned: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          updatedAt: now,
        },
        {
          id: 'msg-proj-002',
          roomId: 'room-website-project-003',
          userId: 'user-shaber-001',
          senderId: 'user-shaber-001',
          content: 'We need registration and payment.',
          type: 'TEXT',
          isAiResponse: false,
          aiPrompt: null,
          threadId: null,
          isPinned: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          updatedAt: now,
        },
        {
          id: 'msg-proj-003',
          roomId: 'room-website-project-003',
          userId: 'user-karthi-003',
          senderId: 'user-karthi-003',
          content: 'We should also have an admin dashboard.',
          type: 'TEXT',
          isAiResponse: false,
          aiPrompt: null,
          threadId: null,
          isPinned: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          updatedAt: now,
        },
        {
          id: 'msg-proj-004',
          roomId: 'room-website-project-003',
          userId: 'user-shaber-001',
          senderId: 'user-shaber-001',
          content: '@AI suggest a good structure.',
          type: 'TEXT',
          isAiResponse: false,
          aiPrompt: 'suggest a good structure.',
          threadId: null,
          isPinned: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          updatedAt: now,
        },
        {
          id: 'msg-proj-005',
          roomId: 'room-website-project-003',
          userId: aiId,
          senderId: aiId,
          content: `Based on the discussion by Arun, Shaber, and Karthi, here is the recommended architecture:

### 🏆 Tournament Platform Architecture
1. **Participant Portal**: Registration, bracket viewer, match reporting, and Stripe checkout.
2. **Admin Dashboard**: Bracket generation, dispute resolution, analytics.
3. **Live Engine**: Instant WebSocket scores, timer updates, and chat channels.`,
          type: 'TEXT',
          isAiResponse: true,
          aiPrompt: null,
          threadId: null,
          isPinned: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
          updatedAt: now,
        },
      ];
      modified = true;
    }

    if (modified) {
      this.saveImmediate();
    }
  }

  private seedInitialData() {
    this.ensureDefaultSeeds();
    this.saveImmediate();
    logger.info(`[JSON-DB] Initialized new JSON database at ${DB_FILE}`);
  }

  private saveImmediate() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      logger.error('[JSON-DB] Error saving db.json:', err);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate();
    }, 50);
  }

  public async $disconnect() {
    this.saveImmediate();
  }

  public async $connect() {
    this.init();
  }

  // =================== QUERY HELPERS ===================

  private matchCondition(item: any, condition: any): boolean {
    if (!condition) return true;

    for (const key of Object.keys(condition)) {
      if (key === 'OR') {
        const orConditions: any[] = condition.OR;
        const matchesAny = orConditions.some((c) => this.matchCondition(item, c));
        if (!matchesAny) return false;
        continue;
      }

      if (key === 'AND') {
        const andConditions: any[] = condition.AND;
        const matchesAll = andConditions.every((c) => this.matchCondition(item, c));
        if (!matchesAll) return false;
        continue;
      }

      if (key === 'NOT') {
        const notConditions = Array.isArray(condition.NOT) ? condition.NOT : [condition.NOT];
        const matchesAny = notConditions.some((c) => this.matchCondition(item, c));
        if (matchesAny) return false;
        continue;
      }

      if (key === 'roomId_userId' && condition.roomId_userId) {
        if (item.roomId !== condition.roomId_userId.roomId || item.userId !== condition.roomId_userId.userId) {
          return false;
        }
        continue;
      }

      if (key === 'provider_providerAccountId' && condition.provider_providerAccountId) {
        if (
          item.provider !== condition.provider_providerAccountId.provider ||
          item.providerAccountId !== condition.provider_providerAccountId.providerAccountId
        ) {
          return false;
        }
        continue;
      }

      if (key === 'messageId_userId_emoji' && condition.messageId_userId_emoji) {
        if (
          item.messageId !== condition.messageId_userId_emoji.messageId ||
          item.userId !== condition.messageId_userId_emoji.userId ||
          item.emoji !== condition.messageId_userId_emoji.emoji
        ) {
          return false;
        }
        continue;
      }

      const val = item[key];
      const target = condition[key];

      if (target !== null && typeof target === 'object' && !(target instanceof Date)) {
        if (target.equals !== undefined && val !== target.equals) return false;
        if (target.not !== undefined && val === target.not) return false;
        if (target.in !== undefined && (!Array.isArray(target.in) || !target.in.includes(val))) return false;
        if (target.notIn !== undefined && Array.isArray(target.notIn) && target.notIn.includes(val)) return false;
        if (target.contains !== undefined) {
          const mode = target.mode;
          const searchVal = String(val || '');
          const term = String(target.contains || '');
          if (mode === 'insensitive') {
            if (!searchVal.toLowerCase().includes(term.toLowerCase())) return false;
          } else {
            if (!searchVal.includes(term)) return false;
          }
        }
        if (target.gt !== undefined && !(new Date(val) > new Date(target.gt))) return false;
        if (target.gte !== undefined && !(new Date(val) >= new Date(target.gte))) return false;
        if (target.lt !== undefined && !(new Date(val) < new Date(target.lt))) return false;
        if (target.lte !== undefined && !(new Date(val) <= new Date(target.lte))) return false;
      } else {
        if (val !== target) return false;
      }
    }

    return true;
  }

  // =================== USER MODEL ===================

  public user = {
    findUnique: async (args: { where: any; include?: any; select?: any }) => {
      const user = this.data.users.find((u) => this.matchCondition(u, args.where));
      if (!user) return null;
      return this.formatUser(user, args.include, args.select);
    },
    findFirst: async (args: { where?: any; include?: any; select?: any }) => {
      const user = this.data.users.find((u) => this.matchCondition(u, args.where));
      if (!user) return null;
      return this.formatUser(user, args.include, args.select);
    },
    findMany: async (args: { where?: any; include?: any; select?: any; take?: number; skip?: number; orderBy?: any } = {}) => {
      let results = this.data.users.filter((u) => this.matchCondition(u, args.where));
      if (args.orderBy) {
        const key = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[key];
        results.sort((a, b) => (dir === 'desc' ? (b[key] > a[key] ? 1 : -1) : a[key] > b[key] ? 1 : -1));
      }
      if (args.skip) results = results.slice(args.skip);
      if (args.take) results = results.slice(0, args.take);
      return results.map((u) => this.formatUser(u, args.include, args.select));
    },
    create: async (args: { data: any; include?: any; select?: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const { accounts, ...userData } = args.data;

      const newUser = {
        id,
        ...userData,
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        status: userData.status || 'ONLINE',
        isAi: userData.isAi || false,
        emailVerified: userData.emailVerified || null,
        createdAt: now,
        updatedAt: now,
      };

      this.data.users.push(newUser);

      if (accounts && accounts.create) {
        const accs = Array.isArray(accounts.create) ? accounts.create : [accounts.create];
        for (const a of accs) {
          await this.account.create({ data: { ...a, userId: id } });
        }
      }

      this.scheduleSave();
      return this.formatUser(newUser, args.include, args.select);
    },
    upsert: async (args: { where: any; update: any; create: any; include?: any; select?: any }) => {
      const idx = this.data.users.findIndex((u) => this.matchCondition(u, args.where));
      if (idx !== -1) {
        this.data.users[idx] = { ...this.data.users[idx], ...args.update, updatedAt: new Date().toISOString() };
        this.scheduleSave();
        return this.formatUser(this.data.users[idx], args.include, args.select);
      }
      return this.user.create({ data: args.create, include: args.include, select: args.select });
    },
    update: async (args: { where: any; data: any; include?: any; select?: any }) => {
      const index = this.data.users.findIndex((u) => this.matchCondition(u, args.where));
      if (index === -1) throw new Error('User not found.');
      this.data.users[index] = {
        ...this.data.users[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
      return this.formatUser(this.data.users[index], args.include, args.select);
    },
    delete: async (args: { where: any }) => {
      const index = this.data.users.findIndex((u) => this.matchCondition(u, args.where));
      if (index === -1) return null;
      const [deleted] = this.data.users.splice(index, 1);
      this.scheduleSave();
      return deleted;
    },
    count: async (args: { where?: any } = {}) => {
      return this.data.users.filter((u) => this.matchCondition(u, args.where)).length;
    },
  };

  private formatUser(user: any, include?: any, select?: any) {
    let result: any = { ...user };

    if (include) {
      if (include.accounts) {
        result.accounts = this.data.accounts.filter((a) => a.userId === user.id);
      }
    }

    if (select) {
      const selected: any = {};
      for (const key of Object.keys(select)) {
        if (select[key] === true) {
          selected[key] = result[key];
        } else if (typeof select[key] === 'object') {
          if (key === 'accounts') {
            selected.accounts = this.data.accounts
              .filter((a) => a.userId === user.id)
              .map((a) => {
                const accSelect = select.accounts.select;
                if (!accSelect) return a;
                const accObj: any = {};
                for (const ak of Object.keys(accSelect)) {
                  if (accSelect[ak]) accObj[ak] = a[ak];
                }
                return accObj;
              });
          }
        }
      }
      return selected;
    }

    return result;
  }

  // =================== ACCOUNT MODEL ===================

  public account = {
    findUnique: async (args: { where: any; include?: any }) => {
      const acc = this.data.accounts.find((a) => this.matchCondition(a, args.where));
      if (!acc) return null;
      const res = { ...acc };
      if (args.include?.user) {
        res.user = await this.user.findUnique({ where: { id: acc.userId } });
      }
      return res;
    },
    create: async (args: { data: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newAcc = {
        id,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.accounts.push(newAcc);
      this.scheduleSave();
      return newAcc;
    },
    update: async (args: { where: any; data: any }) => {
      const index = this.data.accounts.findIndex((a) => this.matchCondition(a, args.where));
      if (index === -1) throw new Error('Account not found.');
      this.data.accounts[index] = { ...this.data.accounts[index], ...args.data };
      this.scheduleSave();
      return this.data.accounts[index];
    },
    deleteMany: async (args: { where: any }) => {
      const before = this.data.accounts.length;
      this.data.accounts = this.data.accounts.filter((a) => !this.matchCondition(a, args.where));
      this.scheduleSave();
      return { count: before - this.data.accounts.length };
    },
  };

  // =================== SESSION MODEL ===================

  public session = {
    findUnique: async (args: { where: any; include?: any }) => {
      const s = this.data.sessions.find((sess) => this.matchCondition(sess, args.where));
      if (!s) return null;
      const res = { ...s };
      if (args.include?.user) {
        res.user = await this.user.findUnique({ where: { id: s.userId }, select: args.include.user.select });
      }
      return res;
    },
    findFirst: async (args: { where: any; include?: any }) => {
      const s = this.data.sessions.find((sess) => this.matchCondition(sess, args.where));
      if (!s) return null;
      const res = { ...s };
      if (args.include?.user) {
        res.user = await this.user.findUnique({ where: { id: s.userId }, select: args.include.user.select });
      }
      return res;
    },
    create: async (args: { data: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newSession = {
        id,
        ...args.data,
        createdAt: new Date().toISOString(),
      };
      this.data.sessions.push(newSession);
      this.scheduleSave();
      return newSession;
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.sessions.findIndex((s) => this.matchCondition(s, args.where));
      if (idx !== -1) {
        const [del] = this.data.sessions.splice(idx, 1);
        this.scheduleSave();
        return del;
      }
      return null;
    },
    deleteMany: async (args: { where: any }) => {
      const before = this.data.sessions.length;
      this.data.sessions = this.data.sessions.filter((s) => !this.matchCondition(s, args.where));
      this.scheduleSave();
      return { count: before - this.data.sessions.length };
    },
  };

  // =================== ROOM MODEL ===================

  public room = {
    findUnique: async (args: { where: any; include?: any }) => {
      const room = this.data.rooms.find((r) => this.matchCondition(r, args.where));
      if (!room) return null;
      return this.formatRoom(room, args.include);
    },
    findFirst: async (args: { where: any; include?: any }) => {
      const room = this.data.rooms.find((r) => this.matchCondition(r, args.where));
      if (!room) return null;
      return this.formatRoom(room, args.include);
    },
    findMany: async (args: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number } = {}) => {
      let results = this.data.rooms.filter((r) => this.matchCondition(r, args.where));
      if (args.orderBy) {
        const key = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[key];
        results.sort((a, b) => (dir === 'desc' ? (b[key] > a[key] ? 1 : -1) : a[key] > b[key] ? 1 : -1));
      }
      if (args.skip) results = results.slice(args.skip);
      if (args.take) results = results.slice(0, args.take);
      return Promise.all(results.map((r) => this.formatRoom(r, args.include)));
    },
    create: async (args: { data: any; include?: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const { members, ...roomData } = args.data;

      const newRoom = {
        id,
        ...roomData,
        createdAt: now,
        updatedAt: now,
      };

      this.data.rooms.push(newRoom);

      if (members && members.create) {
        const mList = Array.isArray(members.create) ? members.create : [members.create];
        for (const m of mList) {
          await this.roomMember.create({ data: { ...m, roomId: id } });
        }
      }

      this.scheduleSave();
      return this.formatRoom(newRoom, args.include);
    },
    upsert: async (args: { where: any; update: any; create: any; include?: any }) => {
      const idx = this.data.rooms.findIndex((r) => this.matchCondition(r, args.where));
      if (idx !== -1) {
        this.data.rooms[idx] = { ...this.data.rooms[idx], ...args.update, updatedAt: new Date().toISOString() };
        this.scheduleSave();
        return this.formatRoom(this.data.rooms[idx], args.include);
      }
      return this.room.create({ data: args.create, include: args.include });
    },
    update: async (args: { where: any; data: any; include?: any }) => {
      const idx = this.data.rooms.findIndex((r) => this.matchCondition(r, args.where));
      if (idx === -1) throw new Error('Room not found.');
      this.data.rooms[idx] = {
        ...this.data.rooms[idx],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
      return this.formatRoom(this.data.rooms[idx], args.include);
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.rooms.findIndex((r) => this.matchCondition(r, args.where));
      if (idx === -1) return null;
      const [deleted] = this.data.rooms.splice(idx, 1);
      // Cascade delete members, messages
      this.data.roomMembers = this.data.roomMembers.filter((m) => m.roomId !== deleted.id);
      this.data.messages = this.data.messages.filter((m) => m.roomId !== deleted.id);
      this.scheduleSave();
      return deleted;
    },
    count: async (args: { where?: any } = {}) => {
      return this.data.rooms.filter((r) => this.matchCondition(r, args.where)).length;
    },
  };

  private async formatRoom(room: any, include?: any) {
    const res: any = { ...room };
    if (!include) return res;

    if (include.members) {
      const mList = this.data.roomMembers.filter((m) => m.roomId === room.id);
      if (include.members.include?.user) {
        res.members = await Promise.all(
          mList.map(async (m) => ({
            ...m,
            user: await this.user.findUnique({ where: { id: m.userId }, select: include.members.include.user.select }),
          }))
        );
      } else {
        res.members = mList;
      }
    }

    if (include.createdBy) {
      res.createdBy = await this.user.findUnique({ where: { id: room.createdById }, select: include.createdBy.select });
    }

    if (include._count) {
      res._count = {
        members: this.data.roomMembers.filter((m) => m.roomId === room.id).length,
        messages: this.data.messages.filter((m) => m.roomId === room.id).length,
      };
    }

    return res;
  }

  // =================== ROOM MEMBER MODEL ===================

  public roomMember = {
    findUnique: async (args: { where: any; include?: any }) => {
      const m = this.data.roomMembers.find((item) => this.matchCondition(item, args.where));
      if (!m) return null;
      return this.formatMember(m, args.include);
    },
    findFirst: async (args: { where: any; include?: any }) => {
      const m = this.data.roomMembers.find((item) => this.matchCondition(item, args.where));
      if (!m) return null;
      return this.formatMember(m, args.include);
    },
    findMany: async (args: { where?: any; include?: any; orderBy?: any } = {}) => {
      const list = this.data.roomMembers.filter((m) => this.matchCondition(m, args.where));
      return Promise.all(list.map((m) => this.formatMember(m, args.include)));
    },
    create: async (args: { data: any; include?: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newM = {
        id,
        ...args.data,
        joinedAt: new Date().toISOString(),
      };
      this.data.roomMembers.push(newM);
      this.scheduleSave();
      return this.formatMember(newM, args.include);
    },
    upsert: async (args: { where: any; update: any; create: any; include?: any }) => {
      const idx = this.data.roomMembers.findIndex((m) => this.matchCondition(m, args.where));
      if (idx !== -1) {
        this.data.roomMembers[idx] = { ...this.data.roomMembers[idx], ...args.update };
        this.scheduleSave();
        return this.formatMember(this.data.roomMembers[idx], args.include);
      }
      return this.roomMember.create({ data: args.create, include: args.include });
    },
    update: async (args: { where: any; data: any; include?: any }) => {
      const idx = this.data.roomMembers.findIndex((m) => this.matchCondition(m, args.where));
      if (idx === -1) throw new Error('Room member not found.');
      this.data.roomMembers[idx] = { ...this.data.roomMembers[idx], ...args.data };
      this.scheduleSave();
      return this.formatMember(this.data.roomMembers[idx], args.include);
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.roomMembers.findIndex((m) => this.matchCondition(m, args.where));
      if (idx !== -1) {
        const [del] = this.data.roomMembers.splice(idx, 1);
        this.scheduleSave();
        return del;
      }
      return null;
    },
    count: async (args: { where?: any } = {}) => {
      return this.data.roomMembers.filter((m) => this.matchCondition(m, args.where)).length;
    },
  };

  private async formatMember(m: any, include?: any) {
    const res: any = { ...m };
    if (!include) return res;

    if (include.user) {
      res.user = await this.user.findUnique({ where: { id: m.userId }, select: include.user.select });
    }
    if (include.room) {
      res.room = await this.room.findUnique({ where: { id: m.roomId }, include: include.room.include });
    }
    return res;
  }

  // =================== MESSAGE MODEL ===================

  public message = {
    findUnique: async (args: { where: any; include?: any }) => {
      const msg = this.data.messages.find((m) => this.matchCondition(m, args.where));
      if (!msg) return null;
      return this.formatMessage(msg, args.include);
    },
    findFirst: async (args: { where: any; include?: any }) => {
      const msg = this.data.messages.find((m) => this.matchCondition(m, args.where));
      if (!msg) return null;
      return this.formatMessage(msg, args.include);
    },
    findMany: async (args: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number; cursor?: any } = {}) => {
      let list = this.data.messages.filter((m) => this.matchCondition(m, args.where));

      if (args.orderBy) {
        const key = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[key];
        list.sort((a, b) => (dir === 'desc' ? (b[key] > a[key] ? 1 : -1) : a[key] > b[key] ? 1 : -1));
      }

      if (args.cursor && args.cursor.id) {
        const cursorIdx = list.findIndex((m) => m.id === args.cursor.id);
        if (cursorIdx !== -1) {
          list = list.slice(cursorIdx);
        }
      }

      if (args.skip) list = list.slice(args.skip);
      if (args.take) list = list.slice(0, args.take);

      return Promise.all(list.map((m) => this.formatMessage(m, args.include)));
    },
    create: async (args: { data: any; include?: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const { attachments, ...msgData } = args.data;

      const newMsg = {
        id,
        ...msgData,
        userId: msgData.userId || msgData.senderId,
        senderId: msgData.senderId || msgData.userId,
        createdAt: now,
        updatedAt: now,
      };

      this.data.messages.push(newMsg);

      if (attachments && attachments.create) {
        const aList = Array.isArray(attachments.create) ? attachments.create : [attachments.create];
        for (const a of aList) {
          await this.attachment.create({ data: { ...a, messageId: id } });
        }
      }

      this.scheduleSave();
      return this.formatMessage(newMsg, args.include);
    },
    update: async (args: { where: any; data: any; include?: any }) => {
      const idx = this.data.messages.findIndex((m) => this.matchCondition(m, args.where));
      if (idx === -1) throw new Error('Message not found.');
      this.data.messages[idx] = {
        ...this.data.messages[idx],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
      return this.formatMessage(this.data.messages[idx], args.include);
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.messages.findIndex((m) => this.matchCondition(m, args.where));
      if (idx !== -1) {
        const [del] = this.data.messages.splice(idx, 1);
        this.data.messageReactions = this.data.messageReactions.filter((r) => r.messageId !== del.id);
        this.data.attachments = this.data.attachments.filter((a) => a.messageId !== del.id);
        this.scheduleSave();
        return del;
      }
      return null;
    },
    count: async (args: { where?: any } = {}) => {
      return this.data.messages.filter((m) => this.matchCondition(m, args.where)).length;
    },
  };

  private async formatMessage(msg: any, include?: any) {
    const res: any = { ...msg };
    const senderId = msg.userId || msg.senderId;
    if (!include) return res;

    if (include.user || include.sender) {
      const user = await this.user.findUnique({
        where: { id: senderId },
        select: include.user?.select || include.sender?.select,
      });
      res.user = user;
      res.sender = user;
    }
    if (include.room) {
      res.room = await this.room.findUnique({ where: { id: msg.roomId } });
    }
    if (include.reactions) {
      const rList = this.data.messageReactions.filter((r) => r.messageId === msg.id);
      if (include.reactions.include?.user) {
        res.reactions = await Promise.all(
          rList.map(async (r) => ({
            ...r,
            user: await this.user.findUnique({ where: { id: r.userId }, select: include.reactions.include.user.select }),
          }))
        );
      } else {
        res.reactions = rList;
      }
    }
    if (include.attachments) {
      res.attachments = this.data.attachments.filter((a) => a.messageId === msg.id);
    }
    if (include.thread) {
      res.thread = this.data.threads.find((t) => t.parentMessageId === msg.id) || null;
    }
    return res;
  }

  // =================== MESSAGE REACTION MODEL ===================

  public messageReaction = {
    findUnique: async (args: { where: any; include?: any }) => {
      const r = this.data.messageReactions.find((item) => this.matchCondition(item, args.where));
      if (!r) return null;
      const res = { ...r };
      if (args.include?.user) {
        res.user = await this.user.findUnique({ where: { id: r.userId }, select: args.include.user.select });
      }
      return res;
    },
    findMany: async (args: { where?: any; include?: any } = {}) => {
      const list = this.data.messageReactions.filter((r) => this.matchCondition(r, args.where));
      if (args.include?.user) {
        return Promise.all(
          list.map(async (r) => ({
            ...r,
            user: await this.user.findUnique({ where: { id: r.userId }, select: args.include.user.select }),
          }))
        );
      }
      return list;
    },
    create: async (args: { data: any; include?: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newR = {
        id,
        ...args.data,
        createdAt: new Date().toISOString(),
      };
      this.data.messageReactions.push(newR);
      this.scheduleSave();
      if (args.include?.user) {
        newR.user = await this.user.findUnique({ where: { id: newR.userId }, select: args.include.user.select });
      }
      return newR;
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.messageReactions.findIndex((r) => this.matchCondition(r, args.where));
      if (idx !== -1) {
        const [del] = this.data.messageReactions.splice(idx, 1);
        this.scheduleSave();
        return del;
      }
      return null;
    },
    deleteMany: async (args: { where: any }) => {
      const before = this.data.messageReactions.length;
      this.data.messageReactions = this.data.messageReactions.filter((r) => !this.matchCondition(r, args.where));
      this.scheduleSave();
      return { count: before - this.data.messageReactions.length };
    },
  };

  // =================== THREAD MODEL ===================

  public thread = {
    findUnique: async (args: { where: any }) => {
      return this.data.threads.find((t) => this.matchCondition(t, args.where)) || null;
    },
    findFirst: async (args: { where: any }) => {
      return this.data.threads.find((t) => this.matchCondition(t, args.where)) || null;
    },
    create: async (args: { data: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newT = {
        id,
        replyCount: 0,
        lastReplyAt: null,
        ...args.data,
      };
      this.data.threads.push(newT);
      this.scheduleSave();
      return newT;
    },
    upsert: async (args: { where: any; update: any; create: any }) => {
      const idx = this.data.threads.findIndex((t) => this.matchCondition(t, args.where));
      if (idx !== -1) {
        const current = this.data.threads[idx];
        const updatedData: any = { ...current };

        if (args.update.replyCount) {
          if (typeof args.update.replyCount === 'object' && args.update.replyCount.increment !== undefined) {
            updatedData.replyCount = (current.replyCount || 0) + args.update.replyCount.increment;
          } else {
            updatedData.replyCount = args.update.replyCount;
          }
        }
        if (args.update.lastReplyAt) {
          updatedData.lastReplyAt = args.update.lastReplyAt;
        }

        this.data.threads[idx] = updatedData;
        this.scheduleSave();
        return updatedData;
      }
      return this.thread.create({ data: args.create });
    },
  };

  // =================== ATTACHMENT MODEL ===================

  public attachment = {
    findUnique: async (args: { where: any }) => {
      return this.data.attachments.find((a) => this.matchCondition(a, args.where)) || null;
    },
    findMany: async (args: { where?: any } = {}) => {
      return this.data.attachments.filter((a) => this.matchCondition(a, args.where));
    },
    create: async (args: { data: any }) => {
      const id = args.data.id || crypto.randomUUID();
      const newA = {
        id,
        ...args.data,
        createdAt: new Date().toISOString(),
      };
      this.data.attachments.push(newA);
      this.scheduleSave();
      return newA;
    },
    delete: async (args: { where: any }) => {
      const idx = this.data.attachments.findIndex((a) => this.matchCondition(a, args.where));
      if (idx !== -1) {
        const [del] = this.data.attachments.splice(idx, 1);
        this.scheduleSave();
        return del;
      }
      return null;
    },
  };
}

export const jsonDb = new JsonDatabase();
export default jsonDb;
