import { cookies } from "next/headers";
import { getValidLevel, type JLPTLevel } from "../data/jlpt";

export const PREFERRED_LEVEL_COOKIE = "jlpt-preferred-level";

export async function getPreferredLevel(requestedLevel?: string): Promise<JLPTLevel> {
  if (requestedLevel) {
    return getValidLevel(requestedLevel);
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(PREFERRED_LEVEL_COOKIE)?.value;

  return getValidLevel(cookieValue);
}
