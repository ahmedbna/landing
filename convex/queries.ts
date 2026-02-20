// convex/internal/queries.ts
import { v } from 'convex/values';
import { internalQuery } from './_generated/server';

/**
 * Internal query to get user by ID (for notifications)
 */
export const getUserById = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Internal query to get post by ID (for notifications)
 */
export const getPostById = internalQuery({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

/**
 * Internal query to get comment by ID (for notifications)
 */
export const getCommentById = internalQuery({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.commentId);
  },
});
