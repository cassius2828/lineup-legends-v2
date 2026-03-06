import mongoose from "mongoose";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  UserModel,
  PlayerModel,
  LineupModel,
  RatingModel,
  CommentModel,
  FeedbackModel,
  RequestedPlayerModel,
  FollowModel,
} from "~/server/models";
import { redis } from "~/server/redis";

function objectIdFromDate(date: Date): mongoose.Types.ObjectId {
  const hexSeconds = Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
  return new mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
}

export const adminRouter = createTRPCRouter({
  getStats: adminProcedure.query(async () => {
    const cachedStats = await redis.get("admin:stats");
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sevenDayObjectId = objectIdFromDate(sevenDaysAgo);
    const thirtyDayObjectId = objectIdFromDate(thirtyDaysAgo);

    const [
      totalUsers,
      newUsersWeek,
      newUsersMonth,
      totalLineups,
      totalPlayers,
      totalRatings,
      totalComments,
      totalFollows,
      pendingFeedback,
      totalFeedback,
      totalRequestedPlayers,
      recentUsers,
      recentFeedback,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ _id: { $gte: sevenDayObjectId } }),
      UserModel.countDocuments({ _id: { $gte: thirtyDayObjectId } }),
      LineupModel.countDocuments(),
      PlayerModel.countDocuments(),
      RatingModel.countDocuments(),
      CommentModel.countDocuments(),
      FollowModel.countDocuments(),
      FeedbackModel.countDocuments({ status: "new" }),
      FeedbackModel.countDocuments(),
      RequestedPlayerModel.countDocuments(),
      UserModel.find()
        .sort({ _id: -1 })
        .limit(5)
        .select("name email image username")
        .lean(),
      FeedbackModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      totalUsers,
      newUsersWeek,
      newUsersMonth,
      totalLineups,
      totalPlayers,
      totalRatings,
      totalComments,
      totalFollows,
      pendingFeedback,
      totalFeedback,
      totalRequestedPlayers,
      recentUsers: recentUsers.map((u) => ({
        id: u._id.toHexString(),
        name: u.name,
        email: u.email,
        image: u.image ?? null,
        username: u.username ?? null,
        createdAt: u._id.getTimestamp(),
      })),
      recentFeedback: recentFeedback.map((f) => ({
        id: f._id.toHexString(),
        name: f.name,
        email: f.email,
        subject: f.subject,
        message: f.message,
        status: f.status,
        createdAt: f.createdAt,
      })),
    };
  }),
});
