"use client";

import { memo, Fragment } from "react";
import Image from "next/image";
import type { GameStatePublic } from "@/types/game";
import SquareCell from "./SquareCell";

type GameBoardProps = {
  state: GameStatePublic;
  onSelectSquare: (row: number, col: number) => void;
  canClaim: boolean;
};

const GameBoard = memo(({ state, onSelectSquare, canClaim }: GameBoardProps) => {
  const { rowNumbers, colNumbers, squares, userColors } = state;
  const getUserColor = (name: string): string | undefined =>
    userColors?.[name];
  const hasRowNumbers = rowNumbers !== null && rowNumbers.length === 10;
  const hasColNumbers = colNumbers !== null && colNumbers.length === 10;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 max-w-4xl mx-auto">
      {/* Board: team headers + grid — fills remaining space */}
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-auto">
        {/* New England (top) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 shrink-0 bg-nfl-charcoal border border-gray-700 rounded-t-xl py-1.5 sm:py-2 px-2">
          <Image
            src="/teams/patriots.svg"
            alt=""
            width={120}
            height={120}
            className="shrink-0 w-24 h-24 sm:w-[7.5rem] sm:h-[7.5rem]"
            aria-hidden
          />
          <span className="font-bold uppercase tracking-wider text-white text-sm sm:text-base">
            New England Patriots
          </span>
        </div>

        <div className="flex flex-1 min-h-0 min-w-0">
          {/* Seattle (left) — vertical */}
          <div
            className="flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 bg-nfl-charcoal border border-gray-700 border-t-0 border-r-0 py-2"
            aria-hidden
          >
            <Image
              src="/teams/seahawks.svg"
              alt=""
              width={120}
              height={120}
              className="shrink-0 w-24 h-24 sm:w-[7.5rem] sm:h-[7.5rem] rotate-[90deg]"
            />
            <span
              className="font-bold uppercase tracking-wider text-white text-xs sm:text-sm mt-1 whitespace-nowrap"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Seattle Seahawks
            </span>
          </div>

          {/* 11x11 grid — square, as large as fits in available space */}
          <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center p-0 sm:p-1">
            <div
              className="w-full max-h-full grid gap-0 border-0 sm:border border-gray-700 border-t-0 overflow-hidden"
              style={{
                aspectRatio: "11 / 11",
                gridTemplateColumns: "minmax(0,1fr) repeat(10, minmax(0,1fr))",
                gridTemplateRows: "minmax(0,1fr) repeat(10, minmax(0,1fr))",
                maxHeight: "100%",
              }}
            >
            {/* Corner */}
            <div
              className="bg-nfl-number-bg border-b border-r border-gray-500 flex items-center justify-center min-w-0 min-h-0"
              style={{
                background:
                  "linear-gradient(to bottom right, transparent 49%, #374151 49%, #374151 51%, transparent 51%)",
                backgroundColor: "#e5e7eb",
              }}
              aria-hidden
            />

            {/* Top row: column numbers */}
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={`col-${i}`}
                className="bg-nfl-number-bg border-b border-r border-gray-500 flex items-center justify-center min-w-0 min-h-0 text-gray-900 font-bold text-[clamp(0.75rem,4vw,1.25rem)]"
              >
                {hasColNumbers ? colNumbers![i] : "—"}
              </div>
            ))}

            {/* Rows: row number + 10 squares */}
            {Array.from({ length: 10 }, (_, rowIndex) => (
              <Fragment key={rowIndex}>
                <div className="bg-nfl-number-bg border-r border-gray-500 flex items-center justify-center min-w-0 min-h-0 text-gray-900 font-bold text-[clamp(0.75rem,4vw,1.25rem)]">
                  {hasRowNumbers ? rowNumbers![rowIndex] : "—"}
                </div>
                {Array.from({ length: 10 }, (_, colIndex) => {
                  const name = squares[`${rowIndex},${colIndex}`] ?? null;
                  return (
                    <SquareCell
                      key={`${rowIndex}-${colIndex}`}
                      row={rowIndex}
                      col={colIndex}
                      name={name}
                      nameColor={name ? getUserColor(name) : undefined}
                      onSelect={onSelectSquare}
                      disabled={!canClaim}
                    />
                  );
                })}
              </Fragment>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GameBoard.displayName = "GameBoard";

export default GameBoard;
