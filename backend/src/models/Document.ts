import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import { LegalAnalysisResult } from '../schemas/analysisSchema.js';

export interface IDocumentRecord {
  id: string;
  originalName: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  extractedText: string;
  pageCount?: number;
  isScannedPdf?: boolean;
  ocrRequired?: boolean;
  status: 'uploaded' | 'extracting' | 'extracted' | 'analyzing' | 'analyzed' | 'error';
  errorMessage?: string;
  analysis?: LegalAnalysisResult;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentDocument = IDocumentRecord & MongooseDocument;

const DocumentSchema = new Schema<DocumentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    filePath: { type: String, required: true },
    extractedText: { type: String, default: '' },
    pageCount: { type: Number, default: 1 },
    isScannedPdf: { type: Boolean, default: false },
    ocrRequired: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['uploaded', 'extracting', 'extracted', 'analyzing', 'analyzed', 'error'],
      default: 'uploaded',
    },
    errorMessage: { type: String },
    analysis: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Mongoose Model
export const DocumentModel = mongoose.model<DocumentDocument>('Document', DocumentSchema);

// In-Memory store fallback in case MongoDB is unavailable
class InMemoryStore {
  private docs: Map<string, IDocumentRecord> = new Map();

  async save(doc: IDocumentRecord): Promise<IDocumentRecord> {
    doc.updatedAt = new Date();
    if (!doc.createdAt) doc.createdAt = new Date();
    this.docs.set(doc.id, { ...doc });
    return doc;
  }

  async findById(id: string): Promise<IDocumentRecord | null> {
    return this.docs.get(id) || null;
  }

  async findAll(): Promise<IDocumentRecord[]> {
    return Array.from(this.docs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async deleteById(id: string): Promise<boolean> {
    return this.docs.delete(id);
  }

  async count(): Promise<number> {
    return this.docs.size;
  }
}

export const inMemoryDocumentStore = new InMemoryStore();
