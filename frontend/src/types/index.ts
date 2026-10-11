export interface CaseClassification {
  primary: string;
  secondary: string[];
  confidence: number;
  evidence: string[];
}

export interface DocumentMetadata {
  title?: string | null;
  court?: string | null;
  caseNumber?: string | null;
  decisionDate?: string | null;
  bench: string[];
  jurisdiction?: string | null;
}

export interface Party {
  name: string;
  role: string;
  evidence: string;
}

export interface LegalProvision {
  name: string;
  type: string;
  context: string;
  evidence: string;
}

export interface CaseSummary {
  overview: string;
  facts: string[];
  legalIssues: string[];
  arguments: string[];
  reasoning: string[];
  outcome: string;
  outcomeCategory: 'Allowed' | 'Dismissed' | 'Partly Allowed' | 'Remanded' | 'Conviction' | 'Acquittal' | 'Disposed of with Directions' | 'Interim Relief Granted' | 'Other' | 'Unclear / Undetermined';
  limitations: string[];
}

export interface ImportantPassage {
  text: string;
  purpose: string;
  page?: number | null;
}

export interface LegalAnalysisResult {
  caseClassification: CaseClassification;
  documentMetadata: DocumentMetadata;
  parties: Party[];
  legalProvisions: LegalProvision[];
  summary: CaseSummary;
  importantPassages: ImportantPassage[];
  aiAnalysisInfo: {
    method: 'gemini-ai' | 'local-deterministic';
    model: string;
    analyzedAt: string;
    tokenUsageEstimate?: number;
    isDemoMode: boolean;
  };
}

export interface DocumentRecord {
  id: string;
  originalName: string;
  filename?: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  charCount?: number;
  wordCount?: number;
  isScannedPdf?: boolean;
  ocrRequired?: boolean;
  status: 'uploaded' | 'extracting' | 'extracted' | 'analyzing' | 'analyzed' | 'error';
  errorMessage?: string;
  extractedText?: string;
  analysis?: LegalAnalysisResult;
  caseType?: string;
  court?: string | null;
  caseNumber?: string | null;
  outcome?: string | null;
  analysisMethod?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  analyzed: number;
  pending: number;
  errors: number;
  distribution: { type: string; count: number }[];
  recent: DocumentRecord[];
  databaseType: string;
}

export interface SampleDocumentItem {
  id: string;
  title: string;
  filename: string;
  caseType: string;
  court: string;
  description: string;
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  database: string;
  aiProvider: {
    configured: boolean;
    service: string;
    model: string;
    isDemoMode: boolean;
    supportedFormats: string[];
    maxFileSizeMB: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'advocate' | 'researcher' | 'clerk' | 'citizen';
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: User;
}

