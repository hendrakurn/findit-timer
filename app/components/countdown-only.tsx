'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  type CountdownStatus,
  type RemainingTime,
  durationToSeconds,
  formatRemainingTime,
  getRemainingMs,
  loadState,
  saveState,
  clearState,
} from '../lib/countdown';
import CountdownDisplay from './countdown-display';

const DEFAULT_DURATION_S = durationToSeconds(24, 0, 0);
const DEFAULT_LABEL = 'Registration Closes In';

interface TimerState {
  status: CountdownStatus;
  endAt: number | null;
  remainingMs: number | null;
  durationSeconds: number;
  eventLabel: string;
}

function buildInitialState(): TimerState {
  const def: TimerState = {
    status: 'idle',
    endAt: null,
    remainingMs: null,
    durationSeconds: DEFAULT_DURATION_S,
    eventLabel: DEFAULT_LABEL,
  };
  if (typeof window === 'undefined') return def;

  const saved = loadState();
  if (!saved) return def;

  if (saved.status === 'running' && saved.endAt) {
    const ms = getRemainingMs(saved.endAt);
    if (ms > 0) {
      return { status: 'running', endAt: saved.endAt, remainingMs: ms, durationSeconds: saved.durationSeconds, eventLabel: saved.eventLabel };
    }
    return { status: 'complete', endAt: null, remainingMs: 0, durationSeconds: saved.durationSeconds, eventLabel: saved.eventLabel };
  }
  if (saved.status === 'paused' && saved.remainingMs != null) {
    return { status: 'paused', endAt: null, remainingMs: saved.remainingMs, durationSeconds: saved.durationSeconds, eventLabel: saved.eventLabel };
  }
  if (saved.status === 'complete') {
    return { status: 'complete', endAt: null, remainingMs: 0, durationSeconds: saved.durationSeconds, eventLabel: saved.eventLabel };
  }
  return def;
}

function buildInitialDisplay(s: TimerState): RemainingTime {
  if (s.status === 'running' && s.endAt) return formatRemainingTime(getRemainingMs(s.endAt));
  if ((s.status === 'paused') && s.remainingMs != null) return formatRemainingTime(s.remainingMs);
  if (s.status === 'complete') return formatRemainingTime(0);
  return formatRemainingTime(DEFAULT_DURATION_S * 1000);
}

export default function CountdownOnly() {
  const [state, setState] = useState<TimerState>(buildInitialState);
  const [display, setDisplay] = useState<RemainingTime>(() => buildInitialDisplay(buildInitialState()));

  useEffect(() => {
    if (state.status !== 'running' || !state.endAt) return;
    const endAt = state.endAt;
    const id = setInterval(() => {
      const ms = getRemainingMs(endAt);
      setDisplay(formatRemainingTime(ms));
      if (ms <= 0) {
        clearInterval(id);
        setState((prev) => {
          const next = { ...prev, status: 'complete' as CountdownStatus, endAt: null };
          saveState({ eventLabel: next.eventLabel, durationSeconds: next.durationSeconds, endAt: null, remainingMs: 0, status: 'complete' });
          return next;
        });
      }
    }, 250);
    return () => clearInterval(id);
  }, [state.status, state.endAt]);

  function handleReset() {
    clearState();
    setState({ status: 'idle', endAt: null, remainingMs: null, durationSeconds: DEFAULT_DURATION_S, eventLabel: DEFAULT_LABEL });
    setDisplay(formatRemainingTime(DEFAULT_DURATION_S * 1000));
  }

  const isAlarm = state.status === 'complete';

  return (
    <div
      className={`relative z-10 flex flex-col items-center justify-center flex-1 px-4 ${isAlarm ? 'animate-alarm' : ''}`}
    >
      <div className="w-full max-w-3xl flex flex-col items-center gap-8 md:gap-12">
        {/* Timer */}
        <div className="animate-rise-in stagger-1 w-full">
          <CountdownDisplay
            hours={display.hours}
            minutes={display.minutes}
            seconds={display.seconds}
            status={state.status}
            eventLabel={state.eventLabel}
          />
        </div>

        {/* Alarm complete message + reset */}
        {isAlarm && (
          <div className="animate-rise-in flex flex-col items-center gap-4" aria-live="assertive">
            <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: '#fca5a5' }}>
              Time&apos;s up
            </p>
            <button
              onClick={handleReset}
              className="focus-ring btn-secondary rounded-[10px] px-8 py-3 font-mono text-sm tracking-wider"
              style={{ color: '#eaf0fb', minHeight: '44px' }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Settings link */}
        <div className="animate-rise-in stagger-5">
          <Link
            href="/setup"
            className="focus-ring flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase rounded-[8px] px-4 py-2.5 btn-secondary"
            style={{ color: 'rgba(116, 146, 230, 0.8)', minHeight: '40px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
            Configure
          </Link>
        </div>
      </div>
    </div>
  );
}
