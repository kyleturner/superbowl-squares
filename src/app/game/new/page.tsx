"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NewGamePage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createGame = async () => {
      try {
        const res = await fetch("/api/game/new");
        if (!res.ok) throw new Error("Failed to create game");
        const { gameId } = await res.json();
        router.replace(`/game/${gameId}`);
      } catch {
        setError("Could not create game. Try again.");
      }
    };
    createGame();
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-nfl-patriots-accent px-6 py-3 text-white font-medium"
          aria-label="Retry creating game"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <p className="text-gray-400">Creating your game...</p>
    </main>
  );
};

export default NewGamePage;
