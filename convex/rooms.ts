// convex/rooms.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const MAX_ROOM_PARTICIPANTS = 5;

/* -------------------------------------------------- */
/* LIST ACTIVE ROOMS FOR A LESSON */
/* -------------------------------------------------- */
export const listByLesson = query({
  args: { lessonId: v.id('lessons') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_lesson_status', (q) =>
        q.eq('lessonId', args.lessonId).eq('status', 'active'),
      )
      .order('desc')
      .collect();

    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query('roomParticipants')
          .withIndex('by_room', (q) => q.eq('roomId', room._id))
          .collect();

        const host = await ctx.db.get(room.hostId);
        const activeParticipants = participants.filter((p) => p.isActive);

        return {
          ...room,
          participantCount: activeParticipants.length,
          isFull: activeParticipants.length >= MAX_ROOM_PARTICIPANTS,
          host: {
            _id: host?._id,
            name: host?.name || 'Anonymous',
            image: host?.image || null,
          },
        };
      }),
    );

    return roomsWithCounts;
  },
});

/* -------------------------------------------------- */
/* LIST ALL ACTIVE ROOMS */
/* -------------------------------------------------- */
export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .order('desc')
      .collect();

    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query('roomParticipants')
          .withIndex('by_room', (q) => q.eq('roomId', room._id))
          .collect();

        const host = await ctx.db.get(room.hostId);
        const activeParticipants = participants.filter((p) => p.isActive);

        return {
          ...room,
          participantCount: activeParticipants.length,
          isFull: activeParticipants.length >= MAX_ROOM_PARTICIPANTS,
          host: {
            _id: host?._id,
            name: host?.name || 'Anonymous',
            image: host?.image || null,
          },
        };
      }),
    );

    return roomsWithCounts;
  },
});

/* -------------------------------------------------- */
/* GET SINGLE ROOM */
/* -------------------------------------------------- */
export const get = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
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
          },
        };
      }),
    );

    const host = await ctx.db.get(room.hostId);
    const myParticipation = participants.find((p) => p.userId === userId);

    return {
      ...room,
      host: {
        _id: host?._id,
        name: host?.name || 'Anonymous',
        image: host?.image || null,
      },
      participants: participantsWithUsers,
      participantCount: activeParticipants.length,
      isFull: activeParticipants.length >= MAX_ROOM_PARTICIPANTS,
      maxParticipants: MAX_ROOM_PARTICIPANTS,
      myRole: myParticipation?.role ?? null,
      isMuted: myParticipation?.isMuted ?? true,
      hasRaisedHand: myParticipation?.hasRaisedHand ?? false,
      isInRoom: myParticipation?.isActive ?? false,
    };
  },
});

/* -------------------------------------------------- */
/* CREATE ROOM (always tied to a lesson) */
/* -------------------------------------------------- */
export const create = mutation({
  args: {
    lessonId: v.id('lessons'),
    title: v.string(),
    description: v.optional(v.string()),
    topic: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const roomId = await ctx.db.insert('rooms', {
      title: args.title,
      description: args.description,
      topic: args.topic,
      lessonId: args.lessonId,
      hostId: userId,
      status: 'active',
      isPrivate: args.isPrivate ?? false,
      startedAt: Date.now(),
    });

    // Host auto-joins as host/speaker (count = 1, under limit)
    await ctx.db.insert('roomParticipants', {
      roomId,
      userId,
      role: 'host',
      isMuted: false,
      hasRaisedHand: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return roomId;
  },
});

/* -------------------------------------------------- */
/* JOIN ROOM */
/* -------------------------------------------------- */
export const join = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== 'active')
      throw new Error('Room not available');

    // Check if user is already a participant (re-joining)
    const existing = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (existing) {
      if (!existing.isActive) {
        // Re-joining — check capacity first
        const activeParticipants = await ctx.db
          .query('roomParticipants')
          .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
          .filter((q) => q.eq(q.field('isActive'), true))
          .collect();

        if (activeParticipants.length >= MAX_ROOM_PARTICIPANTS) {
          throw new Error(
            `Room is full (max ${MAX_ROOM_PARTICIPANTS} participants)`,
          );
        }

        await ctx.db.patch(existing._id, {
          isActive: true,
          joinedAt: Date.now(),
        });
      }
      return { participantId: existing._id, role: existing.role };
    }

    // New participant — enforce capacity limit
    const activeParticipants = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    if (activeParticipants.length >= MAX_ROOM_PARTICIPANTS) {
      throw new Error(
        `Room is full (max ${MAX_ROOM_PARTICIPANTS} participants)`,
      );
    }

    const participantId = await ctx.db.insert('roomParticipants', {
      roomId: args.roomId,
      userId,
      role: 'listener',
      isMuted: true,
      hasRaisedHand: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return { participantId, role: 'listener' };
  },
});

/* -------------------------------------------------- */
/* LEAVE ROOM — auto-delete if everyone leaves */
/* -------------------------------------------------- */
export const leave = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, { isActive: false });
    }

    // Check remaining active participants (excluding the user who just left)
    const remaining = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const othersRemaining = remaining.filter((p) => p.userId !== userId);

    // If no one else is left, delete the room and all participant records
    if (othersRemaining.length === 0) {
      await _deleteRoomAndParticipants(ctx, args.roomId);
      return { success: true, roomDeleted: true };
    }

    // If host leaves and others remain, transfer host to next person
    if (room.hostId === userId) {
      const nextHost = othersRemaining[0];
      await ctx.db.patch(args.roomId, { hostId: nextHost.userId });
      await ctx.db.patch(nextHost._id, { role: 'host', isMuted: false });
    }

    return { success: true, roomDeleted: false };
  },
});

/* -------------------------------------------------- */
/* TOGGLE MUTE */
/* -------------------------------------------------- */
export const toggleMute = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (!participant) throw new Error('Not in room');
    if (participant.role === 'listener')
      throw new Error('Listeners cannot speak');

    await ctx.db.patch(participant._id, { isMuted: !participant.isMuted });
    return { isMuted: !participant.isMuted };
  },
});

/* -------------------------------------------------- */
/* RAISE / LOWER HAND */
/* -------------------------------------------------- */
export const toggleRaiseHand = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', userId),
      )
      .first();

    if (!participant) throw new Error('Not in room');

    await ctx.db.patch(participant._id, {
      hasRaisedHand: !participant.hasRaisedHand,
    });

    return { hasRaisedHand: !participant.hasRaisedHand };
  },
});

/* -------------------------------------------------- */
/* INVITE TO SPEAK (host only) */
/* -------------------------------------------------- */
export const inviteToSpeak = mutation({
  args: {
    roomId: v.id('rooms'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== userId)
      throw new Error('Only host can invite speakers');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', args.targetUserId),
      )
      .first();

    if (!participant) throw new Error('User not in room');

    await ctx.db.patch(participant._id, {
      role: 'speaker',
      isMuted: false,
      hasRaisedHand: false,
    });

    return { success: true };
  },
});

/* -------------------------------------------------- */
/* MOVE TO AUDIENCE (host only) */
/* -------------------------------------------------- */
export const moveToAudience = mutation({
  args: {
    roomId: v.id('rooms'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== userId)
      throw new Error('Only host can manage speakers');

    const participant = await ctx.db
      .query('roomParticipants')
      .withIndex('by_room_user', (q) =>
        q.eq('roomId', args.roomId).eq('userId', args.targetUserId),
      )
      .first();

    if (!participant) throw new Error('User not in room');

    await ctx.db.patch(participant._id, {
      role: 'listener',
      isMuted: true,
      hasRaisedHand: false,
    });

    return { success: true };
  },
});

/* -------------------------------------------------- */
/* END ROOM (host only) — hard delete */
/* -------------------------------------------------- */
export const endRoom = mutation({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== userId) throw new Error('Only host can end the room');

    await _deleteRoomAndParticipants(ctx, args.roomId);

    return { success: true };
  },
});

/* -------------------------------------------------- */
/* INTERNAL: delete room + all participant records */
/* -------------------------------------------------- */
async function _deleteRoomAndParticipants(ctx: any, roomId: any) {
  const participants = await ctx.db
    .query('roomParticipants')
    .withIndex('by_room', (q: any) => q.eq('roomId', roomId))
    .collect();

  for (const p of participants) {
    await ctx.db.delete(p._id);
  }

  await ctx.db.delete(roomId);
}
