import { SQUARE_COLS, SQUARE_ROWS } from "@/types/game";

const shuffle = (array: number[]): number[] => {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const shuffleZeroThroughNine = (): number[] =>
  shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

export const squareKey = (row: number, col: number): string =>
  `${row},${col}`;

export const parseSquareKey = (key: string): [number, number] | null => {
  const parts = key.split(",");
  if (parts.length !== 2) return null;
  const row = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);
  if (
    Number.isNaN(row) ||
    Number.isNaN(col) ||
    row < 0 ||
    row >= SQUARE_ROWS ||
    col < 0 ||
    col >= SQUARE_COLS
  ) {
    return null;
  }
  return [row, col];
};

export const isValidSquare = (row: number, col: number): boolean =>
  row >= 0 &&
  row < SQUARE_ROWS &&
  col >= 0 &&
  col < SQUARE_COLS;
