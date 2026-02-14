// convex/api/livekit.ts

import { httpAction } from '../_generated/server';
import { api } from '../_generated/api';

export const getToken = httpAction(async (ctx, request) => {
  try {
    // Parse the request body
    const body = await request.json();

    // Call the Node.js action to generate the token
    const result = await ctx.runAction(
      api.api.livekitNode.generateLivekitToken,
      body,
    );

    // Return response with proper status code (201 Created)
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('LiveKit error:', error);
    return new Response(JSON.stringify({ error: 'Error generating token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
