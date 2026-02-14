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

    // ========== SUBSCRIPTION FIELDS ==========
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
  })
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('scheduledForDeletion', ['scheduledForDeletion']),

  // ========== SUBSCRIPTION TABLE ==========
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

  // ========== SUBSCRIPTION EVENTS TABLE ==========
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

  conversations: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    agentId: v.string(),
    conversationId: v.string(),
    duration: v.number(),
    cost: v.number(),
    status: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_lesson', ['userId', 'lessonId']),

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
    lessonId: v.id('lessons'), // every room belongs to a lesson
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
});
