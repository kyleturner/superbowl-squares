import { NextRequest, NextResponse } from "next/server";
import { generateGameId, getOrCreateGame } from "@/lib/game-store";

const getAdminIdFromRequest = (request: NextRequest): string | null => {
  const cookie = request.cookies.get("superbowl_admin_id");
  return cookie?.value ?? null;
};

export const GET = async (request: NextRequest) => {
  const gameId = generateGameId();
  const adminId = getAdminIdFromRequest(request) ?? `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await getOrCreateGame(gameId, adminId);
  const response = NextResponse.json({ gameId });
  response.cookies.set("superbowl_admin_id", adminId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
};
