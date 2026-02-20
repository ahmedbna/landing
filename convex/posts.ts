// convex/posts.ts

import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

export const getPost = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const author = await ctx.db.get(post.userId);
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', post._id))
      .collect();

    const reactions = await ctx.db
      .query('reactions')
      .withIndex('by_post', (q) => q.eq('postId', post._id))
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
  },
});

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

export const togglePostReaction = mutation({
  args: {
    postId: v.id('posts'),
    emoji: v.string(),
  },
  handler: async (ctx, { postId, emoji }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_post_user_emoji', (q) =>
        q.eq('postId', postId).eq('userId', userId).eq('emoji', emoji),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: 'removed' };
    }

    await ctx.db.insert('reactions', { postId, userId, emoji });

    // 🔔 Notify post author (skip self-reactions)
    if (post.userId !== userId) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          recipientId: post.userId,
          actorId: userId,
          type: 'post_reaction',
          postId,
          emoji,
        },
      );
    }

    return { action: 'added' };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// createComment — fires post_comment notification
// ─────────────────────────────────────────────────────────────────────────────
export const createComment = mutation({
  args: {
    postId: v.id('posts'),
    content: v.string(),
  },
  handler: async (ctx, { postId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');

    const commentId = await ctx.db.insert('comments', {
      postId,
      userId,
      content,
    });

    // 🔔 Notify post author
    if (post.userId !== userId) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          recipientId: post.userId,
          actorId: userId,
          type: 'post_comment',
          postId,
          commentId,
        },
      );
    }

    return commentId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// toggleCommentReaction — fires comment_reaction notification
// ─────────────────────────────────────────────────────────────────────────────
export const toggleCommentReaction = mutation({
  args: {
    commentId: v.id('comments'),
    emoji: v.string(),
  },
  handler: async (ctx, { commentId, emoji }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error('Comment not found');

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_comment_user_emoji', (q) =>
        q.eq('commentId', commentId).eq('userId', userId).eq('emoji', emoji),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: 'removed' };
    }

    await ctx.db.insert('reactions', { commentId, userId, emoji });

    // 🔔 Notify comment author
    if (comment.userId !== userId) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          recipientId: comment.userId,
          actorId: userId,
          type: 'comment_reaction',
          postId: comment.postId,
          commentId,
          emoji,
        },
      );
    }

    return { action: 'added' };
  },
});

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
