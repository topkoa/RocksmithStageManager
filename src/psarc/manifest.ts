import type { Song, Tuning } from '../types/song';

const DEFAULT_TUNING: Tuning = {
  string0: 0, string1: 0, string2: 0,
  string3: 0, string4: 0, string5: 0,
};

function inferArrangementType(attr: Record<string, unknown>): 'Guitar' | 'Bass' | 'Vocals' {
  const props = attr.ArrangementProperties as Record<string, number> | undefined;
  const name = (attr.ArrangementName as string || '').toLowerCase();

  if (name === 'vocals' || name === 'jvocals') return 'Vocals';
  if (name === 'bass' || props?.pathBass === 1) return 'Bass';
  return 'Guitar';
}

function generateSongId(artistName: string, songName: string, sourceFile: string): string {
  const raw = `${artistName}::${songName}::${sourceFile}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Try to extract artist and song name from a PSARC filename.
 * Common CDLC format: "ArtistSort_SongTitleSort_vX_DD_p.psarc"
 */
function parseFilename(sourceFile: string): { artist: string; song: string } {
  // Strip extension and platform suffix
  let name = sourceFile.replace(/\.(psarc|PSARC)$/, '');
  name = name.replace(/_(p|m)$/, '');

  // Split by underscore — first part is artist, second is song
  const parts = name.split('_');
  if (parts.length >= 2) {
    const artist = parts[0]!
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // "SmashMouth" -> "Smash Mouth"
    const song = parts[1]!
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    return { artist, song };
  }

  return { artist: '', song: name.replace(/-/g, ' ') };
}

function getStringValue(attr: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = attr[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return '';
}

export function parseManifest(
  json: Record<string, unknown>,
  sourceFile: string
): Song[] {
  const entries = json.Entries as Record<string, { Attributes: Record<string, unknown> }> | undefined;

  if (!entries) {
    return parseIndividualManifest(json, sourceFile);
  }

  const filenameFallback = parseFilename(sourceFile);
  const songMap = new Map<string, Song>();

  for (const entry of Object.values(entries)) {
    const attr = entry.Attributes;
    if (!attr) continue;

    // Try multiple field names for artist and song
    let artistName = getStringValue(attr, 'ArtistName', 'Artist');
    let songName = getStringValue(attr, 'SongName', 'FullName', 'SongKey', 'DLCKey');

    // Clean up SongKey-style names (e.g. "AllStar" -> "All Star")
    if (songName && !getStringValue(attr, 'SongName')) {
      songName = songName.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    // Fall back to filename parsing
    if (!artistName) artistName = filenameFallback.artist || 'Unknown Artist';
    if (!songName) songName = filenameFallback.song || 'Unknown Song';

    const key = `${artistName}::${songName}`;

    if (!songMap.has(key)) {
      songMap.set(key, {
        id: generateSongId(artistName, songName, sourceFile),
        artistName,
        songName,
        albumName: getStringValue(attr, 'AlbumName', 'Album'),
        songYear: (attr.SongYear as number) || 0,
        songLength: (attr.SongLength as number) || 0,
        averageTempo: (attr.SongAverageTempo as number) || 0,
        arrangements: [],
        sourceFile,
      });
    }

    const song = songMap.get(key)!;
    const arrangementName = (attr.ArrangementName as string) || 'Unknown';

    // Skip duplicate arrangements
    if (song.arrangements.some(a => a.name === arrangementName)) continue;

    const tuningData = attr.Tuning as Tuning | undefined;

    song.arrangements.push({
      name: arrangementName,
      type: inferArrangementType(attr),
      tuning: tuningData || DEFAULT_TUNING,
      difficulty: (attr.MaxPhraseDifficulty as number) || 0,
      isBonusArrangement:
        (attr.ArrangementProperties as Record<string, number> | undefined)?.bonusArr === 1,
    });
  }

  return Array.from(songMap.values());
}

function parseIndividualManifest(
  json: Record<string, unknown>,
  sourceFile: string
): Song[] {
  const modelName = json.ModelName as string | undefined;
  if (modelName === 'RSEnumerable_Song') {
    const entries = json.Entries as Record<string, unknown> | undefined;
    if (entries) {
      return parseManifest(
        { Entries: entries } as Record<string, unknown>,
        sourceFile
      );
    }
  }

  for (const value of Object.values(json)) {
    if (value && typeof value === 'object' && 'Attributes' in (value as Record<string, unknown>)) {
      return parseManifest(
        { Entries: json } as Record<string, unknown>,
        sourceFile
      );
    }
  }

  return [];
}
