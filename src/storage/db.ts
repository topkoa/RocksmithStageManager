import { openDB, type IDBPDatabase } from 'idb';
import type { Song } from '../types/song';

const DB_NAME = 'rocksmith-stage-manager';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SONGS_STORE)) {
        const store = db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        store.createIndex('artistName', 'artistName');
        store.createIndex('songName', 'songName');
      }
    },
  });

  return dbInstance;
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDb();
  return db.getAll(SONGS_STORE);
}

export async function putSongs(songs: Song[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(SONGS_STORE, 'readwrite');
  await Promise.all([
    ...songs.map(song => tx.store.put(song)),
    tx.done,
  ]);
}

export async function clearLibrary(): Promise<void> {
  const db = await getDb();
  await db.clear(SONGS_STORE);
}

export async function getSongCount(): Promise<number> {
  const db = await getDb();
  return db.count(SONGS_STORE);
}
