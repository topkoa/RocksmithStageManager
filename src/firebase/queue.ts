import {
  ref,
  push,
  set,
  remove,
  update,
  onValue,
  get,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseDb } from './config';
import type { QueueItem, PlayerSlot } from '../types/queue';

export async function addToQueue(
  sessionId: string,
  songId: string,
  songName: string,
  artistName: string,
  player: PlayerSlot
): Promise<string> {
  const db = getFirebaseDb();
  const queueRef = ref(db, `sessions/${sessionId}/queue`);

  // Get current max order
  const snapshot = await get(queueRef);
  const existing = snapshot.val() as Record<string, QueueItem> | null;
  const maxOrder = existing
    ? Math.max(...Object.values(existing).map(q => q.order))
    : -1;

  const newRef = push(queueRef);
  const item: QueueItem = {
    id: newRef.key!,
    songId,
    songName,
    artistName,
    players: [player],
    status: 'waiting',
    addedAt: Date.now(),
    order: maxOrder + 1,
  };

  await set(newRef, item);
  return newRef.key!;
}

export async function joinQueueItem(
  sessionId: string,
  queueItemId: string,
  player: PlayerSlot
): Promise<void> {
  const db = getFirebaseDb();
  const itemRef = ref(db, `sessions/${sessionId}/queue/${queueItemId}`);
  const snapshot = await get(itemRef);

  if (!snapshot.exists()) {
    throw new Error('Queue item not found');
  }

  const item = snapshot.val() as QueueItem;
  const updatedPlayers = [...item.players, player];
  await update(itemRef, { players: updatedPlayers });
}

export async function removeFromQueue(
  sessionId: string,
  queueItemId: string
): Promise<void> {
  const db = getFirebaseDb();
  await remove(ref(db, `sessions/${sessionId}/queue/${queueItemId}`));
}

export async function playNext(sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  const queueRef = ref(db, `sessions/${sessionId}/queue`);
  const snapshot = await get(queueRef);

  if (!snapshot.exists()) return;

  const items = snapshot.val() as Record<string, QueueItem>;
  const waiting = Object.values(items)
    .filter(i => i.status === 'waiting')
    .sort((a, b) => a.order - b.order);

  if (waiting.length === 0) return;

  const next = waiting[0]!;

  // Move current playing to history
  const nowPlayingSnap = await get(ref(db, `sessions/${sessionId}/nowPlaying`));
  if (nowPlayingSnap.exists()) {
    const current = nowPlayingSnap.val() as QueueItem;
    await set(ref(db, `sessions/${sessionId}/history/${current.id}`), {
      ...current,
      status: 'played',
      playedAt: Date.now(),
    });
  }

  // Set new now playing
  await set(ref(db, `sessions/${sessionId}/nowPlaying`), {
    ...next,
    status: 'playing',
    playedAt: Date.now(),
  });

  // Remove from queue
  await remove(ref(db, `sessions/${sessionId}/queue/${next.id}`));
}

export async function skipCurrent(sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  const nowPlayingSnap = await get(ref(db, `sessions/${sessionId}/nowPlaying`));

  if (!nowPlayingSnap.exists()) return;

  const current = nowPlayingSnap.val() as QueueItem;

  // Move to history as skipped
  await set(ref(db, `sessions/${sessionId}/history/${current.id}`), {
    ...current,
    status: 'skipped',
    playedAt: Date.now(),
  });

  // Clear now playing
  await remove(ref(db, `sessions/${sessionId}/nowPlaying`));
}

export async function markPlayed(sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  const nowPlayingSnap = await get(ref(db, `sessions/${sessionId}/nowPlaying`));

  if (!nowPlayingSnap.exists()) return;

  const current = nowPlayingSnap.val() as QueueItem;

  // Move to history
  await set(ref(db, `sessions/${sessionId}/history/${current.id}`), {
    ...current,
    status: 'played',
    playedAt: Date.now(),
  });

  // Clear now playing
  await remove(ref(db, `sessions/${sessionId}/nowPlaying`));
}

export async function reorderQueue(
  sessionId: string,
  queueItemId: string,
  direction: 'up' | 'down'
): Promise<void> {
  const db = getFirebaseDb();
  const queueRef = ref(db, `sessions/${sessionId}/queue`);
  const snapshot = await get(queueRef);

  if (!snapshot.exists()) return;

  const items = snapshot.val() as Record<string, QueueItem>;
  const sorted = Object.values(items)
    .filter(i => i.status === 'waiting')
    .sort((a, b) => a.order - b.order);

  const idx = sorted.findIndex(i => i.id === queueItemId);
  if (idx < 0) return;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;

  const current = sorted[idx]!;
  const swap = sorted[swapIdx]!;

  // Swap orders
  const updates: Record<string, number> = {};
  updates[`${current.id}/order`] = swap.order;
  updates[`${swap.id}/order`] = current.order;

  await update(queueRef, updates);
}

export function subscribeToQueue(
  sessionId: string,
  callback: (items: QueueItem[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `sessions/${sessionId}/queue`), (snapshot) => {
    const data = snapshot.val() as Record<string, QueueItem> | null;
    const items = data ? Object.values(data).sort((a, b) => a.order - b.order) : [];
    callback(items);
  });
}

export function subscribeToNowPlaying(
  sessionId: string,
  callback: (item: QueueItem | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `sessions/${sessionId}/nowPlaying`), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as QueueItem) : null);
  });
}

export function subscribeToHistory(
  sessionId: string,
  callback: (items: QueueItem[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `sessions/${sessionId}/history`), (snapshot) => {
    const data = snapshot.val() as Record<string, QueueItem> | null;
    const items = data
      ? Object.values(data).sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0))
      : [];
    callback(items);
  });
}
