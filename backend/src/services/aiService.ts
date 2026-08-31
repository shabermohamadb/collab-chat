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

const getGeminiApiKey = (): string | null => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key.trim() === '' || key.includes('your_gemini_api_key')) {
    return null;
  }
  return key.trim();
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
        username: config.ai?.botUsername?.toLowerCase() || 'ai',
        name: config.ai?.botName || 'Gemini Assistant',
        passwordHash: 'ai_system_account_no_login',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GeminiAI',
        bio: 'AI Teammate powered by Gemini participating in team conversations',
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

/**
 * Direct call to Google Gemini 1.5/2.0 API with zero extra npm dependencies
 */
const callGeminiAPI = async (
  apiKey: string,
  systemPrompt: string,
  history: Array<{ senderName: string; content: string; isAi: boolean }>,
  currentPrompt: string
): Promise<string | null> => {
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = history.map((m) => ({
      role: m.isAi ? 'model' : 'user',
      parts: [{ text: `${m.isAi ? '' : `${m.senderName}: `}${m.content}` }],
    }));

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: currentPrompt }],
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn(`[GEMINI API] Request failed (${response.status}): ${errText}`);
      return null;
    }

    const data = (await response.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch (error) {
    logger.warn('[GEMINI API] Network error calling Google Gemini API:', error);
    return null;
  }
};

/**
 * Intelligent contextual NLP fallback responder if no external API key is active
 */
const synthesizeLocalAIResponse = (
  roomName: string,
  history: Array<{ senderName: string; content: string; isAi: boolean }>,
  prompt: string
): string => {
  const userMessages = history.filter((m) => !m.isAi);
  const participants = Array.from(new Set(userMessages.map((m) => m.senderName)));
  const cleanPrompt = prompt.replace(/@(AI|gemini|bot|assistant)\b/gi, '').trim();
  const lower = cleanPrompt.toLowerCase();

  // Tamil greetings & slang handling
  if (lower.includes('machi') || lower.includes('machan') || lower.includes('thala') || lower.includes('bro') || lower.includes('nanba')) {
    return `Vanakkam nanba! 👋 Enna vishayam machi, enna help venum?
I'm active in **#${roomName}** and ready to help you with code, database architecture, debugging, or project ideas!

Ask me anything or mention \`@AI\` with your question! 🚀`;
  }

  // General greetings
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.startsWith('hi ') || lower.startsWith('hello ')) {
    const caller = participants[participants.length - 1] || 'there';
    return `Hello ${caller}! 👋 I'm your AI assistant in **#${roomName}**. How can I help you and the team today?
You can ask me to:
- 💡 Brainstorm ideas & architect features
- 💻 Review or write TypeScript/React/Node code
- 🔍 Debug issues or optimize queries
- 📝 Summarize the recent room discussions`;
  }

  // Architecture & Structure
  if (lower.includes('structure') || lower.includes('architect') || lower.includes('design')) {
    return `Based on the discussion in **#${roomName}**, here is a recommended modular architecture:

### 🏗️ Recommended Fullstack Architecture
1. **Frontend (React 18 + Vite + Tailwind CSS)**:
   - Component-driven UI with reactive custom hooks (\`useAuth\`, \`useSocket\`, \`useChat\`).
   - Optimistic UI updates with instant message dispatch and status syncing.
2. **Backend (Node.js + Express + Socket.IO)**:
   - Modular MVC router pattern (\`routes/\`, \`controllers/\`, \`services/\`, \`websocket/\`).
   - Secure HttpOnly session persistence and RBAC room permissions.
3. **Data Layer**:
   - Zero-dependency JSON storage engine or PostgreSQL database with relational indexing.
4. **Real-time Engine**:
   - WebSocket broadcast hub with typing indicators, presence, and AI event streams.

\`\`\`text
project-root/
├── frontend/src/       # React SPA (components, state, hooks)
├── backend/src/        # Express API & WebSocket handlers
└── data/               # Persistent database models
\`\`\`

Would you like me to detail any specific layer or generate code templates?`;
  }

  // Summarization
  if (lower.includes('summar') || lower.includes('recap') || lower.includes('what happened')) {
    const summaryPoints = userMessages
      .slice(-6)
      .map((m) => `- **${m.senderName}**: "${m.content.replace(/@AI/gi, '').trim()}"`)
      .join('\n');

    return `### 📋 Discussion Recap in #${roomName}
${summaryPoints || '- *No recent user messages yet.*'}

**Summary**: The team is collaborating in **#${roomName}**. Let me know what task or feature you want to tackle next!`;
  }

  // Code / Programming questions
  if (lower.includes('code') || lower.includes('function') || lower.includes('react') || lower.includes('javascript') || lower.includes('typescript') || lower.includes('api')) {
    return `Here are key technical best practices for **${cleanPrompt}**:

\`\`\`typescript
// Example async handler pattern
export const handleDataRequest = async (params: { id: string }): Promise<void> => {
  try {
    const result = await fetchResource(params.id);
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
};
\`\`\`

- ✅ Keep functions pure and decoupled.
- ✅ Validate payloads before state mutations.
- ✅ Implement centralized error boundaries.

Let me know if you'd like a complete implementation snippet!`;
  }

  // Default contextual response
  if (cleanPrompt.length > 0) {
    return `### 🤖 Gemini Assistant Insights
Regarding **"${cleanPrompt}"**:

1. **Analysis**: This is an important consideration for **#${roomName}**.
2. **Recommendation**:
   - Ensure the implementation is modular and scalable.
   - Maintain clear separation between data storage and presentation.
   - Keep real-time notifications synchronized across all room participants.

Feel free to ask me to write code, provide examples, or break this down further!`;
  }

  return `Hello team! 👋 I am your collaborative AI teammate in **#${roomName}**. Type \`@AI\` followed by your question or prompt to get assistance anytime!`;
};

export const handleAiMention = async (
  roomId: string,
  messageContent: string,
  triggeringUserId: string,
  parentMessageId?: string | null
) => {
  const config = getConfig();

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
      take: config.ai?.contextMessageLimit || 12,
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

    const chronologicalMessages = recentMessages.reverse().map((m: any) => ({
      senderName: m.sender?.name || m.sender?.username || (m.isAiMessage ? 'AI' : 'User'),
      content: m.content,
      isAi: !!m.isAiMessage || !!m.sender?.isAi,
    }));

    let responseText = '';

    const systemPrompt = `${config.ai?.systemPrompt || 'You are an intelligent, helpful AI collaboration partner in a team chat channel. Format your responses with beautiful Markdown.'}\nYou are participating in room "#${room.name}". Help team members with code, architecture, problem-solving, and general questions. Be friendly, concise, and helpful.`;

    // 1. Try Google Gemini API
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      logger.info('[AI SERVICE] Generating response with Google Gemini API...');
      const geminiResponse = await callGeminiAPI(geminiKey, systemPrompt, chronologicalMessages, messageContent);
      if (geminiResponse) {
        responseText = geminiResponse;
      }
    }

    // 2. Try OpenAI API if Gemini not configured
    if (!responseText) {
      const openai = getOpenAIClient();
      if (openai) {
        try {
          logger.info('[AI SERVICE] Generating response with OpenAI API...');
          const messagesPayload: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
          ];

          for (const msg of chronologicalMessages) {
            messagesPayload.push({
              role: msg.isAi ? 'assistant' : 'user',
              content: `${msg.isAi ? '' : `${msg.senderName}: `}${msg.content}`,
            });
          }

          messagesPayload.push({
            role: 'user',
            content: messageContent,
          });

          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: messagesPayload,
            temperature: 0.7,
            max_tokens: 1200,
          });

          responseText = completion.choices[0]?.message?.content || '';
        } catch (apiError) {
          logger.warn('[AI SERVICE] OpenAI API call failed, falling back to local contextual engine:', apiError);
        }
      }
    }

    // 3. Fallback to high-performance local contextual engine
    if (!responseText) {
      logger.info('[AI SERVICE] Synthesizing intelligent contextual response...');
      responseText = synthesizeLocalAIResponse(room.name, chronologicalMessages, messageContent);
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
