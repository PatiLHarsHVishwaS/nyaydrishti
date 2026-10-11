import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  pageCount: number;
  isScannedPdf: boolean;
  ocrRequired: boolean;
  charCount: number;
  wordCount: number;
}

export class TextExtractor {
  public static async extract(filePath: string, mimeType: string): Promise<ExtractionResult> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.txt' || mimeType.includes('text/plain')) {
      return this.extractFromTxt(filePath);
    } else if (ext === '.docx' || mimeType.includes('wordprocessingml')) {
      return this.extractFromDocx(filePath);
    } else if (ext === '.pdf' || mimeType.includes('pdf')) {
      return this.extractFromPdf(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext || mimeType}. Supported types are PDF, DOCX, and TXT.`);
    }
  }

  private static async extractFromTxt(filePath: string): Promise<ExtractionResult> {
    const buffer = await fs.promises.readFile(filePath);
    const text = buffer.toString('utf-8').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return {
      text,
      pageCount: Math.max(1, Math.ceil(wordCount / 400)),
      isScannedPdf: false,
      ocrRequired: false,
      charCount: text.length,
      wordCount,
    };
  }

  private static async extractFromDocx(filePath: string): Promise<ExtractionResult> {
    const buffer = await fs.promises.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return {
      text,
      pageCount: Math.max(1, Math.ceil(wordCount / 400)),
      isScannedPdf: false,
      ocrRequired: false,
      charCount: text.length,
      wordCount,
    };
  }

  private static async extractFromPdf(filePath: string): Promise<ExtractionResult> {
    const buffer = await fs.promises.readFile(filePath);
    // @ts-ignore
    const pdfModule = await import('pdf-parse');
    const pdfParse = pdfModule.default || pdfModule;

    const data = await pdfParse(buffer);
    const rawText = (data.text || '').trim();
    const pageCount = data.numpages || 1;
    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const charCount = rawText.length;

    // Check if PDF is likely a scanned image (fewer than 50 characters or less than 15 words across multiple pages)
    const isScanned = charCount < 60 || wordCount < 15;

    return {
      text: rawText,
      pageCount,
      isScannedPdf: isScanned,
      ocrRequired: isScanned,
      charCount,
      wordCount,
    };
  }
}
