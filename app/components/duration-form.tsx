'use client';

import { useRef, useState } from 'react';
import { clampDurationInput } from '../lib/countdown';

interface DurationValues {
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}

interface ValidationErrors {
  hours?: string;
  minutes?: string;
  seconds?: string;
  total?: string;
}

interface Props {
  defaults: DurationValues;
  status: 'idle' | 'running' | 'paused' | 'complete';
  busy?: boolean;
  onStart: (values: DurationValues) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const PRESETS = [
  { label: '15m', hours: 0, minutes: 15, seconds: 0 },
  { label: '1h', hours: 1, minutes: 0, seconds: 0 },
  { label: '6h', hours: 6, minutes: 0, seconds: 0 },
  { label: '24h', hours: 24, minutes: 0, seconds: 0 },
];

function parseIntField(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function validate(
  label: string,
  hours: number,
  minutes: number,
  seconds: number,
): ValidationErrors {
  const errs: ValidationErrors = {};
  if (hours < 0 || hours > 999) errs.hours = 'Hours must be 0–999';
  if (minutes < 0 || minutes > 59) errs.minutes = 'Minutes must be 0–59';
  if (seconds < 0 || seconds > 59) errs.seconds = 'Seconds must be 0–59';
  const total = hours * 3600 + minutes * 60 + seconds;
  if (!errs.hours && !errs.minutes && !errs.seconds && total < 1) {
    errs.total = 'Total duration must be at least 1 second';
  }
  return errs;
}

export default function DurationForm({
  defaults,
  status,
  busy = false,
  onStart,
  onPause,
  onResume,
  onReset,
}: Props) {
  const [label, setLabel] = useState(defaults.label);
  const [hoursRaw, setHoursRaw] = useState(String(defaults.hours));
  const [minutesRaw, setMinutesRaw] = useState(String(defaults.minutes));
  const [secondsRaw, setSecondsRaw] = useState(String(defaults.seconds));
  const [errors, setErrors] = useState<ValidationErrors>({});

  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  const isActive = status === 'running' || status === 'paused';
  const isDisabled = busy || isActive;

  function applyPreset(preset: (typeof PRESETS)[0]) {
    setHoursRaw(String(preset.hours));
    setMinutesRaw(String(preset.minutes));
    setSecondsRaw(String(preset.seconds));
    setErrors({});
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const h = parseIntField(hoursRaw);
    const m = parseIntField(minutesRaw);
    const s = parseIntField(secondsRaw);
    const clamped = clampDurationInput(h, m, s);
    const errs = validate(label, clamped.hours, clamped.minutes, clamped.seconds);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.hours && hoursRef.current) hoursRef.current.focus();
      else if (errs.minutes && minutesRef.current) minutesRef.current.focus();
      else if (errs.seconds && secondsRef.current) secondsRef.current.focus();
      return;
    }

    onStart({ hours: clamped.hours, minutes: clamped.minutes, seconds: clamped.seconds, label });
  }

  return (
    <form onSubmit={handleStart} noValidate className="w-full flex flex-col gap-5">
      {/* Event label */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="event-label"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: 'oklch(0.55 0.15 245)' }}
        >
          Event Label
        </label>
        <input
          id="event-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Registration Closes In"
          maxLength={60}
          disabled={isDisabled}
          className="input-field focus-ring rounded-[10px] px-4 py-2.5 text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        />
      </div>

      {/* Duration inputs */}
      <div className="flex flex-col gap-1.5">
        <span
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: 'oklch(0.55 0.15 245)' }}
        >
          Duration
        </span>

        <div className="grid grid-cols-3 gap-2">
          {/* Hours */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="duration-hours"
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: 'oklch(0.5 0.12 245)' }}
            >
              HH
            </label>
            <input
              ref={hoursRef}
              id="duration-hours"
              type="text"
              inputMode="numeric"
              value={hoursRaw}
              onChange={(e) => {
                setHoursRaw(e.target.value.replace(/[^0-9]/g, ''));
                setErrors((p) => ({ ...p, hours: undefined, total: undefined }));
              }}
              onBlur={(e) => {
                const v = parseIntField(e.target.value);
                setHoursRaw(String(Math.min(999, Math.max(0, v))));
              }}
              disabled={isDisabled}
              aria-invalid={!!errors.hours}
              aria-describedby={errors.hours ? 'err-hours' : undefined}
              className="input-field focus-ring rounded-[10px] px-3 py-2.5 text-center font-mono text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.hours && (
              <p id="err-hours" role="alert" className="text-[10px]" style={{ color: '#f87171' }}>
                {errors.hours}
              </p>
            )}
          </div>

          {/* Minutes */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="duration-minutes"
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: 'oklch(0.5 0.12 245)' }}
            >
              MM
            </label>
            <input
              ref={minutesRef}
              id="duration-minutes"
              type="text"
              inputMode="numeric"
              value={minutesRaw}
              onChange={(e) => {
                setMinutesRaw(e.target.value.replace(/[^0-9]/g, ''));
                setErrors((p) => ({ ...p, minutes: undefined, total: undefined }));
              }}
              onBlur={(e) => {
                const v = parseIntField(e.target.value);
                setMinutesRaw(String(Math.min(59, Math.max(0, v))));
              }}
              disabled={isDisabled}
              aria-invalid={!!errors.minutes}
              aria-describedby={errors.minutes ? 'err-minutes' : undefined}
              className="input-field focus-ring rounded-[10px] px-3 py-2.5 text-center font-mono text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.minutes && (
              <p id="err-minutes" role="alert" className="text-[10px]" style={{ color: '#f87171' }}>
                {errors.minutes}
              </p>
            )}
          </div>

          {/* Seconds */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="duration-seconds"
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: 'oklch(0.5 0.12 245)' }}
            >
              SS
            </label>
            <input
              ref={secondsRef}
              id="duration-seconds"
              type="text"
              inputMode="numeric"
              value={secondsRaw}
              onChange={(e) => {
                setSecondsRaw(e.target.value.replace(/[^0-9]/g, ''));
                setErrors((p) => ({ ...p, seconds: undefined, total: undefined }));
              }}
              onBlur={(e) => {
                const v = parseIntField(e.target.value);
                setSecondsRaw(String(Math.min(59, Math.max(0, v))));
              }}
              disabled={isDisabled}
              aria-invalid={!!errors.seconds}
              aria-describedby={errors.seconds ? 'err-seconds' : undefined}
              className="input-field focus-ring rounded-[10px] px-3 py-2.5 text-center font-mono text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.seconds && (
              <p id="err-seconds" role="alert" className="text-[10px]" style={{ color: '#f87171' }}>
                {errors.seconds}
              </p>
            )}
          </div>
        </div>

        {errors.total && (
          <p role="alert" className="text-[10px]" style={{ color: '#f87171' }}>
            {errors.total}
          </p>
        )}
      </div>

      {/* Presets */}
      {!isActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-[9px] tracking-widest uppercase mr-1"
            style={{ color: 'oklch(0.45 0.1 245)' }}
          >
            Quick
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              disabled={busy}
              className="focus-ring btn-secondary rounded-[8px] px-3 py-1.5 font-mono text-xs"
              style={{ color: 'oklch(0.7 0.15 245)', minHeight: '32px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {status === 'idle' || status === 'complete' ? (
          <button
            type="submit"
            disabled={busy}
            className="focus-ring btn-primary rounded-[10px] px-8 py-3 font-mono text-sm font-semibold text-white tracking-wider flex-1 sm:flex-none"
            style={{ minHeight: '44px', minWidth: '120px' }}
          >
            Start
          </button>
        ) : null}

        {status === 'running' && (
          <button
            type="button"
            onClick={onPause}
            disabled={busy}
            className="focus-ring btn-secondary rounded-[10px] px-8 py-3 font-mono text-sm font-semibold tracking-wider flex-1 sm:flex-none"
            style={{ color: '#f5c842', minHeight: '44px', minWidth: '120px' }}
          >
            Pause
          </button>
        )}

        {status === 'paused' && (
          <button
            type="button"
            onClick={onResume}
            disabled={busy}
            className="focus-ring btn-primary rounded-[10px] px-8 py-3 font-mono text-sm font-semibold text-white tracking-wider flex-1 sm:flex-none"
            style={{ minHeight: '44px', minWidth: '120px' }}
          >
            Resume
          </button>
        )}

        {(status === 'running' || status === 'paused' || status === 'complete') && (
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className="focus-ring btn-secondary rounded-[10px] px-6 py-3 font-mono text-sm tracking-wider"
            style={{ color: 'oklch(0.6 0.12 245)', minHeight: '44px', minWidth: '90px' }}
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
