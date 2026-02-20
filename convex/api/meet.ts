// convex/api/meet.ts
// HTTP handler for generating LiveKit tokens for Meet rooms

import { httpAction } from '../_generated/server';
import { api } from '../_generated/api';

export const getMeetToken = httpAction(async (ctx, request) => {
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

    if (!body.meetId || !body.lessonId || !body.userId || !body.userName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: meetId, lessonId, userId, userName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await ctx.runAction(api.api.meetNode.generateMeetToken, {
      meetId: body.meetId,
      lessonId: body.lessonId,
      userId: body.userId,
      userName: body.userName,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Meet token error:', error);
    return new Response(
      JSON.stringify({ error: 'Error generating meet token' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
