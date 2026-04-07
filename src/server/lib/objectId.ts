import mongoose from "mongoose";

export function objectIdFromDate(date: Date): mongoose.Types.ObjectId {
  const hexSeconds = Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
  return new mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
}
