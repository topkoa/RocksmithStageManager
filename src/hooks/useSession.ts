import { useState, useCallback, useEffect, useRef } from 'react';
import type { Session, Player, AppRole } from '../types/session';
import type { Song } from '../types/song';
import type { QueueItem } from '../types/queue';
import { isFirebaseConfigured } from '../firebase/config';
import { createSession, joinSession, subscribeToPlayers } from '../firebase/session';
import { uploadLibrary, subscribeToLibrary } from '../firebase/library';
import {
  subscribeToQueue,
  subscribeToNowPlaying,
  subscribeToHistory,
} from '../firebase/queue';

interface SessionState {
  session: Session | null;
  role: AppRole;
  playerId: string;
  playerName: string;
  players: Player[];
  firebaseConfigured: boolean;
  error: string | null;
  connecting: boolean;
  // Synced state
  queue: QueueItem[];
  nowPlaying: QueueItem | null;
  history: QueueItem[];
}

const SESSION_STORAGE_KEY = 'rs-stage-session';

interface SavedSession {
  session: Session;
  role: AppRole;
  playerId: string;
  playerName: string;
}

function saveSession(data: SavedSession) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadSavedSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

function clearSavedSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    session: null,
    role: 'none',
    playerId: '',
    playerName: '',
    players: [],
    firebaseConfigured: isFirebaseConfigured(),
    error: null,
    connecting: false,
    queue: [],
    nowPlaying: null,
    history: [],
  });

  const unsubscribesRef = useRef<Array<() => void>>([]);
  const restoredRef = useRef(false);

  const setupSubscriptions = useCallback((sessionId: string) => {
    // Clean up previous subscriptions
    unsubscribesRef.current.forEach(unsub => unsub());
    unsubscribesRef.current = [];

    unsubscribesRef.current.push(
      subscribeToPlayers(sessionId, players => {
        setState(prev => ({ ...prev, players }));
      })
    );

    unsubscribesRef.current.push(
      subscribeToQueue(sessionId, queue => {
        setState(prev => ({ ...prev, queue }));
      })
    );

    unsubscribesRef.current.push(
      subscribeToNowPlaying(sessionId, nowPlaying => {
        setState(prev => ({ ...prev, nowPlaying }));
      })
    );

    unsubscribesRef.current.push(
      subscribeToHistory(sessionId, history => {
        setState(prev => ({ ...prev, history }));
      })
    );
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadSavedSession();
    if (!saved || !isFirebaseConfigured()) return;
    if (saved.session.id === 'offline') {
      // Restore offline mode
      setState(prev => ({
        ...prev,
        session: saved.session,
        role: saved.role,
        playerId: saved.playerId,
        playerName: saved.playerName,
      }));
      return;
    }

    // Reconnect to Firebase session
    setState(prev => ({
      ...prev,
      connecting: true,
    }));

    // Re-join the session with a timeout so it doesn't hang
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Reconnect timeout')), ms)
        ),
      ]);

    const reconnect = async () => {
      try {
        if (saved.role === 'host') {
          // Host just needs to re-auth and subscribe
          const { ensureAuthenticated } = await import('../firebase/config');
          await withTimeout(ensureAuthenticated(), 8000);
          setState(prev => ({
            ...prev,
            session: saved.session,
            role: saved.role,
            playerId: saved.playerId,
            playerName: saved.playerName,
            connecting: false,
          }));
          setupSubscriptions(saved.session.id);
        } else {
          // Player re-joins
          const { session, playerId } = await withTimeout(
            joinSession(saved.session.roomCode, saved.playerName),
            8000
          );
          setState(prev => ({
            ...prev,
            session,
            role: 'player',
            playerId,
            playerName: saved.playerName,
            connecting: false,
          }));
          setupSubscriptions(session.id);
        }
      } catch {
        // Session expired or gone — clear and show landing
        clearSavedSession();
        setState(prev => ({
          ...prev,
          connecting: false,
          role: 'none',
        }));
      }
    };

    reconnect();
  }, [setupSubscriptions]);

  const handleCreateSession = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));
    try {
      const { session, playerId } = await createSession();
      const savedData: SavedSession = {
        session,
        role: 'host',
        playerId,
        playerName: 'Host',
      };
      saveSession(savedData);
      setState(prev => ({
        ...prev,
        session,
        role: 'host',
        playerId,
        playerName: 'Host',
        connecting: false,
      }));
      setupSubscriptions(session.id);
    } catch (err) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: (err as Error).message,
      }));
    }
  }, [setupSubscriptions]);

  const handleJoinSession = useCallback(async (roomCode: string, playerName: string) => {
    setState(prev => ({ ...prev, connecting: true, error: null }));
    try {
      const { session, playerId } = await joinSession(roomCode, playerName);
      const savedData: SavedSession = {
        session,
        role: 'player',
        playerId,
        playerName,
      };
      saveSession(savedData);
      setState(prev => ({
        ...prev,
        session,
        role: 'player',
        playerId,
        playerName,
        connecting: false,
      }));
      setupSubscriptions(session.id);
    } catch (err) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: (err as Error).message,
      }));
    }
  }, [setupSubscriptions]);

  const handleUploadLibrary = useCallback(async (songs: Song[]) => {
    if (!state.session) return;
    try {
      await uploadLibrary(state.session.id, songs);
    } catch (err) {
      console.error('Failed to upload library:', err);
    }
  }, [state.session]);

  const subscribeToLibrarySync = useCallback(
    (callback: (songs: Song[]) => void) => {
      if (!state.session) return () => {};
      const unsub = subscribeToLibrary(state.session.id, callback);
      unsubscribesRef.current.push(unsub);
      return unsub;
    },
    [state.session]
  );

  const startOfflineMode = useCallback(() => {
    const session: Session = {
      id: 'offline',
      roomCode: 'OFFLINE',
      hostId: 'local',
      createdAt: Date.now(),
      status: 'active',
    };
    saveSession({
      session,
      role: 'host',
      playerId: 'local',
      playerName: 'Host',
    });
    setState(prev => ({
      ...prev,
      role: 'host',
      playerName: 'Host',
      session,
    }));
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribesRef.current.forEach(unsub => unsub());
    };
  }, []);

  return {
    ...state,
    createSession: handleCreateSession,
    joinSession: handleJoinSession,
    uploadLibrary: handleUploadLibrary,
    subscribeToLibrarySync,
    startOfflineMode,
  };
}
