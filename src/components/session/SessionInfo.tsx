import type { Player } from '../../types/session';

interface SessionInfoProps {
  roomCode: string;
  players: Player[];
}

export function SessionInfo({ roomCode, players }: SessionInfoProps) {
  return (
    <div className="flex items-center gap-3">
      {roomCode !== 'OFFLINE' && (
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-slate-500 uppercase">Room</span>
          <span className="text-sm font-mono font-bold text-orange-400 tracking-wider">
            {roomCode}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-xs text-slate-400">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
      </div>
    </div>
  );
}
