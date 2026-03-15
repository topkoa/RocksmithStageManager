import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const PATHS = ['Lead', 'Rhythm', 'Bass', 'Vocals'] as const;

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
  preferredPath: string;
  onSave: (playerName: string, preferredPath: string) => void;
}

export function EditProfileDialog({
  open,
  onClose,
  playerName,
  preferredPath,
  onSave,
}: EditProfileDialogProps) {
  const [name, setName] = useState(playerName);
  const [path, setPath] = useState(preferredPath);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), path);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Preferred Path</label>
          <div className="flex gap-2">
            {PATHS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPath(p)}
                className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${
                  path === p
                    ? 'bg-orange-600/30 border-orange-500 text-orange-300'
                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
