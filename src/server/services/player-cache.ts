import { PlayerModel, type PlayerDoc } from "~/server/models";
import { cacheDel, cacheGet, cacheSetex } from "~/server/redis";

const PLAYERS_CACHE_KEY = "players";
const PLAYERS_CACHE_TTL = 86400; // 24 hours

export async function getPlayersFromCacheOrDb(): Promise<PlayerDoc[]> {
  const cached = await cacheGet(PLAYERS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PlayerDoc[];
  }

  const players = await PlayerModel.find().sort({ value: -1 }).lean();
  await cacheSetex(
    PLAYERS_CACHE_KEY,
    PLAYERS_CACHE_TTL,
    JSON.stringify(players),
  );
  return players;
}

export async function invalidatePlayersCache() {
  await cacheDel(PLAYERS_CACHE_KEY);
}
