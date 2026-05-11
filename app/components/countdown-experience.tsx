'use client';

import { useEffect, useState } from 'react';
import {
  type CountdownStatus,
  type RemainingTime,
  durationToSeconds,
  formatRemainingTime,
  getRemainingMs,
  saveState,
  loadState,
  clearState,
} from '../lib/countdown';
import CountdownDisplay from './countdown-display';
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
    if (ms > 0) {
      return {
        status: 'running',
        endAt: saved.endAt,
        remainingMs: ms,
        durationSeconds: saved.durationSeconds,
        eventLabel: saved.eventLabel,
      };
    }
    return {
      status: 'complete',
      endAt: null,
      remainingMs: 0,
      durationSeconds: saved.durationSeconds,
      eventLabel: saved.eventLabel,
    };
  }

  if (saved.status === 'paused' && saved.remainingMs != null) {
    return {
      status: 'paused',
      endAt: null,
      remainingMs: saved.remainingMs,
      durationSeconds: saved.durationSeconds,
      eventLabel: saved.eventLabel,
    };
  }

  if (saved.status === 'complete') {
    return {
      status: 'complete',
      endAt: null,
      remainingMs: 0,
      durationSeconds: saved.durationSeconds,
      eventLabel: saved.eventLabel,
    };
  }

  return def;
}

function buildInitialDisplay(s: TimerState): RemainingTime {
  if (s.status === 'running' && s.endAt) {
    return formatRemainingTime(getRemainingMs(s.endAt));
  }
  if (s.status === 'paused' && s.remainingMs != null) {
    return formatRemainingTime(s.remainingMs);
  }
  if (s.status === 'complete') {
    return formatRemainingTime(0);
  }
  return formatRemainingTime(DEFAULT_DURATION_S * 1000);
}

export default function CountdownExperience() {
  const [state, setState] = useState<TimerState>(buildInitialState);
  const [display, setDisplay] = useState<RemainingTime>(() =>
    buildInitialDisplay(buildInitialState()),
  );

  // Subscribe to the clock — pure external-system sync, no setState in body
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
          saveState({
            eventLabel: next.eventLabel,
            durationSeconds: next.durationSeconds,
            endAt: null,
            remainingMs: 0,
            status: 'complete',
          });
          return next;
        });
      }
    }, 250);

    return () => clearInterval(id);
  }, [state.status, state.endAt]);

  function handleStart(values: {
    hours: number;
    minutes: number;
    seconds: number;
    label: string;
  }) {
    const totalSeconds = durationToSeconds(values.hours, values.minutes, values.seconds);
    const endAt = Date.now() + totalSeconds * 1000;
    setState({
      status: 'running',
      endAt,
      remainingMs: totalSeconds * 1000,
      durationSeconds: totalSeconds,
      eventLabel: values.label,
    });
    setDisplay(formatRemainingTime(totalSeconds * 1000));
    saveState({
      eventLabel: values.label,
      durationSeconds: totalSeconds,
      endAt,
      remainingMs: totalSeconds * 1000,
      status: 'running',
    });
  }

  function handlePause() {
    const ms = state.endAt ? getRemainingMs(state.endAt) : (state.remainingMs ?? 0);
    setDisplay(formatRemainingTime(ms));
    setState((prev) => {
      const next: TimerState = { ...prev, status: 'paused', endAt: null, remainingMs: ms };
      saveState({
        eventLabel: next.eventLabel,
        durationSeconds: next.durationSeconds,
        endAt: null,
        remainingMs: ms,
        status: 'paused',
      });
      return next;
    });
  }

  function handleResume() {
    const ms = state.remainingMs ?? 0;
    if (ms <= 0) return;
    const endAt = Date.now() + ms;
    setState((prev) => {
      const next: TimerState = { ...prev, status: 'running', endAt, remainingMs: ms };
      saveState({
        eventLabel: next.eventLabel,
        durationSeconds: next.durationSeconds,
        endAt,
        remainingMs: ms,
        status: 'running',
      });
      return next;
    });
  }

  function handleReset() {
    clearState();
    setState({
      status: 'idle',
      endAt: null,
      remainingMs: null,
      durationSeconds: DEFAULT_DURATION_S,
      eventLabel: DEFAULT_LABEL,
    });
    setDisplay(formatRemainingTime(DEFAULT_DURATION_S * 1000));
  }

  const isAlarm = state.status === 'complete';

  return (
    <div
      className={`relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-8 md:py-12 ${isAlarm ? 'animate-alarm' : ''}`}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-10 md:gap-14">
        {/* Timer display */}
        <div className="animate-rise-in stagger-1 w-full">
          <CountdownDisplay
            hours={display.hours}
            minutes={display.minutes}
            seconds={display.seconds}
            status={state.status}
            eventLabel={state.eventLabel}
          />
        </div>

        {/* Divider */}
        <div
          className="animate-rise-in stagger-3 w-full max-w-sm"
          style={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, oklch(0.4 0.15 245 / 0.4), transparent)',
          }}
        />

        {/* Form */}
        <div className="animate-rise-in stagger-4 glass-card rounded-2xl p-6 md:p-8 w-full">
          <DurationForm
            defaults={{
              hours: DEFAULT_HOURS,
              minutes: DEFAULT_MINUTES,
              seconds: DEFAULT_SECONDS,
              label: state.eventLabel,
            }}
            status={state.status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
          />
        </div>

        {/* Alarm message */}
        {isAlarm && (
          <div className="animate-rise-in text-center" aria-live="assertive">
            <p
              className="font-mono text-xs tracking-[0.2em] uppercase"
              style={{ color: '#fca5a5' }}
            >
              Time&apos;s up — press Reset to start a new countdown
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
