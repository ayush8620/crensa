
export * from "./database";

export interface FeatureItem {
 icon: string;
 title: string;
 description: string;
}

export interface Testimonial {
 name: string;
 role: "creator" | "viewer";
 avatar: string;
 content: string;
 rating: number;
}

export interface FAQItem {
 question: string;
 answer: string;
 category: "general" | "creator" | "viewer" | "payment";
}

export interface HeroContent {
 backgroundVideo: string;
 headline: string;
 subheadline: string;
 ctaText: string;
 ctaLink: string;
}

export interface SocialLink {
 name: string;
 url: string;
 icon: string;
}

export interface FooterLink {
 label: string;
 href: string;
}

export interface FooterSection {
 title: string;
 links: FooterLink[];
}

export interface FooterContent {
 tagline: string;
 description: string;
 contactEmail: string;
 socialLinks: SocialLink[];
 sections: FooterSection[];
 finalCta: {
 title: string;
 description: string;
 buttonText: string;
 buttonLink: string;
 };
 legal: {
 copyright: string;
 links: FooterLink[];
 };
}

export interface WhyCrensaSection {
 title: string;
 subtitle?: string;
 features: FeatureItem[];
}

export interface WhyJoinNowSection {
 title: string;
 benefits: string[];
 ctaText: string;
 ctaLink: string;
}

export interface HowItWorksSection {
 title: string;
 steps: FeatureItem[];
}

export interface TestimonialsSection {
 title: string;
 items: Testimonial[];
}

export interface FAQSection {
 title: string;
 items: FAQItem[];
}

export interface EnvironmentConfig {
 baseUrl: string;
 creatorSignupUrl: string;
 earlyAccessUrl: string;
 loginUrl: string;
 signupUrl: string;
 supportEmail: string;
 socialLinks: {
 twitter: string;
 instagram: string;
 tiktok: string;
 youtube: string;
 };
 features: {
 enableEarlyAccess: boolean;
 showFounderBenefits: boolean;
 enableTestimonials: boolean;
 };
}

export interface ContentValidationError {
 field: string;
 message: string;
 section: string;
}

export interface ContentValidationResult {
 isValid: boolean;
 errors: ContentValidationError[];
}

export type AspectRatio =
 | "1:1"
 | "16:9"
 | "9:16"
 | "2:3"
 | "3:2"
 | "4:5"
 | "5:4";

export interface AspectRatioOption {
 value: AspectRatio;
 label: string;
 description: string;
 isVertical: boolean;
}

export interface Series {
 id: string;
 creatorId: string;
 title: string;
 description?: string;
 thumbnailUrl?: string;
 totalPrice: number; // Deprecated - kept for backward compatibility
 coinPrice: number; // Deprecated - series is now a free container
 videoCount: number;
 totalDuration: number; // in seconds
 category: string;
 tags: string[];
 viewCount: number;
 totalEarnings: number; // Sum of all video earnings in the series
 isActive: boolean;
 moderationStatus: "pending" | "approved" | "rejected" | "flagged";
 moderationReason?: string;
 moderatedAt?: Date;
 moderatedBy?: string;
 createdAt: Date;
 updatedAt: Date;

 creator?: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 videos?: SeriesVideo[];
}

export interface SeriesVideo {
 id: string;
 seriesId: string;
 videoId: string;
 orderIndex: number;
 createdAt: Date;

 video?: Video;
 series?: Series;
}

export interface Category {
 id: string;
 name: string;
 slug: string;
 description?: string;
 iconUrl?: string;
 videoCount: number;
 seriesCount: number;
 isActive: boolean;
 displayOrder: number;
 createdAt: Date;
 updatedAt: Date;
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
 moderationStatus: "pending" | "approved" | "rejected" | "flagged";
 createdAt: Date;
}

export interface Video {
 id: string;
 creatorId: string;
 title: string;
 description?: string;
 videoUrl: string;
 thumbnailUrl: string;
 duration: number;
 creditCost: number; // Deprecated - use coinPrice
 coinPrice: number; // New coin-based pricing (1-2000 coins)
 category: string;
 tags: string[];
 viewCount: number;
 totalEarnings: number;
 isActive: boolean;
 aspectRatio: AspectRatio;
 seriesId?: string;
 createdAt: Date;
 updatedAt: Date;
 creator?: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 series?: Series;
}

export interface VideoUploadProps {
 onUploadComplete: (video: Video) => void;
 maxFileSize?: number;
 acceptedFormats?: string[];
}

export interface UploadState {
 file: File | null;
 uploadProgress: number;
 isProcessing: boolean;
 error: string | null;
 isUploading: boolean;
}

export interface VideoMetadata {
 title: string;
 description: string;
 category: string;
 tags: string[];
 creditCost: number; // Deprecated - use coinPrice
 coinPrice: number; // New coin-based pricing (1-2000 coins)
 aspectRatio: AspectRatio;
 seriesId?: string;
}

export interface CloudinaryUploadResponse {
 public_id: string;
 secure_url: string;
 duration: number;
 format: string;
 resource_type: string;
 bytes: number;
}

export interface VideoShare {
 id: string;
 videoId: string;
 creatorId: string;
 shareToken: string;
 platform?:
 | "direct"
 | "twitter"
 | "facebook"
 | "whatsapp"
 | "telegram"
 | "linkedin"
 | "qr";
 clickCount: number;
 viewCount: number;
 conversionCount: number;
 lastAccessedAt?: Date;
 isActive: boolean;
 createdAt: Date;
 updatedAt: Date;
}

export interface ShareAnalytics {
 totalAnalytics: {
 clickCount: number;
 viewCount: number;
 conversionCount: number;
 };
 platformAnalytics: Record<
 string,
 {
 clickCount: number;
 viewCount: number;
 conversionCount: number;
 }
 >;
 shares: Array<{
 id: string;
 shareToken: string;
 platform?: string;
 clickCount: number;
 viewCount: number;
 conversionCount: number;
 lastAccessedAt?: Date;
 createdAt: Date;
 }>;
}

export interface VideoPreview {
 id: string;
 title: string;
 description?: string;
 thumbnailUrl: string;
 duration: number;
 creditCost: number;
 category: string;
 tags: string[];
 viewCount: number;
 creator: {
 id: string;
 username: string;
 displayName: string;
 avatar?: string;
 };
 shareToken: string;
}

export interface CreditDeductionResult {
 success: boolean;
 newBalance: number;
 transactionId?: string;
 error?: string;
 alreadyWatched?: boolean;
}

export interface ViewingSession {
 videoId: string;
 userId: string;
 creditsCost: number;
 startedAt: Date;
 completedAt?: Date;
 transactionId: string;
}

export interface WalletBalance {
 balance: number;
 lastUpdated: Date;
 pendingTransactions: number;
}

export interface InsufficientCreditsError {
 required: number;
 available: number;
 shortfall: number;
}

export interface ViewingHistoryEntry {
 id: string;
 videoId: string;
 video: {
 id: string;
 title: string;
 thumbnailUrl: string;
 duration: number;
 creator: {
 username: string;
 displayName: string;
 };
 };
 creditsCost: number;
 watchedAt: Date;
 completedAt?: Date;
 transactionId: string;
}

export interface MembershipPlan {
 id: string;
 name: string;
 description: string;
 price: number;
 duration: number; // in days
 features: string[];
 isPopular?: boolean;
 discountPercentage?: number;
 originalPrice?: number;
}

export interface MembershipBenefit {
 icon: string;
 title: string;
 description: string;
 isPremiumOnly?: boolean;
}

export interface MembershipStatus {
 status: "free" | "premium";
 expiry?: Date;
 daysRemaining?: number;
 autoRenew?: boolean;
 plan?: MembershipPlan;
}

export interface ExclusiveContent {
 id: string;
 title: string;
 description: string;
 type: "video" | "series" | "live_event";
 thumbnailUrl: string;
 creatorId: string;
 creator: {
 username: string;
 displayName: string;
 avatar?: string;
 };
 requiredMembership: "premium";
 isNew?: boolean;
 releaseDate: Date;
}

export interface MembershipUpgradeOptions {
 currentPlan: "free" | "premium";
 availablePlans: MembershipPlan[];
 prorationAmount?: number;
 nextBillingDate?: Date;
}

export interface FeaturedContent {
 id: string;
 type: "video" | "series";
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
 category: string;
 isVerified?: boolean;
}

export interface TrendingShow {
 id: string;
 type: "video" | "series";
 title: string;
 thumbnailUrl: string;
 creatorName: string;
 creatorId: string;
 viewCount: number;
 rating?: number;
 duration?: number;
 videoCount?: number; // for series
 price: number;
 trendingScore: number;
 recentViews: number;
 category: string;
}

export interface LandingPageData {
 featuredContent: FeaturedContent[];
 trendingCreators: TrendingCreator[];
 trendingShows: TrendingShow[];
 categories: Category[];
 features: Feature[];
}

export interface Feature {
 id: string;
 title: string;
 description: string;
 iconUrl: string;
 order: number;
}

export interface LandingPageContent {
 hero: HeroContent;
 whyCrensa: WhyCrensaSection;
 whyJoinNow: WhyJoinNowSection;
 howItWorks: HowItWorksSection;
 testimonials: TestimonialsSection;
 faq: FAQSection;
 footer: FooterContent;
}
