import EventHeader from './components/event-header';
import DecorativeScene from './components/decorative-scene';
import SessionCountdownDisplay from './components/session-countdown-display';
import { DEFAULT_SESSION_ID } from './lib/countdown';

export default function Page() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <DecorativeScene />
      <EventHeader />
      <SessionCountdownDisplay sessionId={DEFAULT_SESSION_ID} />
    </div>
  );
}
