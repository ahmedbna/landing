import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.number()),
    image: v.optional(v.union(v.string(), v.null())),
    emailVerificationTime: v.optional(v.float64()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),

    nativeLanguage: v.optional(v.string()),
    learningLanguage: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    agentId: v.optional(v.string()),
    piperId: v.optional(v.id('piperModels')),
    scheduledForDeletion: v.optional(v.number()),

    subscriptionTier: v.optional(
      v.union(v.literal('free'), v.literal('Orca+')),
    ),
    subscriptionStatus: v.optional(
      v.union(
        v.literal('active'),
        v.literal('cancelled'),
        v.literal('expired'),
        v.literal('in_grace_period'),
        v.literal('on_hold'),
      ),
    ),
    subscriptionPlatform: v.optional(
      v.union(v.literal('ios'), v.literal('android')),
    ),

    pushToken: v.optional(v.string()),
    pushNotificationsEnabled: v.optional(v.boolean()),
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('scheduledForDeletion', ['scheduledForDeletion']),

  pushNotifications: defineTable({
    userId: v.id('users'),
    type: v.union(
      v.literal('post_reaction'),
      v.literal('post_comment'),
      v.literal('comment_reaction'),
      v.literal('room_invite'),
    ),
    title: v.string(),
    body: v.string(),
    data: v.any(),
    sent: v.boolean(),
    read: v.boolean(),
    sentAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_read', ['userId', 'read'])
    .index('by_sent', ['sent']),

  notifications: defineTable({
    recipientId: v.id('users'),
    actorId: v.id('users'),
    type: v.union(
      v.literal('post_reaction'),
      v.literal('post_comment'),
      v.literal('comment_reaction'),
    ),
    postId: v.optional(v.id('posts')),
    commentId: v.optional(v.id('comments')),
    emoji: v.optional(v.string()),
    read: v.boolean(),
  })
    .index('by_recipient', ['recipientId'])
    .index('by_recipient_unread', ['recipientId', 'read']),

  subscriptions: defineTable({
    userId: v.id('users'),
    productId: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
    status: v.union(
      v.literal('active'),
      v.literal('cancelled'),
      v.literal('expired'),
      v.literal('in_grace_period'),
      v.literal('on_hold'),
      v.literal('paused'),
    ),
    purchaseDate: v.number(),
    expirationDate: v.number(),
    renewalDate: v.optional(v.number()),
    cancellationDate: v.optional(v.number()),
    originalTransactionId: v.string(),
    transactionId: v.string(),
    revenuecatSubscriberId: v.optional(v.string()),
    isTrialPeriod: v.boolean(),
    willRenew: v.boolean(),
    priceUSD: v.number(),
    billingPeriod: v.union(v.literal('monthly'), v.literal('yearly')),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_transaction', ['originalTransactionId'])
    .index('by_expiration', ['expirationDate']),

  subscriptionEvents: defineTable({
    userId: v.id('users'),
    subscriptionId: v.id('subscriptions'),
    eventType: v.union(
      v.literal('initial_purchase'),
      v.literal('renewal'),
      v.literal('cancellation'),
      v.literal('expiration'),
      v.literal('reactivation'),
      v.literal('billing_issue'),
      v.literal('refund'),
      v.literal('grace_period_start'),
      v.literal('grace_period_end'),
    ),
    platform: v.union(v.literal('ios'), v.literal('android')),
    transactionId: v.string(),
    eventData: v.optional(v.any()),
    eventDate: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_subscription', ['subscriptionId'])
    .index('by_event_type', ['eventType'])
    .index('by_date', ['eventDate']),

  credits: defineTable({
    userId: v.id('users'),
    balance: v.number(),
  }).index('by_user', ['userId']),

  courses: defineTable({
    language: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.string(),
    prerequisites: v.optional(v.array(v.id('courses'))),
    isPremium: v.boolean(),
  })
    .index('by_language', ['language'])
    .index('by_language_order', ['language', 'order']),

  courseProgress: defineTable({
    userId: v.id('users'),
    courseId: v.id('courses'),
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_course', ['userId', 'courseId']),

  lessons: defineTable({
    courseId: v.id('courses'),
    order: v.number(),
    title: v.string(),
    phrases: v.array(
      v.object({
        order: v.number(),
        text: v.string(),
        dictionary: v.optional(
          v.array(
            v.object({
              language: v.string(),
              translation: v.string(),
            }),
          ),
        ),
        audioUrl: v.optional(v.string()),
      }),
    ),
  })
    .index('by_course', ['courseId'])
    .index('by_course_order', ['courseId', 'order']),

  lessonProgress: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_lesson', ['userId', 'lessonId']),

  completions: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    time: v.number(),
    correctPhrases: v.number(),
    totalPhrases: v.number(),
    allCorrect: v.boolean(),
    day: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_lesson', ['lessonId'])
    .index('by_user_lesson', ['userId', 'lessonId'])
    .index('by_user_day', ['userId', 'day'])
    .index('by_user_lesson_day', ['userId', 'lessonId', 'day']),

  piperModels: defineTable({
    modelId: v.string(),
    voice: v.string(),
    language: v.string(),
    code: v.string(),
    locale: v.string(),
    url: v.string(),
    folderName: v.string(),
    modelFile: v.string(),
  }).index('by_code', ['code']),

  posts: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    content: v.string(),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_user', ['userId']),

  comments: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
    content: v.string(),
  })
    .index('by_post', ['postId'])
    .index('by_user', ['userId']),

  reactions: defineTable({
    userId: v.id('users'),
    postId: v.optional(v.id('posts')),
    commentId: v.optional(v.id('comments')),
    emoji: v.string(),
  })
    .index('by_post', ['postId'])
    .index('by_comment', ['commentId'])
    .index('by_post_user_emoji', ['postId', 'userId', 'emoji'])
    .index('by_comment_user_emoji', ['commentId', 'userId', 'emoji']),

  rooms: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    topic: v.optional(v.string()),
    lessonId: v.id('lessons'),
    hostId: v.id('users'),
    status: v.union(v.literal('active'), v.literal('ended')),
    isPrivate: v.boolean(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_host', ['hostId'])
    .index('by_lesson', ['lessonId'])
    .index('by_lesson_status', ['lessonId', 'status']),

  roomParticipants: defineTable({
    roomId: v.id('rooms'),
    userId: v.id('users'),
    role: v.union(
      v.literal('host'),
      v.literal('speaker'),
      v.literal('listener'),
    ),
    isMuted: v.boolean(),
    hasRaisedHand: v.boolean(),
    isActive: v.boolean(),
    joinedAt: v.number(),
  })
    .index('by_room', ['roomId'])
    .index('by_user', ['userId'])
    .index('by_room_user', ['roomId', 'userId'])
    .index('by_room_active', ['roomId', 'isActive']),

  // ══════════════════════════════════════
  // NEW: Meet Rooms — AI-moderated group sessions
  // ══════════════════════════════════════
  meets: defineTable({
    title: v.string(),
    topic: v.optional(v.string()),
    lessonId: v.id('lessons'),
    hostId: v.id('users'),
    status: v.union(v.literal('active'), v.literal('ended')),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_host', ['hostId'])
    .index('by_lesson', ['lessonId'])
    .index('by_lesson_status', ['lessonId', 'status']),

  meetParticipants: defineTable({
    meetId: v.id('meets'),
    userId: v.id('users'),
    isMuted: v.boolean(),
    isActive: v.boolean(),
    joinedAt: v.number(),
  })
    .index('by_room', ['meetId'])
    .index('by_user', ['userId'])
    .index('by_room_user', ['meetId', 'userId'])
    .index('by_room_active', ['meetId', 'isActive']),

  analyticsEvents: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id('users')),
    anonymousId: v.optional(v.string()),
    eventType: v.union(
      v.literal('page_view'),
      v.literal('session_start'),
      v.literal('session_end'),
      v.literal('app_foreground'),
      v.literal('app_background'),
      v.literal('user_action'),
      v.literal('error'),
      v.literal('performance'),
    ),
    eventName: v.string(),
    route: v.optional(v.string()),
    previousRoute: v.optional(v.string()),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
    osVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    deviceModel: v.optional(v.string()),
    deviceType: v.optional(v.union(v.literal('phone'), v.literal('tablet'))),
    locale: v.optional(v.string()),
    timezone: v.optional(v.string()),
    sessionDurationMs: v.optional(v.number()),
    screenDurationMs: v.optional(v.number()),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    errorStack: v.optional(v.string()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_session', ['sessionId'])
    .index('by_user', ['userId'])
    .index('by_event_type', ['eventType'])
    .index('by_route', ['route'])
    .index('by_platform', ['platform']),

  analyticsSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id('users')),
    anonymousId: v.optional(v.string()),
    platform: v.union(v.literal('ios'), v.literal('android'), v.literal('web')),
    osVersion: v.optional(v.string()),
    appVersion: v.optional(v.string()),
    deviceModel: v.optional(v.string()),
    deviceType: v.optional(v.union(v.literal('phone'), v.literal('tablet'))),
    locale: v.optional(v.string()),
    timezone: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    screenCount: v.number(),
    isActive: v.boolean(),
    lastSeenAt: v.number(),
  })
    .index('by_session_id', ['sessionId'])
    .index('by_user', ['userId'])
    .index('by_platform', ['platform'])
    .index('by_started_at', ['startedAt'])
    .index('by_is_active', ['isActive']),
});
