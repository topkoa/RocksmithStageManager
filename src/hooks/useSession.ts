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

  const handleCreateSession = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));
    try {
      const { session, playerId } = await createSession();
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
      setState(prev => ({
        ...prev,
        session,
        role: 'player',
        playerId,
        playerName,
        connecting: false,
      }));
      setupSubscriptions(session.id);

      // Subscribe to library for player devices
      unsubscribesRef.current.push(
        subscribeToLibrary(session.id, (_songs) => {
          // This callback is used by the parent component via onLibrarySync
        })
      );
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
    setState(prev => ({
      ...prev,
      role: 'host',
      playerName: 'Host',
      session: {
        id: 'offline',
        roomCode: 'OFFLINE',
        hostId: 'local',
        createdAt: Date.now(),
        status: 'active',
      },
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
