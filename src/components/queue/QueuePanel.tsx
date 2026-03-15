import type { QueueItem } from '../../types/queue';
import { QueueItemCard } from './QueueItemCard';
import { Button } from '../common/Button';

interface QueuePanelProps {
  queue: QueueItem[];
  isHost: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onJoin: (item: QueueItem) => void;
  onPlayNext: () => void;
}

export function QueuePanel({
  queue,
  isHost,
  onMoveUp,
  onMoveDown,
  onRemove,
  onJoin,
  onPlayNext,
}: QueuePanelProps) {
  const waitingItems = queue.filter(i => i.status === 'waiting');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Queue ({waitingItems.length})
        </h2>
        {isHost && waitingItems.length > 0 && (
          <Button size="sm" onClick={onPlayNext}>
            Play Next
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {waitingItems.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-sm">
            Queue is empty — add songs from the library
          </div>
        )}
        {waitingItems.map((item, idx) => (
          <QueueItemCard
            key={item.id}
            item={item}
            index={idx}
            isHost={isHost}
            onMoveUp={() => onMoveUp(item.id)}
            onMoveDown={() => onMoveDown(item.id)}
            onRemove={() => onRemove(item.id)}
            onJoin={() => onJoin(item)}
            isFirst={idx === 0}
            isLast={idx === waitingItems.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
