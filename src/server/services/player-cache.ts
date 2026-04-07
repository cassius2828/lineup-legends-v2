import { PlayerModel, type PlayerDoc } from "~/server/models";
import { redis } from "~/server/redis";

const PLAYERS_CACHE_KEY = "players";
const PLAYERS_CACHE_TTL = 86400; // 24 hours

export async function getPlayersFromCacheOrDb(): Promise<PlayerDoc[]> {
  const cached = await redis.get(PLAYERS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PlayerDoc[];
  }

  const players = await PlayerModel.find().sort({ value: -1 }).lean();
  await redis.set(PLAYERS_CACHE_KEY, JSON.stringify(players));
  await redis.expire(PLAYERS_CACHE_KEY, PLAYERS_CACHE_TTL);
  return players;
}

export async function invalidatePlayersCache() {
  await redis.del(PLAYERS_CACHE_KEY);
}
