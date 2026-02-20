// convex/sendPushNotification.ts
// NOTE: 'use node' has been intentionally removed.
// ctx.scheduler.runAfter() cannot schedule Node.js actions — only Convex-runtime
// actions are schedulable. fetch() works fine in the Convex runtime too.

import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import type { ActionCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

type ExpoPushMessage = {
  to: string;
  sound?: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
};

type SendResult = { success: boolean; ticketId?: string; error?: string };

/* ================================================== */
/* CORE SEND HELPER                                   */
/* ================================================== */
async function sendToExpo(
  ctx: ActionCtx,
  args: {
    recipientUserId: Id<'users'>;
    title: string;
    body: string;
    data?: Record<string, any>;
    type: 'post_reaction' | 'post_comment' | 'comment_reaction' | 'room_invite';
  },
): Promise<SendResult> {
  // Get recipient user
  const recipient = await ctx.runQuery(internal.queries.getUserById, {
    userId: args.recipientUserId,
  });

  if (!recipient) {
    console.error('Recipient user not found:', args.recipientUserId);
    return { success: false, error: 'User not found' };
  }

  // Check if user has notifications enabled and a push token
  if (!recipient.pushNotificationsEnabled || !recipient.pushToken) {
    console.log(
      'User has notifications disabled or no push token:',
      args.recipientUserId,
    );
    return { success: false, error: 'Notifications disabled' };
  }

  // Create notification record in DB first
  const notificationId = await ctx.runMutation(
    internal.pushNotifications.createNotification,
    {
      userId: args.recipientUserId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data ?? {},
    },
  );

  // Prepare Expo push message
  const message: ExpoPushMessage = {
    to: recipient.pushToken,
    sound: 'default',
    title: args.title,
    body: args.body,
    data: {
      ...args.data,
      notificationId,
      type: args.type,
    },
    badge: 1,
    priority: 'high',
    channelId: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Expo push result:', result);

    // Expo returns { data: [ticket, ...] }
    const ticket: ExpoPushTicket | undefined =
      result?.data?.[0] ?? result?.data;

    if (ticket?.status === 'ok') {
      await ctx.runMutation(internal.pushNotifications.markNotificationSent, {
        notificationId,
      });
      return { success: true, ticketId: ticket.id };
    }

    console.error('Expo push ticket error:', ticket);
    return { success: false, error: ticket?.message ?? 'Unknown push error' };
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/* ================================================== */
/* PUBLIC ACTION — generic send (callable from client)*/
/* ================================================== */
export const sendPushNotification = action({
  args: {
    recipientUserId: v.id('users'),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    type: v.union(
      v.literal('post_reaction'),
      v.literal('post_comment'),
      v.literal('comment_reaction'),
      v.literal('room_invite'),
    ),
  },
  handler: async (ctx, args): Promise<SendResult> => {
    return sendToExpo(ctx, {
      ...args,
      data: args.data as Record<string, any> | undefined,
    });
  },
});

/* ================================================== */
/* POST REACTION NOTIFICATION (scheduled internally)  */
/* ================================================== */
export const sendPostReactionNotification = internalAction({
  args: {
    postId: v.id('posts'),
    reactorUserId: v.id('users'),
    emoji: v.string(),
  },
  handler: async (ctx, args): Promise<SendResult> => {
    const post = await ctx.runQuery(internal.queries.getPostById, {
      postId: args.postId,
    });

    // Don't notify if post not found or reactor is the author
    if (!post || post.userId === args.reactorUserId) {
      return { success: false, error: 'Invalid notification target' };
    }

    const reactor = await ctx.runQuery(internal.queries.getUserById, {
      userId: args.reactorUserId,
    });

    if (!reactor) {
      return { success: false, error: 'Reactor not found' };
    }

    return sendToExpo(ctx, {
      recipientUserId: post.userId,
      title: '🎉 New Reaction',
      body: `${reactor.name ?? 'Someone'} reacted ${args.emoji} to your post`,
      data: {
        postId: args.postId,
        reactorUserId: args.reactorUserId,
        emoji: args.emoji,
      },
      type: 'post_reaction',
    });
  },
});

/* ================================================== */
/* POST COMMENT NOTIFICATION (scheduled internally)   */
/* ================================================== */
export const sendPostCommentNotification = internalAction({
  args: {
    postId: v.id('posts'),
    commentId: v.id('comments'),
    commenterUserId: v.id('users'),
  },
  handler: async (ctx, args): Promise<SendResult> => {
    const post = await ctx.runQuery(internal.queries.getPostById, {
      postId: args.postId,
    });

    // Don't notify if post not found or commenter is the author
    if (!post || post.userId === args.commenterUserId) {
      return { success: false, error: 'Invalid notification target' };
    }

    const commenter = await ctx.runQuery(internal.queries.getUserById, {
      userId: args.commenterUserId,
    });

    if (!commenter) {
      return { success: false, error: 'Commenter not found' };
    }

    const comment = await ctx.runQuery(internal.queries.getCommentById, {
      commentId: args.commentId,
    });

    return sendToExpo(ctx, {
      recipientUserId: post.userId,
      title: '💬 New Comment',
      body: `${commenter.name ?? 'Someone'} commented on your post`,
      data: {
        postId: args.postId,
        commentId: args.commentId,
        commenterUserId: args.commenterUserId,
        preview: comment?.content?.substring(0, 50),
      },
      type: 'post_comment',
    });
  },
});

/* ================================================== */
/* COMMENT REACTION NOTIFICATION (scheduled internally)*/
/* ================================================== */
export const sendCommentReactionNotification = internalAction({
  args: {
    commentId: v.id('comments'),
    reactorUserId: v.id('users'),
    emoji: v.string(),
  },
  handler: async (ctx, args): Promise<SendResult> => {
    const comment = await ctx.runQuery(internal.queries.getCommentById, {
      commentId: args.commentId,
    });

    // Don't notify if comment not found or reactor is the author
    if (!comment || comment.userId === args.reactorUserId) {
      return { success: false, error: 'Invalid notification target' };
    }

    const reactor = await ctx.runQuery(internal.queries.getUserById, {
      userId: args.reactorUserId,
    });

    if (!reactor) {
      return { success: false, error: 'Reactor not found' };
    }

    return sendToExpo(ctx, {
      recipientUserId: comment.userId,
      title: '🎉 New Reaction',
      body: `${reactor.name ?? 'Someone'} reacted ${args.emoji} to your comment`,
      data: {
        commentId: args.commentId,
        reactorUserId: args.reactorUserId,
        emoji: args.emoji,
        postId: comment.postId,
      },
      type: 'comment_reaction',
    });
  },
});
