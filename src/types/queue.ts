export interface PlayerSlot {
  playerName: string;
  arrangement: string;
}

export interface QueueItem {
  id: string;
  songId: string;
  songName: string;
  artistName: string;
  players: PlayerSlot[];
  status: 'waiting' | 'playing' | 'played' | 'skipped';
  addedAt: number;
  playedAt?: number;
  order: number;
}
