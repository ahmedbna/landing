// convex/api/room.ts
/**
 * BUG 4 FIX: Previously this handler called `api.api.roomNode.generateLivekitToken`
 * (the legacy action) which generated room names as `audio_room_<roomId>`.
 * The typed action `generateRoomToken` generates them as `lesson_<lessonId>_room_<roomId>`.
 * Since all participants must join the SAME LiveKit room name, we now always use
 * the typed `generateRoomToken` action which has proper argument validation.
 *
 * BUG 5 FIX: The client was sending `serverUrl: ''` in the body; that field is
 * now removed from the client call (see audio-room.tsx) and ignored here.
 */

import { httpAction } from '../_generated/server';
import { api } from '../_generated/api';

export const getRoomToken = httpAction(async (ctx, request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();

    // Validate required fields before calling the action
    if (
      !body.roomId ||
      !body.lessonId ||
      !body.userId ||
      !body.userName ||
      !body.role
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: roomId, lessonId, userId, userName, role',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // BUG 4 FIX: Use the typed generateRoomToken action (not the legacy generateLivekitToken)
    // This ensures room names are `lesson_<lessonId>_room_<roomId>` consistently.
    const result = await ctx.runAction(api.api.roomNode.generateRoomToken, {
      roomId: body.roomId,
      lessonId: body.lessonId,
      userId: body.userId,
      userName: body.userName,
      role: body.role,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('LiveKit room token error:', error);
    return new Response(JSON.stringify({ error: 'Error generating token' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
