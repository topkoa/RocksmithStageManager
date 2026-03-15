import type { QueueItem } from '../../types/queue';

interface PlayHistoryProps {
  history: QueueItem[];
}

export function PlayHistory({ history }: PlayHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">
        History ({history.length})
      </h2>
      <div className="space-y-1 px-3 pb-3 max-h-48 overflow-y-auto">
        {history.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 py-1.5 text-xs"
          >
            <span className={item.status === 'played' ? 'text-green-500' : 'text-red-500'}>
              {item.status === 'played' ? '\u2713' : '\u2717'}
            </span>
            <span className="text-slate-400 truncate flex-1">
              {item.songName} &mdash; {item.artistName}
            </span>
            <span className="text-slate-600 shrink-0">
              {item.players.map(p => p.playerName).join(', ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
