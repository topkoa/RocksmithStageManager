import type { QueueItem } from '../../types/queue';
import { Button } from '../common/Button';

interface QueueItemCardProps {
  item: QueueItem;
  index: number;
  isHost: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onJoin?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function QueueItemCard({
  item,
  index,
  isHost,
  onMoveUp,
  onMoveDown,
  onRemove,
  onJoin,
  isFirst,
  isLast,
}: QueueItemCardProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 group">
      <span className="text-xs text-slate-600 w-5 text-center font-mono">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {item.songName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {item.artistName}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.players.map((p, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded"
            >
              {p.playerName} - {p.arrangement}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onJoin && (
          <Button variant="ghost" size="sm" onClick={onJoin} className="!px-1.5 text-green-400">
            +Join
          </Button>
        )}
        {isHost && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={isFirst}
              className="!px-1 opacity-0 group-hover:opacity-100"
            >
              &#9650;
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={isLast}
              className="!px-1 opacity-0 group-hover:opacity-100"
            >
              &#9660;
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="!px-1 text-red-400 opacity-0 group-hover:opacity-100"
            >
              &times;
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
