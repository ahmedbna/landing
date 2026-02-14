'use node';
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { AccessToken } from 'livekit-server-sdk';

export const generateRoomToken = action({
  args: {
    roomId: v.string(),
    lessonId: v.string(),
    userId: v.string(),
    userName: v.string(),
    role: v.union(
      v.literal('host'),
      v.literal('speaker'),
      v.literal('listener'),
    ),
  },
  handler: async (_ctx, args) => {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit environment variables not set');
    }

    // Room name scoped to the lesson so rooms are isolated per lesson
    const roomName = `lesson_${args.lessonId}_room_${args.roomId}`;
    const canPublish = args.role === 'host' || args.role === 'speaker';

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: args.userId,
        name: args.userName,
        ttl: '4h',
      },
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      serverUrl: process.env.LIVEKIT_URL ?? '',
      roomName,
      token,
    };
  },
});

// Keep legacy token generator for backward compat
export const generateLivekitToken = action(async (_ctx, args: any) => {
  const roomName = args.roomId
    ? `audio_room_${args.roomId}`
    : 'quickstart-room';
  const participantIdentity = args.userId ?? 'guest';
  const participantName = args.userName ?? 'Participant';
  const role = args.role ?? 'listener';

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit environment variables not set');
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
      ttl: '4h',
    },
  );

  const canPublish = role === 'host' || role === 'speaker';

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return {
    serverUrl: process.env.LIVEKIT_URL,
    roomName,
    token,
  };
});
