// convex/forum.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* ================================================== */
/* POSTS */
/* ================================================== */

export const getPosts = query({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const posts = await ctx.db
      .query('posts')
      .withIndex('by_lesson', (q) => q.eq('lessonId', args.lessonId))
      .order('desc')
      .collect();

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.userId);
        const comments = await ctx.db
          .query('comments')
          .withIndex('by_post', (q) => q.eq('postId', post._id))
          .collect();

        const reactions = await ctx.db
          .query('reactions')
          .withIndex('by_post', (q) => q.eq('postId', post._id))
          .collect();

        // Group reactions by emoji using a plain JS Map to avoid Convex
        // rejecting emoji characters as object field names
        const reactionMap = new Map<
          string,
          { count: number; hasReacted: boolean }
        >();
        for (const r of reactions) {
          const existing = reactionMap.get(r.emoji) ?? {
            count: 0,
            hasReacted: false,
          };
          reactionMap.set(r.emoji, {
            count: existing.count + 1,
            hasReacted: existing.hasReacted || r.userId === userId,
          });
        }

        // Return reactions as an array so emojis are values, not field names
        const reactionList = Array.from(reactionMap.entries()).map(
          ([emoji, data]) => ({
            emoji,
            count: data.count,
            hasReacted: data.hasReacted,
          }),
        );

        return {
          ...post,
          author: {
            _id: author?._id,
            name: author?.name || 'Anonymous',
            image: author?.image || null,
          },
          commentCount: comments.length,
          reactions: reactionList,
          isOwner: post.userId === userId,
        };
      }),
    );

    return postsWithDetails;
  },
});

export const createPost = mutation({
  args: {
    lessonId: v.id('lessons'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    if (!args.content.trim()) throw new Error('Post cannot be empty');

    const postId = await ctx.db.insert('posts', {
      userId,
      lessonId: args.lessonId,
      content: args.content.trim(),
    });

    return postId;
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');
    if (post.userId !== userId) throw new Error('Not authorized');

    // Delete all reactions and comments for this post
    const reactions = await ctx.db
      .query('reactions')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();
    for (const r of reactions) await ctx.db.delete(r._id);

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();
    for (const c of comments) {
      const commentReactions = await ctx.db
        .query('reactions')
        .withIndex('by_comment', (q) => q.eq('commentId', c._id))
        .collect();
      for (const r of commentReactions) await ctx.db.delete(r._id);
      await ctx.db.delete(c._id);
    }

    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

/* ================================================== */
/* REACTIONS */
/* ================================================== */

export const togglePostReaction = mutation({
  args: {
    postId: v.id('posts'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Find ALL reactions this user has on this post (should be max 1,
    // but clean up any duplicates just in case)
    const existingReactions = await ctx.db
      .query('reactions')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();

    const existingSameEmoji = existingReactions.find(
      (r) => r.emoji === args.emoji,
    );

    // Always remove all prior reactions from this user on this post
    for (const r of existingReactions) {
      await ctx.db.delete(r._id);
    }

    // If user tapped a DIFFERENT emoji (or had none), add the new one.
    // If user tapped their CURRENT emoji, it's a toggle-off — don't re-add.
    if (!existingSameEmoji) {
      await ctx.db.insert('reactions', {
        userId,
        postId: args.postId,
        commentId: undefined,
        emoji: args.emoji,
      });
      return { added: true, emoji: args.emoji };
    }

    return { added: false, emoji: null };
  },
});

export const toggleCommentReaction = mutation({
  args: {
    commentId: v.id('comments'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Find ALL reactions this user has on this comment
    const existingReactions = await ctx.db
      .query('reactions')
      .withIndex('by_comment', (q) => q.eq('commentId', args.commentId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .collect();

    const existingSameEmoji = existingReactions.find(
      (r) => r.emoji === args.emoji,
    );

    // Always remove all prior reactions from this user on this comment
    for (const r of existingReactions) {
      await ctx.db.delete(r._id);
    }

    // If user tapped a DIFFERENT emoji (or had none), add the new one.
    // If user tapped their CURRENT emoji, it's a toggle-off — don't re-add.
    if (!existingSameEmoji) {
      await ctx.db.insert('reactions', {
        userId,
        commentId: args.commentId,
        postId: undefined,
        emoji: args.emoji,
      });
      return { added: true, emoji: args.emoji };
    }

    return { added: false, emoji: null };
  },
});

/* ================================================== */
/* COMMENTS */
/* ================================================== */

export const getComments = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .order('asc')
      .collect();

    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.userId);
        const reactions = await ctx.db
          .query('reactions')
          .withIndex('by_comment', (q) => q.eq('commentId', comment._id))
          .collect();

        const reactionMap = new Map<
          string,
          { count: number; hasReacted: boolean }
        >();
        for (const r of reactions) {
          const existing = reactionMap.get(r.emoji) ?? {
            count: 0,
            hasReacted: false,
          };
          reactionMap.set(r.emoji, {
            count: existing.count + 1,
            hasReacted: existing.hasReacted || r.userId === userId,
          });
        }

        const reactionList = Array.from(reactionMap.entries()).map(
          ([emoji, data]) => ({
            emoji,
            count: data.count,
            hasReacted: data.hasReacted,
          }),
        );

        return {
          ...comment,
          author: {
            _id: author?._id,
            name: author?.name || 'Anonymous',
            image: author?.image || null,
          },
          reactions: reactionList,
          isOwner: comment.userId === userId,
        };
      }),
    );

    return commentsWithDetails;
  },
});

export const createComment = mutation({
  args: {
    postId: v.id('posts'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    if (!args.content.trim()) throw new Error('Comment cannot be empty');
    if (args.content.length > 500)
      throw new Error('Comment too long (max 500 chars)');

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');

    const commentId = await ctx.db.insert('comments', {
      userId,
      postId: args.postId,
      content: args.content.trim(),
    });

    return commentId;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id('comments'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Not authorized');

    const reactions = await ctx.db
      .query('reactions')
      .withIndex('by_comment', (q) => q.eq('commentId', args.commentId))
      .collect();
    for (const r of reactions) await ctx.db.delete(r._id);

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});
