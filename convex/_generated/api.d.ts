/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as api_livekit from "../api/livekit.js";
import type * as api_livekitNode from "../api/livekitNode.js";
import type * as api_meet from "../api/meet.js";
import type * as api_meetNode from "../api/meetNode.js";
import type * as api_revenuecat from "../api/revenuecat.js";
import type * as api_room from "../api/room.js";
import type * as api_roomNode from "../api/roomNode.js";
import type * as auth from "../auth.js";
import type * as completions from "../completions.js";
import type * as courses from "../courses.js";
import type * as credits from "../credits.js";
import type * as home from "../home.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as meets from "../meets.js";
import type * as notifications from "../notifications.js";
import type * as passwordReset from "../passwordReset.js";
import type * as piperModels from "../piperModels.js";
import type * as posts from "../posts.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as queries from "../queries.js";
import type * as resendOTP from "../resendOTP.js";
import type * as resendPasswordOTP from "../resendPasswordOTP.js";
import type * as rooms from "../rooms.js";
import type * as sendPushNotification from "../sendPushNotification.js";
import type * as subscriptions from "../subscriptions.js";
import type * as userDeletion from "../userDeletion.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "api/livekit": typeof api_livekit;
  "api/livekitNode": typeof api_livekitNode;
  "api/meet": typeof api_meet;
  "api/meetNode": typeof api_meetNode;
  "api/revenuecat": typeof api_revenuecat;
  "api/room": typeof api_room;
  "api/roomNode": typeof api_roomNode;
  auth: typeof auth;
  completions: typeof completions;
  courses: typeof courses;
  credits: typeof credits;
  home: typeof home;
  http: typeof http;
  lessons: typeof lessons;
  meets: typeof meets;
  notifications: typeof notifications;
  passwordReset: typeof passwordReset;
  piperModels: typeof piperModels;
  posts: typeof posts;
  pushNotifications: typeof pushNotifications;
  queries: typeof queries;
  resendOTP: typeof resendOTP;
  resendPasswordOTP: typeof resendPasswordOTP;
  rooms: typeof rooms;
  sendPushNotification: typeof sendPushNotification;
  subscriptions: typeof subscriptions;
  userDeletion: typeof userDeletion;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
