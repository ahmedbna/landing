'use node';

// convex/api/meetNode.ts
import { v } from 'convex/values';
import { action } from '../_generated/server';
import { AccessToken } from 'livekit-server-sdk';

export const generateMeetToken = action({
  args: {
    meetId: v.string(),
    lessonId: v.string(),
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (_ctx, args) => {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit environment variables not set');
    }

    // Unique room name for this meet session — scoped to lessonId + meetId
    const roomName = `meet_${args.lessonId}_${args.meetId}`;

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
      canPublish: true,
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
