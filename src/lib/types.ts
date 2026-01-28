// Shared types for the application
// These types match the Mongoose models and are used across the frontend
// Note: id and _id are both optional because Mongoose returns _id but we transform to id

import type { IPlayer } from "~/server/models";
import type mongoose from "mongoose";

type ObjectIdLike = string | { toString(): string };

export type PopulatableField =
  | mongoose.Types.ObjectId
  | IPlayer
  | string
  | null
  | undefined;

export interface PlayerType {
  id?: string;
  _id?: ObjectIdLike;
  firstName: string;
  lastName: string;
  imgUrl: string;
  value: number; // 1-5 representing player cost
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
  _doc: {
  id?: string;
  _id?: ObjectIdLike;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  pgId: string;
  pg: PlayerType;
  sgId: string;
  sg: PlayerType;
  sfId: string;
  sf: PlayerType;
  pfId: string;
  pf: PlayerType;
  cId: string;
  c: PlayerType;
  ownerId: string;
  owner: UserType;
  totalVotes: number;
    avgRating: number;
    timesGambled: number;
  }
}

export interface VoteType {
  id?: string;
  _id?: ObjectIdLike;
  type: "upvote" | "downvote";
  userId: ObjectIdLike;
  lineupId: ObjectIdLike;
  createdAt: Date;
}

export interface RatingType {
  id?: string;
  _id?: ObjectIdLike;
  value: number; // 1-10
  userId: ObjectIdLike;
  lineupId: ObjectIdLike;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to get a string ID from either id or _id
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
