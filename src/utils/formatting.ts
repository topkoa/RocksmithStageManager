import type { Tuning } from '../types/song';

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_SEMITONES = [4, 9, 2, 7, 11, 4]; // E2, A2, D3, G3, B3, E4

export function formatTuning(tuning: Tuning): string {
  const offsets = [
    tuning.string0, tuning.string1, tuning.string2,
    tuning.string3, tuning.string4, tuning.string5,
  ];

  // Check if standard tuning
  if (offsets.every(o => o === 0)) return 'E Standard';

  // Check common tunings
  if (offsets.every(o => o === -2)) return 'D Standard';
  if (offsets.every(o => o === -1)) return 'Eb Standard';
  if (offsets.every(o => o === -3)) return 'C# Standard';
  if (offsets.every(o => o === -4)) return 'C Standard';
  if (offsets[0] === -2 && offsets.slice(1).every(o => o === 0)) return 'Drop D';
  if (offsets[0] === -4 && offsets.slice(1).every(o => o === -2)) return 'Drop C';

  // Build custom tuning string
  return offsets.map((offset, i) => {
    const baseSemitone = STANDARD_SEMITONES[i]!;
    const note = NOTE_NAMES[((baseSemitone + offset) % 12 + 12) % 12]!;
    return note;
  }).join(' ');
}

export function formatTuningShort(tuning: Tuning): string {
  const full = formatTuning(tuning);
  if (full.length <= 12) return full;
  return full.substring(0, 11) + '...';
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
