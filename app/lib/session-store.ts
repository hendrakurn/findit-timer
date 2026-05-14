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
type RedisCommandResponse<T> = {
  result?: T;
  error?: string;
};

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

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return {
    url: url.replace(/\/+$/, ''),
    token,
  };
}

function shouldRequirePersistentStorage() {
  return process.env.NODE_ENV === 'production' && process.env.FINDIT_ALLOW_MEMORY_STORE !== 'true';
}

function storageKey(sessionId: SessionId) {
  return `findit:countdown:${sessionId}`;
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = getRedisConfig();
  if (!config) throw new Error('Persistent countdown storage is not configured');

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  const payload = await response.json() as RedisCommandResponse<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error || 'Persistent countdown storage request failed');
  }

  return payload.result as T;
}

function parseStoredState(sessionId: SessionId, raw: string | null): CountdownSessionState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CountdownSessionState;
    if (parsed.roomId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readStoredState(sessionId: SessionId): Promise<CountdownSessionState | null> {
  if (!getRedisConfig()) {
    if (shouldRequirePersistentStorage()) {
      throw new Error('Persistent countdown storage is not configured');
    }
    return store.get(sessionId) ?? null;
  }

  const raw = await redisCommand<string | null>(['GET', storageKey(sessionId)]);
  const parsed = parseStoredState(sessionId, raw);
  if (parsed) store.set(sessionId, parsed);
  return parsed;
}

async function persistState(sessionId: SessionId, state: CountdownSessionState): Promise<CountdownSessionState> {
  store.set(sessionId, state);

  if (getRedisConfig()) {
    await redisCommand<string>(['SET', storageKey(sessionId), JSON.stringify(state)]);
  } else if (shouldRequirePersistentStorage()) {
    throw new Error('Persistent countdown storage is not configured');
  }

  return cloneState(state);
}

async function normalizeState(sessionId: SessionId, state: CountdownSessionState): Promise<CountdownSessionState> {
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
  await persistState(sessionId, completeState);
  return completeState;
}

export async function getSessionState(sessionId: SessionId): Promise<CountdownSessionState> {
  const existing = await readStoredState(sessionId);
  const state = existing ?? (await persistState(sessionId, createState(sessionId)));
  return cloneState(await normalizeState(sessionId, state));
}

export async function startSession(
  sessionId: SessionId,
  input: { eventLabel: string; durationSeconds: number },
): Promise<CountdownSessionState> {
  const durationSeconds = Math.max(1, Math.min(999 * 3600 + 59 * 60 + 59, Math.floor(input.durationSeconds)));
  const eventLabel = input.eventLabel.trim() || DEFAULT_LABEL;
  const endAt = now() + durationSeconds * 1000;

  return persistState(sessionId, {
    roomId: sessionId,
    eventLabel,
    durationSeconds,
    endAt,
    remainingMs: durationSeconds * 1000,
    status: 'running',
    updatedAt: now(),
  });
}

export async function pauseSession(sessionId: SessionId): Promise<CountdownSessionState> {
  const current = await getSessionState(sessionId);
  if (current.status !== 'running') return current;

  const remainingMs = current.endAt ? getRemainingMs(current.endAt) : (current.remainingMs ?? 0);
  const status: CountdownStatus = remainingMs <= 0 ? 'complete' : 'paused';

  return persistState(sessionId, {
    ...current,
    status,
    endAt: null,
    remainingMs: Math.max(0, remainingMs),
    updatedAt: now(),
  });
}

export async function resumeSession(sessionId: SessionId): Promise<CountdownSessionState> {
  const current = await getSessionState(sessionId);
  if (current.status !== 'paused' || !current.remainingMs || current.remainingMs <= 0) return current;

  return persistState(sessionId, {
    ...current,
    status: 'running',
    endAt: now() + current.remainingMs,
    updatedAt: now(),
  });
}

export async function resetSession(sessionId: SessionId): Promise<CountdownSessionState> {
  return persistState(sessionId, createState(sessionId));
}

export function getValidSessions(): readonly SessionId[] {
  return SESSION_IDS;
}
