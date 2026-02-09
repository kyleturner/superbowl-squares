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

/**
 * Merge two game states intelligently to resolve conflicts.
 * - Uses the state with higher revisionId as base
 * - For squares: if one is empty and other has value, use the value; if both have values, prefer higher revisionId
 * - Merges users and userColors (union, prefer higher revisionId)
 * - Uses higher revisionId's locked, rowNumbers, colNumbers
 * - Only bumps revisionId if there are actual conflicts (different squares filled)
 */
function mergeGameStates(base: GameState, other: GameState): GameState {
  const baseRev = base.revisionId ?? 1;
  const otherRev = other.revisionId ?? 1;
  
  // Use the state with higher revisionId as the base
  const primary = baseRev >= otherRev ? base : other;
  const secondary = baseRev >= otherRev ? other : base;
  
  // Merge squares: prefer non-empty, then prefer primary
  const allSquareKeys = new Set([
    ...Object.keys(primary.squares ?? {}),
    ...Object.keys(secondary.squares ?? {}),
  ]);
  
  let hasConflict = false;
  const mergedSquares: Record<string, string> = {};
  for (const key of allSquareKeys) {
    const primaryVal = primary.squares?.[key];
    const secondaryVal = secondary.squares?.[key];
    if (primaryVal && !secondaryVal) {
      mergedSquares[key] = primaryVal;
    } else if (!primaryVal && secondaryVal) {
      mergedSquares[key] = secondaryVal;
    } else if (primaryVal && secondaryVal && primaryVal !== secondaryVal) {
      // Both have values and they differ - conflict!
      hasConflict = true;
      mergedSquares[key] = primaryVal; // Prefer primary (higher revisionId)
    } else if (primaryVal && secondaryVal) {
      // Same value in both, no conflict
      mergedSquares[key] = primaryVal;
    }
  }
  
  // Only bump revisionId if there was an actual conflict
  const merged: GameState = {
    ...primary,
    squares: mergedSquares,
    revisionId: hasConflict ? Math.max(baseRev, otherRev) + 1 : Math.max(baseRev, otherRev),
  };
  
  // Merge users: union, keep latest lastSeen
  merged.users = { ...primary.users };
  for (const [name, user] of Object.entries(secondary.users ?? {})) {
    if (!merged.users[name] || (user.lastSeen ?? 0) > (merged.users[name]?.lastSeen ?? 0)) {
      merged.users[name] = user;
    }
  }
  
  // Merge userColors: union, prefer primary
  merged.userColors = { ...primary.userColors };
  for (const [name, color] of Object.entries(secondary.userColors ?? {})) {
    if (!merged.userColors[name]) {
      merged.userColors[name] = color;
    }
  }
  
  return merged;
}

/** Load game from persistent store into memory cache. Returns true if game exists (in cache after load). */
export async function ensureGameLoaded(gameId: string): Promise<boolean> {
  const blob = getBlobStore();
  if (!blob) {
    // If no blob store, check in-memory only
    return store.has(gameId);
  }
  
  try {
    const data = await blob.get(gameId, { type: "json" });
    if (data && typeof data === "object" && "gameId" in data && "adminId" in data) {
      const blobState = data as GameState;
      const needsMigration = typeof blobState.revisionId !== "number";
      if (needsMigration) blobState.revisionId = 1;
      
      const inMemoryState = store.get(gameId);
      if (inMemoryState) {
        // Merge: in-memory might have newer mutations, blob has persisted state
        const merged = mergeGameStates(inMemoryState, blobState);
        store.set(gameId, merged);
        await persistGame(gameId); // Persist merged state
        return true;
      } else {
        // No in-memory state, use blob state
        store.set(gameId, blobState);
        if (needsMigration) await persistGame(gameId);
        return true;
      }
    }
  } catch {
    // ignore
  }
  
  // If blob load failed but we have in-memory, return true
  return store.has(gameId);
}

/** Reload game from Blobs and merge with in-memory state. Ensures we have latest before mutations. */
export async function reloadAndMergeGame(gameId: string): Promise<boolean> {
  const blob = getBlobStore();
  if (!blob) return store.has(gameId);
  
  try {
    const data = await blob.get(gameId, { type: "json" });
    if (data && typeof data === "object" && "gameId" in data && "adminId" in data) {
      const blobState = data as GameState;
      if (typeof blobState.revisionId !== "number") blobState.revisionId = 1;
      
      const inMemoryState = store.get(gameId);
      if (inMemoryState) {
        const merged = mergeGameStates(inMemoryState, blobState);
        store.set(gameId, merged);
        return true;
      } else {
        store.set(gameId, blobState);
        return true;
      }
    }
  } catch {
    // ignore
  }
  
  return store.has(gameId);
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

function bumpRevision(state: GameState): void {
  state.revisionId = (state.revisionId ?? 1) + 1;
}

/** Bump revision after a mutation (e.g. join). Call from API after mutating state. */
export function incrementRevision(gameId: string): void {
  const state = store.get(gameId);
  if (state) bumpRevision(state);
}

async function createGame(gameId: string, adminId: string): Promise<GameState> {
  const state: GameState = {
    gameId,
    adminId,
    revisionId: 1,
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
  bumpRevision(state);
  return state;
};

export const populateNumbers = (gameId: string): GameState | null => {
  const state = store.get(gameId);
  if (!state) return null;
  if (state.locked) return null;
  state.rowNumbers = shuffleZeroThroughNine();
  state.colNumbers = shuffleZeroThroughNine();
  bumpRevision(state);
  return state;
};

export const setLocked = (
  gameId: string,
  locked: boolean
): { success: boolean; error?: string } => {
  const state = store.get(gameId);
  if (!state) return { success: false, error: "Game not found" };
  state.locked = locked;
  bumpRevision(state);
  return { success: true };
};

export const claimSquare = (
  gameId: string,
  name: string,
  row: number,
  col: number,
  expectedRevisionId?: number
): { success: boolean; error?: string } => {
  const state = store.get(gameId);
  if (!state) return { success: false, error: "Game not found" };
  if (state.locked) return { success: false, error: "Board is locked" };
  const key = `${row},${col}`;
  if (
    row < 0 ||
    row >= SQUARE_ROWS ||
    col < 0 ||
    col >= SQUARE_COLS
  ) {
    return { success: false, error: "Invalid square" };
  }
  
  // Check if square is already taken
  if (state.squares[key]) {
    return { success: false, error: "Square already taken" };
  }
  
  // If revisionId doesn't match but square is still empty, allow the claim
  // (the client will get updated state in response)
  if (expectedRevisionId !== undefined && (state.revisionId ?? 1) !== expectedRevisionId) {
    // Square is empty, so it's safe to claim - revision mismatch is just informational
    // We'll proceed with the claim
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
  bumpRevision(state);
  return { success: true };
};

export const unclaimSquare = (
  gameId: string,
  name: string,
  row: number,
  col: number,
  expectedRevisionId?: number
): { success: boolean; error?: string } => {
  const state = store.get(gameId);
  if (!state) return { success: false, error: "Game not found" };
  if (state.locked) return { success: false, error: "Board is locked" };
  const key = `${row},${col}`;
  if (
    row < 0 ||
    row >= SQUARE_ROWS ||
    col < 0 ||
    col >= SQUARE_COLS
  ) {
    return { success: false, error: "Invalid square" };
  }
  const current = state.squares[key];
  if (!current || current.trim() !== name.trim()) {
    return { success: false, error: "You can only remove your own square" };
  }
  
  // If revisionId doesn't match but they own the square, allow the unclaim
  // (the client will get updated state in response)
  if (expectedRevisionId !== undefined && (state.revisionId ?? 1) !== expectedRevisionId) {
    // They own the square, so it's safe to unclaim - revision mismatch is just informational
    // We'll proceed with the unclaim
  }
  
  delete state.squares[key];
  bumpRevision(state);
  return { success: true };
};

export const generateGameId = (): string => nanoid(10);
