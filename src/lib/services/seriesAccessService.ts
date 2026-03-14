

import { db } from '../database/connection';
import { 
 series,
 seriesPurchases,
 videos,
 transactions,
 type Series,
 type SeriesPurchase,
 type Video,
 type NewSeriesPurchase
} from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface AccessResult {
 hasAccess: boolean;
 accessType?: 'series_purchase' | 'video_purchase' | 'creator_access';
 purchaseDate?: Date;
 seriesPurchaseId?: string;
}

export interface OwnedVideo {
 videoId: string;
 title: string;
 coinPrice: number;
}

export interface PriceCalculation {
 originalPrice: number;
 ownedVideos: OwnedVideo[];
 totalDeduction: number;
 adjustedPrice: number;
 allVideosOwned: boolean;
}

export interface SeriesAccessParams {
 userId: string;
 seriesId: string;
}

export interface VideoAccessParams {
 userId: string;
 videoId: string;
}

export interface GrantSeriesAccessParams {
 userId: string;
 seriesId: string;
 purchasePrice: number;
 paymentId?: string;
 razorpayOrderId?: string;
 metadata?: any;
}

export interface SeriesAccessResult {
 success: boolean;
 seriesPurchase?: SeriesPurchase;
 error?: string;
}

export class SeriesAccessService {
 
 async checkSeriesAccess(params: SeriesAccessParams): Promise<AccessResult> {
 try {
 const { userId, seriesId } = params;

 const seriesDataResult = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
 const seriesData = seriesDataResult[0];

 if (seriesData && seriesData.creatorId === userId) {
 return {
 hasAccess: true,
 accessType: 'creator_access'
 };
 }

 const seriesPurchaseResult = await db.select().from(seriesPurchases).where(and(
 eq(seriesPurchases.userId, userId),
 eq(seriesPurchases.seriesId, seriesId),
 eq(seriesPurchases.status, 'completed')
 )).limit(1);
 const seriesPurchase = seriesPurchaseResult[0];

 if (seriesPurchase) {
 return {
 hasAccess: true,
 accessType: 'series_purchase',
 purchaseDate: seriesPurchase.purchasedAt,
 seriesPurchaseId: seriesPurchase.id
 };
 }

 return { hasAccess: false };
 } catch (error) {
 console.error('[SeriesAccess] Error checking series access:', error);
 return { hasAccess: false };
 }
 }

 async checkVideoAccess(params: VideoAccessParams): Promise<AccessResult> {
 try {
 const { userId, videoId } = params;

 const videoResult = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
 const video = videoResult[0];

 if (!video) {
 console.error('[SeriesAccess] Video not found:', videoId);
 return { hasAccess: false };
 }

 if (video.creatorId === userId) {
 return {
 hasAccess: true,
 accessType: 'creator_access'
 };
 }

 if (video.seriesId) {
 const seriesAccess = await this.checkSeriesAccess({
 userId,
 seriesId: video.seriesId
 });

 if (seriesAccess.hasAccess && seriesAccess.accessType === 'series_purchase') {
 return seriesAccess;
 }
 }

 const videoPurchaseResult = await db.select().from(transactions).where(and(
 eq(transactions.userId, userId),
 eq(transactions.videoId, videoId),
 eq(transactions.type, 'video_view'),
 eq(transactions.status, 'completed')
 )).limit(1);
 const videoPurchase = videoPurchaseResult[0];

 if (videoPurchase) {
 return {
 hasAccess: true,
 accessType: 'video_purchase',
 purchaseDate: videoPurchase.createdAt
 };
 }

 return { hasAccess: false };
 } catch (error) {
 console.error('[SeriesAccess] Error checking video access:', error);
 return { hasAccess: false };
 }
 }

 async calculateAdjustedPrice(params: SeriesAccessParams): Promise<PriceCalculation> {
 try {
 const { userId, seriesId } = params;

 const seriesDataResult = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
 const seriesData = seriesDataResult[0];

 if (!seriesData) {
 throw new Error('Series not found');
 }

 const seriesVideos = await db.select().from(videos).where(eq(videos.seriesId, seriesId));

 const ownedVideos: OwnedVideo[] = [];
 let totalDeduction = 0;

 for (const video of seriesVideos) {
 const purchaseResult = await db.select().from(transactions).where(and(
 eq(transactions.userId, userId),
 eq(transactions.videoId, video.id),
 eq(transactions.type, 'video_view'),
 eq(transactions.status, 'completed')
 )).limit(1);
 const purchase = purchaseResult[0];

 if (purchase) {
 ownedVideos.push({
 videoId: video.id,
 title: video.title,
 coinPrice: video.coinPrice
 });
 totalDeduction += video.coinPrice;
 }
 }

 const seriesCoinPrice = seriesData.coinPrice ?? 0;
 const adjustedPrice = Math.max(0, seriesCoinPrice - totalDeduction);

 const allVideosOwned = seriesVideos.length > 0 && ownedVideos.length === seriesVideos.length;

 const result: PriceCalculation = {
 originalPrice: seriesCoinPrice,
 ownedVideos,
 totalDeduction,
 adjustedPrice,
 allVideosOwned
 };

 console.log('[SeriesAccess] Price calculation:', {
 seriesId,
 userId,
 originalPrice: result.originalPrice,
 ownedVideosCount: ownedVideos.length,
 totalDeduction,
 adjustedPrice,
 allVideosOwned
 });

 return result;
 } catch (error) {
 console.error('[SeriesAccess] Error calculating adjusted price:', error);
 throw error;
 }
 }

 async grantSeriesAccess(params: GrantSeriesAccessParams): Promise<SeriesAccessResult> {
 try {
 const { userId, seriesId, purchasePrice, paymentId, razorpayOrderId, metadata } = params;

 const seriesDataResult = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
 const seriesData = seriesDataResult[0];

 if (!seriesData) {
 return {
 success: false,
 error: 'Series not found'
 };
 }

 if (!seriesData.isActive) {
 return {
 success: false,
 error: 'Series is not active'
 };
 }

 const existingPurchaseResult = await db.select().from(seriesPurchases).where(and(
 eq(seriesPurchases.userId, userId),
 eq(seriesPurchases.seriesId, seriesId),
 eq(seriesPurchases.status, 'completed')
 )).limit(1);
 const existingPurchase = existingPurchaseResult[0];

 if (existingPurchase) {
 return {
 success: false,
 error: 'Series already purchased'
 };
 }

 const purchaseData: NewSeriesPurchase = {
 seriesId,
 userId,
 purchasePrice: purchasePrice.toString(),
 razorpayPaymentId: paymentId,
 razorpayOrderId,
 status: 'completed',
 purchasedAt: new Date(),
 metadata,
 createdAt: new Date(),
 updatedAt: new Date()
 };

 const [seriesPurchase] = await db
 .insert(seriesPurchases)
 .values(purchaseData)
 .returning();

 console.log('[SeriesAccess] Series access granted:', {
 seriesPurchaseId: seriesPurchase.id,
 userId,
 seriesId,
 purchasePrice
 });

 return {
 success: true,
 seriesPurchase
 };
 } catch (error) {
 console.error('[SeriesAccess] Error granting series access:', error);
 return {
 success: false,
 error: error instanceof Error ? error.message : 'Failed to grant series access'
 };
 }
 }

 async ownsAllSeriesVideos(params: SeriesAccessParams): Promise<boolean> {
 try {
 const priceCalculation = await this.calculateAdjustedPrice(params);
 return priceCalculation.allVideosOwned;
 } catch (error) {
 console.error('[SeriesAccess] Error checking if owns all videos:', error);
 return false;
 }
 }

 async getUnownedSeriesVideos(params: SeriesAccessParams): Promise<Video[]> {
 try {
 const { userId, seriesId } = params;

 const seriesVideos = await db.select().from(videos).where(eq(videos.seriesId, seriesId));

 const unownedVideos: Video[] = [];

 for (const video of seriesVideos) {
 const purchaseResult = await db.select().from(transactions).where(and(
 eq(transactions.userId, userId),
 eq(transactions.videoId, video.id),
 eq(transactions.type, 'video_view'),
 eq(transactions.status, 'completed')
 )).limit(1);
 const purchase = purchaseResult[0];

 if (!purchase) {
 unownedVideos.push(video);
 }
 }

 return unownedVideos;
 } catch (error) {
 console.error('[SeriesAccess] Error getting unowned videos:', error);
 return [];
 }
 }

 async verifySeriesPurchase(seriesPurchaseId: string): Promise<boolean> {
 try {
 const purchaseResult = await db.select().from(seriesPurchases).where(and(
 eq(seriesPurchases.id, seriesPurchaseId),
 eq(seriesPurchases.status, 'completed')
 )).limit(1);
 const purchase = purchaseResult[0];

 return !!purchase;
 } catch (error) {
 console.error('[SeriesAccess] Error verifying series purchase:', error);
 return false;
 }
 }
}

export const seriesAccessService = new SeriesAccessService();
