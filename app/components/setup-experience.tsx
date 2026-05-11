'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import DurationForm from './duration-form';

const DEFAULT_HOURS = 24;
const DEFAULT_MINUTES = 0;
const DEFAULT_SECONDS = 0;
const DEFAULT_LABEL = 'Registration Closes In';
const DEFAULT_DURATION_S = durationToSeconds(DEFAULT_HOURS, DEFAULT_MINUTES, DEFAULT_SECONDS);

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
    if (ms > 0) return { status: 'running', endAt: saved.endAt, remainingMs: ms, durationSeconds: saved.durationSeconds, eventLabel: saved.eventLabel };
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
  if (s.status === 'paused' && s.remainingMs != null) return formatRemainingTime(s.remainingMs);
  if (s.status === 'complete') return formatRemainingTime(0);
  return formatRemainingTime(DEFAULT_DURATION_S * 1000);
}

function splitSeconds(total: number): { hours: number; minutes: number; seconds: number } {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { hours: h, minutes: m, seconds: s };
}

export default function SetupExperience() {
  const [state, setState] = useState<TimerState>(buildInitialState);
  const [display] = useState<RemainingTime>(() => buildInitialDisplay(buildInitialState()));

  const split = splitSeconds(state.durationSeconds);

  function handleStart(values: { hours: number; minutes: number; seconds: number; label: string }) {
    const totalSeconds = durationToSeconds(values.hours, values.minutes, values.seconds);
    const endAt = Date.now() + totalSeconds * 1000;
    setState({ status: 'running', endAt, remainingMs: totalSeconds * 1000, durationSeconds: totalSeconds, eventLabel: values.label });
    saveState({ eventLabel: values.label, durationSeconds: totalSeconds, endAt, remainingMs: totalSeconds * 1000, status: 'running' });
  }

  function handlePause() {
    const ms = state.endAt ? getRemainingMs(state.endAt) : (state.remainingMs ?? 0);
    setState((prev) => {
      const next: TimerState = { ...prev, status: 'paused', endAt: null, remainingMs: ms };
      saveState({ eventLabel: next.eventLabel, durationSeconds: next.durationSeconds, endAt: null, remainingMs: ms, status: 'paused' });
      return next;
    });
  }

  function handleResume() {
    const ms = state.remainingMs ?? 0;
    if (ms <= 0) return;
    const endAt = Date.now() + ms;
    setState((prev) => {
      const next: TimerState = { ...prev, status: 'running', endAt, remainingMs: ms };
      saveState({ eventLabel: next.eventLabel, durationSeconds: next.durationSeconds, endAt, remainingMs: ms, status: 'running' });
      return next;
    });
  }

  function handleReset() {
    clearState();
    setState({ status: 'idle', endAt: null, remainingMs: null, durationSeconds: DEFAULT_DURATION_S, eventLabel: DEFAULT_LABEL });
  }

  const currentStatus = state.status;
  const currentLabel = state.eventLabel;

  return (
    <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-8 md:py-12">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Page heading */}
        <div className="animate-rise-in stagger-1 flex items-center justify-between">
          <div>
            <h1
              className="font-mono text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ color: '#eaf0fb' }}
            >
              Configure Countdown
            </h1>
            <p className="font-mono text-[10px] tracking-widest uppercase mt-1" style={{ color: 'rgba(116, 146, 230, 0.7)' }}>
              {currentLabel}
            </p>
          </div>

          <Link
            href="/"
            className="focus-ring flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase rounded-[8px] px-4 py-2.5 btn-secondary"
            style={{ color: 'rgba(116, 146, 230, 0.8)', minHeight: '40px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            View Timer
          </Link>
        </div>

        {/* Status strip */}
        {currentStatus !== 'idle' && currentStatus !== 'running' && (
          <div
            className="animate-rise-in stagger-2 flex items-center gap-3 px-4 py-3 rounded-[10px]"
            style={{ background: 'rgba(10, 20, 70, 0.5)', border: '1px solid rgba(116, 146, 230, 0.2)' }}
          >
            {currentStatus === 'paused' && (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: '#f5c842' }} />
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'rgba(245, 200, 66, 0.8)' }}>Paused</span>
              </>
            )}
            {currentStatus === 'complete' && (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'rgba(248, 113, 113, 0.8)' }}>Complete</span>
              </>
            )}
            <span className="font-mono text-[10px] ml-auto" style={{ color: 'rgba(116, 146, 230, 0.5)' }}>
              {String(display.hours).padStart(2, '0')}:{String(display.minutes).padStart(2, '0')}:{String(display.seconds).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Form card */}
        <div className="animate-rise-in stagger-3 glass-card rounded-2xl p-6 md:p-8">
          <DurationForm
            defaults={{
              hours: state.status === 'idle' ? DEFAULT_HOURS : split.hours,
              minutes: state.status === 'idle' ? DEFAULT_MINUTES : split.minutes,
              seconds: state.status === 'idle' ? DEFAULT_SECONDS : split.seconds,
              label: currentLabel,
            }}
            status={state.status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
