import { useState, useCallback, useEffect } from 'react';
import type { Song } from './types/song';
import type { QueueItem, PlayerSlot } from './types/queue';
import { useSession } from './hooks/useSession';
import { useSongLibrary } from './hooks/useSongLibrary';
import { useFileLoader } from './hooks/useFileLoader';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { Header } from './components/layout/Header';
import { SongLibrary } from './components/library/SongLibrary';
import { QueuePanel } from './components/queue/QueuePanel';
import { AddToQueueDialog } from './components/queue/AddToQueueDialog';
import { NowPlaying } from './components/stage/NowPlaying';
import { PlayHistory } from './components/stage/PlayHistory';
import { CreateSession } from './components/session/CreateSession';
import { JoinSession } from './components/session/JoinSession';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { isFirebaseConfigured } from './firebase/config';
import {
  addToQueue as fbAddToQueue,
  joinQueueItem as fbJoinQueueItem,
  removeFromQueue as fbRemoveFromQueue,
  playNext as fbPlayNext,
  markPlayed as fbMarkPlayed,
  skipCurrent as fbSkipCurrent,
  reorderQueue as fbReorderQueue,
} from './firebase/queue';

function App() {
  const session = useSession();
  const library = useSongLibrary();
  const offlineQueue = useOfflineQueue();

  const [addToQueueSong, setAddToQueueSong] = useState<Song | null>(null);
  const [joinQueueTarget, setJoinQueueTarget] = useState<QueueItem | null>(null);
  const [recentPlayerNames, setRecentPlayerNames] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentPlayerNames') || '[]');
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'library' | 'queue'>('library');

  const isOnline = session.session && session.session.id !== 'offline';
  const isHost = session.role === 'host';
  const queue = isOnline ? session.queue : offlineQueue.queue;
  const nowPlaying = isOnline ? session.nowPlaying : offlineQueue.nowPlaying;
  const history = isOnline ? session.history : offlineQueue.history;

  const handleSongsLoaded = useCallback(async (songs: Song[]) => {
    await library.addSongs(songs);
    if (isOnline && session.session) {
      // Upload to Firebase for player devices
      const allSongs = [...library.songs, ...songs];
      const uniqueMap = new Map(allSongs.map(s => [s.id, s]));
      session.uploadLibrary(Array.from(uniqueMap.values()));
    }
  }, [library, isOnline, session]);

  const fileLoader = useFileLoader(handleSongsLoaded);

  // Subscribe to library sync for player role
  useEffect(() => {
    if (session.role === 'player' && session.session) {
      const unsub = session.subscribeToLibrarySync((songs) => {
        library.setSongsFromFirebase(songs);
      });
      return unsub;
    }
  }, [session.role, session.session?.id]);

  const rememberPlayerName = useCallback((name: string) => {
    setRecentPlayerNames(prev => {
      const updated = [name, ...prev.filter(n => n !== name)].slice(0, 10);
      localStorage.setItem('recentPlayerNames', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleAddToQueue = useCallback(async (song: Song, player: PlayerSlot) => {
    rememberPlayerName(player.playerName);

    if (isOnline && session.session) {
      await fbAddToQueue(session.session.id, song.id, song.songName, song.artistName, player);
    } else {
      offlineQueue.addToQueue(song.id, song.songName, song.artistName, player);
    }
  }, [isOnline, session.session, offlineQueue, rememberPlayerName]);

  const handleJoinQueueItem = useCallback(async (item: QueueItem, player: PlayerSlot) => {
    rememberPlayerName(player.playerName);

    if (isOnline && session.session) {
      await fbJoinQueueItem(session.session.id, item.id, player);
    } else {
      offlineQueue.joinQueueItem(item.id, player);
    }
  }, [isOnline, session.session, offlineQueue, rememberPlayerName]);

  const handleRemoveFromQueue = useCallback(async (id: string) => {
    if (isOnline && session.session) {
      await fbRemoveFromQueue(session.session.id, id);
    } else {
      offlineQueue.removeFromQueue(id);
    }
  }, [isOnline, session.session, offlineQueue]);

  const handlePlayNext = useCallback(async () => {
    if (isOnline && session.session) {
      await fbPlayNext(session.session.id);
    } else {
      offlineQueue.playNext();
    }
  }, [isOnline, session.session, offlineQueue]);

  const handleMarkPlayed = useCallback(async () => {
    if (isOnline && session.session) {
      await fbMarkPlayed(session.session.id);
    } else {
      offlineQueue.markPlayed();
    }
  }, [isOnline, session.session, offlineQueue]);

  const handleSkip = useCallback(async () => {
    if (isOnline && session.session) {
      await fbSkipCurrent(session.session.id);
    } else {
      offlineQueue.skipCurrent();
    }
  }, [isOnline, session.session, offlineQueue]);

  const handleReorderQueue = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (isOnline && session.session) {
      await fbReorderQueue(session.session.id, id, direction);
    } else {
      offlineQueue.reorderQueue(id, direction);
    }
  }, [isOnline, session.session, offlineQueue]);

  // Landing page - choose role
  if (session.role === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-orange-500">RS</span> Stage Manager
            </h1>
            <p className="text-slate-400">Manage your Rocksmith jam night</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <CreateSession
                onCreateSession={session.createSession}
                onStartOffline={session.startOfflineMode}
                firebaseConfigured={isFirebaseConfigured()}
                connecting={session.connecting}
                error={session.error}
              />
            </div>

            {isFirebaseConfigured() && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <JoinSession
                  onJoinSession={session.joinSession}
                  connecting={session.connecting}
                  error={session.error}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main app view
  return (
    <div className="flex flex-col h-screen">
      <Header
        roomCode={session.session?.roomCode || null}
        players={session.players}
        isHost={isHost}
        loading={fileLoader.loading}
        songCount={library.totalCount}
        onLoadFiles={fileLoader.loadFromDirectory}
        onClearLibrary={library.clearSongs}
        progress={fileLoader.progress}
      />

      {fileLoader.loading && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
          <LoadingSpinner
            message={`Parsing ${fileLoader.progress.current}`}
            progress={fileLoader.progress}
          />
        </div>
      )}

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-slate-800">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
            activeTab === 'library'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-500'
          }`}
        >
          Songs ({library.totalCount})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 text-sm font-medium text-center transition-colors relative ${
            activeTab === 'queue'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-500'
          }`}
        >
          Queue ({queue.length})
          {nowPlaying && (
            <span className="absolute top-1 right-4 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Song Library - left panel / mobile tab */}
        <div className={`flex-1 lg:flex lg:flex-col lg:border-r lg:border-slate-800 ${
          activeTab === 'library' ? 'flex flex-col' : 'hidden lg:flex'
        }`}>
          <SongLibrary
            songs={library.songs}
            filteredSongs={library.filteredSongs}
            searchQuery={library.searchQuery}
            onSearchChange={library.setSearchQuery}
            arrangementFilter={library.arrangementFilter}
            onArrangementFilterChange={library.setArrangementFilter}
            sortBy={library.sortBy}
            onSortChange={library.setSortBy}
            onAddToQueue={song => setAddToQueueSong(song)}
            loading={fileLoader.loading}
            onLoadFiles={fileLoader.loadFromDirectory}
          />
        </div>

        {/* Queue + Stage - right panel / mobile tab */}
        <div className={`lg:w-[400px] lg:flex lg:flex-col ${
          activeTab === 'queue' ? 'flex flex-col flex-1' : 'hidden lg:flex'
        }`}>
          <div className="p-3 border-b border-slate-800">
            <NowPlaying
              item={nowPlaying}
              isHost={isHost}
              onMarkPlayed={handleMarkPlayed}
              onSkip={handleSkip}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <QueuePanel
              queue={queue}
              isHost={isHost}
              onMoveUp={id => handleReorderQueue(id, 'up')}
              onMoveDown={id => handleReorderQueue(id, 'down')}
              onRemove={handleRemoveFromQueue}
              onJoin={item => setJoinQueueTarget(item)}
              onPlayNext={handlePlayNext}
            />
          </div>

          <div className="border-t border-slate-800">
            <PlayHistory history={history} />
          </div>
        </div>
      </div>

      {/* Add to Queue Dialog */}
      <AddToQueueDialog
        open={addToQueueSong !== null}
        onClose={() => setAddToQueueSong(null)}
        song={addToQueueSong}
        onConfirm={handleAddToQueue}
        defaultPlayerName={session.playerName !== 'Host' ? session.playerName : (recentPlayerNames[0] || '')}
        recentPlayerNames={recentPlayerNames}
      />

      {/* Join Queue Item Dialog */}
      {joinQueueTarget && (
        <AddToQueueDialog
          open={true}
          onClose={() => setJoinQueueTarget(null)}
          song={{
            id: joinQueueTarget.songId,
            songName: joinQueueTarget.songName,
            artistName: joinQueueTarget.artistName,
            albumName: '',
            songYear: 0,
            songLength: 0,
            averageTempo: 0,
            arrangements: library.songs.find(s => s.id === joinQueueTarget.songId)?.arrangements || [],
            sourceFile: '',
          }}
          onConfirm={(_song, player) => {
            handleJoinQueueItem(joinQueueTarget, player);
            setJoinQueueTarget(null);
          }}
          defaultPlayerName={session.playerName !== 'Host' ? session.playerName : (recentPlayerNames[0] || '')}
          recentPlayerNames={recentPlayerNames}
        />
      )}

      {/* File loading errors */}
      {fileLoader.errors.length > 0 && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-red-900/90 border border-red-700 rounded-lg p-3 text-sm">
          <p className="font-medium text-red-200 mb-1">
            {fileLoader.errors.length} file(s) failed to parse
          </p>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {fileLoader.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-300">{err.file}: {err.error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
