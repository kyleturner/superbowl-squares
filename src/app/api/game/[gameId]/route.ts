import { NextRequest, NextResponse } from "next/server";
import type { GameAction, GameStatePublic } from "@/types/game";
import {
  getGame,
  getOrCreateGame,
  ensureGameLoaded,
  reloadAndMergeGame,
  persistGame,
  resetGame,
  populateNumbers,
  claimSquare,
  unclaimSquare,
  setLocked,
  assignUserColor,
  incrementRevision,
} from "@/lib/game-store";

const getAdminIdFromRequest = (request: NextRequest): string | null => {
  const cookie = request.cookies.get("superbowl_admin_id");
  return cookie?.value ?? null;
};

const sanitizeState = (
  state: { gameId: string; revisionId?: number; locked?: boolean; rowNumbers: number[] | null; colNumbers: number[] | null; squares: Record<string, string>; users: Record<string, { name: string; lastSeen?: number }>; userColors?: Record<string, string>; adminId: string },
  adminId: string | null
): GameStatePublic => {
  return {
    gameId: state.gameId,
    revisionId: state.revisionId ?? 1,
    locked: state.locked ?? false,
    rowNumbers: state.rowNumbers,
    colNumbers: state.colNumbers,
    squares: state.squares,
    users: state.users,
    userColors: state.userColors ?? {},
    isAdmin: adminId !== null && state.adminId === adminId,
  };
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) => {
  const { gameId } = await params;
  const adminId = getAdminIdFromRequest(request);
  await reloadAndMergeGame(gameId);
  const state = getGame(gameId);
  if (!state) {
    return NextResponse.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }
  // Persist merged state if merge happened
  await persistGame(gameId);
  return NextResponse.json(sanitizeState(state, adminId));
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) => {
  const { gameId } = await params;
  const adminId = getAdminIdFromRequest(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const action = body as GameAction;

  if (action.action === "join") {
    const name = action.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    await reloadAndMergeGame(gameId);
    const existing = getGame(gameId);
    const isFirstJoin = !existing;
    const effectiveAdminId =
      adminId ?? (isFirstJoin ? `admin-${Date.now()}-${Math.random().toString(36).slice(2)}` : `anon-${Date.now()}`);
    const state = await getOrCreateGame(gameId, effectiveAdminId);
    state.users[name] = { name, lastSeen: Date.now() };
    assignUserColor(gameId, name);
    incrementRevision(gameId);
    await persistGame(gameId);
    const response = NextResponse.json(
      sanitizeState(state, effectiveAdminId)
    );
    if (isFirstJoin) {
      response.cookies.set("superbowl_admin_id", effectiveAdminId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }
    return response;
  }

  await reloadAndMergeGame(gameId);
  const state = getGame(gameId);
  if (!state) {
    return NextResponse.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  if (action.action === "claim") {
    if (state.locked) {
      return NextResponse.json(
        { error: "Board is locked" },
        { status: 403 }
      );
    }
    const name = action.name?.trim();
    const square = action.square;
    const revisionId = action.revisionId;
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(square) ||
      square.length !== 2 ||
      typeof square[0] !== "number" ||
      typeof square[1] !== "number"
    ) {
      return NextResponse.json(
        { error: "Valid square [row, col] is required" },
        { status: 400 }
      );
    }
    // Check square availability before calling claimSquare - if square is empty, allow claim even if revisionId differs
    const key = `${square[0]},${square[1]}`;
    if (state.squares[key]) {
      // Square is taken - return current state so client can refresh
      return NextResponse.json(
        {
          error: "Square already taken",
          state: sanitizeState(state, adminId),
        },
        { status: 409 }
      );
    }
    const result = claimSquare(gameId, name, square[0], square[1], revisionId);
    if (!result.success) {
      if (result.error === "STALE_REVISION") {
        return NextResponse.json(
          {
            error: "Board was updated. Please refresh and try again.",
            state: sanitizeState(getGame(gameId)!, adminId),
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Square already taken" ? 409 : result.error === "Board is locked" ? 403 : 400 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(state, adminId));
  }

  if (action.action === "unclaim") {
    if (state.locked) {
      return NextResponse.json(
        { error: "Board is locked" },
        { status: 403 }
      );
    }
    const name = action.name?.trim();
    const square = action.square;
    const revisionId = action.revisionId;
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(square) ||
      square.length !== 2 ||
      typeof square[0] !== "number" ||
      typeof square[1] !== "number"
    ) {
      return NextResponse.json(
        { error: "Valid square [row, col] is required" },
        { status: 400 }
      );
    }
    // Check square ownership before calling unclaimSquare - if they own it, allow unclaim even if revisionId differs
    const key = `${square[0]},${square[1]}`;
    const currentOwner = state.squares[key];
    if (!currentOwner || currentOwner.trim() !== name.trim()) {
      // They don't own this square - return current state so client can refresh
      return NextResponse.json(
        {
          error: currentOwner ? "You can only remove your own square" : "Square is not claimed",
          state: sanitizeState(state, adminId),
        },
        { status: 400 }
      );
    }
    const result = unclaimSquare(gameId, name, square[0], square[1], revisionId);
    if (!result.success) {
      if (result.error === "STALE_REVISION") {
        return NextResponse.json(
          {
            error: "Board was updated. Please refresh and try again.",
            state: sanitizeState(getGame(gameId)!, adminId),
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Board is locked" ? 403 : 400 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(state, adminId));
  }

  const isAdmin = adminId !== null && state.adminId === adminId;

  if (action.action === "reset") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }
    if (state.locked) {
      return NextResponse.json(
        { error: "Board is locked. Unlock to reset." },
        { status: 403 }
      );
    }
    const updated = resetGame(gameId);
    if (!updated) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(updated, adminId));
  }

  if (action.action === "populate") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }
    if (state.locked) {
      return NextResponse.json(
        { error: "Board is locked. Unlock to populate numbers." },
        { status: 403 }
      );
    }
    const updated = populateNumbers(gameId);
    if (!updated) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(updated, adminId));
  }

  if (action.action === "lock") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }
    const lockResult = setLocked(gameId, true);
    if (!lockResult.success) {
      return NextResponse.json(
        { error: lockResult.error },
        { status: 404 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(getGame(gameId)!, adminId));
  }

  if (action.action === "unlock") {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }
    const unlockResult = setLocked(gameId, false);
    if (!unlockResult.success) {
      return NextResponse.json(
        { error: unlockResult.error },
        { status: 404 }
      );
    }
    await persistGame(gameId);
    return NextResponse.json(sanitizeState(getGame(gameId)!, adminId));
  }

  return NextResponse.json(
    { error: "Unknown action" },
    { status: 400 }
  );
};
