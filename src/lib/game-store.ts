import { nanoid } from "nanoid";
import {
  type GameState,
  SQUARE_ROWS,
  SQUARE_COLS,
} from "@/types/game";
import { shuffleZeroThroughNine } from "./game-utils";

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

const createGame = (gameId: string, adminId: string): GameState => {
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
  return state;
};

export const getGame = (gameId: string): GameState | undefined =>
  store.get(gameId);

export const getOrCreateGame = (
  gameId: string,
  adminId: string
): GameState => {
  const existing = store.get(gameId);
  if (existing) return existing;
  return createGame(gameId, adminId);
};

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
