export interface Session {
  id: string;
  roomCode: string;
  hostId: string;
  createdAt: number;
  status: 'active' | 'ended';
}

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
  isHost: boolean;
}

export type AppRole = 'host' | 'player' | 'none';
