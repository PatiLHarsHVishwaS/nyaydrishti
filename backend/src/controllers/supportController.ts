import { Request, Response } from 'express';
import crypto from 'crypto';
import { supportInquiryStore } from '../models/SupportInquiry.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 200, subject: 200, message: 5000 };

export class SupportController {
  /**
   * Log a support inquiry from the Contact Support page.
   */
  public static async submitInquiry(req: Request, res: Response): Promise<void> {
    try {
      const field = (key: keyof typeof LIMITS) => (typeof req.body?.[key] === 'string' ? req.body[key].trim() : '');
      const name = field('name');
      const email = field('email');
      const subject = field('subject');
      const message = field('message');

      if (!name || !email || !subject || !message) {
        res.status(400).json({ error: 'Please fill in your name, email, subject and message.' });
        return;
      }
      if (!EMAIL_PATTERN.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      for (const [key, max] of Object.entries(LIMITS)) {
        if (field(key as keyof typeof LIMITS).length > max) {
          res.status(400).json({ error: `${key[0].toUpperCase()}${key.slice(1)} is too long (maximum ${max} characters).` });
          return;
        }
      }

      const id = `SUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const storedIn = await supportInquiryStore.save({ id, name, email, subject, message, status: 'open', createdAt: new Date() });
      console.log(`[SupportController] Inquiry ${id} logged (${storedIn}).`);

      res.status(201).json({ message: 'Your inquiry has been submitted.', referenceId: id });
    } catch (err: any) {
      console.error('[SupportController.submitInquiry] Error:', err);
      res.status(500).json({ error: 'Could not submit your inquiry. Please try again.' });
    }
  }
}
