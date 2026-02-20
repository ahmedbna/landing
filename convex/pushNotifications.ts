// convex/pushNotifications.ts
import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* ================================================== */
/* SAVE PUSH TOKEN */
/* ================================================== */
export const savePushToken = mutation({
  args: {
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      pushToken: args.pushToken,
      pushNotificationsEnabled: true,
    });

    return { success: true };
  },
});

/* ================================================== */
/* UPDATE NOTIFICATION PREFERENCES */
/* ================================================== */
export const updateNotificationPreferences = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      pushNotificationsEnabled: args.enabled,
    });

    return { success: true };
  },
});

/* ================================================== */
/* GET NOTIFICATION PREFERENCES */
/* ================================================== */
export const getNotificationPreferences = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);

    return {
      enabled: user?.pushNotificationsEnabled ?? true,
      hasPushToken: !!user?.pushToken,
    };
  },
});

/* ================================================== */
/* REMOVE PUSH TOKEN */
/* ================================================== */
export const removePushToken = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      pushToken: undefined,
    });

    return { success: true };
  },
});

/* ================================================== */
/* CREATE NOTIFICATION RECORD */
/* ================================================== */
export const createNotification = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('post_reaction'),
      v.literal('post_comment'),
      v.literal('comment_reaction'),
      v.literal('room_invite'),
    ),
    title: v.string(),
    body: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('pushNotifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      sent: false,
      read: false,
    });

    return notificationId;
  },
});

/* ================================================== */
/* MARK NOTIFICATION AS SENT */
/* ================================================== */
export const markNotificationSent = internalMutation({
  args: {
    notificationId: v.id('pushNotifications'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      sent: true,
      sentAt: Date.now(),
    });
  },
});

/* ================================================== */
/* GET USER NOTIFICATIONS */
/* ================================================== */
export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const notifications = await ctx.db
      .query('pushNotifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(args.limit ?? 50);

    return notifications;
  },
});

/* ================================================== */
/* MARK NOTIFICATION AS READ */
/* ================================================== */
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id('pushNotifications'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return { success: true };
  },
});

/* ================================================== */
/* MARK ALL NOTIFICATIONS AS READ */
/* ================================================== */
export const markAllNotificationsRead = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const unreadNotifications = await ctx.db
      .query('pushNotifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('read', false),
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

/* ================================================== */
/* GET UNREAD COUNT */
/* ================================================== */
export const getUnreadCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const unreadNotifications = await ctx.db
      .query('pushNotifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('read', false),
      )
      .collect();

    return unreadNotifications.length;
  },
});
