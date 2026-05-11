import EventHeader from './components/event-header';
import DecorativeScene from './components/decorative-scene';
import CountdownOnly from './components/countdown-only';

export default function Page() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <DecorativeScene />
      <EventHeader />
      <CountdownOnly />
    </div>
  );
}
