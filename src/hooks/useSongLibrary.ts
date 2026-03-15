import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Song } from '../types/song';
import { formatTuning } from '../utils/formatting';
import { getAllSongs, putSongs, clearLibrary } from '../storage/db';

export type SortOption =
  | 'artist-asc'
  | 'artist-desc'
  | 'song-asc'
  | 'song-desc'
  | 'year-desc'
  | 'year-asc'
  | 'tempo-asc'
  | 'tempo-desc'
  | 'duration-asc'
  | 'duration-desc'
  | 'tuning';

function getPrimaryTuning(song: Song): string {
  const lead = song.arrangements.find(a => a.name === 'Lead' && !a.isBonusArrangement);
  const fallback = song.arrangements.find(a => a.type !== 'Vocals' && !a.isBonusArrangement);
  const arr = lead ?? fallback;
  return arr ? formatTuning(arr.tuning) : 'Z';
}

const sorters: Record<SortOption, (a: Song, b: Song) => number> = {
  'artist-asc': (a, b) => a.artistName.localeCompare(b.artistName) || a.songName.localeCompare(b.songName),
  'artist-desc': (a, b) => b.artistName.localeCompare(a.artistName) || a.songName.localeCompare(b.songName),
  'song-asc': (a, b) => a.songName.localeCompare(b.songName),
  'song-desc': (a, b) => b.songName.localeCompare(a.songName),
  'year-desc': (a, b) => (b.songYear || 0) - (a.songYear || 0) || a.artistName.localeCompare(b.artistName),
  'year-asc': (a, b) => (a.songYear || 9999) - (b.songYear || 9999) || a.artistName.localeCompare(b.artistName),
  'tempo-asc': (a, b) => (a.averageTempo || 999) - (b.averageTempo || 999),
  'tempo-desc': (a, b) => (b.averageTempo || 0) - (a.averageTempo || 0),
  'duration-asc': (a, b) => (a.songLength || 999) - (b.songLength || 999),
  'duration-desc': (a, b) => (b.songLength || 0) - (a.songLength || 0),
  'tuning': (a, b) => getPrimaryTuning(a).localeCompare(getPrimaryTuning(b)) || a.artistName.localeCompare(b.artistName),
};

export function useSongLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [arrangementFilter, setArrangementFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('artist-asc');
  const [loaded, setLoaded] = useState(false);

  // Load cached songs from IndexedDB on mount
  useEffect(() => {
    getAllSongs().then(cached => {
      if (cached.length > 0) {
        setSongs(cached);
      }
      setLoaded(true);
    });
  }, []);

  const addSongs = useCallback(async (newSongs: Song[]) => {
    setSongs(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const unique = newSongs.filter(s => !existingIds.has(s.id));
      const merged = [...prev, ...unique];

      // Persist to IndexedDB
      putSongs(unique);

      return merged;
    });
  }, []);

  const clearSongs = useCallback(async () => {
    setSongs([]);
    await clearLibrary();
  }, []);

  const setSongsFromFirebase = useCallback((firebaseSongs: Song[]) => {
    setSongs(firebaseSongs);
  }, []);

  const filteredSongs = useMemo(() => {
    let result = songs;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.songName.toLowerCase().includes(q) ||
        s.artistName.toLowerCase().includes(q) ||
        s.albumName.toLowerCase().includes(q)
      );
    }

    if (arrangementFilter) {
      result = result.filter(s =>
        s.arrangements.some(a =>
          a.name.toLowerCase() === arrangementFilter.toLowerCase() ||
          a.type.toLowerCase() === arrangementFilter.toLowerCase()
        )
      );
    }

    return result.sort(sorters[sortBy]);
  }, [songs, searchQuery, arrangementFilter, sortBy]);

  return {
    songs,
    filteredSongs,
    searchQuery,
    setSearchQuery,
    arrangementFilter,
    setArrangementFilter,
    sortBy,
    setSortBy,
    addSongs,
    clearSongs,
    setSongsFromFirebase,
    loaded,
    totalCount: songs.length,
  };
}
