import { padHours, pad2 } from '../lib/countdown';

interface Props {
  hours: number;
  minutes: number;
  seconds: number;
  status: 'idle' | 'running' | 'paused' | 'complete';
  eventLabel: string;
}

function DigitBlock({
  value,
  label,
  wide,
}: {
  value: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`digit-card rounded-[14px] flex items-center justify-center ${wide ? 'px-5 md:px-8' : 'px-4 md:px-7'}`}
        style={{
          minWidth: wide ? 'clamp(100px, 16vw, 220px)' : 'clamp(88px, 13vw, 180px)',
          height: 'clamp(88px, 15vw, 180px)',
        }}
      >
        <span
          className="font-mono font-semibold digit-glow tabular-nums leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
            color: '#f5c842',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
      </div>
      <span
        className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div
      className="flex flex-col items-center gap-3 self-start pt-[clamp(1.5rem,3.5vw,4rem)]"
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
      />
    </div>
  );
}

export default function CountdownDisplay({
  hours,
  minutes,
  seconds,
  status,
  eventLabel,
}: Props) {
  const isComplete = status === 'complete';
  const isIdle = status === 'idle';

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Event label */}
      <div
        aria-live="polite"
        className="text-center"
      >
        {isComplete ? (
          <p
            className="font-mono text-sm md:text-base tracking-[0.15em] uppercase font-semibold"
            style={{ color: '#f87171' }}
          >
            Countdown Complete
          </p>
        ) : (
          <p
            className="font-mono text-xs md:text-sm tracking-[0.18em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.75)' }}
          >
            {eventLabel || 'Event Countdown'}
          </p>
        )}
      </div>

      {/* Timer digits */}
      <div
        role="timer"
        aria-label={
          isComplete
            ? 'Countdown complete'
            : `${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`
        }
        className="flex items-center justify-center gap-2 md:gap-4 flex-wrap"
      >
        <DigitBlock value={padHours(hours)} label="Hours" wide={hours >= 100} />
        <Separator />
        <DigitBlock value={pad2(minutes)} label="Minutes" />
        <Separator />
        <DigitBlock value={pad2(seconds)} label="Seconds" />
      </div>

      {status !== 'running' && (
        <div className="flex items-center gap-2 h-5">
        {status === 'paused' && (
          <>
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#f5c842' }}
            />
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: 'oklch(0.7 0.15 80)' }}
            >
              Paused
            </span>
          </>
        )}
        {isIdle && (
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            Ready
          </span>
        )}
        {isComplete && (
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: '#f87171' }}
          >
            00:00:00
          </span>
        )}
        </div>
      )}
    </div>
  );
}
