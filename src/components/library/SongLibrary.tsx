import type { Song } from '../../types/song';
import type { SortOption } from '../../hooks/useSongLibrary';
import { FilterBar } from './FilterBar';
import { SongCard } from './SongCard';

interface SongLibraryProps {
  songs: Song[];
  filteredSongs: Song[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  arrangementFilter: string;
  onArrangementFilterChange: (filter: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAddToQueue: (song: Song) => void;
  loading: boolean;
  onLoadFiles: () => void;
}

export function SongLibrary({
  songs,
  filteredSongs,
  searchQuery,
  onSearchChange,
  arrangementFilter,
  onArrangementFilterChange,
  sortBy,
  onSortChange,
  onAddToQueue,
  loading,
  onLoadFiles,
}: SongLibraryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-700/50">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          arrangementFilter={arrangementFilter}
          onArrangementFilterChange={onArrangementFilterChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          totalCount={songs.length}
          filteredCount={filteredSongs.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {songs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">&#127928;</div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No songs loaded
            </h3>
            <p className="text-sm text-slate-500 mb-4 max-w-xs">
              Load your Rocksmith PSARC files to get started
            </p>
            <button
              onClick={onLoadFiles}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
            >
              Load Songs
            </button>
          </div>
        )}

        {filteredSongs.length === 0 && songs.length > 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No songs match your search
          </div>
        )}

        {filteredSongs.map(song => (
          <SongCard
            key={song.id}
            song={song}
            onAddToQueue={onAddToQueue}
          />
        ))}
      </div>
    </div>
  );
}
