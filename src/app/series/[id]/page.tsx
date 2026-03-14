

import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/database';
import { series, users, creatorProfiles, videos, seriesVideos } from '@/lib/database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { seriesAccessService } from '@/lib/services/seriesAccessService';
import SeriesDetailClient from './SeriesDetailClient';

interface SeriesDetailPageProps {
 params: Promise<{
 id: string;
 }>;
}

function SeriesDetailLoading() {
 return (
 <div className="max-w-7xl mx-auto px-4 py-8">
 <div className="animate-pulse">
 <div className="aspect-video bg-neutral-light-gray rounded-lg mb-6" />
 <div className="h-8 bg-neutral-light-gray rounded w-3/4 mb-4" />
 <div className="h-4 bg-neutral-light-gray rounded w-1/2 mb-8" />
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-4">
 <div className="h-4 bg-neutral-light-gray rounded" />
 <div className="h-4 bg-neutral-light-gray rounded" />
 <div className="h-4 bg-neutral-light-gray rounded w-5/6" />
 </div>
 <div className="space-y-4">
 <div className="h-32 bg-neutral-light-gray rounded" />
 <div className="h-64 bg-neutral-light-gray rounded" />
 </div>
 </div>
 </div>
 </div>
 );
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
 const { id: seriesId } = await params;

 const { userId: clerkUserId } = await auth();

 const seriesData = await db
 .select({
 id: series.id,
 creatorId: series.creatorId,
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 totalPrice: series.totalPrice,
 coinPrice: series.coinPrice,
 videoCount: series.videoCount,
 totalDuration: series.totalDuration,
 category: series.category,
 tags: series.tags,
 viewCount: series.viewCount,
 totalEarnings: series.totalEarnings,
 isActive: series.isActive,
 moderationStatus: series.moderationStatus,
 moderationReason: series.moderationReason,
 moderatedAt: series.moderatedAt,
 moderatedBy: series.moderatedBy,
 createdAt: series.createdAt,
 updatedAt: series.updatedAt,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(eq(series.id, seriesId))
 .limit(1);

 if (seriesData.length === 0) {
 notFound();
 }

 const seriesInfo = seriesData[0];

 if (!seriesInfo.isActive || seriesInfo.moderationStatus !== 'approved') {

 if (!clerkUserId) {
 notFound();
 }

 const [currentUser] = await db
 .select()
 .from(users)
 .where(eq(users.clerkId, clerkUserId))
 .limit(1);

 if (!currentUser || (currentUser.id !== seriesInfo.creatorId && currentUser.role !== 'admin')) {
 notFound();
 }
 }

 const seriesVideosList = await db
 .select({
 id: seriesVideos.id,
 seriesId: seriesVideos.seriesId,
 videoId: seriesVideos.videoId,
 orderIndex: seriesVideos.orderIndex,
 createdAt: seriesVideos.createdAt,
 videoTitle: videos.title,
 videoDescription: videos.description,
 videoUrl: videos.videoUrl,
 videoThumbnailUrl: videos.thumbnailUrl,
 videoDuration: videos.duration,
 videoCoinPrice: videos.coinPrice,
 videoCategory: videos.category,
 videoTags: videos.tags,
 videoViewCount: videos.viewCount,
 videoIsActive: videos.isActive,
 videoCreatedAt: videos.createdAt,
 })
 .from(seriesVideos)
 .innerJoin(videos, eq(seriesVideos.videoId, videos.id))
 .where(and(
 eq(seriesVideos.seriesId, seriesId),
 eq(videos.isActive, true)
 ))
 .orderBy(asc(seriesVideos.orderIndex));

 let hasAccess = false;
 let accessType: 'series_purchase' | 'creator_access' | 'video_purchase' | undefined;
 let priceCalculation = null;
 let userId: string | undefined;

 if (clerkUserId) {
 const [currentUser] = await db
 .select()
 .from(users)
 .where(eq(users.clerkId, clerkUserId))
 .limit(1);

 if (currentUser) {
 userId = currentUser.id;

 const accessResult = await seriesAccessService.checkSeriesAccess({
 userId: currentUser.id,
 seriesId
 });

 hasAccess = accessResult.hasAccess;
 accessType = accessResult.accessType;

 if (!hasAccess) {
 priceCalculation = await seriesAccessService.calculateAdjustedPrice({
 userId: currentUser.id,
 seriesId
 });
 }
 }
 }

 const formattedSeries = {
 id: seriesInfo.id,
 creatorId: seriesInfo.creatorId,
 title: seriesInfo.title,
 description: seriesInfo.description || undefined,
 thumbnailUrl: seriesInfo.thumbnailUrl || undefined,
 totalPrice: parseFloat(seriesInfo.totalPrice || '0'),
 coinPrice: seriesInfo.coinPrice ?? 0,
 videoCount: seriesInfo.videoCount,
 totalDuration: seriesInfo.totalDuration,
 category: seriesInfo.category,
 tags: Array.isArray(seriesInfo.tags) ? seriesInfo.tags : [],
 viewCount: seriesInfo.viewCount,
 totalEarnings: parseFloat(seriesInfo.totalEarnings),
 isActive: seriesInfo.isActive,
 moderationStatus: seriesInfo.moderationStatus,
 moderationReason: seriesInfo.moderationReason || undefined,
 moderatedAt: seriesInfo.moderatedAt || undefined,
 moderatedBy: seriesInfo.moderatedBy || undefined,
 createdAt: seriesInfo.createdAt,
 updatedAt: seriesInfo.updatedAt,
 creator: {
 id: seriesInfo.creatorId,
 username: seriesInfo.creatorUsername || 'creator',
 displayName: seriesInfo.creatorDisplayName || seriesInfo.creatorUsername || 'Creator',
 avatar: seriesInfo.creatorAvatar || undefined,
 },
 videos: seriesVideosList.map((sv) => ({
 id: sv.id,
 seriesId: sv.seriesId,
 videoId: sv.videoId,
 orderIndex: sv.orderIndex,
 createdAt: sv.createdAt,
 video: {
 id: sv.videoId,
 title: sv.videoTitle,
 description: sv.videoDescription || undefined,
 videoUrl: sv.videoUrl,
 thumbnailUrl: sv.videoThumbnailUrl,
 duration: sv.videoDuration,
 coinPrice: sv.videoCoinPrice,
 category: sv.videoCategory,
 tags: Array.isArray(sv.videoTags) ? sv.videoTags : [],
 viewCount: sv.videoViewCount,
 isActive: sv.videoIsActive,
 createdAt: sv.videoCreatedAt,
 },
 })),
 };

 return (
 <Suspense fallback={<SeriesDetailLoading />}>
 <SeriesDetailClient
 series={formattedSeries}
 hasAccess={hasAccess}
 accessType={accessType}
 priceCalculation={priceCalculation}
 userId={userId}
 isAuthenticated={!!clerkUserId}
 />
 </Suspense>
 );
}

export async function generateMetadata({ params }: SeriesDetailPageProps) {
 const { id: seriesId } = await params;

 const seriesData = await db
 .select({
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 creatorDisplayName: creatorProfiles.displayName,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(eq(series.id, seriesId))
 .limit(1);

 if (seriesData.length === 0) {
 return {
 title: 'Series Not Found',
 };
 }

 const seriesInfo = seriesData[0];

 return {
 title: `${seriesInfo.title} - Crensa`,
 description: seriesInfo.description || `Watch ${seriesInfo.title} by ${seriesInfo.creatorDisplayName || 'creator'} on Crensa`,
 openGraph: {
 title: seriesInfo.title,
 description: seriesInfo.description || undefined,
 images: seriesInfo.thumbnailUrl ? [seriesInfo.thumbnailUrl] : [],
 },
 };
}
