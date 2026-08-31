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
    const configPath = path.resolve(__dirname, '../../../config/config.json');
    if (fs.existsSync(configPath)) {
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
      model: 'gpt-4o-mini',
      botName: 'AI Assistant',
      botUsername: 'AI',
      contextMessageLimit: 20,
      systemPrompt: 'You are AI, a helpful participant in a multi-user collaborative chat workspace.',
    },
  };
};
