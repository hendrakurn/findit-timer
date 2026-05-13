import { notFound } from 'next/navigation';
import DecorativeScene from '../../components/decorative-scene';
import EventHeader from '../../components/event-header';
import RemoteControl from '../../components/remote-control';
import { getSessionDisplayName, isSessionId } from '../../lib/countdown';

export async function generateMetadata({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!isSessionId(sessionId)) return { title: 'FindIT UGM - Remote' };

  return {
    title: `FindIT UGM - ${getSessionDisplayName(sessionId)} Remote`,
  };
}

export default async function RemotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!isSessionId(sessionId)) notFound();

  return (
    <div className="relative min-h-[100dvh] flex flex-col">
      <DecorativeScene />
      <EventHeader />
      <RemoteControl sessionId={sessionId} />
    </div>
  );
}
