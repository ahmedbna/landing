// convex/meets.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const MAX_MEET_PARTICIPANTS = 5;

/* -------------------------------------------------- */
/* LIST ACTIVE MEETS FOR A LESSON */
/* -------------------------------------------------- */
export const listByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const meets = await ctx.db
      .query('meets')
      .withIndex('by_lesson_status', (q) =>
        q.eq('lessonId', args.lessonId).eq('status', 'active'),
      )
      .order('desc')
      .collect();

    const meetsWithParticipants = await Promise.all(
      meets.map(async (meet) => {
        const meetParticipants = await ctx.db
          .query('meetParticipants')
          .withIndex('by_room', (q) => q.eq('meetId', meet._id))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        const participants = await Promise.all(
          meetParticipants.map(async (p) => {
            const user = await ctx.db.get(p.userId);
            if (!user) return null;
            return {
              _id: p._id,
              userId: p.userId,
              meetId: p.meetId,
              isMuted: p.isMuted,
              isActive: p.isActive,
              joinedAt: p.joinedAt,
              name: user.name ?? 'Anonymous',
              image: user.image ?? null,
            };
          }),
        );

        const activeParticipants = participants.filter(
          (p): p is NonNullable<typeof p> => p !== null,
        );

        return {
          ...meet,
          participants: activeParticipants,
          participantCount: activeParticipants.length,
          isFull: activeParticipants.length >= MAX_MEET_PARTICIPANTS,
        };
      }),
    );

    return meetsWithParticipants;
  },
});

/* -------------------------------------------------- */
/* GET SINGLE MEET ROOM */
/* -------------------------------------------------- */
export const get = query({
  args: { meetId: v.id('meets') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const meet = await ctx.db.get(args.meetId);
    if (!meet) return null;

    const participants = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room', (q) => q.eq('meetId', args.meetId))
      .collect();

    const activeParticipants = participants.filter((p) => p.isActive);

    const participantsWithUsers = await Promise.all(
      activeParticipants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user: {
            _id: user?._id,
            name: user?.name || 'Anonymous',
            image: user?.image || null,
            lang: user?.nativeLanguage || 'en',
          },
        };
      }),
    );

    const host = await ctx.db.get(meet.hostId);
    const myParticipation = participants.find((p) => p.userId === userId);
    const lesson = await ctx.db.get(meet.lessonId);
    if (!lesson) return null;

    return {
      ...meet,
      host: {
        _id: host?._id,
        name: host?.name || 'Anonymous',
        image: host?.image || null,
      },
      lesson,
      participants: participantsWithUsers,
      participantCount: activeParticipants.length,
      isFull: activeParticipants.length >= MAX_MEET_PARTICIPANTS,
      maxParticipants: MAX_MEET_PARTICIPANTS,
      isMuted: myParticipation?.isMuted ?? false,
      isInRoom: myParticipation?.isActive ?? false,
    };
  },
});

/* -------------------------------------------------- */
/* CREATE MEET ROOM */
/* -------------------------------------------------- */
export const create = mutation({
  args: {
    lessonId: v.id('lessons'),
    title: v.string(),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const meetId = await ctx.db.insert('meets', {
      title: args.title,
      topic: args.topic,
      lessonId: args.lessonId,
      hostId: userId,
      status: 'active',
      startedAt: Date.now(),
    });

    // Creator joins automatically
    await ctx.db.insert('meetParticipants', {
      meetId,
      userId,
      isMuted: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return meetId;
  },
});

/* -------------------------------------------------- */
/* JOIN MEET ROOM */
/* -------------------------------------------------- */
export const join = mutation({
  args: { meetId: v.id('meets') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const meet = await ctx.db.get(args.meetId);
    if (!meet || meet.status !== 'active')
      throw new Error('Meet not available');

    const existing = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('meetId', args.meetId).eq('userId', userId),
      )
      .first();

    if (existing) {
      if (!existing.isActive) {
        const activeParticipants = await ctx.db
          .query('meetParticipants')
          .withIndex('by_room', (q) => q.eq('meetId', args.meetId))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        if (activeParticipants.length >= MAX_MEET_PARTICIPANTS) {
          throw new Error(
            `Meet is full (max ${MAX_MEET_PARTICIPANTS} participants)`,
          );
        }

        await ctx.db.patch(existing._id, {
          isActive: true,
          isMuted: false,
          joinedAt: Date.now(),
        });
      }
      return { participantId: existing._id };
    }

    // New participant — enforce limit
    const activeParticipants = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room', (q) => q.eq('meetId', args.meetId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    if (activeParticipants.length >= MAX_MEET_PARTICIPANTS) {
      throw new Error(
        `Meet is full (max ${MAX_MEET_PARTICIPANTS} participants)`,
      );
    }

    const participantId = await ctx.db.insert('meetParticipants', {
      meetId: args.meetId,
      userId,
      isMuted: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return { participantId };
  },
});

/* -------------------------------------------------- */
/* LEAVE MEET ROOM */
/* -------------------------------------------------- */
export const leave = mutation({
  args: { meetId: v.id('meets') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const meet = await ctx.db.get(args.meetId);
    if (!meet) throw new Error('Meet not found');

    const participant = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('meetId', args.meetId).eq('userId', userId),
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, { isActive: false });
    }

    const remaining = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room', (q) => q.eq('meetId', args.meetId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const othersRemaining = remaining.filter((p) => p.userId !== userId);

    if (othersRemaining.length === 0) {
      await _deleteMeetRoom(ctx, args.meetId);
      return { success: true, roomDeleted: true };
    }

    if (meet.hostId === userId) {
      await ctx.db.patch(args.meetId, {
        hostId: othersRemaining[0].userId,
      });
    }

    return { success: true, roomDeleted: false };
  },
});

/* -------------------------------------------------- */
/* TOGGLE MUTE */
/* -------------------------------------------------- */
export const toggleMute = mutation({
  args: { meetId: v.id('meets') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const participant = await ctx.db
      .query('meetParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('meetId', args.meetId).eq('userId', userId),
      )
      .first();

    if (!participant) throw new Error('Not in meet');

    await ctx.db.patch(participant._id, { isMuted: !participant.isMuted });
    return { isMuted: !participant.isMuted };
  },
});

/* -------------------------------------------------- */
/* INTERNAL: delete meet room + all participant records */
/* -------------------------------------------------- */
async function _deleteMeetRoom(ctx: any, meetId: any) {
  const participants = await ctx.db
    .query('meetParticipants')
    .withIndex('by_room', (q: any) => q.eq('meetId', meetId))
    .collect();

  for (const p of participants) {
    await ctx.db.delete(p._id);
  }

  await ctx.db.delete(meetId);
}
