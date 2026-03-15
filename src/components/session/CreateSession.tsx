import { Button } from '../common/Button';

interface CreateSessionProps {
  onCreateSession: () => void;
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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Host a Session</h2>
      <p className="text-sm text-slate-400">
        Create a session so players can join from their phones and add songs to the queue.
      </p>
      {firebaseConfigured ? (
        <Button onClick={onCreateSession} disabled={connecting} className="w-full">
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
