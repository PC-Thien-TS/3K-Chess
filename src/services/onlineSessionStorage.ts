import { Faction } from '@/src/rules/classicThreeKingdomRules';
import { GameMode } from '@/shared/gameModes';

export interface PersistedOnlineRoomSession {
  roomCode: string;
  playerName: string;
  roomMode: 'online';
  gameMode: GameMode;
}

export interface PersistedOnlineMatchSession extends PersistedOnlineRoomSession {
  playerFaction?: Exclude<Faction, 'None'> | null;
  isHost?: boolean;
}

const ROOM_SESSION_KEY = '3k_online_room_session_v1';
const MATCH_SESSION_KEY = '3k_online_match_session_v1';

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.sessionStorage.getItem(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(key);
}

export function readOnlineRoomSession(): PersistedOnlineRoomSession | null {
  return readJson<PersistedOnlineRoomSession>(ROOM_SESSION_KEY);
}

export function saveOnlineRoomSession(session: PersistedOnlineRoomSession) {
  writeJson(ROOM_SESSION_KEY, session);
}

export function clearOnlineRoomSession() {
  removeKey(ROOM_SESSION_KEY);
}

export function readOnlineMatchSession(): PersistedOnlineMatchSession | null {
  return readJson<PersistedOnlineMatchSession>(MATCH_SESSION_KEY);
}

export function saveOnlineMatchSession(session: PersistedOnlineMatchSession) {
  writeJson(MATCH_SESSION_KEY, session);
}

export function clearOnlineMatchSession() {
  removeKey(MATCH_SESSION_KEY);
}

export function clearAllOnlineSessions() {
  clearOnlineRoomSession();
  clearOnlineMatchSession();
}
