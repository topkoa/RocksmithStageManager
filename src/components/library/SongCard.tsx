import type { Song } from '../../types/song';
import { formatDuration, formatTuning } from '../../utils/formatting';

interface SongCardProps {
  song: Song;
  onAddToQueue: (song: Song) => void;
}

const ARRANGEMENT_COLORS: Record<string, string> = {
  Lead: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
  Rhythm: 'bg-green-600/30 text-green-300 border-green-500/40',
  Bass: 'bg-orange-600/30 text-orange-300 border-orange-500/40',
  Vocals: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40',
};

export function SongCard({ song, onAddToQueue }: SongCardProps) {
  const mainArrangements = song.arrangements.filter(a => !a.isBonusArrangement);

  // Get the "primary" tuning — use Lead, fall back to first non-vocal arrangement
  const primaryTuning = mainArrangements.find(a => a.name === 'Lead')?.tuning
    ?? mainArrangements.find(a => a.type !== 'Vocals')?.tuning;

  // Check if all non-vocal arrangements share the same tuning
  const nonVocalArrangements = mainArrangements.filter(a => a.type !== 'Vocals');
  const allSameTuning = nonVocalArrangements.length > 1 && nonVocalArrangements.every(a =>
    JSON.stringify(a.tuning) === JSON.stringify(nonVocalArrangements[0]!.tuning)
  );

  return (
    <button
      type="button"
      onClick={() => onAddToQueue(song)}
      className="w-full text-left bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-orange-500/50 hover:bg-slate-800 active:bg-slate-700/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {song.songName}
          </h3>
          <p className="text-xs text-slate-400 truncate">
            {song.artistName}
            {song.albumName && ` \u2014 ${song.albumName}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Show shared tuning once if all arrangements match, otherwise per-arrangement */}
        {allSameTuning && primaryTuning ? (
          <>
            {mainArrangements.map(arr => (
              <span
                key={arr.name}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${ARRANGEMENT_COLORS[arr.name] || 'bg-slate-700 text-slate-300 border-slate-600'}`}
              >
                {arr.name}
              </span>
            ))}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-yellow-300/80 border border-yellow-500/20">
              {formatTuning(primaryTuning)}
            </span>
          </>
        ) : (
          mainArrangements.map(arr => (
            <span
              key={arr.name}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${ARRANGEMENT_COLORS[arr.name] || 'bg-slate-700 text-slate-300 border-slate-600'}`}
            >
              {arr.name}
              {arr.type !== 'Vocals' && (
                <span className="ml-1 text-yellow-300/70">{formatTuning(arr.tuning)}</span>
              )}
            </span>
          ))
        )}

        {song.averageTempo > 0 && (
          <span className="text-[10px] text-slate-500">{Math.round(song.averageTempo)} BPM</span>
        )}
        {song.songLength > 0 && (
          <span className="text-[10px] text-slate-500">{formatDuration(song.songLength)}</span>
        )}
        {song.songYear > 0 && (
          <span className="text-[10px] text-slate-500">{song.songYear}</span>
        )}
      </div>
    </button>
  );
}
