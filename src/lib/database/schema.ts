

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    decimal,
    boolean,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
        email: varchar("email", { length: 255 }).notNull().unique(),
        username: varchar("username", { length: 100 }).notNull().unique(),
        role: varchar("role", { length: 20 })
            .notNull()
            .$type<"creator" | "member" | "admin">(),
        avatar: text("avatar"),
        isActive: boolean("is_active").default(true).notNull(),
        isSuspended: boolean("is_suspended").default(false).notNull(),
        suspensionReason: text("suspension_reason"),
        suspendedAt: timestamp("suspended_at"),
        suspendedBy: uuid("suspended_by"),

        coinBalance: integer("coin_balance").default(0).notNull(),
        totalCoinsPurchased: integer("total_coins_purchased").default(0).notNull(),
        totalCoinsSpent: integer("total_coins_spent").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        clerkIdIdx: index("users_clerk_id_idx").on(table.clerkId),
        emailIdx: index("users_email_idx").on(table.email),
        usernameIdx: index("users_username_idx").on(table.username),
        roleIdx: index("users_role_idx").on(table.role),
        isSuspendedIdx: index("users_is_suspended_idx").on(table.isSuspended),
        coinBalanceIdx: index("users_coin_balance_idx").on(table.coinBalance),
    })
);

export const creatorProfiles = pgTable(
    "creator_profiles",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        displayName: varchar("display_name", { length: 255 }).notNull(),
        bio: text("bio"),
        totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        totalViews: integer("total_views").default(0).notNull(),
        videoCount: integer("video_count").default(0).notNull(),
        seriesCount: integer("series_count").default(0).notNull(),
        socialLinks:
            jsonb("social_links").$type<Array<{ platform: string; url: string }>>(),

        coinBalance: integer("coin_balance").default(0).notNull(),
        totalCoinsEarned: integer("total_coins_earned").default(0).notNull(),
        coinsWithdrawn: integer("coins_withdrawn").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("creator_profiles_user_id_idx").on(table.userId),
        coinBalanceIdx: index("creator_profiles_coin_balance_idx").on(table.coinBalance),
    })
);

export const memberProfiles = pgTable(
    "member_profiles",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        membershipStatus: varchar("membership_status", { length: 20 })
            .default("free")
            .notNull()
            .$type<"free" | "premium">(),
        membershipExpiry: timestamp("membership_expiry"),
        autoRenew: boolean("auto_renew").default(false).notNull(),
        watchHistory: jsonb("watch_history").$type<string[]>().default([]),
        favoriteCreators: jsonb("favorite_creators").$type<string[]>().default([]),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("member_profiles_user_id_idx").on(table.userId),
    })
);

export const series = pgTable(
    "series",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        creatorId: uuid("creator_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description"),
        thumbnailUrl: text("thumbnail_url"),
        totalPrice: decimal("total_price", { precision: 10, scale: 2 }).default("0.00"), // Optional - for backward compatibility
        coinPrice: integer("coin_price").default(0), // Optional - series is now a free container
        videoCount: integer("video_count").default(0).notNull(),
        totalDuration: integer("total_duration").default(0).notNull(), // in seconds
        category: varchar("category", { length: 100 }).notNull(),
        tags: jsonb("tags").$type<string[]>().default([]),
        viewCount: integer("view_count").default(0).notNull(),
        totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        moderationStatus: varchar("moderation_status", { length: 20 })
            .default("approved")
            .notNull()
            .$type<"pending" | "approved" | "rejected" | "flagged">(),
        moderationReason: text("moderation_reason"),
        moderatedAt: timestamp("moderated_at"),
        moderatedBy: uuid("moderated_by").references(() => users.id, { onDelete: "set null" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        creatorIdIdx: index("series_creator_id_idx").on(table.creatorId),
        categoryIdx: index("series_category_idx").on(table.category),
        isActiveIdx: index("series_is_active_idx").on(table.isActive),
        moderationStatusIdx: index("series_moderation_status_idx").on(table.moderationStatus),
        createdAtIdx: index("series_created_at_idx").on(table.createdAt),
        viewCountIdx: index("series_view_count_idx").on(table.viewCount),
        totalPriceIdx: index("series_total_price_idx").on(table.totalPrice),
        coinPriceIdx: index("series_coin_price_idx").on(table.coinPrice),
    })
);

export const videos = pgTable(
    "videos",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        creatorId: uuid("creator_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description"),
        videoUrl: text("video_url").notNull(),
        thumbnailUrl: text("thumbnail_url").notNull(),
        duration: integer("duration").notNull(), // in seconds
        creditCost: decimal("credit_cost", { precision: 5, scale: 2 }).notNull(),
        coinPrice: integer("coin_price").notNull(), // Coin-based pricing
        category: varchar("category", { length: 100 }).notNull(),
        tags: jsonb("tags").$type<string[]>().default([]),
        viewCount: integer("view_count").default(0).notNull(),
        totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        moderationStatus: varchar("moderation_status", { length: 20 })
            .default("approved")
            .notNull()
            .$type<"pending" | "approved" | "rejected" | "flagged">(),
        moderationReason: text("moderation_reason"),
        moderatedAt: timestamp("moderated_at"),
        moderatedBy: uuid("moderated_by").references(() => users.id, { onDelete: "set null" }),

        aspectRatio: varchar("aspect_ratio", { length: 10 }).default("16:9").notNull()
            .$type<"1:1" | "16:9" | "9:16" | "2:3" | "3:2" | "4:5" | "5:4">(),
        seriesId: uuid("series_id").references(() => series.id, { onDelete: "set null" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        creatorIdIdx: index("videos_creator_id_idx").on(table.creatorId),
        categoryIdx: index("videos_category_idx").on(table.category),
        isActiveIdx: index("videos_is_active_idx").on(table.isActive),
        moderationStatusIdx: index("videos_moderation_status_idx").on(table.moderationStatus),
        createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
        aspectRatioIdx: index("videos_aspect_ratio_idx").on(table.aspectRatio),
        seriesIdIdx: index("videos_series_id_idx").on(table.seriesId),
        coinPriceIdx: index("videos_coin_price_idx").on(table.coinPrice),
    })
);

export const transactions = pgTable(
    "transactions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 })
            .notNull()
            .$type<"credit_purchase" | "video_view" | "creator_earning" | "membership_activation" | "membership_upgrade" | "membership_renewal" | "membership_cancellation" | "series_purchase">(),
        amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
        videoId: uuid("video_id").references(() => videos.id, {
            onDelete: "set null",
        }),
        seriesId: uuid("series_id").references(() => series.id, {
            onDelete: "set null",
        }),
        creatorId: uuid("creator_id").references(() => users.id, {
            onDelete: "set null",
        }),
        razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
        razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
        status: varchar("status", { length: 20 })
            .default("pending")
            .notNull()
            .$type<"pending" | "completed" | "failed">(),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("transactions_user_id_idx").on(table.userId),
        typeIdx: index("transactions_type_idx").on(table.type),
        statusIdx: index("transactions_status_idx").on(table.status),
        createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
        razorpayPaymentIdIdx: index("transactions_razorpay_payment_id_idx").on(
            table.razorpayPaymentId
        ),
        seriesIdIdx: index("transactions_series_id_idx").on(table.seriesId),
        videoIdIdx: index("transactions_video_id_idx").on(table.videoId),
    })
);

export const userPreferences = pgTable(
    "user_preferences",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" })
            .unique(),
        notifications: jsonb("notifications")
            .$type<{
                email: boolean;
                push: boolean;
                earnings: boolean;
                newFollowers: boolean;
                videoComments: boolean;
            }>()
            .default({
                email: true,
                push: true,
                earnings: true,
                newFollowers: true,
                videoComments: true,
            }),
        privacy: jsonb("privacy")
            .$type<{
                profileVisibility: "public" | "private";
                showEarnings: boolean;
                showViewCount: boolean;
            }>()
            .default({
                profileVisibility: "public",
                showEarnings: true,
                showViewCount: true,
            }),
        playback: jsonb("playback")
            .$type<{
                autoplay: boolean;
                quality: "auto" | "high" | "medium" | "low";
                volume: number;
            }>()
            .default({
                autoplay: true,
                quality: "auto",
                volume: 80,
            }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
    })
);

export const videoShares = pgTable(
    "video_shares",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        creatorId: uuid("creator_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        shareToken: varchar("share_token", { length: 255 }).notNull().unique(),
        platform: varchar("platform", { length: 50 }).$type<
            | "direct"
            | "twitter"
            | "facebook"
            | "whatsapp"
            | "telegram"
            | "linkedin"
            | "qr"
        >(),
        clickCount: integer("click_count").default(0).notNull(),
        viewCount: integer("view_count").default(0).notNull(),
        conversionCount: integer("conversion_count").default(0).notNull(), // views that resulted in payment
        lastAccessedAt: timestamp("last_accessed_at"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        videoIdIdx: index("video_shares_video_id_idx").on(table.videoId),
        creatorIdIdx: index("video_shares_creator_id_idx").on(table.creatorId),
        shareTokenIdx: index("video_shares_share_token_idx").on(table.shareToken),
        platformIdx: index("video_shares_platform_idx").on(table.platform),
        createdAtIdx: index("video_shares_created_at_idx").on(table.createdAt),
    })
);

export const videoLikes = pgTable(
    "video_likes",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("video_likes_user_id_idx").on(table.userId),
        videoIdIdx: index("video_likes_video_id_idx").on(table.videoId),
        uniqueUserVideo: index("video_likes_user_video_unique").on(table.userId, table.videoId),
    })
);

export const videoSaves = pgTable(
    "video_saves",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("video_saves_user_id_idx").on(table.userId),
        videoIdIdx: index("video_saves_video_id_idx").on(table.videoId),
        uniqueUserVideo: index("video_saves_user_video_unique").on(table.userId, table.videoId),
    })
);

export const videoComments = pgTable(
    "video_comments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        parentId: uuid("parent_id"), // For replies - will be set up later
        isEdited: boolean("is_edited").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("video_comments_user_id_idx").on(table.userId),
        videoIdIdx: index("video_comments_video_id_idx").on(table.videoId),
        parentIdIdx: index("video_comments_parent_id_idx").on(table.parentId),
        createdAtIdx: index("video_comments_created_at_idx").on(table.createdAt),
    })
);

export const creatorFollows = pgTable(
    "creator_follows",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        followerId: uuid("follower_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        creatorId: uuid("creator_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        followedAt: timestamp("followed_at").defaultNow().notNull(),
        notificationEnabled: boolean("notification_enabled").default(true).notNull(),
        source: varchar("source", { length: 50 }).default("dashboard").notNull()
            .$type<"dashboard" | "search" | "recommendation" | "direct" | "profile">(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        followerIdIdx: index("creator_follows_follower_id_idx").on(table.followerId),
        creatorIdIdx: index("creator_follows_creator_id_idx").on(table.creatorId),
        uniqueFollowerCreator: index("creator_follows_follower_creator_unique").on(table.followerId, table.creatorId),
        followedAtIdx: index("creator_follows_followed_at_idx").on(table.followedAt),
        sourceIdx: index("creator_follows_source_idx").on(table.source),
    })
);

export const memberStats = pgTable(
    "member_stats",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" })
            .unique(),
        totalVideosWatched: integer("total_videos_watched").default(0).notNull(),
        totalCreditsSpent: decimal("total_credits_spent", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        followedCreatorsCount: integer("followed_creators_count").default(0).notNull(),
        favoriteCategory: varchar("favorite_category", { length: 100 }),
        monthlyVideosWatched: integer("monthly_videos_watched").default(0).notNull(),
        monthlyCreditsSpent: decimal("monthly_credits_spent", { precision: 10, scale: 2 })
            .default("0.00")
            .notNull(),
        monthlyNewFollows: integer("monthly_new_follows").default(0).notNull(),
        lastUpdated: timestamp("last_updated").defaultNow().notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("member_stats_user_id_idx").on(table.userId),
        lastUpdatedIdx: index("member_stats_last_updated_idx").on(table.lastUpdated),
    })
);

export const profileVisits = pgTable(
    "profile_visits",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        creatorId: uuid("creator_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        visitedAt: timestamp("visited_at").defaultNow().notNull(),
        source: varchar("source", { length: 50 }).notNull()
            .$type<"dashboard" | "search" | "recommendation" | "direct" | "trending">(),
        duration: integer("duration"), // in seconds
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("profile_visits_user_id_idx").on(table.userId),
        creatorIdIdx: index("profile_visits_creator_id_idx").on(table.creatorId),
        visitedAtIdx: index("profile_visits_visited_at_idx").on(table.visitedAt),
        sourceIdx: index("profile_visits_source_idx").on(table.source),
    })
);

export const memberActivities = pgTable(
    "member_activities",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        activityType: varchar("activity_type", { length: 50 }).notNull()
            .$type<"video_watch" | "creator_follow" | "creator_unfollow" | "credit_purchase" | "profile_visit" | "video_like" | "video_save" | "video_comment">(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description"),
        metadata: jsonb("metadata").$type<{
            videoId?: string;
            creatorId?: string;
            amount?: number;
            category?: string;
            source?: string;
            [key: string]: any;
        }>(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("member_activities_user_id_idx").on(table.userId),
        activityTypeIdx: index("member_activities_activity_type_idx").on(table.activityType),
        createdAtIdx: index("member_activities_created_at_idx").on(table.createdAt),
    })
);

export const promotionalOffers = pgTable(
    "promotional_offers",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        type: varchar("type", { length: 50 })
            .notNull()
            .$type<"credit_bonus" | "membership_discount" | "early_access" | "free_content">(),
        value: varchar("value", { length: 100 }).notNull(), // e.g., "50% OFF", "+50% Credits"
        originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
        discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
        validFrom: timestamp("valid_from").defaultNow().notNull(),
        validUntil: timestamp("valid_until").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        isLimited: boolean("is_limited").default(false).notNull(),
        totalCount: integer("total_count"), // For limited offers
        usedCount: integer("used_count").default(0).notNull(),
        ctaText: varchar("cta_text", { length: 100 }).notNull(),
        ctaLink: varchar("cta_link", { length: 255 }).notNull(),
        targetAudience: varchar("target_audience", { length: 50 })
            .$type<"all" | "new_users" | "premium_users" | "free_users">()
            .default("all"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        typeIdx: index("promotional_offers_type_idx").on(table.type),
        isActiveIdx: index("promotional_offers_is_active_idx").on(table.isActive),
        validUntilIdx: index("promotional_offers_valid_until_idx").on(table.validUntil),
        targetAudienceIdx: index("promotional_offers_target_audience_idx").on(table.targetAudience),
    })
);

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 })
            .notNull()
            .$type<"earning" | "follower" | "video_view" | "payment" | "system" | "like" | "comment">(),
        title: varchar("title", { length: 255 }).notNull(),
        message: text("message").notNull(),
        isRead: boolean("is_read").default(false).notNull(),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("notifications_user_id_idx").on(table.userId),
        typeIdx: index("notifications_type_idx").on(table.type),
        isReadIdx: index("notifications_is_read_idx").on(table.isRead),
        createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    })
);

export const usersRelations = relations(users, ({ one, many }) => ({
    creatorProfile: one(creatorProfiles, {
        fields: [users.id],
        references: [creatorProfiles.userId],
    }),
    memberProfile: one(memberProfiles, {
        fields: [users.id],
        references: [memberProfiles.userId],
    }),
    preferences: one(userPreferences, {
        fields: [users.id],
        references: [userPreferences.userId],
    }),
    videos: many(videos),
    videoShares: many(videoShares),
    userTransactions: many(transactions, {
        relationName: "userTransactions",
    }),
    creatorTransactions: many(transactions, {
        relationName: "creatorTransactions",
    }),
    notifications: many(notifications),
    videoLikes: many(videoLikes),
    videoSaves: many(videoSaves),
    videoComments: many(videoComments),
    following: many(creatorFollows, {
        relationName: "followerRelation",
    }),
    followers: many(creatorFollows, {
        relationName: "creatorRelation",
    }),
    memberStats: one(memberStats, {
        fields: [users.id],
        references: [memberStats.userId],
    }),
    profileVisitsMade: many(profileVisits, {
        relationName: "visitorRelation",
    }),
    profileVisitsReceived: many(profileVisits, {
        relationName: "visitedCreatorRelation",
    }),
    memberActivities: many(memberActivities),

    reportsCreated: many(reports, {
        relationName: "reporterRelation",
    }),
    reportsReceived: many(reports, {
        relationName: "reportedUserRelation",
    }),
    reportsReviewed: many(reports, {
        relationName: "reviewerRelation",
    }),
    auditLogs: many(auditLogs),
    contentFiltersCreated: many(contentFilters),
    suspendedBy: one(users, {
        fields: [users.suspendedBy],
        references: [users.id],
        relationName: "suspenderRelation",
    }),
    suspendedUsers: many(users, {
        relationName: "suspenderRelation",
    }),

    series: many(series),
    moderatedSeries: many(series, {
        relationName: "seriesModeratorRelation",
    }),

    coinTransactions: many(coinTransactions),
}));

export const creatorProfilesRelations = relations(
    creatorProfiles,
    ({ one }) => ({
        user: one(users, {
            fields: [creatorProfiles.userId],
            references: [users.id],
        }),
    })
);

export const memberProfilesRelations = relations(memberProfiles, ({ one }) => ({
    user: one(users, {
        fields: [memberProfiles.userId],
        references: [users.id],
    }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
    creator: one(users, {
        fields: [videos.creatorId],
        references: [users.id],
    }),
    transactions: many(transactions),
    shares: many(videoShares),
    likes: many(videoLikes),
    saves: many(videoSaves),
    comments: many(videoComments),
    reports: many(reports),
    moderator: one(users, {
        fields: [videos.moderatedBy],
        references: [users.id],
        relationName: "moderatorRelation",
    }),

    series: one(series, {
        fields: [videos.seriesId],
        references: [series.id],
    }),
    seriesVideos: many(seriesVideos),
}));

export const videoSharesRelations = relations(videoShares, ({ one }) => ({
    video: one(videos, {
        fields: [videoShares.videoId],
        references: [videos.id],
    }),
    creator: one(users, {
        fields: [videoShares.creatorId],
        references: [users.id],
    }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
        relationName: "userTransactions",
    }),
    video: one(videos, {
        fields: [transactions.videoId],
        references: [videos.id],
    }),
    creator: one(users, {
        fields: [transactions.creatorId],
        references: [users.id],
        relationName: "creatorTransactions",
    }),
    series: one(series, {
        fields: [transactions.seriesId],
        references: [series.id],
    }),
}));

export const userPreferencesRelations = relations(
    userPreferences,
    ({ one }) => ({
        user: one(users, {
            fields: [userPreferences.userId],
            references: [users.id],
        }),
    })
);

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
    user: one(users, {
        fields: [videoLikes.userId],
        references: [users.id],
    }),
    video: one(videos, {
        fields: [videoLikes.videoId],
        references: [videos.id],
    }),
}));

export const videoSavesRelations = relations(videoSaves, ({ one }) => ({
    user: one(users, {
        fields: [videoSaves.userId],
        references: [users.id],
    }),
    video: one(videos, {
        fields: [videoSaves.videoId],
        references: [videos.id],
    }),
}));

export const videoCommentsRelations = relations(videoComments, ({ one, many }) => ({
    user: one(users, {
        fields: [videoComments.userId],
        references: [users.id],
    }),
    video: one(videos, {
        fields: [videoComments.videoId],
        references: [videos.id],
    }),
    parent: one(videoComments, {
        fields: [videoComments.parentId],
        references: [videoComments.id],
        relationName: "parentComment",
    }),
    replies: many(videoComments, {
        relationName: "parentComment",
    }),
}));

export const creatorFollowsRelations = relations(creatorFollows, ({ one }) => ({
    follower: one(users, {
        fields: [creatorFollows.followerId],
        references: [users.id],
        relationName: "followerRelation",
    }),
    creator: one(users, {
        fields: [creatorFollows.creatorId],
        references: [users.id],
        relationName: "creatorRelation",
    }),
}));

export const memberStatsRelations = relations(memberStats, ({ one }) => ({
    user: one(users, {
        fields: [memberStats.userId],
        references: [users.id],
    }),
}));

export const profileVisitsRelations = relations(profileVisits, ({ one }) => ({
    user: one(users, {
        fields: [profileVisits.userId],
        references: [users.id],
        relationName: "visitorRelation",
    }),
    creator: one(users, {
        fields: [profileVisits.creatorId],
        references: [users.id],
        relationName: "visitedCreatorRelation",
    }),
}));

export const memberActivitiesRelations = relations(memberActivities, ({ one }) => ({
    user: one(users, {
        fields: [memberActivities.userId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type NewMemberProfile = typeof memberProfiles.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type VideoShare = typeof videoShares.$inferSelect;
export type NewVideoShare = typeof videoShares.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type VideoLike = typeof videoLikes.$inferSelect;
export type NewVideoLike = typeof videoLikes.$inferInsert;
export type VideoSave = typeof videoSaves.$inferSelect;
export type NewVideoSave = typeof videoSaves.$inferInsert;
export type VideoComment = typeof videoComments.$inferSelect;
export type NewVideoComment = typeof videoComments.$inferInsert;
export type CreatorFollow = typeof creatorFollows.$inferSelect;
export type NewCreatorFollow = typeof creatorFollows.$inferInsert;
export type MemberStats = typeof memberStats.$inferSelect;
export type NewMemberStats = typeof memberStats.$inferInsert;
export type ProfileVisit = typeof profileVisits.$inferSelect;
export type NewProfileVisit = typeof profileVisits.$inferInsert;
export type MemberActivity = typeof memberActivities.$inferSelect;
export type NewMemberActivity = typeof memberActivities.$inferInsert;
export type PromotionalOffer = typeof promotionalOffers.$inferSelect;
export type NewPromotionalOffer = typeof promotionalOffers.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export const reports = pgTable(
    "reports",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reporterId: uuid("reporter_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: "cascade" }),
        reportedVideoId: uuid("reported_video_id").references(() => videos.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 })
            .notNull()
            .$type<"user" | "video" | "comment" | "spam" | "harassment" | "inappropriate_content">(),
        reason: varchar("reason", { length: 100 }).notNull(),
        description: text("description"),
        status: varchar("status", { length: 20 })
            .default("pending")
            .notNull()
            .$type<"pending" | "reviewed" | "resolved" | "dismissed">(),
        reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
        reviewedAt: timestamp("reviewed_at"),
        resolution: text("resolution"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        reporterIdIdx: index("reports_reporter_id_idx").on(table.reporterId),
        reportedUserIdIdx: index("reports_reported_user_id_idx").on(table.reportedUserId),
        reportedVideoIdIdx: index("reports_reported_video_id_idx").on(table.reportedVideoId),
        statusIdx: index("reports_status_idx").on(table.status),
        typeIdx: index("reports_type_idx").on(table.type),
        createdAtIdx: index("reports_created_at_idx").on(table.createdAt),
    })
);

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        adminId: uuid("admin_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        action: varchar("action", { length: 100 }).notNull(),
        targetType: varchar("target_type", { length: 50 })
            .notNull()
            .$type<"user" | "video" | "report" | "content_filter" | "system">(),
        targetId: uuid("target_id").notNull(),
        details: jsonb("details"),
        ipAddress: varchar("ip_address", { length: 45 }),
        userAgent: text("user_agent"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        adminIdIdx: index("audit_logs_admin_id_idx").on(table.adminId),
        actionIdx: index("audit_logs_action_idx").on(table.action),
        targetTypeIdx: index("audit_logs_target_type_idx").on(table.targetType),
        createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    })
);

export const contentFilters = pgTable(
    "content_filters",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        type: varchar("type", { length: 50 })
            .notNull()
            .$type<"keyword" | "pattern" | "ai_model" | "regex">(),
        pattern: text("pattern").notNull(),
        severity: varchar("severity", { length: 20 })
            .notNull()
            .$type<"low" | "medium" | "high" | "critical">(),
        action: varchar("action", { length: 50 })
            .notNull()
            .$type<"flag" | "auto_reject" | "shadow_ban" | "require_review">(),
        isActive: boolean("is_active").default(true).notNull(),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        typeIdx: index("content_filters_type_idx").on(table.type),
        severityIdx: index("content_filters_severity_idx").on(table.severity),
        isActiveIdx: index("content_filters_is_active_idx").on(table.isActive),
        createdByIdx: index("content_filters_created_by_idx").on(table.createdBy),
    })
);

export const seriesVideos = pgTable(
    "series_videos",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        seriesId: uuid("series_id")
            .notNull()
            .references(() => series.id, { onDelete: "cascade" }),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        orderIndex: integer("order_index").notNull(),
        // Simplified: videos in series are accessed individually based on their own coinPrice
        // No need for accessType - the video's coinPrice determines if it's free (0) or paid (>0)
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        seriesIdIdx: index("series_videos_series_id_idx").on(table.seriesId),
        videoIdIdx: index("series_videos_video_id_idx").on(table.videoId),
        orderIndexIdx: index("series_videos_order_index_idx").on(table.orderIndex),
        uniqueSeriesVideo: index("series_videos_series_video_unique").on(table.seriesId, table.videoId),
        uniqueSeriesOrder: index("series_videos_series_order_unique").on(table.seriesId, table.orderIndex),
    })
);

export const seriesPurchases = pgTable(
    "series_purchases",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        seriesId: uuid("series_id")
            .notNull()
            .references(() => series.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
        razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
        razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
        status: varchar("status", { length: 20 })
            .default("pending")
            .notNull()
            .$type<"pending" | "completed" | "failed" | "refunded">(),
        purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
        expiresAt: timestamp("expires_at"), // For time-limited access if needed
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        seriesIdIdx: index("series_purchases_series_id_idx").on(table.seriesId),
        userIdIdx: index("series_purchases_user_id_idx").on(table.userId),
        statusIdx: index("series_purchases_status_idx").on(table.status),
        purchasedAtIdx: index("series_purchases_purchased_at_idx").on(table.purchasedAt),
        razorpayPaymentIdIdx: index("series_purchases_razorpay_payment_id_idx").on(table.razorpayPaymentId),
        uniqueUserSeries: index("series_purchases_user_series_unique").on(table.userId, table.seriesId),
    })
);

export const seriesProgress = pgTable(
    "series_progress",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        seriesId: uuid("series_id")
            .notNull()
            .references(() => series.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        currentVideoId: uuid("current_video_id")
            .references(() => videos.id, { onDelete: "set null" }),
        videosWatched: integer("videos_watched").default(0).notNull(),
        totalVideos: integer("total_videos").default(0).notNull(),
        progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0.00").notNull(),
        lastWatchedAt: timestamp("last_watched_at").defaultNow().notNull(),
        completedAt: timestamp("completed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        seriesIdIdx: index("series_progress_series_id_idx").on(table.seriesId),
        userIdIdx: index("series_progress_user_id_idx").on(table.userId),
        lastWatchedAtIdx: index("series_progress_last_watched_at_idx").on(table.lastWatchedAt),
        uniqueUserSeries: index("series_progress_user_series_unique").on(table.userId, table.seriesId),
    })
);

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 100 }).notNull().unique(),
        slug: varchar("slug", { length: 100 }).notNull().unique(),
        description: text("description"),
        iconUrl: text("icon_url"),
        videoCount: integer("video_count").default(0).notNull(),
        seriesCount: integer("series_count").default(0).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        displayOrder: integer("display_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        nameIdx: index("categories_name_idx").on(table.name),
        slugIdx: index("categories_slug_idx").on(table.slug),
        isActiveIdx: index("categories_is_active_idx").on(table.isActive),
        displayOrderIdx: index("categories_display_order_idx").on(table.displayOrder),
    })
);

export const coinTransactions = pgTable(
    "coin_transactions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        transactionType: varchar("transaction_type", { length: 50 })
            .notNull()
            .$type<"purchase" | "spend" | "earn" | "refund" | "withdraw">(),
        coinAmount: integer("coin_amount").notNull(),
        rupeeAmount: decimal("rupee_amount", { precision: 10, scale: 2 }),
        relatedContentType: varchar("related_content_type", { length: 50 })
            .$type<"video" | "series">(),
        relatedContentId: uuid("related_content_id"),
        paymentId: varchar("payment_id", { length: 255 }),
        status: varchar("status", { length: 50 })
            .default("completed")
            .notNull()
            .$type<"pending" | "completed" | "failed" | "refunded">(),
        description: text("description"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        userIdIdx: index("coin_transactions_user_id_idx").on(table.userId),
        transactionTypeIdx: index("coin_transactions_type_idx").on(table.transactionType),
        createdAtIdx: index("coin_transactions_created_idx").on(table.createdAt),
        statusIdx: index("coin_transactions_status_idx").on(table.status),
        paymentIdIdx: index("coin_transactions_payment_id_idx").on(table.paymentId),
    })
);

export const coinPackages = pgTable(
    "coin_packages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 100 }).notNull(),
        coinAmount: integer("coin_amount").notNull(),
        rupeePrice: decimal("rupee_price", { precision: 10, scale: 2 }).notNull(),
        bonusCoins: integer("bonus_coins").default(0).notNull(),
        isPopular: boolean("is_popular").default(false).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        displayOrder: integer("display_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => ({
        isActiveIdx: index("coin_packages_is_active_idx").on(table.isActive),
        displayOrderIdx: index("coin_packages_display_order_idx").on(table.displayOrder),
    })
);

export const reportsRelations = relations(reports, ({ one }) => ({
    reporter: one(users, {
        fields: [reports.reporterId],
        references: [users.id],
        relationName: "reporterRelation",
    }),
    reportedUser: one(users, {
        fields: [reports.reportedUserId],
        references: [users.id],
        relationName: "reportedUserRelation",
    }),
    reportedVideo: one(videos, {
        fields: [reports.reportedVideoId],
        references: [videos.id],
    }),
    reviewer: one(users, {
        fields: [reports.reviewedBy],
        references: [users.id],
        relationName: "reviewerRelation",
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    admin: one(users, {
        fields: [auditLogs.adminId],
        references: [users.id],
    }),
}));

export const contentFiltersRelations = relations(contentFilters, ({ one }) => ({
    creator: one(users, {
        fields: [contentFilters.createdBy],
        references: [users.id],
    }),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
    creator: one(users, {
        fields: [series.creatorId],
        references: [users.id],
    }),
    moderator: one(users, {
        fields: [series.moderatedBy],
        references: [users.id],
        relationName: "seriesModeratorRelation",
    }),
    videos: many(videos),
    seriesVideos: many(seriesVideos),
    purchases: many(seriesPurchases),
    transactions: many(transactions),
}));

export const seriesVideosRelations = relations(seriesVideos, ({ one }) => ({
    series: one(series, {
        fields: [seriesVideos.seriesId],
        references: [series.id],
    }),
    video: one(videos, {
        fields: [seriesVideos.videoId],
        references: [videos.id],
    }),
}));

export const seriesPurchasesRelations = relations(seriesPurchases, ({ one }) => ({
    series: one(series, {
        fields: [seriesPurchases.seriesId],
        references: [series.id],
    }),
    user: one(users, {
        fields: [seriesPurchases.userId],
        references: [users.id],
    }),
}));

export const seriesProgressRelations = relations(seriesProgress, ({ one }) => ({
    series: one(series, {
        fields: [seriesProgress.seriesId],
        references: [series.id],
    }),
    user: one(users, {
        fields: [seriesProgress.userId],
        references: [users.id],
    }),
    currentVideo: one(videos, {
        fields: [seriesProgress.currentVideoId],
        references: [videos.id],
    }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({

}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
    user: one(users, {
        fields: [coinTransactions.userId],
        references: [users.id],
    }),
}));

export const coinPackagesRelations = relations(coinPackages, ({ many }) => ({

}));

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ContentFilter = typeof contentFilters.$inferSelect;
export type NewContentFilter = typeof contentFilters.$inferInsert;
export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
export type SeriesVideo = typeof seriesVideos.$inferSelect;
export type NewSeriesVideo = typeof seriesVideos.$inferInsert;
export type SeriesPurchase = typeof seriesPurchases.$inferSelect;
export type NewSeriesPurchase = typeof seriesPurchases.$inferInsert;
export type SeriesProgress = typeof seriesProgress.$inferSelect;
export type NewSeriesProgress = typeof seriesProgress.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type NewCoinTransaction = typeof coinTransactions.$inferInsert;
export type CoinPackage = typeof coinPackages.$inferSelect;
export type NewCoinPackage = typeof coinPackages.$inferInsert;

export type TransactionType = "credit_purchase" | "video_view" | "creator_earning" | "membership_activation" | "membership_upgrade" | "membership_renewal" | "membership_cancellation" | "series_purchase";
export type TransactionStatus = "pending" | "completed" | "failed";
export type SeriesPurchaseStatus = "pending" | "completed" | "failed" | "refunded";
export type UserRole = "creator" | "member" | "admin";
export type MembershipStatus = "free" | "premium";
export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";
export type ReportType = "user" | "video" | "comment" | "spam" | "harassment" | "inappropriate_content";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type ContentFilterType = "keyword" | "pattern" | "ai_model" | "regex";
export type ContentFilterSeverity = "low" | "medium" | "high" | "critical";
export type ContentFilterAction = "flag" | "auto_reject" | "shadow_ban" | "require_review";
export type FollowSource = "dashboard" | "search" | "recommendation" | "direct" | "profile";
export type ProfileVisitSource = "dashboard" | "search" | "recommendation" | "direct" | "trending";
export type MemberActivityType = "video_watch" | "creator_follow" | "creator_unfollow" | "credit_purchase" | "profile_visit" | "video_like" | "video_save" | "video_comment";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "2:3" | "3:2" | "4:5" | "5:4";
export type CoinTransactionType = "purchase" | "spend" | "earn" | "refund" | "withdraw";
export type CoinTransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type CoinContentType = "video" | "series";

// Export schema object for Drizzle query builder
export const schema = {
    users,
    creatorProfiles,
    memberProfiles,
    series,
    videos,
    transactions,
    userPreferences,
    videoShares,
    videoLikes,
    videoSaves,
    videoComments,
    creatorFollows,
    memberStats,
    profileVisits,
    memberActivities,
    promotionalOffers,
    notifications,
    seriesVideos,
    seriesPurchases,
    seriesProgress,
    categories,
    reports,
    auditLogs,
    contentFilters,
    coinTransactions,
    coinPackages,
    // Relations
    usersRelations,
    creatorProfilesRelations,
    memberProfilesRelations,
    videosRelations,
    videoSharesRelations,
    transactionsRelations,
    userPreferencesRelations,
    videoLikesRelations,
    videoSavesRelations,
    videoCommentsRelations,
    creatorFollowsRelations,
    memberStatsRelations,
    profileVisitsRelations,
    memberActivitiesRelations,
    notificationsRelations,
    seriesRelations,
    seriesVideosRelations,
    seriesPurchasesRelations,
    seriesProgressRelations,
    categoriesRelations,
    reportsRelations,
    auditLogsRelations,
    contentFiltersRelations,
    coinTransactionsRelations,
    coinPackagesRelations,
};
