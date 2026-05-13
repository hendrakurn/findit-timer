import {
  type CountdownSessionState,
  type CountdownStatus,
  type SessionId,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_LABEL,
  SESSION_IDS,
  getRemainingMs,
} from './countdown';

type CountdownStore = Map<SessionId, CountdownSessionState>;

const globalStore = globalThis as typeof globalThis & {
  __finditCountdownStore?: CountdownStore;
};

const store = globalStore.__finditCountdownStore ?? new Map<SessionId, CountdownSessionState>();
globalStore.__finditCountdownStore = store;

function now() {
  return Date.now();
}

function createState(sessionId: SessionId): CountdownSessionState {
  return {
    roomId: sessionId,
    eventLabel: DEFAULT_LABEL,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    endAt: null,
    remainingMs: null,
    status: 'idle',
    updatedAt: now(),
  };
}

function cloneState(state: CountdownSessionState): CountdownSessionState {
  return { ...state };
}

function setState(sessionId: SessionId, state: CountdownSessionState) {
  store.set(sessionId, state);
  return cloneState(state);
}

function normalizeState(sessionId: SessionId, state: CountdownSessionState) {
  if (state.status !== 'running' || !state.endAt) return state;

  const remainingMs = getRemainingMs(state.endAt);
  if (remainingMs > 0) return { ...state, remainingMs };

  const completeState: CountdownSessionState = {
    ...state,
    status: 'complete',
    endAt: null,
    remainingMs: 0,
    updatedAt: now(),
  };
  store.set(sessionId, completeState);
  return completeState;
}

export function getSessionState(sessionId: SessionId): CountdownSessionState {
  const existing = store.get(sessionId) ?? setState(sessionId, createState(sessionId));
  return cloneState(normalizeState(sessionId, existing));
}

export function startSession(
  sessionId: SessionId,
  input: { eventLabel: string; durationSeconds: number },
): CountdownSessionState {
  const durationSeconds = Math.max(1, Math.min(999 * 3600 + 59 * 60 + 59, Math.floor(input.durationSeconds)));
  const eventLabel = input.eventLabel.trim() || DEFAULT_LABEL;
  const endAt = now() + durationSeconds * 1000;

  return setState(sessionId, {
    roomId: sessionId,
    eventLabel,
    durationSeconds,
    endAt,
    remainingMs: durationSeconds * 1000,
    status: 'running',
    updatedAt: now(),
  });
}

export function pauseSession(sessionId: SessionId): CountdownSessionState {
  const current = getSessionState(sessionId);
  if (current.status !== 'running') return current;

  const remainingMs = current.endAt ? getRemainingMs(current.endAt) : (current.remainingMs ?? 0);
  const status: CountdownStatus = remainingMs <= 0 ? 'complete' : 'paused';

  return setState(sessionId, {
    ...current,
    status,
    endAt: null,
    remainingMs: Math.max(0, remainingMs),
    updatedAt: now(),
  });
}

export function resumeSession(sessionId: SessionId): CountdownSessionState {
  const current = getSessionState(sessionId);
  if (current.status !== 'paused' || !current.remainingMs || current.remainingMs <= 0) return current;

  return setState(sessionId, {
    ...current,
    status: 'running',
    endAt: now() + current.remainingMs,
    updatedAt: now(),
  });
}

export function resetSession(sessionId: SessionId): CountdownSessionState {
  return setState(sessionId, createState(sessionId));
}

export function getValidSessions(): readonly SessionId[] {
  return SESSION_IDS;
}
