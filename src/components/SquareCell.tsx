"use client";

import { memo } from "react";

type SquareCellProps = {
  row: number;
  col: number;
  name: string | null;
  nameColor?: string | null;
  onSelect: (row: number, col: number) => void;
  disabled: boolean;
};

const SquareCell = memo(({ row, col, name, nameColor, onSelect, disabled }: SquareCellProps) => {
  const handleClick = () => {
    if (disabled || name) return;
    onSelect(row, col);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (disabled || name) return;
    onSelect(row, col);
  };

  const isEmpty = !name;
  const isClickable = isEmpty && !disabled;

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!isClickable}
      tabIndex={isClickable ? 0 : -1}
      aria-label={name ? `Square ${row + 1},${col + 1} taken by ${name}` : `Select square ${row + 1},${col + 1}`}
      className={`
        min-h-0 min-w-0 border border-gray-700 bg-white text-gray-900
        flex items-center justify-center p-0.5 sm:p-1
        text-[clamp(0.5rem,2.8vw,0.95rem)] sm:text-sm font-bold
        transition-colors select-none
        ${isClickable ? "cursor-pointer hover:bg-gray-100 active:bg-gray-200 focus:outline focus:ring-2 focus:ring-nfl-patriots-accent focus:ring-inset" : ""}
        ${!isEmpty ? "bg-gray-50 cursor-default" : ""}
      `}
    >
      {name ? (
        <span
          className="truncate w-full text-center leading-tight font-bold"
          title={name}
          style={nameColor ? { color: nameColor } : undefined}
        >
          {name}
        </span>
      ) : (
        <span className="invisible">.</span>
      )}
    </button>
  );
});

SquareCell.displayName = "SquareCell";

export default SquareCell;
