import OpenAI from 'openai';
import prisma from '../models/prisma.js';
import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { broadcastToRoom } from './socketService.js';

let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

export const getOrCreateAiUser = async () => {
  const config = getConfig();
  let aiUser = await prisma.user.findFirst({
    where: { isAi: true },
  });

  if (!aiUser) {
    aiUser = await prisma.user.create({
      data: {
        email: 'ai-assistant@collabspace.internal',
        username: config.ai.botUsername.toLowerCase(),
        name: config.ai.botName,
        passwordHash: 'ai_system_account_no_login',
        avatar: '/avatars/ai-avatar.svg',
        bio: 'AI Teammate participating in group discussions',
        status: 'ONLINE',
        isAi: true,
      },
    });
  }

  return {
    ...aiUser,
    displayName: aiUser.name,
    avatarUrl: aiUser.avatar,
  };
};

const synthesizeLocalAIResponse = (
  roomName: string,
  history: Array<{ senderName: string; content: string; isAi: boolean }>,
  prompt: string
): string => {
  const userMessages = history.filter((m) => !m.isAi);
  const participants = Array.from(new Set(userMessages.map((m) => m.senderName)));
  const cleanPrompt = prompt.replace(/@AI\b/gi, '').trim();

  if (cleanPrompt.toLowerCase().includes('structure') || cleanPrompt.toLowerCase().includes('architect')) {
    return `Based on the team's discussion (${participants.join(', ')}), here is a recommended architecture structure:

### 🏗️ Proposed Architecture Overview
1. **Frontend**: React + TypeScript + Tailwind CSS with modular component hierarchy and real-time Socket.IO hooks.
2. **Backend**: Express + TypeScript REST endpoints paired with bi-directional WebSocket event channels.
3. **Database**: PostgreSQL managed with Prisma ORM for type-safe schema migrations.
4. **Shared AI Layer**: Background context resolution aggregator feeding multi-user conversation history.

\`\`\`text
workspace/
├── client/     # Real-time reactive UI & state
├── server/     # API controllers, WebSocket hub, AI context pipeline
└── database/   # PostgreSQL schema & relations
\`\`\`

Let me know if you would like me to detail any specific layer or module!`;
  }

  if (cleanPrompt.toLowerCase().includes('payment') || cleanPrompt.toLowerCase().includes('register')) {
    return `Here is a suggested workflow based on the recent inputs from **${participants.join('** and **')}**:

- **Authentication & Profiles**: Secure JWT & HttpOnly sessions with bcrypt password hashing.
- **Registration Flow**: Dynamic form validation with instant room/team assignment.
- **Payment Processing**: Stripe webhook integration with idempotency keys and ledger verification.

Would you like me to generate the database schema or API endpoint contract for this?`;
  }

  if (cleanPrompt.toLowerCase().includes('summar') || cleanPrompt.toLowerCase().includes('recap')) {
    const summaryPoints = userMessages
      .slice(-5)
      .map((m) => `- **${m.senderName}**: "${m.content.replace(/@AI/gi, '').trim()}"`)
      .join('\n');

    return `Here is a quick summary of the recent discussion in **#${roomName}**:\n\n${summaryPoints}\n\nWhat would you like the team to focus on next?`;
  }

  if (userMessages.length > 1) {
    const recentSpeakers = participants.slice(-3).join(', ');
    return `Based on the discussion with ${recentSpeakers || 'the team'}:\n\nRegarding "${cleanPrompt || 'your request'}":\n- We should prioritize modular design and type safety across services.\n- Ensure real-time events propagate cleanly without redundant state updates.\n- Keep communication transparent within the room.\n\nLet me know how else I can assist the team!`;
  }

  return `Hello team! I'm here in **#${roomName}** to help you collaborate, write code, brainstorm solutions, and structure your project. Ask me anything or type \`@AI\` followed by your question!`;
};

export const handleAiMention = async (roomId: string, messageContent: string, triggeringUserId: string, parentMessageId?: string | null) => {
  const config = getConfig();
  if (!config.features.ai) return;

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    });

    if (!room) return;

    const aiUser = await getOrCreateAiUser();

    // Broadcast AI is typing indicator
    broadcastToRoom(roomId, 'typing:update', {
      roomId,
      userId: aiUser.id,
      username: aiUser.username,
      displayName: aiUser.displayName,
      isTyping: true,
    });

    // Fetch recent shared room messages for context
    const recentMessages = await prisma.message.findMany({
      where: {
        roomId,
        isDeleted: false,
        parentMessageId: parentMessageId || null,
      },
      orderBy: { createdAt: 'desc' },
      take: config.ai.contextMessageLimit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            isAi: true,
          },
        },
      },
    });

    const chronologicalMessages = recentMessages.reverse();

    let responseText = '';
    const openai = getOpenAIClient();

    if (openai) {
      try {
        const messagesPayload: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: `${config.ai.systemPrompt}\nYou are participating in room "#${room.name}". The team members in the room are having a real-time conversation. Address their collaborative goals directly. Use markdown, lists, or code snippets when helpful. Keep responses concise and focused.`,
          },
        ];

        for (const msg of chronologicalMessages) {
          const senderName = msg.sender?.name || msg.sender?.username || (msg.isAiMessage ? 'AI' : 'User');
          if (msg.isAiMessage) {
            messagesPayload.push({
              role: 'assistant',
              content: msg.content,
            });
          } else {
            messagesPayload.push({
              role: 'user',
              content: `${senderName}: ${msg.content}`,
            });
          }
        }

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || config.ai.model,
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 1000,
        });

        responseText = completion.choices[0]?.message?.content || '';
      } catch (apiError) {
        logger.warn('OpenAI API call failed or rate limited, falling back to contextual engine:', apiError);
      }
    }

    if (!responseText) {
      const historyContext = chronologicalMessages.map((m) => ({
        senderName: m.sender?.name || m.sender?.username || 'Team Member',
        content: m.content,
        isAi: m.isAiMessage,
      }));
      responseText = synthesizeLocalAIResponse(room.name, historyContext, messageContent);
    }

    // Stop AI typing indicator
    broadcastToRoom(roomId, 'typing:update', {
      roomId,
      userId: aiUser.id,
      username: aiUser.username,
      displayName: aiUser.displayName,
      isTyping: false,
    });

    // Save AI response message to database
    const rawAiMessage = await prisma.message.create({
      data: {
        roomId,
        senderId: aiUser.id,
        content: responseText,
        isAiMessage: true,
        parentMessageId: parentMessageId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            status: true,
            isAi: true,
          },
        },
        reactions: true,
        attachments: true,
        threadInfo: true,
      },
    });

    const aiMessage = {
      ...rawAiMessage,
      sender: rawAiMessage.sender
        ? {
            ...rawAiMessage.sender,
            displayName: rawAiMessage.sender.name || rawAiMessage.sender.username,
            avatarUrl: rawAiMessage.sender.avatar,
          }
        : null,
    };

    // If it's a thread reply, update thread count
    if (parentMessageId) {
      await prisma.thread.upsert({
        where: { rootMessageId: parentMessageId },
        update: {
          replyCount: { increment: 1 },
          lastReplyAt: new Date(),
        },
        create: {
          rootMessageId: parentMessageId,
          replyCount: 1,
          lastReplyAt: new Date(),
        },
      });

      broadcastToRoom(roomId, 'thread:reply', {
        roomId,
        parentMessageId,
        message: aiMessage,
      });
    }

    // Broadcast AI message to all users in the room
    broadcastToRoom(roomId, 'message:new', aiMessage);

    return aiMessage;
  } catch (error) {
    logger.error('Error handling AI mention:', error);
  }
};
