import EventHeader from '../components/event-header';
import DecorativeScene from '../components/decorative-scene';
import SetupExperience from '../components/setup-experience';

export const metadata = {
  title: 'FindIT UGM — Countdown Setup',
};

export default function SetupPage() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <DecorativeScene />
      <EventHeader />
      <SetupExperience />
    </div>
  );
}
