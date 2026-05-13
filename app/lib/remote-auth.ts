import { createHash } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { SessionId } from './countdown';

const DEV_PINS: Record<SessionId, string> = {
  'main-stage': '2468',
  pitch: '1357',
};

function envPinName(sessionId: SessionId) {
  return sessionId === 'main-stage' ? 'FINDIT_MAIN_STAGE_PIN' : 'FINDIT_PITCH_PIN';
}

function getAuthSecret() {
  return process.env.FINDIT_REMOTE_AUTH_SECRET || 'findit-countdown-dev-secret';
}

export function getSessionPin(sessionId: SessionId): string | null {
  const configured = process.env[envPinName(sessionId)];
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production') return DEV_PINS[sessionId];
  return null;
}

export function isPinConfigured(sessionId: SessionId): boolean {
  return getSessionPin(sessionId) !== null;
}

export function verifySessionPin(sessionId: SessionId, pin: string): boolean {
  const expected = getSessionPin(sessionId);
  return Boolean(expected && pin === expected);
}

function cookieName(sessionId: SessionId) {
  return `findit_remote_${sessionId}`;
}

function tokenFor(sessionId: SessionId) {
  const pin = getSessionPin(sessionId);
  if (!pin) return null;

  return createHash('sha256')
    .update(`${sessionId}:${pin}:${getAuthSecret()}`)
    .digest('hex');
}

export function isRemoteAuthorized(request: NextRequest, sessionId: SessionId): boolean {
  const expected = tokenFor(sessionId);
  if (!expected) return false;
  return request.cookies.get(cookieName(sessionId))?.value === expected;
}

export function setRemoteAuthCookie(response: NextResponse, sessionId: SessionId): void {
  const token = tokenFor(sessionId);
  if (!token) return;

  response.cookies.set(cookieName(sessionId), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export function clearRemoteAuthCookie(response: NextResponse, sessionId: SessionId): void {
  response.cookies.set(cookieName(sessionId), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
