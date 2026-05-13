'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type CountdownSessionState,
  type CountdownStatus,
  type SessionId,
  createDefaultSessionState,
  formatRemainingTime,
} from '../lib/countdown';
import CountdownDisplay from './countdown-display';

const POLL_MS = 1500;
const TICK_MS = 250;

function remainingMsFromState(state: CountdownSessionState, nowMs: number): number {
  if (state.status === 'running' && state.endAt) return Math.max(0, state.endAt - nowMs);
  if (state.status === 'paused' && state.remainingMs != null) return state.remainingMs;
  if (state.status === 'complete') return 0;
  return state.durationSeconds * 1000;
}

export default function SessionCountdownDisplay({ sessionId }: { sessionId: SessionId }) {
  const [state, setState] = useState<CountdownSessionState>(() => createDefaultSessionState(sessionId));
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [hasConnectionError, setHasConnectionError] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load countdown state');
      const data = await response.json() as { state: CountdownSessionState };
      setState(data.state);
      setHasConnectionError(false);
    } catch {
      setHasConnectionError(true);
    }
  }, [sessionId]);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refreshState();
    }, 0);
    const id = setInterval(() => {
      void refreshState();
    }, POLL_MS);
    return () => {
      window.clearTimeout(initial);
      clearInterval(id);
    };
  }, [refreshState]);

  useEffect(() => {
    if (state.status !== 'running' || !state.endAt) return;
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, TICK_MS);

    return () => clearInterval(id);
  }, [state.endAt, state.status]);

  const remainingMs = remainingMsFromState(state, nowMs);
  const display = formatRemainingTime(remainingMs);
  const displayStatus: CountdownStatus =
    state.status === 'running' && remainingMs <= 0 ? 'complete' : state.status;
  const isAlarm = displayStatus === 'complete';

  return (
    <div
      className={`relative z-10 flex flex-1 flex-col items-center justify-center px-4 ${isAlarm ? 'animate-alarm' : ''}`}
    >
      <div className="w-full max-w-3xl">
        <div className="animate-rise-in stagger-1 w-full">
          <CountdownDisplay
            hours={display.hours}
            minutes={display.minutes}
            seconds={display.seconds}
            status={displayStatus}
            eventLabel={state.eventLabel}
          />
        </div>

        {hasConnectionError && (
          <p
            className="animate-rise-in mt-8 text-center font-mono text-[10px] uppercase tracking-[0.18em]"
            role="status"
            style={{ color: 'rgba(234, 240, 251, 0.62)' }}
          >
            Connection interrupted
          </p>
        )}
      </div>
    </div>
  );
}
