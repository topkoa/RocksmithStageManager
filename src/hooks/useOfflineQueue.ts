import { useState, useCallback } from 'react';
import type { QueueItem, PlayerSlot } from '../types/queue';

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueItem | null>(null);
  const [history, setHistory] = useState<QueueItem[]>([]);

  const addToQueue = useCallback((
    songId: string,
    songName: string,
    artistName: string,
    player: PlayerSlot
  ) => {
    const item: QueueItem = {
      id: crypto.randomUUID(),
      songId,
      songName,
      artistName,
      players: [player],
      status: 'waiting',
      addedAt: Date.now(),
      order: Date.now(),
    };
    setQueue(prev => [...prev, item]);
  }, []);

  const joinQueueItem = useCallback((queueItemId: string, player: PlayerSlot) => {
    setQueue(prev =>
      prev.map(item =>
        item.id === queueItemId
          ? { ...item, players: [...item.players, player] }
          : item
      )
    );
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id));
  }, []);

  const playNext = useCallback(() => {
    if (nowPlaying) {
      setHistory(prev => [
        { ...nowPlaying, status: 'played', playedAt: Date.now() },
        ...prev,
      ]);
    }

    setQueue(prev => {
      const [next, ...rest] = prev;
      if (next) {
        setNowPlaying({ ...next, status: 'playing', playedAt: Date.now() });
      } else {
        setNowPlaying(null);
      }
      return rest;
    });
  }, [nowPlaying]);

  const markPlayed = useCallback(() => {
    if (nowPlaying) {
      setHistory(prev => [
        { ...nowPlaying, status: 'played', playedAt: Date.now() },
        ...prev,
      ]);
      setNowPlaying(null);
    }
  }, [nowPlaying]);

  const skipCurrent = useCallback(() => {
    if (nowPlaying) {
      setHistory(prev => [
        { ...nowPlaying, status: 'skipped', playedAt: Date.now() },
        ...prev,
      ]);
      setNowPlaying(null);
    }
  }, [nowPlaying]);

  const reorderQueue = useCallback((id: string, direction: 'up' | 'down') => {
    setQueue(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const newQueue = [...prev];
      [newQueue[idx], newQueue[swapIdx]] = [newQueue[swapIdx]!, newQueue[idx]!];
      return newQueue;
    });
  }, []);

  return {
    queue,
    nowPlaying,
    history,
    addToQueue,
    joinQueueItem,
    removeFromQueue,
    playNext,
    markPlayed,
    skipCurrent,
    reorderQueue,
  };
}
