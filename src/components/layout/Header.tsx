import type { Player } from '../../types/session';
import { SessionInfo } from '../session/SessionInfo';
import { Button } from '../common/Button';

interface HeaderProps {
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  loading: boolean;
  songCount: number;
  onLoadFiles: () => void;
  onClearLibrary: () => void;
  progress?: { completed: number; total: number; current: string };
}

export function Header({
  roomCode,
  players,
  isHost,
  loading,
  songCount,
  onLoadFiles,
  onClearLibrary,
  progress,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          <span className="text-orange-500">RS</span> Stage Manager
        </h1>
        {roomCode && (
          <SessionInfo roomCode={roomCode} players={players} />
        )}
      </div>

      <div className="flex items-center gap-2">
        {loading && progress && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-400">
              {progress.completed}/{progress.total}
            </span>
          </div>
        )}
        {isHost && songCount > 0 && !loading && (
          <Button size="sm" variant="ghost" onClick={onClearLibrary} className="text-slate-400">
            Clear
          </Button>
        )}
        {isHost && (
          <Button size="sm" onClick={onLoadFiles} disabled={loading}>
            {loading ? 'Loading...' : 'Load Songs'}
          </Button>
        )}
      </div>
    </header>
  );
}
