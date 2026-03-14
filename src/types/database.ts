
import type {

 User,
 NewUser,
 CreatorProfile,
 NewCreatorProfile,
 MemberProfile,
 NewMemberProfile,

 Video,
 NewVideo,

 Series,
 NewSeries,
 SeriesVideo,
 NewSeriesVideo,

 Category,
 NewCategory,

 Transaction,
 NewTransaction,

 VideoShare,
 NewVideoShare,
 VideoLike,
 NewVideoLike,
 VideoSave,
 NewVideoSave,
 VideoComment,
 NewVideoComment,
 CreatorFollow,
 NewCreatorFollow,
 MemberStats,
 NewMemberStats,
 ProfileVisit,
 NewProfileVisit,
 MemberActivity,
 NewMemberActivity,
 Notification,
 NewNotification,
 UserPreferences,
 NewUserPreferences,

 TransactionType,
 TransactionStatus,
 UserRole,
 MembershipStatus,
 ModerationStatus,
 AspectRatio,
} from '../lib/database/schema';

export type {
 User,
 NewUser,
 CreatorProfile,
 NewCreatorProfile,
 MemberProfile,
 NewMemberProfile,
 Video,
 NewVideo,
 Series,
 NewSeries,
 SeriesVideo,
 NewSeriesVideo,
 Category,
 NewCategory,
 Transaction,
 NewTransaction,
 VideoShare,
 NewVideoShare,
 VideoLike,
 NewVideoLike,
 VideoSave,
 NewVideoSave,
 VideoComment,
 NewVideoComment,
 CreatorFollow,
 NewCreatorFollow,
 MemberStats,
 NewMemberStats,
 ProfileVisit,
 NewProfileVisit,
 MemberActivity,
 NewMemberActivity,
 Notification,
 NewNotification,
 UserPreferences,
 NewUserPreferences,
 TransactionType,
 TransactionStatus,
 UserRole,
 MembershipStatus,
 ModerationStatus,
 AspectRatio,
};

export interface SeriesWithRelations extends Series {
 creator?: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 videos?: SeriesVideoWithRelations[];
}

export interface SeriesVideoWithRelations extends SeriesVideo {
 video?: VideoWithRelations;
 series?: SeriesWithRelations;
}

export interface VideoWithRelations extends Video {
 creator?: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 series?: SeriesWithRelations;
}

export interface CategoryWithCounts extends Category {
 contentCount: number; // Combined video + series count
 thumbnailUrl?: string;
}

export interface SeriesFormData {
 title: string;
 description: string;
 category: string;
 tags: string[];
 thumbnail?: File;
}

export interface SeriesListItem {
 id: string;
 title: string;
 videoCount: number;
 coinPrice: number; // Deprecated - kept for backward compatibility
 viewCount: number;
 earnings: number;
 isActive: boolean;
 moderationStatus: ModerationStatus;
 createdAt: Date;
}

export interface VideoFormData {
 title: string;
 description: string;
 category: string;
 tags: string[];
 creditCost: number;
 aspectRatio: AspectRatio;
 seriesId?: string;
}

export interface AspectRatioOption {
 value: AspectRatio;
 label: string;
 description: string;
 isVertical: boolean;
 icon?: string;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
 {
 value: '16:9',
 label: 'Widescreen',
 description: 'Standard widescreen format (16:9)',
 isVertical: false,
 },
 {
 value: '9:16',
 label: 'Vertical',
 description: 'Mobile/Reel format (9:16)',
 isVertical: true,
 },
 {
 value: '1:1',
 label: 'Square',
 description: 'Square format (1:1)',
 isVertical: false,
 },
 {
 value: '4:5',
 label: 'Portrait',
 description: 'Portrait format (4:5)',
 isVertical: true,
 },
 {
 value: '5:4',
 label: 'Landscape',
 description: 'Landscape format (5:4)',
 isVertical: false,
 },
 {
 value: '3:2',
 label: 'Classic',
 description: 'Classic photo format (3:2)',
 isVertical: false,
 },
 {
 value: '2:3',
 label: 'Tall Portrait',
 description: 'Tall portrait format (2:3)',
 isVertical: true,
 },
];

export const isVerticalAspectRatio = (ratio: AspectRatio): boolean => {
 return ['9:16', '4:5', '2:3'].includes(ratio);
};

export const getAspectRatioLabel = (ratio: AspectRatio): string => {
 const option = ASPECT_RATIO_OPTIONS.find(opt => opt.value === ratio);
 return option?.label || ratio;
};

export interface SeriesPurchase {
 id: string;
 seriesId: string;
 userId: string;
 purchasePrice: number;
 razorpayPaymentId?: string;
 razorpayOrderId?: string;
 status: "pending" | "completed" | "failed" | "refunded";
 purchasedAt: Date;
 expiresAt?: Date;
 metadata?: Record<string, any>;
 createdAt: Date;
 updatedAt: Date;
}

export interface SeriesProgress {
 id: string;
 seriesId: string;
 userId: string;
 currentVideoId?: string;
 videosWatched: number;
 totalVideos: number;
 progressPercentage: number;
 lastWatchedAt: Date;
 completedAt?: Date;
 createdAt: Date;
 updatedAt: Date;
}

export interface SeriesAccess {
 hasAccess: boolean;
 purchaseDate?: Date;
 expiresAt?: Date;
 progress?: SeriesProgress;
}

export interface SeriesSearchResult {
 id: string;
 title: string;
 description?: string;
 thumbnailUrl?: string;
 totalPrice: number;
 videoCount: number;
 viewCount: number;
 category: string;
 tags: string[];
 creator: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 createdAt: Date;

 isFollowing?: boolean;
}

export interface VideoSearchResult {
 id: string;
 title: string;
 description?: string;
 thumbnailUrl: string;
 duration: number;
 creditCost: number;
 category: string;
 tags: string[];
 viewCount: number;
 aspectRatio: AspectRatio;
 creator: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 series?: {
 id: string;
 title: string;
 };
 createdAt: Date;

 hasAccess?: boolean;
 isFollowing?: boolean;
}

export interface FeaturedContent {
 id: string;
 type: 'video' | 'series';
 title: string;
 description: string;
 imageUrl: string;
 creatorName: string;
 creatorAvatar: string;
 category: string;
 href: string;
}

export interface TrendingCreator {
 id: string;
 username: string;
 displayName: string;
 avatar: string;
 followerCount: number;
 videoCount: number;
 seriesCount?: number;
 category: string;
 isVerified?: boolean;
 trendingScore?: number;
}

export interface TrendingShow {
 id: string;
 type: 'video' | 'series';
 title: string;
 thumbnailUrl: string;
 creatorName: string;
 creatorId: string;
 viewCount: number;
 rating?: number;
 duration?: number;
 videoCount?: number; // for series
 price: number;
 category: string;
 trendingScore?: number;
}

export interface LandingPageData {
 featuredContent: FeaturedContent[];
 trendingCreators: TrendingCreator[];
 trendingShows: TrendingShow[];
 categories: CategoryWithCounts[];
 features: Feature[];
}

export interface Feature {
 id: string;
 title: string;
 description: string;
 iconUrl: string;
 order: number;
}

export interface SeriesError {
 code: 'SERIES_NOT_FOUND' | 'ACCESS_DENIED' | 'INVALID_PRICE' | 'VIDEO_LIMIT_EXCEEDED' | 'PROCESSING_ERROR';
 message: string;
 details?: Record<string, any>;
}

export interface VideoError {
 code: 'VIDEO_NOT_FOUND' | 'INVALID_ASPECT_RATIO' | 'PROCESSING_FAILED' | 'UPLOAD_ERROR';
 message: string;
 details?: Record<string, any>;
}

export interface SeriesApiResponse<T = any> {
 success: boolean;
 data?: T;
 error?: SeriesError;
 message?: string;
}

export interface VideoApiResponse<T = any> {
 success: boolean;
 data?: T;
 error?: VideoError;
 message?: string;
}

export interface PaginatedResponse<T> {
 items: T[];
 pagination: {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
 hasNext: boolean;
 hasPrev: boolean;
 };
}

export type PaginatedSeries = PaginatedResponse<SeriesWithRelations>;
export type PaginatedVideos = PaginatedResponse<VideoWithRelations>;
export type PaginatedCategories = PaginatedResponse<CategoryWithCounts>;