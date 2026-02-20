// convex/notifications.ts
import { v } from 'convex/values';
import {
  mutation,
  query,
  internalMutation,
  internalAction,
  internalQuery,
} from './_generated/server';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all notifications for the current user (unread first, then read) */
export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientId', userId))
      .order('desc')
      .take(50);

    return await Promise.all(
      notifications.map(async (n) => {
        const actor = await ctx.db.get(n.actorId);
        const post = n.postId ? await ctx.db.get(n.postId) : null;
        return {
          ...n,
          actorName: actor?.name ?? 'Someone',
          actorImage: actor?.image ?? null,
          postContent: post?.content ?? null,
        };
      }),
    );
  },
});

/** Unread count for the badge */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientId', userId))
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    return unread.length;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QUERIES — used by sendPushForNotification action
// Actions must use ctx.runQuery() with internalQuery functions.
// ─────────────────────────────────────────────────────────────────────────────

export const getNotificationById = internalQuery({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    return await ctx.db.get(notificationId);
  },
});

export const getUserForPush = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name ?? 'Someone',
      pushToken: user.pushToken ?? null,
      pushNotificationsEnabled: user.pushNotificationsEnabled ?? true,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Mark a single notification as read */
export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.recipientId !== userId) return;

    await ctx.db.patch(notificationId, { read: true });
  },
});

/** Mark ALL notifications as read */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientId', userId))
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { read: true })));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a notification record and schedule a push notification.
 * Called internally when someone reacts or comments on a post.
 */
export const createNotification = internalMutation({
  args: {
    recipientId: v.id('users'),
    actorId: v.id('users'),
    type: v.union(
      v.literal('post_reaction'),
      v.literal('post_comment'),
      v.literal('comment_reaction'),
    ),
    postId: v.optional(v.id('posts')),
    commentId: v.optional(v.id('comments')),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Don't notify yourself
    if (args.recipientId === args.actorId) return;

    // Avoid duplicate reaction notifications
    if (args.type === 'post_reaction' || args.type === 'comment_reaction') {
      const existing = await ctx.db
        .query('notifications')
        .withIndex('by_recipient', (q) => q.eq('recipientId', args.recipientId))
        .filter((q) =>
          q.and(
            q.eq(q.field('actorId'), args.actorId),
            q.eq(q.field('type'), args.type),
            q.eq(q.field('postId'), args.postId ?? null),
            q.eq(q.field('emoji'), args.emoji ?? null),
          ),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { read: false });
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendPushForNotification,
          { notificationId: existing._id },
        );
        return existing._id;
      }
    }

    const notificationId = await ctx.db.insert('notifications', {
      recipientId: args.recipientId,
      actorId: args.actorId,
      type: args.type,
      postId: args.postId,
      commentId: args.commentId,
      emoji: args.emoji,
      read: false,
    });

    // Schedule push delivery via an internalAction.
    // CRITICAL: must be an internalAction (not internalMutation) because
    // Convex mutations cannot make external HTTP requests (fetch).
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendPushForNotification,
      { notificationId },
    );

    return notificationId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL ACTION — sends the actual Expo push notification via HTTP.
//
// WHY internalAction and not internalMutation?
//   Convex mutations run in a pure, deterministic transaction and are NOT
//   allowed to make network calls. Only actions can call fetch().
//   The scheduler CAN schedule actions, so this works fine.
//
// WHY ctx.runQuery() instead of ctx.db?
//   Actions don't have direct DB access. They use ctx.runQuery() /
//   ctx.runMutation() which call internalQuery / internalMutation functions.
//
// WHY JSON.stringify([message]) (array)?
//   The Expo push API always expects the body to be a JSON array of
//   message objects, even when sending a single notification.
// ─────────────────────────────────────────────────────────────────────────────
export const sendPushForNotification = internalAction({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.runQuery(
      internal.notifications.getNotificationById,
      { notificationId },
    );
    if (!notification) {
      console.log('Notification not found:', notificationId);
      return;
    }

    const [recipient, actor] = await Promise.all([
      ctx.runQuery(internal.notifications.getUserForPush, {
        userId: notification.recipientId,
      }),
      ctx.runQuery(internal.notifications.getUserForPush, {
        userId: notification.actorId,
      }),
    ]);

    if (!recipient?.pushToken) {
      console.log('No push token for user:', notification.recipientId);
      return;
    }

    if (recipient.pushNotificationsEnabled === false) {
      console.log('Push disabled for user:', notification.recipientId);
      return;
    }

    const actorName = actor?.name ?? 'Someone';
    const emoji = notification.emoji ?? '';

    let title = '';
    let body = '';

    switch (notification.type) {
      case 'post_reaction':
        title = '✨ New reaction on your post';
        body = `${actorName} reacted ${emoji} to your post`;
        break;
      case 'post_comment':
        title = '💬 New comment on your post';
        body = `${actorName} commented on your post`;
        break;
      case 'comment_reaction':
        title = '✨ New reaction on your comment';
        body = `${actorName} reacted ${emoji} to your comment`;
        break;
      default:
        console.log('Unknown notification type:', notification.type);
        return;
    }

    // Expo push API requires the body to be an ARRAY of messages
    const messages = [
      {
        to: recipient.pushToken,
        title,
        body,
        sound: 'default' as const,
        badge: 1,
        priority: 'high' as const,
        channelId: 'default',
        data: {
          type: notification.type,
          postId: notification.postId ?? null,
          notificationId: notification._id,
        },
      },
    ];

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.error(
          'Expo push HTTP error:',
          response.status,
          await response.text(),
        );
        return;
      }

      const result = await response.json();
      console.log('Expo push API response:', JSON.stringify(result));

      // result.data is an array of tickets, one per message sent
      const ticket = result?.data?.[0];
      if (!ticket) {
        console.error('No ticket in Expo push response:', result);
        return;
      }

      if (ticket.status === 'error') {
        console.error(
          'Expo push ticket error:',
          ticket.message,
          JSON.stringify(ticket.details),
        );
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn(
            'Stale push token for user:',
            notification.recipientId,
            '— consider clearing it.',
          );
        }
      } else {
        console.log('✅ Push sent, ticket id:', ticket.id);
      }
    } catch (err) {
      console.error('Push send fetch error:', err);
    }
  },
});
