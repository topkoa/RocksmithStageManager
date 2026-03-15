import { useState } from 'react';
import type { Song } from '../../types/song';
import type { PlayerSlot } from '../../types/queue';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatTuning } from '../../utils/formatting';

interface AddToQueueDialogProps {
  open: boolean;
  onClose: () => void;
  song: Song | null;
  onConfirm: (song: Song, player: PlayerSlot) => void;
  defaultPlayerName: string;
  defaultArrangement?: string;
  recentPlayerNames: string[];
}

export function AddToQueueDialog({
  open,
  onClose,
  song,
  onConfirm,
  defaultPlayerName,
  defaultArrangement,
  recentPlayerNames,
}: AddToQueueDialogProps) {
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [selectedArrangement, setSelectedArrangement] = useState('');

  if (!song) return null;

  const ALL_PATHS = ['Lead', 'Rhythm', 'Bass', 'Vocals'] as const;
  const mainArrangements = song.arrangements.filter(a => !a.isBonusArrangement);
  const availableNames = new Set(mainArrangements.map(a => a.name));

  const getEffectiveArrangement = () => {
    if (selectedArrangement) return selectedArrangement;
    if (defaultArrangement) return defaultArrangement;
    return 'Lead';
  };

  const handleConfirm = () => {
    if (!playerName.trim()) return;
    const arrangement = getEffectiveArrangement();
    onConfirm(song, { playerName: playerName.trim(), arrangement });
    onClose();
    setSelectedArrangement('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Add to Queue">
      <div className="space-y-4">
        <div>
          <p className="text-white font-medium">{song.songName}</p>
          <p className="text-sm text-slate-400">{song.artistName}</p>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Player Name</label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            autoFocus
            list="recent-players"
          />
          {recentPlayerNames.length > 0 && (
            <datalist id="recent-players">
              {recentPlayerNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Arrangement</label>
          <div className="flex flex-wrap gap-2">
            {ALL_PATHS.map(path => {
              const arr = mainArrangements.find(a => a.name === path);
              const isSelected = getEffectiveArrangement() === path;
              return (
                <button
                  key={path}
                  onClick={() => setSelectedArrangement(path)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    isSelected
                      ? 'bg-orange-600/30 border-orange-500 text-orange-300'
                      : availableNames.has(path)
                        ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <span>{path}</span>
                  {arr && arr.tuning && (
                    <span className="text-[10px] ml-1 text-slate-500">
                      {formatTuning(arr.tuning)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!playerName.trim()}>
            Add to Queue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
