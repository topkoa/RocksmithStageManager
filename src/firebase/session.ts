import {
  ref,
  set,
  get,
  onValue,
  onDisconnect,
  remove,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseDb, ensureAuthenticated } from './config';
import type { Session, Player } from '../types/session';
import { generateRoomCode } from '../utils/formatting';

export async function createSession(): Promise<{ session: Session; playerId: string }> {
  const userId = await ensureAuthenticated();
  const db = getFirebaseDb();
  const roomCode = generateRoomCode();
  const sessionId = roomCode;

  const session: Session = {
    id: sessionId,
    roomCode,
    hostId: userId,
    createdAt: Date.now(),
    status: 'active',
  };

  await set(ref(db, `sessions/${sessionId}/info`), session);

  // Register host as a player
  const hostPlayer: Player = {
    id: userId,
    name: 'Host',
    joinedAt: Date.now(),
    isHost: true,
  };
  await set(ref(db, `sessions/${sessionId}/players/${userId}`), hostPlayer);

  // Clean up session on disconnect
  onDisconnect(ref(db, `sessions/${sessionId}/players/${userId}`)).remove();

  return { session, playerId: userId };
}

export async function joinSession(
  roomCode: string,
  playerName: string
): Promise<{ session: Session; playerId: string }> {
  const userId = await ensureAuthenticated();
  const db = getFirebaseDb();
  const sessionId = roomCode.toUpperCase();

  // Check session exists
  const sessionSnap = await get(ref(db, `sessions/${sessionId}/info`));
  if (!sessionSnap.exists()) {
    throw new Error('Session not found. Check the room code and try again.');
  }

  const session = sessionSnap.val() as Session;
  if (session.status !== 'active') {
    throw new Error('This session has ended.');
  }

  // Register as player
  const player: Player = {
    id: userId,
    name: playerName,
    joinedAt: Date.now(),
    isHost: false,
  };
  await set(ref(db, `sessions/${sessionId}/players/${userId}`), player);

  // Clean up on disconnect
  onDisconnect(ref(db, `sessions/${sessionId}/players/${userId}`)).remove();

  return { session, playerId: userId };
}

export function subscribeToPlayers(
  sessionId: string,
  callback: (players: Player[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `sessions/${sessionId}/players`), (snapshot) => {
    const data = snapshot.val() as Record<string, Player> | null;
    callback(data ? Object.values(data) : []);
  });
}

export async function endSession(sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  await set(ref(db, `sessions/${sessionId}/info/status`), 'ended');
}

export async function leaveSession(sessionId: string, playerId: string): Promise<void> {
  const db = getFirebaseDb();
  await remove(ref(db, `sessions/${sessionId}/players/${playerId}`));
}
