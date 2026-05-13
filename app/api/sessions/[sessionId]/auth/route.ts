import { type NextRequest, NextResponse } from 'next/server';
import { isSessionId } from '../../../../lib/countdown';
import {
  clearRemoteAuthCookie,
  isPinConfigured,
  isRemoteAuthorized,
  setRemoteAuthCookie,
  verifySessionPin,
} from '../../../../lib/remote-auth';

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

export async function GET(request: NextRequest, context: Context) {
  const sessionId = await resolveSession(context);
  if (!sessionId) return json({ error: 'Invalid session' }, { status: 404 });

  return json({ authenticated: isRemoteAuthorized(request, sessionId) });
}

export async function POST(request: NextRequest, context: Context) {
  const sessionId = await resolveSession(context);
  if (!sessionId) return json({ error: 'Invalid session' }, { status: 404 });
  if (!isPinConfigured(sessionId)) return json({ error: 'Remote PIN is not configured' }, { status: 500 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pin = body && typeof body === 'object' && 'pin' in body ? String(body.pin) : '';
  if (!verifySessionPin(sessionId, pin)) {
    return json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const response = json({ authenticated: true });
  setRemoteAuthCookie(response, sessionId);
  return response;
}

export async function DELETE(_request: NextRequest, context: Context) {
  const sessionId = await resolveSession(context);
  if (!sessionId) return json({ error: 'Invalid session' }, { status: 404 });

  const response = json({ authenticated: false });
  clearRemoteAuthCookie(response, sessionId);
  return response;
}
