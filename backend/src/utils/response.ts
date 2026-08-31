import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = 200) => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res: Response, error: string, statusCode: number = 400) => {
  const payload: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(payload);
};
