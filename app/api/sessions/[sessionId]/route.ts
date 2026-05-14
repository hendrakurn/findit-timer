import { type NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LABEL, isSessionId } from '../../../lib/countdown';
import { isPinConfigured, isRemoteAuthorized } from '../../../lib/remote-auth';
import {
  getSessionState,
  pauseSession,
  resetSession,
  resumeSession,
  startSession,
} from '../../../lib/session-store';

type Context = {
  params: Promise<{ sessionId: string }>;
};

function json(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function resolveSession(context: Context) {
  const { sessionId } = await context.params;
  return isSessionId(sessionId) ? sessionId : null;
}

export async function GET(_request: NextRequest, context: Context) {
  const sessionId = await resolveSession(context);
  if (!sessionId) return json({ error: 'Invalid session' }, { status: 404 });

  try {
    return json({ state: await getSessionState(sessionId) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Countdown storage failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const sessionId = await resolveSession(context);
  if (!sessionId) return json({ error: 'Invalid session' }, { status: 404 });
  if (!isPinConfigured(sessionId)) return json({ error: 'Remote PIN is not configured' }, { status: 500 });
  if (!isRemoteAuthorized(request, sessionId)) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('action' in body)) {
    return json({ error: 'Missing action' }, { status: 400 });
  }

  const payload = body as {
    action?: unknown;
    eventLabel?: unknown;
    durationSeconds?: unknown;
  };

  if (payload.action === 'start') {
    const durationSeconds = Number(payload.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
      return json({ error: 'Duration must be at least 1 second' }, { status: 400 });
    }

    const eventLabel = typeof payload.eventLabel === 'string' ? payload.eventLabel : DEFAULT_LABEL;
    try {
      return json({ state: await startSession(sessionId, { eventLabel, durationSeconds }) });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Countdown storage failed' }, { status: 500 });
    }
  }

  try {
    if (payload.action === 'pause') return json({ state: await pauseSession(sessionId) });
    if (payload.action === 'resume') return json({ state: await resumeSession(sessionId) });
    if (payload.action === 'reset') return json({ state: await resetSession(sessionId) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Countdown storage failed' }, { status: 500 });
  }

  return json({ error: 'Unsupported action' }, { status: 400 });
}
