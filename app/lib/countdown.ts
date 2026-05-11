export interface RemainingTime {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export type CountdownStatus = 'idle' | 'running' | 'paused' | 'complete';

export interface PersistedState {
  eventLabel: string;
  durationSeconds: number;
  endAt: number | null;
  remainingMs: number | null;
  status: CountdownStatus;
}

export function clampDurationInput(
  hours: number,
  minutes: number,
  seconds: number,
): { hours: number; minutes: number; seconds: number } {
  return {
    hours: Math.max(0, Math.min(999, Math.floor(hours))),
    minutes: Math.max(0, Math.min(59, Math.floor(minutes))),
    seconds: Math.max(0, Math.min(59, Math.floor(seconds))),
  };
}

export function durationToSeconds(
  hours: number,
  minutes: number,
  seconds: number,
): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatRemainingTime(ms: number): RemainingTime {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs: ms };
}

export function getRemainingMs(endAt: number): number {
  return Math.max(0, endAt - Date.now());
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function padHours(n: number): string {
  return n >= 100 ? String(n) : String(n).padStart(2, '0');
}

const STORAGE_KEY = 'findit_countdown_v1';

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — fail silently
  }
}

export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
