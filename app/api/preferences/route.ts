import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getValidLevel } from "../../../data/jlpt";
import { PREFERRED_LEVEL_COOKIE } from "../../../lib/level-preference";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    preferredLevel?: string;
  };

  const preferredLevel = getValidLevel(body.preferredLevel);
  const cookieStore = await cookies();

  cookieStore.set(PREFERRED_LEVEL_COOKIE, preferredLevel, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ preferredLevel });
}
