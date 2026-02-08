"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pacifico } from "next/font/google";
import type { GameStatePublic } from "@/types/game";
import GameBoard from "@/components/GameBoard";
import AdminControls from "@/components/AdminControls";
import NameEntry from "@/components/NameEntry";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"] });

const POLL_INTERVAL_MS = 4000;

const GamePage = () => {
  const params = useParams();
  const router = useRouter();
  const gameId = typeof params.gameId === "string" ? params.gameId : "";

  const [state, setState] = useState<GameStatePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");

  const fetchState = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/game/${gameId}`);
      if (res.status === 404) {
        setError("Game not found");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong");
        return;
      }
      const data: GameStatePublic = await res.json();
      setState(data);
      setError(null);
    } catch {
      setError("Failed to load game");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    fetchState();
  }, [gameId, fetchState]);

  useEffect(() => {
    if (!gameId || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`superbowl_name_${gameId}`);
      if (saved) setPlayerName(saved);
    } catch {
      // ignore
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId || !state) return;
    const id = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [gameId, state, fetchState]);

  const handleJoin = useCallback(
    async (name: string) => {
      if (!gameId) return;
      try {
        const res = await fetch(`/api/game/${gameId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", name }),
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Join failed");
          return;
        }
        const data: GameStatePublic = await res.json();
        setState(data);
        setPlayerName(name);
        setError(null);
        try {
          localStorage.setItem(`superbowl_name_${gameId}`, name);
        } catch {
          // ignore
        }
      } catch {
        setError("Failed to join");
      }
    },
    [gameId]
  );

  const handleClaimSquare = useCallback(
    async (row: number, col: number) => {
      if (!gameId || !playerName.trim()) return;
      try {
        const res = await fetch(`/api/game/${gameId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "claim",
            name: playerName.trim(),
            square: [row, col],
          }),
          credentials: "include",
        });
        if (res.status === 409) {
          setError("That square was just taken. Refreshing…");
          fetchState();
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Could not claim square");
          return;
        }
        const data: GameStatePublic = await res.json();
        setState(data);
        setError(null);
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#c60c30", "#69be28", "#002244", "#0d2341", "#ffd700", "#ffffff"],
          });
        } catch {
          // ignore if confetti fails
        }
      } catch {
        setError("Failed to claim square");
      }
    },
    [gameId, playerName, fetchState]
  );

  const handleReset = useCallback(async () => {
    if (!gameId) return;
    const res = await fetch(`/api/game/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
      credentials: "include",
    });
    if (res.ok) {
      const data: GameStatePublic = await res.json();
      setState(data);
      setError(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not reset");
    }
  }, [gameId]);

  const handlePopulate = useCallback(async () => {
    if (!gameId) return;
    const res = await fetch(`/api/game/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "populate" }),
      credentials: "include",
    });
    if (res.ok) {
      const data: GameStatePublic = await res.json();
      setState(data);
      setError(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not populate numbers");
    }
  }, [gameId]);

  const handleLock = useCallback(async () => {
    if (!gameId) return;
    const res = await fetch(`/api/game/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock" }),
      credentials: "include",
    });
    if (res.ok) {
      const data: GameStatePublic = await res.json();
      setState(data);
      setError(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not lock board");
    }
  }, [gameId]);

  const handleUnlock = useCallback(async () => {
    if (!gameId) return;
    const res = await fetch(`/api/game/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlock" }),
      credentials: "include",
    });
    if (res.ok) {
      const data: GameStatePublic = await res.json();
      setState(data);
      setError(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not unlock board");
    }
  }, [gameId]);

  if (!gameId) {
    router.replace("/");
    return null;
  }

  if (loading && !state) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-400">Loading game…</p>
      </main>
    );
  }

  if (error && !state) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <Link
          href="/"
          className="rounded-lg bg-nfl-patriots-accent px-6 py-3 text-white font-medium"
          aria-label="Back to home"
        >
          Back to home
        </Link>
      </main>
    );
  }

  if (!state) return null;

  const hasJoined = Boolean(playerName.trim());
  const claimedCount = Object.keys(state.squares).length;
  const allFilled = claimedCount >= 100;

  return (
    <main className="min-h-[100dvh] flex flex-col w-full max-w-4xl mx-auto px-2 sm:px-4 pb-safe">
      {/* Header: centered Super Bowl logo + title (calligraphic), Home link */}
      <header className="shrink-0 relative flex flex-col items-center justify-center gap-1 py-2 sm:py-3">
        <Link
          href="/"
          className="absolute right-0 top-2 text-sm text-gray-400 hover:text-white py-2 px-1 min-h-touch min-w-touch flex items-center justify-center z-10"
          aria-label="Back to home"
        >
          Home
        </Link>
        <Image
          src="/super-bowl-logo.svg"
          alt=""
          width={500}
          height={330}
          className="shrink-0 w-40 h-auto sm:w-52 max-w-full object-contain"
          priority
          aria-hidden
        />
        <h1
          className={`${pacifico.className} text-xl sm:text-2xl md:text-3xl font-normal text-white text-center`}
        >
          Casa Turner Super Bowl Squares
        </h1>
      </header>

      {/* Compact top section: scrolls if needed on small screens */}
      <div className="shrink-0 flex flex-col gap-2 sm:gap-3 py-2 sm:py-3">

        {state.isAdmin && (
          <AdminControls
            gameId={gameId}
            locked={state.locked}
            onReset={handleReset}
            onPopulate={handlePopulate}
            onLock={handleLock}
            onUnlock={handleUnlock}
          />
        )}

        {!hasJoined && (
          <div className="flex flex-col items-center gap-1.5">
            <NameEntry
              currentName={playerName}
              onSubmit={handleJoin}
            />
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              Enter your name and click Join to select squares.
            </p>
          </div>
        )}

        {hasJoined && (
          <p className="text-base sm:text-lg text-gray-400 text-center leading-tight">
            Playing as{" "}
            <strong
              style={
                state.userColors?.[playerName]
                  ? { color: state.userColors[playerName] }
                  : undefined
              }
              className={!state.userColors?.[playerName] ? "text-white" : ""}
            >
              {playerName}
            </strong>
            . Tap an empty square to claim it.
          </p>
        )}

        {error && (
          <p className="text-red-400 text-xs sm:text-sm text-center" role="alert">
            {error}
          </p>
        )}

        {allFilled && (
          <p className="text-nfl-seahawks-accent font-medium text-sm text-center" role="status">
            Board full! All squares are taken.
          </p>
        )}
      </div>

      {/* Board fills remaining viewport */}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <GameBoard
          state={state}
          onSelectSquare={handleClaimSquare}
          canClaim={hasJoined}
        />
      </div>
    </main>
  );
};

export default GamePage;
