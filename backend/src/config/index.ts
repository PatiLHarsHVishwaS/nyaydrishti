import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nyayadrishti',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  maxFileSize: 25 * 1024 * 1024, // 25 MB
  nodeEnv: process.env.NODE_ENV || 'development',
};
