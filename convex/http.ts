// convex/http.ts — UPDATED with /getMeetToken route
// Replace your existing convex/http.ts with this file

import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { getToken } from './api/livekit';
import { revenuecatWebhook } from './api/revenuecat';
import { getRoomToken } from './api/room';
import { getMeetToken } from './api/meet';

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// RevenueCat webhook routes
http.route({
  path: '/revenuecatWebhook',
  method: 'POST',
  handler: revenuecatWebhook,
});

// LiveKit agent endpoint
http.route({
  path: '/getToken',
  method: 'POST',
  handler: getToken,
});

// LiveKit room endpoint
http.route({
  path: '/getRoomToken',
  method: 'OPTIONS',
  handler: getRoomToken,
});

http.route({
  path: '/getRoomToken',
  method: 'POST',
  handler: getRoomToken,
});

// Meet room token endpoint (hybrid: participants + AI agent)
http.route({
  path: '/getMeetToken',
  method: 'OPTIONS',
  handler: getMeetToken,
});

http.route({
  path: '/getMeetToken',
  method: 'POST',
  handler: getMeetToken,
});

export default http;
