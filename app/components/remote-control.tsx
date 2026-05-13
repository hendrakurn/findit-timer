'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type CountdownSessionState,
  type SessionId,
  createDefaultSessionState,
  durationToSeconds,
  formatRemainingTime,
  getRemainingMs,
  getSessionDisplayName,
} from '../lib/countdown';
import DurationForm from './duration-form';

const POLL_MS = 1500;

type AuthState = 'checking' | 'locked' | 'authorized';
type ConnectionState = 'connecting' | 'connected' | 'updating' | 'error';

function splitSeconds(total: number): { hours: number; minutes: number; seconds: number } {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds };
}

function remainingText(state: CountdownSessionState) {
  const ms =
    state.status === 'running' && state.endAt
      ? getRemainingMs(state.endAt)
      : state.status === 'paused' && state.remainingMs != null
        ? state.remainingMs
        : state.status === 'complete'
          ? 0
          : state.durationSeconds * 1000;
  const time = formatRemainingTime(ms);
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
}

function StatusDot({ state }: { state: ConnectionState }) {
  const color =
    state === 'connected'
      ? '#38bdf8'
      : state === 'updating'
        ? '#f5c842'
        : state === 'error'
          ? '#f87171'
          : 'rgba(234, 240, 251, 0.45)';

  return <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

export default function RemoteControl({ sessionId }: { sessionId: SessionId }) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<CountdownSessionState>(() => createDefaultSessionState(sessionId));

  const sessionName = getSessionDisplayName(sessionId);
  const isBusy = connectionState === 'updating';

  const loadState = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load countdown state');
      const data = await response.json() as { state: CountdownSessionState };
      setState(data.state);
      setConnectionState((current) => (current === 'updating' ? current : 'connected'));
      setError(null);
    } catch {
      setConnectionState('error');
      setError('Cannot reach countdown session.');
    }
  }, [sessionId]);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/auth`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Auth check failed');
        const data = await response.json() as { authenticated: boolean };
        if (!active) return;
        setAuthState(data.authenticated ? 'authorized' : 'locked');
        if (data.authenticated) void loadState();
      } catch {
        if (!active) return;
        setAuthState('locked');
        setConnectionState('error');
        setError('Cannot verify remote access.');
      }
    }

    const initial = window.setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(initial);
    };
  }, [loadState, sessionId]);

  useEffect(() => {
    if (authState !== 'authorized') return;
    const id = setInterval(() => {
      void loadState();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [authState, loadState]);

  async function handlePinSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectionState('updating');
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        setConnectionState('error');
        setError(response.status === 401 ? 'PIN is not valid for this session.' : 'Remote access failed.');
        return;
      }

      setPin('');
      setAuthState('authorized');
      setConnectionState('connected');
      await loadState();
    } catch {
      setConnectionState('error');
      setError('Cannot reach remote auth endpoint.');
    }
  }

  async function sendAction(body: Record<string, unknown>) {
    setConnectionState('updating');
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        setAuthState('locked');
        setConnectionState('error');
        setError('Remote session expired. Enter the PIN again.');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        setConnectionState('error');
        setError(data?.error ?? 'Countdown update failed.');
        return;
      }

      const data = await response.json() as { state: CountdownSessionState };
      setState(data.state);
      setConnectionState('connected');
    } catch {
      setConnectionState('error');
      setError('Cannot update countdown session.');
    }
  }

  const split = splitSeconds(state.durationSeconds);

  if (authState !== 'authorized') {
    return (
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <form
          onSubmit={handlePinSubmit}
          className="animate-rise-in glass-card flex w-full max-w-sm flex-col gap-5 rounded-2xl p-6"
        >
          <div>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'rgba(116, 146, 230, 0.86)' }}
            >
              {sessionName}
            </p>
            <h1 className="mt-2 font-mono text-lg font-semibold uppercase tracking-[0.16em] text-findit-50">
              Remote PIN
            </h1>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="remote-pin"
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'oklch(0.55 0.15 245)' }}
            >
              PIN
            </label>
            <input
              id="remote-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/[^0-9]/g, ''));
                setError(null);
              }}
              disabled={authState === 'checking' || isBusy}
              className="input-field focus-ring rounded-[10px] px-4 py-3 text-center font-mono text-xl tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'pin-error' : undefined}
            />
            {error && (
              <p id="pin-error" role="alert" className="text-xs" style={{ color: '#fca5a5' }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length === 0 || authState === 'checking' || isBusy}
            className="focus-ring btn-primary rounded-[10px] px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Unlock Remote
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-xl flex-col gap-5">
        <section className="animate-rise-in stagger-1 glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'rgba(116, 146, 230, 0.86)' }}
              >
                {sessionName}
              </p>
              <h1 className="mt-2 font-mono text-lg font-semibold uppercase tracking-[0.12em] text-findit-50">
                Countdown Remote
              </h1>
            </div>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-findit-100/75">
              <StatusDot state={connectionState} />
              {connectionState}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-3 rounded-xl border border-findit-300/20 bg-findit-900/35 px-4 py-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-findit-300/75">
                Current
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-findit-yellow">
                {remainingText(state)}
              </p>
            </div>
            <p
              className="pb-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: state.status === 'complete' ? '#fca5a5' : 'rgba(234, 240, 251, 0.72)' }}
            >
              {state.status}
            </p>
          </div>
        </section>

        <section className="animate-rise-in stagger-2 glass-card rounded-2xl p-5 md:p-6">
          <DurationForm
            key={state.updatedAt}
            defaults={{
              hours: state.status === 'idle' ? 24 : split.hours,
              minutes: state.status === 'idle' ? 0 : split.minutes,
              seconds: state.status === 'idle' ? 0 : split.seconds,
              label: state.eventLabel,
            }}
            status={state.status}
            busy={isBusy}
            onStart={(values) => {
              void sendAction({
                action: 'start',
                eventLabel: values.label,
                durationSeconds: durationToSeconds(values.hours, values.minutes, values.seconds),
              });
            }}
            onPause={() => void sendAction({ action: 'pause' })}
            onResume={() => void sendAction({ action: 'resume' })}
            onReset={() => void sendAction({ action: 'reset' })}
          />
        </section>

        {error && (
          <p className="animate-rise-in text-center text-xs" role="alert" style={{ color: '#fca5a5' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
