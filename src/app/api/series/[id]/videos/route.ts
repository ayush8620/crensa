import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import { videos, series, seriesVideos } from "@/lib/database/schema";
import { eq, asc, and, inArray, sql } from "drizzle-orm";
import { CacheService } from "@/lib/services/cacheService";

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id: seriesId } = await params;

 const [seriesData] = await db
 .select()
 .from(series)
 .where(eq(series.id, seriesId))
 .limit(1);

 if (!seriesData) {
 return NextResponse.json(
 { success: false, error: "Series not found" },
 { status: 404 }
 );
 }

 // Fetch videos in the series
 const seriesVideosList = await db
 .select({
 svId: seriesVideos.id,
 svSeriesId: seriesVideos.seriesId,
 svVideoId: seriesVideos.videoId,
 svOrderIndex: seriesVideos.orderIndex,
 svCreatedAt: seriesVideos.createdAt,
 videoId: videos.id,
 videoTitle: videos.title,
 videoDescription: videos.description,
 videoThumbnailUrl: videos.thumbnailUrl,
 videoDuration: videos.duration,
 videoCoinPrice: videos.coinPrice,
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

 return NextResponse.json({
 success: true,
 videos: seriesVideosList.map((sv) => ({
 id: sv.svId,
 videoId: sv.svVideoId,
 seriesId: sv.svSeriesId,
 orderIndex: sv.svOrderIndex,
 createdAt: sv.svCreatedAt,
 video: {
 id: sv.videoId,
 title: sv.videoTitle,
 description: sv.videoDescription,
 thumbnailUrl: sv.videoThumbnailUrl,
 duration: sv.videoDuration,
 coinPrice: sv.videoCoinPrice,
 viewCount: sv.videoViewCount,
 isActive: sv.videoIsActive,
 createdAt: sv.videoCreatedAt,
 },
 })),
 count: seriesVideosList.length,
 });
 } catch (error) {
 console.error("Error fetching series videos:", error);
 return NextResponse.json(
 { success: false, error: "Failed to fetch series videos" },
 { status: 500 }
 );
 }
}

export async function POST(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { userId } = await auth();
 if (!userId) {
 return NextResponse.json(
 { success: false, error: "Unauthorized" },
 { status: 401 }
 );
 }

 const { id: seriesId } = await params;
 const body = await request.json();
 const { videoIds } = body;

 if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
 return NextResponse.json(
 { success: false, error: "Video IDs are required" },
 { status: 400 }
 );
 }

 // Verify series ownership
 const [seriesData] = await db
 .select({ creatorId: series.creatorId })
 .from(series)
 .where(eq(series.id, seriesId))
 .limit(1);

 if (!seriesData) {
 return NextResponse.json(
 { success: false, error: "Series not found" },
 { status: 404 }
 );
 }

 // Get user from database
 const { userRepository } = await import("@/lib/database/repositories/users");
 const user = await userRepository.findByClerkId(userId);

 if (!user || user.id !== seriesData.creatorId) {
 return NextResponse.json(
 { success: false, error: "You don't have permission to edit this series" },
 { status: 403 }
 );
 }

 // Verify all videos belong to the creator
 const videosList = await db
 .select({ id: videos.id, creatorId: videos.creatorId })
 .from(videos)
 .where(
 and(
 inArray(videos.id, videoIds),
 eq(videos.creatorId, user.id)
 )
 );

 if (videosList.length !== videoIds.length) {
 return NextResponse.json(
 { success: false, error: "Some videos not found or don't belong to you" },
 { status: 400 }
 );
 }

 // Get current max order index
 const [maxOrderResult] = await db
 .select({ maxOrder: sql<number>`COALESCE(MAX(${seriesVideos.orderIndex}), -1)` })
 .from(seriesVideos)
 .where(eq(seriesVideos.seriesId, seriesId));

 let nextOrderIndex = (maxOrderResult?.maxOrder ?? -1) + 1;

 // Add videos to series
 const newSeriesVideos = videoIds.map((videoId) => ({
 seriesId,
 videoId,
 orderIndex: nextOrderIndex++,
 }));

 await db.insert(seriesVideos).values(newSeriesVideos);

 // Update series video count and total duration
 const [updatedStats] = await db
 .select({
 count: sql<number>`COUNT(*)::int`,
 totalDuration: sql<number>`COALESCE(SUM(${videos.duration}), 0)::int`,
 })
 .from(seriesVideos)
 .innerJoin(videos, eq(seriesVideos.videoId, videos.id))
 .where(eq(seriesVideos.seriesId, seriesId));

 await db
 .update(series)
 .set({
 videoCount: updatedStats.count,
 totalDuration: updatedStats.totalDuration,
 })
 .where(eq(series.id, seriesId));

 // Invalidate browse/discover cache so updated series appears immediately
 CacheService.deleteByPrefix('landing:unified-content:');

 return NextResponse.json({
 success: true,
 message: `${videoIds.length} video(s) added to series`,
 addedCount: videoIds.length,
 });
 } catch (error) {
 console.error("Error adding videos to series:", error);
 return NextResponse.json(
 { success: false, error: "Failed to add videos to series" },
 { status: 500 }
 );
 }
}
