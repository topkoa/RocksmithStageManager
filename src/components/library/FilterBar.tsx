import { SearchInput } from '../common/SearchInput';
import type { SortOption } from '../../hooks/useSongLibrary';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  arrangementFilter: string;
  onArrangementFilterChange: (filter: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  arrangementFilter,
  onArrangementFilterChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search songs, artists, albums..."
      />
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={arrangementFilter}
          onChange={e => onArrangementFilterChange(e.target.value)}
          className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-orange-500"
        >
          <option value="">All Arrangements</option>
          <option value="Lead">Lead</option>
          <option value="Rhythm">Rhythm</option>
          <option value="Bass">Bass</option>
          <option value="Vocals">Vocals</option>
        </select>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as SortOption)}
          className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-orange-500"
        >
          <option value="artist-asc">Artist A-Z</option>
          <option value="artist-desc">Artist Z-A</option>
          <option value="song-asc">Song A-Z</option>
          <option value="song-desc">Song Z-A</option>
          <option value="year-desc">Year (newest)</option>
          <option value="year-asc">Year (oldest)</option>
          <option value="tempo-asc">Tempo (slow)</option>
          <option value="tempo-desc">Tempo (fast)</option>
          <option value="duration-asc">Duration (short)</option>
          <option value="duration-desc">Duration (long)</option>
          <option value="tuning">Tuning</option>
        </select>
        <span className="text-xs text-slate-500 whitespace-nowrap ml-auto">
          {filteredCount === totalCount
            ? `${totalCount} songs`
            : `${filteredCount} / ${totalCount}`}
        </span>
      </div>
    </div>
  );
}
