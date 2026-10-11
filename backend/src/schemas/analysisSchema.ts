import { z } from 'zod';

export const CaseClassificationSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).default([]),
});

export const DocumentMetadataSchema = z.object({
  title: z.string().nullable().optional(),
  court: z.string().nullable().optional(),
  caseNumber: z.string().nullable().optional(),
  decisionDate: z.string().nullable().optional(),
  bench: z.array(z.string()).default([]),
  jurisdiction: z.string().nullable().optional(),
});

export const PartySchema = z.object({
  name: z.string(),
  role: z.string(), // e.g. "Petitioner", "Respondent", "Appellant", "Accused", "Judge", "Advocate for Petitioner", etc.
  evidence: z.string().default(''),
});

export const LegalProvisionSchema = z.object({
  name: z.string(), // e.g. "Article 226", "Section 482", "Order 39 Rule 1 & 2"
  type: z.string(), // "Statutory Section", "Constitutional Article", "Court Rule", "Precedent/Case Law", "Statute/Act"
  context: z.string(), // How it applies in this case
  evidence: z.string().default(''),
});

export const CaseSummarySchema = z.object({
  overview: z.string(),
  facts: z.array(z.string()).default([]),
  legalIssues: z.array(z.string()).default([]),
  arguments: z.array(z.string()).default([]), // can also include appellant/respondent breakdowns
  reasoning: z.array(z.string()).default([]),
  outcome: z.string(),
  outcomeCategory: z.enum([
    'Allowed',
    'Dismissed',
    'Partly Allowed',
    'Remanded',
    'Conviction',
    'Acquittal',
    'Disposed of with Directions',
    'Interim Relief Granted',
    'Other',
    'Unclear / Undetermined'
  ]).default('Other'),
  limitations: z.array(z.string()).default([]),
});

export const ImportantPassageSchema = z.object({
  text: z.string(),
  purpose: z.string(), // e.g., "Classification Context", "Court Holding", "Legal Interpretation", "Disposition"
  page: z.number().nullable().optional(),
});

export const LegalAnalysisResultSchema = z.object({
  caseClassification: CaseClassificationSchema,
  documentMetadata: DocumentMetadataSchema,
  parties: z.array(PartySchema).default([]),
  legalProvisions: z.array(LegalProvisionSchema).default([]),
  summary: CaseSummarySchema,
  importantPassages: z.array(ImportantPassageSchema).default([]),
  aiAnalysisInfo: z.object({
    method: z.enum(['gemini-ai', 'local-deterministic']),
    model: z.string(),
    analyzedAt: z.string(),
    tokenUsageEstimate: z.number().optional(),
    isDemoMode: z.boolean(),
  }),
});

export type CaseClassification = z.infer<typeof CaseClassificationSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type Party = z.infer<typeof PartySchema>;
export type LegalProvision = z.infer<typeof LegalProvisionSchema>;
export type CaseSummary = z.infer<typeof CaseSummarySchema>;
export type ImportantPassage = z.infer<typeof ImportantPassageSchema>;
export type LegalAnalysisResult = z.infer<typeof LegalAnalysisResultSchema>;
