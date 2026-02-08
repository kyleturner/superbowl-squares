"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const JoinPage = () => {
  const router = useRouter();
  const [gameId, setGameId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = gameId.trim();
    if (!trimmed) {
      setError("Enter a game code");
      return;
    }
    setError(null);
    router.push(`/game/${trimmed}`);
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
        Join game
      </h1>
      <p className="text-gray-400 text-sm mb-6 text-center px-2">
        Enter the game code shared by the host
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Game code"
          className="rounded-xl border-2 border-gray-600 bg-gray-900 px-4 py-4 min-h-touch text-white placeholder-gray-500 focus:border-nfl-patriots-accent focus:outline-none focus:ring-2 focus:ring-nfl-patriots-accent text-base"
          aria-label="Game code"
          autoComplete="off"
        />
        {error && (
          <p className="text-red-400 text-sm text-center" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-nfl-seahawks-accent px-6 py-4 min-h-touch flex items-center justify-center font-medium text-white hover:opacity-90 active:opacity-95 transition-opacity"
          aria-label="Join game"
        >
          Join
        </button>
      </form>
      <Link
        href="/"
        className="mt-6 text-gray-400 hover:text-white text-sm min-h-touch flex items-center justify-center"
        aria-label="Back to home"
      >
        Back to home
      </Link>
    </main>
  );
};

export default JoinPage;
