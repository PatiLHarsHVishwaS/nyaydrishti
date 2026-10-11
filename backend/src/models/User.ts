import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import crypto from 'crypto';

export interface IUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'advocate' | 'researcher' | 'clerk' | 'citizen';
  token?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = IUserRecord & MongooseDocument;

const UserSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: {
      type: String,
      enum: ['advocate', 'researcher', 'clerk', 'citizen'],
      default: 'advocate',
    },
    token: { type: String },
    tokenExpiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);

// In-Memory store fallback in case MongoDB is unavailable
class InMemoryUserStore {
  private users: Map<string, IUserRecord> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private tokenIndex: Map<string, string> = new Map();

  constructor() {
    this.seedDefaultUser();
  }

  private seedDefaultUser() {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('Password@123', salt, 10000, 64, 'sha512').toString('hex');
    const defaultUser: IUserRecord = {
      id: 'usr_demo_harish_001',
      name: 'Harish P',
      email: 'demo@nyayadrishti.in',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'advocate',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
    this.emailIndex.set(defaultUser.email.toLowerCase(), defaultUser.id);
  }

  async save(user: IUserRecord): Promise<IUserRecord> {
    user.updatedAt = new Date();
    if (!user.createdAt) user.createdAt = new Date();
    this.users.set(user.id, { ...user });
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    if (user.token) {
      this.tokenIndex.set(user.token, user.id);
    }
    return user;
  }

  async findById(id: string): Promise<IUserRecord | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<IUserRecord | null> {
    const id = this.emailIndex.get(email.toLowerCase().trim());
    if (!id) return null;
    return this.users.get(id) || null;
  }

  async findByToken(token: string): Promise<IUserRecord | null> {
    const id = this.tokenIndex.get(token);
    if (!id) return null;
    const user = this.users.get(id);
    if (!user) return null;
    if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
      this.tokenIndex.delete(token);
      return null;
    }
    return user;
  }
}

export const inMemoryUserStore = new InMemoryUserStore();

// Security helper functions
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(hash, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
