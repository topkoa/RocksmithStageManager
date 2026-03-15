export interface Tuning {
  string0: number;
  string1: number;
  string2: number;
  string3: number;
  string4: number;
  string5: number;
}

export interface Arrangement {
  name: string;
  type: 'Guitar' | 'Bass' | 'Vocals';
  tuning: Tuning;
  difficulty: number;
  isBonusArrangement: boolean;
}

export interface Song {
  id: string;
  artistName: string;
  songName: string;
  albumName: string;
  songYear: number;
  songLength: number;
  averageTempo: number;
  arrangements: Arrangement[];
  sourceFile: string;
}
