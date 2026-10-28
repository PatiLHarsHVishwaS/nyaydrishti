/**
 * Live progress of running analyses, so the UI can show which step is running instead of a bare spinner.
 * Kept in memory only: progress is short-lived and meaningless after a server restart.
 */

export type AnalysisStage = 'preparing' | 'reading' | 'writing' | 'verifying' | 'saving' | 'done' | 'error';

export interface AnalysisProgress {
  stage: AnalysisStage;
  /** Human-readable description of what is happening right now. */
  detail: string;
  /** Sections of the judgment read so far / in total (stage "reading"). */
  sectionsDone: number;
  sectionsTotal: number;
  startedAt: number;
  updatedAt: number;
}

export type ProgressUpdate = Partial<Pick<AnalysisProgress, 'stage' | 'detail' | 'sectionsDone' | 'sectionsTotal'>>;
export type ProgressReporter = (update: ProgressUpdate) => void;

// Finished entries are kept briefly so a polling client still sees "done" / "error".
const KEEP_FINISHED_MS = 10 * 60 * 1000;

class AnalysisProgressStore {
  private entries = new Map<string, AnalysisProgress>();

  start(id: string): ProgressReporter {
    this.prune();
    const now = Date.now();
    this.entries.set(id, {
      stage: 'preparing',
      detail: 'Preparing the judgment text',
      sectionsDone: 0,
      sectionsTotal: 0,
      startedAt: now,
      updatedAt: now,
    });
    return (update) => this.update(id, update);
  }

  update(id: string, update: ProgressUpdate): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    Object.assign(entry, update, { updatedAt: Date.now() });
  }

  finish(id: string, stage: 'done' | 'error', detail: string): void {
    this.update(id, { stage, detail });
  }

  get(id: string): (AnalysisProgress & { elapsedMs: number }) | null {
    const entry = this.entries.get(id);
    if (!entry) return null;
    const end = entry.stage === 'done' || entry.stage === 'error' ? entry.updatedAt : Date.now();
    return { ...entry, elapsedMs: end - entry.startedAt };
  }

  private prune(): void {
    const cutoff = Date.now() - KEEP_FINISHED_MS;
    for (const [id, entry] of this.entries) {
      if ((entry.stage === 'done' || entry.stage === 'error') && entry.updatedAt < cutoff) this.entries.delete(id);
    }
  }
}

export const analysisProgress = new AnalysisProgressStore();
