// import { z } from "zod";

// import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// // Required fields: requesterId (ObjectId), recipientId (ObjectId), status (string: pending|accepted|requested), createdAt (Date)
// import { UserModel, LineupModel } from "~/server/models";
// import mongoose, { Schema } from "mongoose";

// // Inline Friend model definition until proper model file is created
// const FriendSchema = new Schema({
//   requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   status: {
//     type: String,
//     enum: ["pending", "accepted", "requested"],
//     required: true,
//   },
//   createdAt: { type: Date, default: Date.now },
// });
// FriendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
// const Friend = mongoose.models.Friend ?? mongoose.model("Friend", FriendSchema);

// // Population fields for lineup queries
// const lineupPopulateFields = [
//   { path: "pgId", model: "Player" },
//   { path: "sgId", model: "Player" },
//   { path: "sfId", model: "Player" },
//   { path: "pfId", model: "Player" },
//   { path: "cId", model: "Player" },
//   { path: "ownerId", model: "User" },
// ];

// // Helper to transform lineup for API response
// function transformLineup(lineup: any) {
//   if (!lineup) return null;
//   const obj = lineup.toObject ? lineup.toObject() : lineup;
//   return {
//     ...obj,
//     id: obj._id?.toString() ?? obj.id,
//     pg: obj.pgId,
//     sg: obj.sgId,
//     sf: obj.sfId,
//     pf: obj.pfId,
//     c: obj.cId,
//     owner: obj.ownerId,
//   };
// }

// // Helper to transform user for API response
// function transformUser(user: any) {
//   if (!user) return null;
//   const obj = user.toObject ? user.toObject() : user;
//   return {
//     ...obj,
//     id: obj._id?.toString() ?? obj.id,
//     password: undefined, // Never expose password
//   };
// }

// export const friendRouter = createTRPCRouter({
//   // ============================================
//   // SEARCH & BROWSE
//   // ============================================

//   // Search for users to add as friends (excludes current friends and self)
//   searchUsers: protectedProcedure
//     .input(z.object({ query: z.string().optional() }))
//     .query(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;

//       // Get current user's friends
//       const currentUser =
//         await UserModel.findById(currentUserId).select("friends");
//       const friendIds = currentUser?.friends ?? [];

//       // Build search query
//       const searchQuery: any = {
//         _id: {
//           $nin: [...friendIds, new mongoose.Types.ObjectId(currentUserId)],
//         },
//       };

//       // Add username search if query provided
//       if (input.query && input.query.trim()) {
//         searchQuery.username = { $regex: input.query, $options: "i" };
//       }

//       const users = await UserModel.find(searchQuery)
//         .select("username name profileImg")
//         .limit(20);

//       return users.map(transformUser);
//     }),

//   // Search within current friends
//   searchFriends: protectedProcedure
//     .input(z.object({ query: z.string().optional() }))
//     .query(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;

//       // Get current user with populated friends
//       const currentUser = await UserModel.findById(currentUserId).populate(
//         "friends",
//         "username name profileImg",
//       );

//       if (!currentUser) {
//         return [];
//       }

//       let friends = currentUserModel.friends as any[];

//       // Filter by query if provided
//       if (input.query && input.query.trim()) {
//         const query = input.query.toLowerCase();
//         friends = friends.filter((friend: any) =>
//           friend.username?.toLowerCase().includes(query),
//         );
//       }

//       return friends.map(transformUser);
//     }),

//   // Get all friends for current user
//   getMyFriends: protectedProcedure.query(async ({ ctx }) => {
//     const currentUser = await UserModel.findById(ctx.session.user.id).populate(
//       "friends",
//       "username name profileImg bio",
//     );

//     if (!currentUser) {
//       return [];
//     }

//     return (currentUserModel.friends as any[]).map(transformUser);
//   }),

//   // Get friends for a specific user (public profile)
//   getUserFriends: protectedProcedure
//     .input(z.object({ userId: z.string() }))
//     .query(async ({ input }) => {
//       const user = await UserModel.findById(input.userId).populate(
//         "friends",
//         "username name profileImg",
//       );

//       if (!user) {
//         return [];
//       }

//       return (user.friends as any[]).map(transformUser);
//     }),

//   // ============================================
//   // FRIEND REQUESTS
//   // ============================================

//   // Send a friend request
//   sendRequest: protectedProcedure
//     .input(z.object({ targetUserId: z.string() }))
//     .mutation(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;
//       const { targetUserId } = input;

//       if (currentUserId === targetUserId) {
//         throw new Error("You cannot send a friend request to yourself.");
//       }

//       // Check if target user exists
//       const targetUser = await UserModel.findById(targetUserId);
//       if (!targetUser) {
//         throw new Error("User not found.");
//       }

//       // Check if already friends
//       const currentUser = await UserModel.findById(currentUserId);
//       if (currentUser?.friends.some((f) => f.toString() === targetUserId)) {
//         throw new Error("You are already friends with this user.");
//       }

//       // Check for existing friend request in either direction
//       const existingRequest = await Friend.findOne({
//         $or: [
//           { requesterId: currentUserId, recipientId: targetUserId },
//           { requesterId: targetUserId, recipientId: currentUserId },
//         ],
//       });

//       if (existingRequest) {
//         if (existingRequest.status === "accepted") {
//           throw new Error("You are already friends with this user.");
//         }
//         throw new Error(
//           "A friend request already exists between you and this user.",
//         );
//       }

//       // Create friend request - sender's perspective (pending)
//       await Friend.create({
//         requesterId: currentUserId,
//         recipientId: targetUserId,
//         status: "pending",
//       });

//       // Create reciprocal entry - recipient's perspective (requested)
//       await Friend.create({
//         requesterId: targetUserId,
//         recipientId: currentUserId,
//         status: "requested",
//       });

//       return { success: true, message: "Friend request sent!" };
//     }),

//   // Get pending friend requests (received)
//   getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
//     const currentUserId = ctx.session.user.id;

//     const requests = await Friend.find({
//       recipientId: currentUserId,
//       status: "pending",
//     }).populate("requesterId", "username name profileImg");

//     return requests.map((req) => ({
//       id: req._id.toString(),
//       requester: transformUser(req.requesterId),
//       status: req.status,
//       createdAt: req.createdAt,
//     }));
//   }),

//   // Get sent friend requests
//   getSentRequests: protectedProcedure.query(async ({ ctx }) => {
//     const currentUserId = ctx.session.user.id;

//     const requests = await Friend.find({
//       requesterId: currentUserId,
//       status: "pending",
//     }).populate("recipientId", "username name profileImg");

//     return requests.map((req) => ({
//       id: req._id.toString(),
//       recipient: transformUser(req.recipientId),
//       status: req.status,
//       createdAt: req.createdAt,
//     }));
//   }),

//   // Accept a friend request
//   acceptRequest: protectedProcedure
//     .input(z.object({ requesterId: z.string() }))
//     .mutation(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;
//       const { requesterId } = input;

//       // Find the pending request
//       const request = await Friend.findOne({
//         requesterId: requesterId,
//         recipientId: currentUserId,
//         status: "pending",
//       });

//       if (!request) {
//         throw new Error("Friend request not found.");
//       }

//       // Update both friend request documents to accepted
//       await Friend.updateMany(
//         {
//           $or: [
//             { requesterId: requesterId, recipientId: currentUserId },
//             { requesterId: currentUserId, recipientId: requesterId },
//           ],
//         },
//         { status: "accepted" },
//       );

//       // Add each user to the other's friends array
//       await UserModel.findByIdAndUpdate(currentUserId, {
//         $addToSet: { friends: requesterId },
//       });

//       await UserModel.findByIdAndUpdate(requesterId, {
//         $addToSet: { friends: currentUserId },
//       });

//       return { success: true, message: "Friend request accepted!" };
//     }),

//   // Reject a friend request
//   rejectRequest: protectedProcedure
//     .input(z.object({ requesterId: z.string() }))
//     .mutation(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;
//       const { requesterId } = input;

//       // Delete both friend request documents
//       await Friend.deleteMany({
//         $or: [
//           { requesterId: requesterId, recipientId: currentUserId },
//           { requesterId: currentUserId, recipientId: requesterId },
//         ],
//       });

//       return { success: true, message: "Friend request rejected." };
//     }),

//   // Remove a friend
//   removeFriend: protectedProcedure
//     .input(z.object({ friendId: z.string() }))
//     .mutation(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;
//       const { friendId } = input;

//       // Remove from both users' friends arrays
//       await UserModel.findByIdAndUpdate(currentUserId, {
//         $pull: { friends: friendId },
//       });

//       await UserModel.findByIdAndUpdate(friendId, {
//         $pull: { friends: currentUserId },
//       });

//       // Delete friend relationship documents
//       await Friend.deleteMany({
//         $or: [
//           { requesterId: currentUserId, recipientId: friendId },
//           { requesterId: friendId, recipientId: currentUserId },
//         ],
//       });

//       return { success: true, message: "Friend removed." };
//     }),

//   // ============================================
//   // FRIEND LINEUPS
//   // ============================================

//   // Get lineups from a specific friend
//   getFriendLineups: protectedProcedure
//     .input(z.object({ friendId: z.string() }))
//     .query(async ({ ctx, input }) => {
//       const currentUserId = ctx.session.user.id;
//       const { friendId } = input;

//       // Verify they are friends
//       const currentUser = await UserModel.findById(currentUserId);
//       if (!currentUser?.friends.some((f) => f.toString() === friendId)) {
//         throw new Error("You are not friends with this user.");
//       }

//       const lineups = await LineupModel.find({ ownerId: friendId })
//         .sort({ createdAt: -1 })
//         .populate(lineupPopulateFields);

//       return lineups.map(transformLineup);
//     }),

//   // Get all friends' lineups (combined feed)
//   getAllFriendsLineups: protectedProcedure.query(async ({ ctx }) => {
//     const currentUserId = ctx.session.user.id;

//     // Get current user's friends
//     const currentUser =
//       await UserModel.findById(currentUserId).select("friends");
//     const friendIds = currentUser?.friends ?? [];

//     if (friendIds.length === 0) {
//       return [];
//     }

//     const lineups = await LineupModel.find({ ownerId: { $in: friendIds } })
//       .sort({ createdAt: -1 })
//       .populate(lineupPopulateFields);

//     return lineups.map(transformLineup);
//   }),
// });
