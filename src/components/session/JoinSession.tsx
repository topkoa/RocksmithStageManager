import { useState } from 'react';
import { Button } from '../common/Button';

const PATHS = ['Lead', 'Rhythm', 'Bass', 'Vocals'] as const;

interface JoinSessionProps {
  onJoinSession: (roomCode: string, playerName: string, preferredPath: string) => void;
  connecting: boolean;
  error: string | null;
}

export function JoinSession({ onJoinSession, connecting, error }: JoinSessionProps) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [preferredPath, setPreferredPath] = useState('Lead');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      onJoinSession(roomCode.trim().toUpperCase(), playerName.trim(), preferredPath);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Join a Session</h2>
      <p className="text-sm text-slate-400">
        Enter the room code shown on the host screen.
      </p>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          placeholder="e.g. ROCK42"
          maxLength={6}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Your Name</label>
        <input
          type="text"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Preferred Path</label>
        <div className="flex gap-2">
          {PATHS.map(path => (
            <button
              key={path}
              type="button"
              onClick={() => setPreferredPath(path)}
              className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${
                preferredPath === path
                  ? 'bg-orange-600/30 border-orange-500 text-orange-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {path}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={!roomCode.trim() || !playerName.trim() || connecting}
        className="w-full"
      >
        {connecting ? 'Joining...' : 'Join Session'}
      </Button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
