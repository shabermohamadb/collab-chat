import fs from 'fs';
import path from 'path';

export interface AppConfig {
  appName: string;
  appDescription: string;
  version: string;
  maxMessageLength: number;
  maxFileUploadSizeBytes: number;
  allowedFileExtensions: string[];
  pagination: {
    defaultMessagesPerPage: number;
    maxMessagesPerPage: number;
  };
  features: {
    ai: boolean;
    threads: boolean;
    reactions: boolean;
    attachments: boolean;
    typingIndicators: boolean;
    presence: boolean;
    directMessages: boolean;
  };
  ai: {
    model: string;
    botName: string;
    botUsername: string;
    contextMessageLimit: number;
    systemPrompt: string;
  };
}

let loadedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (loadedConfig) return loadedConfig;

  try {
    const primaryPath = path.resolve(process.cwd(), 'config/config.json');
    const altPath = path.resolve(process.cwd(), '../config/config.json');
    const configPath = fs.existsSync(primaryPath) ? primaryPath : (fs.existsSync(altPath) ? altPath : null);

    if (configPath) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      loadedConfig = JSON.parse(raw);
      return loadedConfig!;
    }
  } catch (err) {
    console.error('Failed to load config/config.json, using defaults:', err);
  }

  // Fallback defaults if file read fails
  return {
    appName: 'CollabSpace',
    appDescription: 'Real-time collaborative chat platform',
    version: '1.0.0',
    maxMessageLength: 5000,
    maxFileUploadSizeBytes: 10485760,
    allowedFileExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.txt', '.md', '.json', '.ts', '.tsx', '.js', '.py'],
    pagination: {
      defaultMessagesPerPage: 50,
      maxMessagesPerPage: 100,
    },
    features: {
      ai: true,
      threads: true,
      reactions: true,
      attachments: true,
      typingIndicators: true,
      presence: true,
      directMessages: true,
    },
    ai: {
      model: 'gemini-1.5-flash',
      botName: 'Gemini Assistant',
      botUsername: 'ai',
      contextMessageLimit: 10,
      systemPrompt: 'You are an intelligent, helpful AI collaboration partner in a team chat channel. Format your responses with beautiful Markdown.',
    },
  };
};

export default getConfig;
