import type { QueueItem } from '../../types/queue';
import { Button } from '../common/Button';

interface NowPlayingProps {
  item: QueueItem | null;
  isHost: boolean;
  onMarkPlayed: () => void;
  onSkip: () => void;
}

export function NowPlaying({ item, isHost, onMarkPlayed, onSkip }: NowPlayingProps) {
  if (!item) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
        <p className="text-slate-600 text-sm">Nothing playing</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-600/20 to-purple-600/20 border border-orange-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold">
          Now Playing
        </span>
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>

      <h3 className="text-lg font-bold text-white">{item.songName}</h3>
      <p className="text-sm text-slate-300">{item.artistName}</p>

      <div className="flex flex-wrap gap-2 mt-3">
        {item.players.map((p, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 bg-slate-800/80 text-slate-200 rounded-full border border-slate-600"
          >
            {p.playerName} &mdash; {p.arrangement}
          </span>
        ))}
      </div>

      {isHost && (
        <div className="flex gap-2 mt-4">
          <Button onClick={onMarkPlayed} size="sm">
            Mark Played
          </Button>
          <Button variant="secondary" onClick={onSkip} size="sm">
            Skip
          </Button>
        </div>
      )}
    </div>
  );
}
