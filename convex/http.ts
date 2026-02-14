// convex/http.ts

import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { getToken } from './api/livekit';
import { revenuecatWebhook } from './api/revenuecat';
import { getRoomToken } from './api/room';

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

export default http;
