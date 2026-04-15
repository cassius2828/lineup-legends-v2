import type {
  PlayerOutput,
  PlayersByValueOutput,
} from "~/server/api/schemas/output";

export function makeSkeletonPlayer(value: number, index: number): PlayerOutput {
  return {
    _id: `skeleton-${value}-${index}`,
    firstName: "--",
    lastName: "--",
    imgUrl: "",
    value,
  };
}

/** Placeholder grid while the player pool is loading or before Zustand rehydrates. */
export const SKELETON_PLAYERS_BY_VALUE: NonNullable<PlayersByValueOutput> = {
  value1Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(1, i)),
  value2Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(2, i)),
  value3Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(3, i)),
  value4Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(4, i)),
  value5Players: Array.from({ length: 5 }, (_, i) => makeSkeletonPlayer(5, i)),
};
