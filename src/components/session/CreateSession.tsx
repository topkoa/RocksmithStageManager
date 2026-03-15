import { useState } from 'react';
import { Button } from '../common/Button';

const PATHS = ['Lead', 'Rhythm', 'Bass', 'Vocals'] as const;

interface CreateSessionProps {
  onCreateSession: (hostName?: string, hostPath?: string) => void;
  onStartOffline: () => void;
  firebaseConfigured: boolean;
  connecting: boolean;
  error: string | null;
}

export function CreateSession({
  onCreateSession,
  onStartOffline,
  firebaseConfigured,
  connecting,
  error,
}: CreateSessionProps) {
  const [hostName, setHostName] = useState('');
  const [preferredPath, setPreferredPath] = useState('Lead');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Host a Session</h2>
      <p className="text-sm text-slate-400">
        Create a session so players can join from their phones and add songs to the queue.
      </p>

      {firebaseConfigured && (
        <>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Your Name</label>
            <input
              type="text"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
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
        </>
      )}

      {firebaseConfigured ? (
        <Button
          onClick={() => onCreateSession(hostName.trim() || undefined, preferredPath)}
          disabled={connecting}
          className="w-full"
        >
          {connecting ? 'Creating...' : 'Create Session'}
        </Button>
      ) : (
        <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          Firebase is not configured. Add your Firebase config to a <code>.env</code> file to enable online sessions.
        </div>
      )}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-slate-900 px-2 text-slate-500">or</span>
        </div>
      </div>
      <Button variant="secondary" onClick={onStartOffline} className="w-full">
        Start Offline (Single Device)
      </Button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
