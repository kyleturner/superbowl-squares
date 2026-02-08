"use client";

import { useState } from "react";

type NameEntryProps = {
  currentName: string;
  onSubmit: (name: string) => void;
  disabled?: boolean;
};

const NameEntry = ({
  currentName,
  onSubmit,
  disabled = false,
}: NameEntryProps) => {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 w-full max-w-xs"
      aria-label="Enter your name to select a square"
    >
      <label htmlFor="player-name" className="text-sm text-gray-400">
        Your name
      </label>
      <div className="flex gap-2">
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          disabled={disabled}
          className="flex-1 rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 focus:border-nfl-patriots-accent focus:outline-none focus:ring-2 focus:ring-nfl-patriots-accent min-h-touch"
          aria-label="Your name"
          autoComplete="name"
        />
        <button
          type="submit"
          disabled={disabled || !name.trim()}
          className="rounded-xl bg-nfl-patriots-accent px-4 py-3 font-medium text-white hover:opacity-90 active:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
          aria-label="Submit name"
        >
          Join
        </button>
      </div>
    </form>
  );
};

export default NameEntry;
