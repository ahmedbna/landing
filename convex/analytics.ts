// convex/analytics.ts
import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* ================================================== */
/* TRACK EVENT */
/* ================================================== */
export const trackEvent = mutation({
  args: {
    sessionId: v.string(),
    anonymousId: v.optional(v.string()),
    eventType: v.union(
      v.literal('page_view'),
      v.literal('session_start'),
      v.literal('session_end'),
      v.literal('app_foreground'),
      v.literal('app_background'),
      v.literal('user_action'),
      v.literal('error'),
      v.literal('performance'),
    ),
    eventName: v.string(),
    route: v.optional(v.string()),
    previousRoute: v.optional(v.string()),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
    osVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    deviceModel: v.optional(v.string()),
    deviceType: v.optional(v.union(v.literal('phone'), v.literal('tablet'))),
    locale: v.optional(v.string()),
    timezone: v.optional(v.string()),
    sessionDurationMs: v.optional(v.number()),
    screenDurationMs: v.optional(v.number()),
    metadata: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    errorStack: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    await ctx.db.insert('analyticsEvents', {
      ...args,
      userId: userId ?? undefined,
    });

    // Update session
    const session = await ctx.db
      .query('analyticsSessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastSeenAt: args.timestamp,
        screenCount:
          session.screenCount + (args.eventType === 'page_view' ? 1 : 0),
        userId: userId ?? session.userId,
        isActive: args.eventType !== 'session_end',
        ...(args.eventType === 'session_end' && args.sessionDurationMs
          ? {
              endedAt: args.timestamp,
              durationMs: args.sessionDurationMs,
              isActive: false,
            }
          : {}),
      });
    } else if (args.eventType === 'session_start') {
      await ctx.db.insert('analyticsSessions', {
        sessionId: args.sessionId,
        userId: userId ?? undefined,
        anonymousId: args.anonymousId,
        platform: args.platform,
        osVersion: args.osVersion,
        appVersion: args.appVersion,
        deviceModel: args.deviceModel,
        deviceType: args.deviceType,
        locale: args.locale,
        timezone: args.timezone,
        startedAt: args.timestamp,
        screenCount: 0,
        isActive: true,
        lastSeenAt: args.timestamp,
      });
    }
  },
});

/* ================================================== */
/* BATCH TRACK (for offline queue flush) */
/* ================================================== */
export const trackEventBatch = mutation({
  args: {
    events: v.array(
      v.object({
        sessionId: v.string(),
        anonymousId: v.optional(v.string()),
        eventType: v.union(
          v.literal('page_view'),
          v.literal('session_start'),
          v.literal('session_end'),
          v.literal('app_foreground'),
          v.literal('app_background'),
          v.literal('user_action'),
          v.literal('error'),
          v.literal('performance'),
        ),
        eventName: v.string(),
        route: v.optional(v.string()),
        previousRoute: v.optional(v.string()),
        platform: v.union(
          v.literal('ios'),
          v.literal('android'),
          v.literal('web'),
        ),
        osVersion: v.optional(v.string()),
        appVersion: v.optional(v.string()),
        deviceModel: v.optional(v.string()),
        deviceType: v.optional(
          v.union(v.literal('phone'), v.literal('tablet')),
        ),
        locale: v.optional(v.string()),
        timezone: v.optional(v.string()),
        sessionDurationMs: v.optional(v.number()),
        screenDurationMs: v.optional(v.number()),
        metadata: v.optional(v.any()),
        errorMessage: v.optional(v.string()),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    for (const event of args.events) {
      await ctx.db.insert('analyticsEvents', {
        ...event,
        userId: userId ?? undefined,
      });
    }
  },
});

/* ================================================== */
/* ADMIN DASHBOARD QUERIES */
/* ================================================== */

// Overview stats for the last N days
export const getOverviewStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const [allEvents, allSessions] = await Promise.all([
      ctx.db
        .query('analyticsEvents')
        .withIndex('by_timestamp', (q) => q.gte('timestamp', since))
        .collect(),
      ctx.db
        .query('analyticsSessions')
        .withIndex('by_started_at', (q) => q.gte('startedAt', since))
        .collect(),
    ]);

    const uniqueUsers = new Set(
      allEvents.filter((e) => e.userId).map((e) => e.userId),
    );
    const uniqueSessions = new Set(allEvents.map((e) => e.sessionId));
    const pageViews = allEvents.filter((e) => e.eventType === 'page_view');
    const activeSessions = allSessions.filter((s) => s.isActive);
    const completedSessions = allSessions.filter((s) => s.durationMs);
    const avgSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.durationMs ?? 0), 0) /
          completedSessions.length
        : 0;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    for (const s of allSessions) {
      platformCounts[s.platform] = (platformCounts[s.platform] ?? 0) + 1;
    }

    // OS breakdown
    const osCounts: Record<string, number> = {};
    for (const s of allSessions) {
      const os = s.osVersion ?? 'Unknown';
      osCounts[os] = (osCounts[os] ?? 0) + 1;
    }

    // Top routes
    const routeCounts: Record<string, number> = {};
    for (const e of pageViews) {
      const route = e.route ?? 'Unknown';
      routeCounts[route] = (routeCounts[route] ?? 0) + 1;
    }

    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));

    // Errors
    const errors = allEvents.filter((e) => e.eventType === 'error');

    // Daily active users (last 30 days)
    const dailyStats: Record<
      string,
      { users: Set<string>; sessions: number; pageViews: number }
    > = {};
    for (const e of allEvents) {
      const day = new Date(e.timestamp).toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { users: new Set(), sessions: 0, pageViews: 0 };
      }
      if (e.userId) dailyStats[day].users.add(e.userId);
      if (e.eventType === 'session_start') dailyStats[day].sessions++;
      if (e.eventType === 'page_view') dailyStats[day].pageViews++;
    }

    const dailyData = Object.entries(dailyStats)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({
        date,
        activeUsers: stats.users.size,
        sessions: stats.sessions,
        pageViews: stats.pageViews,
      }));

    return {
      totalUsers: uniqueUsers.size,
      totalSessions: uniqueSessions.size,
      totalPageViews: pageViews.length,
      totalErrors: errors.length,
      activeSessionsNow: activeSessions.length,
      avgSessionDurationMs: avgSessionDuration,
      platformBreakdown: Object.entries(platformCounts).map(
        ([platform, count]) => ({
          platform,
          count,
        }),
      ),
      osBreakdown: Object.entries(osCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([os, count]) => ({ os, count })),
      topRoutes,
      dailyData,
      errorRate:
        allEvents.length > 0
          ? ((errors.length / allEvents.length) * 100).toFixed(2)
          : '0',
    };
  },
});

export const getRecentSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    const sessions = await ctx.db
      .query('analyticsSessions')
      .withIndex('by_started_at')
      .order('desc')
      .take(args.limit ?? 50);

    return await Promise.all(
      sessions.map(async (s) => {
        const user = s.userId ? await ctx.db.get(s.userId) : null;
        return {
          ...s,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null,
        };
      }),
    );
  },
});

export const getRouteAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const pageViews = await ctx.db
      .query('analyticsEvents')
      .withIndex('by_event_type', (q) => q.eq('eventType', 'page_view'))
      .filter((q) => q.gte(q.field('timestamp'), since))
      .collect();

    const routeStats: Record<
      string,
      {
        count: number;
        uniqueUsers: Set<string>;
        totalDuration: number;
        durationCount: number;
      }
    > = {};

    for (const view of pageViews) {
      const route = view.route ?? 'Unknown';
      if (!routeStats[route]) {
        routeStats[route] = {
          count: 0,
          uniqueUsers: new Set(),
          totalDuration: 0,
          durationCount: 0,
        };
      }
      routeStats[route].count++;
      if (view.userId) routeStats[route].uniqueUsers.add(view.userId);
      if (view.screenDurationMs) {
        routeStats[route].totalDuration += view.screenDurationMs;
        routeStats[route].durationCount++;
      }
    }

    return Object.entries(routeStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([route, stats]) => ({
        route,
        pageViews: stats.count,
        uniqueUsers: stats.uniqueUsers.size,
        avgDurationMs:
          stats.durationCount > 0
            ? Math.round(stats.totalDuration / stats.durationCount)
            : 0,
      }));
  },
});

export const getErrorLogs = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    const days = args.days ?? 7;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const errors = await ctx.db
      .query('analyticsEvents')
      .withIndex('by_event_type', (q) => q.eq('eventType', 'error'))
      .filter((q) => q.gte(q.field('timestamp'), since))
      .order('desc')
      .take(args.limit ?? 100);

    return errors.map((e) => ({
      id: e._id,
      sessionId: e.sessionId,
      userId: e.userId,
      route: e.route,
      errorMessage: e.errorMessage,
      errorStack: e.errorStack,
      platform: e.platform,
      appVersion: e.appVersion,
      timestamp: e.timestamp,
    }));
  },
});

export const getUserJourneys = query({
  args: {
    userId: v.optional(v.id('users')),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const user = await ctx.db.get(authId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    let events;
    if (args.sessionId) {
      events = await ctx.db
        .query('analyticsEvents')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId!))
        .order('asc')
        .collect();
    } else if (args.userId) {
      events = await ctx.db
        .query('analyticsEvents')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .order('desc')
        .take(200);
    } else {
      return [];
    }

    return events.map((e) => ({
      eventType: e.eventType,
      eventName: e.eventName,
      route: e.route,
      timestamp: e.timestamp,
      platform: e.platform,
      metadata: e.metadata,
    }));
  },
});

export const getRetentionData = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (user?.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Not authorized');
    }

    const days = args.days ?? 14;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query('analyticsSessions')
      .withIndex('by_started_at', (q) => q.gte('startedAt', since))
      .collect();

    // Group by user, get their days active
    const userDays: Record<string, Set<string>> = {};
    for (const s of sessions) {
      if (!s.userId) continue;
      const day = new Date(s.startedAt).toISOString().split('T')[0];
      if (!userDays[s.userId]) userDays[s.userId] = new Set();
      userDays[s.userId].add(day);
    }

    // Simple cohort: users who came back
    const totalUsers = Object.keys(userDays).length;
    const returnedDay2 = Object.values(userDays).filter(
      (days) => days.size >= 2,
    ).length;
    const returnedDay7 = Object.values(userDays).filter(
      (days) => days.size >= 7,
    ).length;

    return {
      totalCohortUsers: totalUsers,
      day1Retention: totalUsers > 0 ? 100 : 0,
      day2Retention:
        totalUsers > 0 ? Math.round((returnedDay2 / totalUsers) * 100) : 0,
      day7Retention:
        totalUsers > 0 ? Math.round((returnedDay7 / totalUsers) * 100) : 0,
    };
  },
});

/* ================================================== */
/* CLEANUP OLD EVENTS (run via cron for 90-day TTL) */
/* ================================================== */
export const cleanupOldEvents = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query('analyticsEvents')
      .withIndex('by_timestamp', (q) => q.lt('timestamp', cutoff))
      .take(500);
    for (const e of old) await ctx.db.delete(e._id);
    return { deleted: old.length };
  },
});
