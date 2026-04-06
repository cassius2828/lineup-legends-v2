import type mongoose from "mongoose";
import type { GambleOutcomeTier } from "~/server/models";

type ObjectIdLike = string | { toString(): string };

export interface PlayerType {
  id?: string;
  _id?: ObjectIdLike;
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number;
}

export interface UserType {
  id?: string;
  _id?: ObjectIdLike;
  name: string;
  username: string;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  bio?: string | null;
  profileImg?: string | null;
  bannerImg?: string | null;
}

export interface LineupType {
  _id?: ObjectIdLike;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  players: {
    pg: PlayerType;
    sg: PlayerType;
    sf: PlayerType;
    pf: PlayerType;
    c: PlayerType;
  };
  owner: UserType;
  totalVotes: number;
  avgRating: number;
  timesGambled: number;
  ratingCount: number;
}

export interface GambleResultData {
  previousPlayer: PlayerType;
  newPlayer: PlayerType;
  outcomeTier: GambleOutcomeTier;
  valueChange: number;
}

export function getId(
  obj: { id?: string; _id?: ObjectIdLike } | null | undefined,
): string {
  if (!obj) return "";
  if (obj.id) return obj.id;
  if (obj._id) {
    return typeof obj._id === "string" ? obj._id : obj._id.toString();
  }
  return "";
}
