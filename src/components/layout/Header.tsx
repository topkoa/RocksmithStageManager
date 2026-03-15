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
  playerName?: string;
  preferredPath?: string;
  onEditProfile?: () => void;
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
  playerName,
  preferredPath,
  onEditProfile,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          <span className="text-orange-500">RS</span> Stage Manager
          <span className="text-[10px] font-normal text-slate-600 ml-1.5 align-middle">v{__APP_VERSION__}</span>
        </h1>
        {roomCode && (
          <SessionInfo roomCode={roomCode} players={players} />
        )}
        {playerName && onEditProfile && (
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:border-orange-500/50 transition-colors"
          >
            <span className="text-xs text-white">{playerName}</span>
            <span className="text-[10px] text-orange-400">{preferredPath}</span>
          </button>
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
