import { notFound } from 'next/navigation';
import DecorativeScene from '../../components/decorative-scene';
import EventHeader from '../../components/event-header';
import SessionCountdownDisplay from '../../components/session-countdown-display';
import { getSessionDisplayName, isSessionId } from '../../lib/countdown';

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!isSessionId(sessionId)) return { title: 'FindIT UGM - Countdown' };

  return {
    title: `FindIT UGM - ${getSessionDisplayName(sessionId)} Countdown`,
  };
}

export default async function DisplayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!isSessionId(sessionId)) notFound();

  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <DecorativeScene />
      <EventHeader />
      <SessionCountdownDisplay sessionId={sessionId} />
    </div>
  );
}
