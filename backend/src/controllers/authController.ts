import { Request, Response } from 'express';
import mongoose from 'express';
import {
  UserModel,
  inMemoryUserStore,
  hashPassword,
  verifyPassword,
  generateToken,
  IUserRecord,
} from '../models/User.js';

export class AuthController {
  /**
   * User Registration
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Validate inputs
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({ error: 'Please enter a valid full name (minimum 2 characters).' });
        return;
      }

      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      // Check if user already exists
      let existingUser: any = null;
      try {
        existingUser = await UserModel.findOne({ email: cleanEmail }).exec();
      } catch (err) {
        existingUser = await inMemoryUserStore.findByEmail(cleanEmail);
      }
      if (!existingUser) {
        existingUser = await inMemoryUserStore.findByEmail(cleanEmail);
      }

      if (existingUser) {
        res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
        return;
      }

      // Hash password
      const { hash, salt } = hashPassword(password);
      const token = generateToken();
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUserRecord: IUserRecord = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        role: (role && ['advocate', 'researcher', 'clerk', 'citizen'].includes(role)) ? role : 'advocate',
        token,
        tokenExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to store
      try {
        const userDoc = new UserModel(newUserRecord);
        await userDoc.save();
      } catch (dbErr) {
        console.warn('[Auth] MongoDB save failed, persisting to in-memory store.');
      }
      // Always keep memory store updated for rapid lookup
      await inMemoryUserStore.save(newUserRecord);

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: {
          id: newUserRecord.id,
          name: newUserRecord.name,
          email: newUserRecord.email,
          role: newUserRecord.role,
        },
      });
    } catch (error: any) {
      console.error('[Auth Register Error]:', error);
      res.status(500).json({ error: 'Registration failed due to an internal server error.' });
    }
  }

  /**
   * User Login
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Both email and password are required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();

      // Look up user
      let user: any = null;
      try {
        user = await UserModel.findOne({ email: cleanEmail }).exec();
      } catch (err) {
        user = await inMemoryUserStore.findByEmail(cleanEmail);
      }
      if (!user) {
        user = await inMemoryUserStore.findByEmail(cleanEmail);
      }

      if (!user) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      // Verify password
      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email address or password.' });
        return;
      }

      // Generate new session token
      const token = generateToken();
      const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      user.token = token;
      user.tokenExpiresAt = tokenExpiresAt;
      user.updatedAt = new Date();

      try {
        if (typeof user.save === 'function') {
          await user.save();
        }
      } catch (e) {
        // ignore
      }
      await inMemoryUserStore.save({
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        role: user.role,
        token,
        tokenExpiresAt,
        createdAt: user.createdAt,
        updatedAt: new Date(),
      });

      res.status(200).json({
        message: 'Signed in successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('[Auth Login Error]:', error);
      res.status(500).json({ error: 'Login failed due to an internal server error.' });
    }
  }

  /**
   * Get Current User Profile
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or malformed authorization token.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      let user: any = null;

      try {
        user = await UserModel.findOne({
          token,
          tokenExpiresAt: { $gt: new Date() },
        }).exec();
      } catch (err) {
        user = await inMemoryUserStore.findByToken(token);
      }
      if (!user) {
        user = await inMemoryUserStore.findByToken(token);
      }

      if (!user) {
        res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error('[Auth Me Error]:', error);
      res.status(500).json({ error: 'Failed to authenticate user.' });
    }
  }

  /**
   * User Logout
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          await UserModel.updateOne({ token }, { $unset: { token: '', tokenExpiresAt: '' } });
        } catch (e) {
          // ignore
        }
      }
      res.status(200).json({ message: 'Signed out successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Logout failed.' });
    }
  }
}
