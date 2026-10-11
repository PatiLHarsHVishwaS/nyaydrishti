import mongoose, { Schema } from 'mongoose';

export interface ISupportInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: Date;
}

const SupportInquirySchema = new Schema<ISupportInquiry>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const SupportInquiryModel = mongoose.model<ISupportInquiry>('SupportInquiry', SupportInquirySchema);

/** MongoDB when connected, otherwise kept in memory (same pattern as documents). */
class SupportInquiryStore {
  private memory: ISupportInquiry[] = [];

  async save(inquiry: ISupportInquiry): Promise<'mongodb' | 'memory'> {
    if (mongoose.connection.readyState === 1) {
      try {
        await SupportInquiryModel.create(inquiry);
        return 'mongodb';
      } catch (err) {
        console.warn('[SupportInquiryStore] MongoDB save failed, keeping inquiry in memory:', err);
      }
    }
    this.memory.push(inquiry);
    return 'memory';
  }
}

export const supportInquiryStore = new SupportInquiryStore();
