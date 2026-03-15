import { ref, set, onValue, type Unsubscribe } from 'firebase/database';
import { getFirebaseDb } from './config';
import type { Song } from '../types/song';

export async function uploadLibrary(sessionId: string, songs: Song[]): Promise<void> {
  const db = getFirebaseDb();
  const songMap: Record<string, Song> = {};
  for (const song of songs) {
    songMap[song.id] = song;
  }
  await set(ref(db, `sessions/${sessionId}/library`), songMap);
}

export function subscribeToLibrary(
  sessionId: string,
  callback: (songs: Song[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `sessions/${sessionId}/library`), (snapshot) => {
    const data = snapshot.val() as Record<string, Song> | null;
    callback(data ? Object.values(data) : []);
  });
}
