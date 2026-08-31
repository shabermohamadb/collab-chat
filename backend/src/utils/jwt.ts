import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'collab_chat_default_jwt_secret_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      isAi: user.isAi,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

export const verifyToken = (token: string): AuthenticatedUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch (error) {
    return null;
  }
};
