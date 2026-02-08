export type GameState = {
  gameId: string;
  adminId: string;
  locked: boolean;
  rowNumbers: number[] | null;
  colNumbers: number[] | null;
  squares: Record<string, string>;
  users: Record<string, { name: string; lastSeen?: number }>;
  userColors: Record<string, string>;
};

export type GameStatePublic = Omit<GameState, "adminId"> & {
  isAdmin: boolean;
};

export type GameAction =
  | { action: "join"; name: string }
  | { action: "claim"; name: string; square: [number, number] }
  | { action: "unclaim"; name: string; square: [number, number] }
  | { action: "reset"; adminId?: string }
  | { action: "populate"; adminId?: string }
  | { action: "lock"; adminId?: string }
  | { action: "unlock"; adminId?: string };

export const SQUARE_ROWS = 10;
export const SQUARE_COLS = 10;
