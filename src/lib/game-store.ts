import { getStore } from "@netlify/blobs";
import { nanoid } from "nanoid";
import {
  type GameState,
  SQUARE_ROWS,
  SQUARE_COLS,
} from "@/types/game";
import { shuffleZeroThroughNine } from "./game-utils";

const BLOB_STORE_NAME = "superbowl-games";

/** Lazy init blob store; null when not on Netlify or Blobs unavailable (e.g. local dev). */
let blobStore: ReturnType<typeof getStore> | null | undefined = undefined;

function getBlobStore(): ReturnType<typeof getStore> | null {
  if (blobStore !== undefined) return blobStore;
  try {
    blobStore = getStore(BLOB_STORE_NAME);
    return blobStore;
  } catch {
    blobStore = null;
    return null;
  }
}

/** Load game from persistent store into memory cache. Returns true if game exists (in cache after load). */
export async function ensureGameLoaded(gameId: string): Promise<boolean> {
  if (store.has(gameId)) return true;
  const blob = getBlobStore();
  if (!blob) return false;
  try {
    const data = await blob.get(gameId, { type: "json" });
    if (data && typeof data === "object" && "gameId" in data && "adminId" in data) {
      const state = data as GameState;
      store.set(gameId, state);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/** Persist current in-memory state to Blobs so other instances/devices can load it. */
export async function persistGame(gameId: string): Promise<void> {
  const state = store.get(gameId);
  if (!state) return;
  const blob = getBlobStore();
  if (!blob) return;
  try {
    await blob.setJSON(gameId, state);
  } catch {
    // ignore; in-memory state still valid
  }
}

/** Complementary palette: distinct hues, same saturation/brightness, readable on white */
const USER_COLOR_PALETTE = [
  "#0d47a1", "#b71c1c", "#1b5e20", "#e65100", "#4a148c",
  "#006064", "#bf360c", "#283593", "#c62828", "#2e7d32",
  "#ad1457", "#1565c0", "#558b2f", "#6a1b9a", "#0277bd",
  "#00838f", "#6d4c41", "#37474f",
];

const getNextUserColor = (state: GameState): string => {
  const used = new Set(Object.values(state.userColors ?? {}));
  for (const color of USER_COLOR_PALETTE) {
    if (!used.has(color)) return color;
  }
  const index = Object.keys(state.userColors ?? {}).length % USER_COLOR_PALETTE.length;
  return USER_COLOR_PALETTE[index];
};

export const assignUserColor = (gameId: string, name: string): void => {
  const state = store.get(gameId);
  if (!state) return;
  if (!state.userColors) state.userColors = {};
  if (state.userColors[name]) return;
  state.userColors[name] = getNextUserColor(state);
};

const store = new Map<string, GameState>();

async function createGame(gameId: string, adminId: string): Promise<GameState> {
  const state: GameState = {
    gameId,
    adminId,
    locked: false,
    rowNumbers: null,
    colNumbers: null,
    squares: {},
    users: {},
    userColors: {},
  };
  store.set(gameId, state);
  await persistGame(gameId);
  return state;
}

export const getGame = (gameId: string): GameState | undefined =>
  store.get(gameId);

/** Get existing game (loading from Blobs if needed) or create and persist. */
export async function getOrCreateGame(
  gameId: string,
  adminId: string
): Promise<GameState> {
  const loaded = await ensureGameLoaded(gameId);
  if (loaded) {
    const existing = store.get(gameId);
    if (existing) return existing;
  }
  return createGame(gameId, adminId);
}

export const resetGame = (gameId: string): GameState | null => {
  const state = store.get(gameId);
  if (!state) return null;
  if (state.locked) return null;
  state.rowNumbers = null;
  state.colNumbers = null;
  state.squares = {};
  state.users = {};
  state.userColors = {};
  return state;
};

export const populateNumbers = (gameId: string): GameState | null => {
  const state = store.get(gameId);
  if (!state) return null;
  if (state.locked) return null;
  state.rowNumbers = shuffleZeroThroughNine();
  state.colNumbers = shuffleZeroThroughNine();
  return state;
};

export const setLocked = (
  gameId: string,
  locked: boolean
): { success: boolean; error?: string } => {
  const state = store.get(gameId);
  if (!state) return { success: false, error: "Game not found" };
  state.locked = locked;
  return { success: true };
};

export const claimSquare = (
  gameId: string,
  name: string,
  row: number,
  col: number
): { success: boolean; error?: string } => {
  const state = store.get(gameId);
  if (!state) return { success: false, error: "Game not found" };
  const key = `${row},${col}`;
  if (
    row < 0 ||
    row >= SQUARE_ROWS ||
    col < 0 ||
    col >= SQUARE_COLS
  ) {
    return { success: false, error: "Invalid square" };
  }
  if (state.squares[key]) {
    return { success: false, error: "Square already taken" };
  }
  const trimmedName = name.trim();
  if (!trimmedName) return { success: false, error: "Name is required" };
  if (!state.userColors) state.userColors = {};
  if (!state.userColors[trimmedName]) {
    state.userColors[trimmedName] = getNextUserColor(state);
  }
  state.squares[key] = trimmedName;
  state.users[trimmedName] = {
    name: trimmedName,
    lastSeen: Date.now(),
  };
  return { success: true };
};

export const generateGameId = (): string => nanoid(10);
