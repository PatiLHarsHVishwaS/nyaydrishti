import React, { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { AnalysisProgress, AnalysisStage } from '../types';

const STEPS: Array<{ stage: AnalysisStage; label: string }> = [
  { stage: 'preparing', label: 'Prepare the judgment text' },
  { stage: 'reading', label: 'Read the judgment section by section' },
  { stage: 'writing', label: 'Write the structured report' },
  { stage: 'verifying', label: 'Verify the final order and quotes' },
  { stage: 'saving', label: 'Save the report to the database' },
];

const POLL_MS = 2000;

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Rough overall percentage; reading is the longest step for multi-section judgments. */
function percentFor(p: AnalysisProgress | null): number {
  if (!p) return 2;
  switch (p.stage) {
    case 'preparing':
      return 3;
    case 'reading':
      return 5 + (p.sectionsTotal ? Math.round((60 * p.sectionsDone) / p.sectionsTotal) : 0);
    case 'writing':
      return 68;
    case 'verifying':
      return 88;
    case 'saving':
      return 96;
    case 'done':
      return 100;
    default:
      return 0;
  }
}

/**
 * Live view of a running analysis: current step, sections read, elapsed time and whether the backend is still reachable.
 */
export const AnalysisProgressPanel: React.FC<{ documentId: string }> = ({ documentId }) => {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [connected, setConnected] = useState(true);
  const [, setTick] = useState(0);
  // Server-reported elapsed time plus the local time since that report, so the clock ticks smoothly between polls.
  const elapsedBase = useRef<{ ms: number; at: number }>({ ms: 0, at: Date.now() });

  useEffect(() => {
    let stopped = false;
    const mountedAt = Date.now();
    const poll = async () => {
      try {
        const { progress: p } = await api.getAnalysisProgress(documentId);
        if (stopped) return;
        setConnected(true);
        // A finished entry from an earlier run of this document is not this run's progress.
        const stale = p && (p.stage === 'done' || p.stage === 'error') && p.updatedAt < mountedAt;
        if (p && !stale) {
          setProgress(p);
          elapsedBase.current = { ms: p.elapsedMs, at: Date.now() };
        }
      } catch {
        if (!stopped) setConnected(false);
      }
    };
    poll();
    const pollTimer = setInterval(poll, POLL_MS);
    const clockTimer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      stopped = true;
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    };
  }, [documentId]);

  const finished = progress?.stage === 'done' || progress?.stage === 'error';
  const elapsed = elapsedBase.current.ms + (finished ? 0 : Date.now() - elapsedBase.current.at);
  const currentIndex = progress ? STEPS.findIndex((s) => s.stage === progress.stage) : 0;
  const percent = percentFor(progress);

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-[#E5E2DA] bg-white shadow-subtle space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-[#14243D]">Analysing the judgment</div>
          <div className="text-xs text-[#737986]">
            {progress?.detail || 'Starting the analysis'}
            {progress?.stage === 'reading' && progress.sectionsTotal > 0 && (
              <span className="text-[#14243D] font-medium">
                {' '}· {progress.sectionsDone} of {progress.sectionsTotal} section{progress.sectionsTotal === 1 ? '' : 's'} done
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xl font-semibold text-[#14243D] tabular-nums">{formatElapsed(elapsed)}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#737986]">elapsed</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-[#F3F1EB] overflow-hidden">
        <div className="h-full bg-[#14243D] rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const state = progress?.stage === 'done' || i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
          return (
            <li key={step.stage} className="flex items-center space-x-2.5 text-xs">
              {state === 'done' ? (
                <span className="w-5 h-5 rounded-full bg-[#EBF7F1] text-[#23845D] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              ) : state === 'active' ? (
                <span className="w-5 h-5 rounded-full bg-[#FDF6E7] text-[#9A6B12] flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border border-[#E5E2DA] text-[#A0A5AE] flex items-center justify-center shrink-0 text-[10px]">
                  {i + 1}
                </span>
              )}
              <span className={state === 'pending' ? 'text-[#A0A5AE]' : state === 'active' ? 'text-[#14243D] font-semibold' : 'text-[#3F4754]'}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="pt-3 border-t border-[#F0EEE8] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {connected ? (
          <span className="inline-flex items-center space-x-1.5 text-[#23845D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23845D] animate-pulse" />
            <span>Backend connected, still working</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1.5 text-[#C44B4B]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cannot reach the backend. Check that the server is running.</span>
          </span>
        )}
        <span className="text-[#737986]">Each step waits for the NVIDIA AI service; long judgments can take several minutes.</span>
      </div>
    </div>
  );
};
