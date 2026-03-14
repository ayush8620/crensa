

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/connection";
import { videos, series, users, creatorProfiles } from "@/lib/database/schema";
import { desc, and, eq, sql, or } from "drizzle-orm";
import { CacheService } from "@/lib/services/cacheService";
import { getCategoryNameFromSlug } from "@/lib/utils/category-utils";

interface UnifiedContent {
 id: string;
 type: "series" | "video";
 title: string;
 description: string;
 thumbnailUrl: string;
 creatorName: string;
 creatorAvatar: string;
 creatorId: string;
 category: string;
 tags: string[];

 episodeCount?: number;

 duration?: number;
 viewCount: number;
 price: number;
 href: string;
}

async function getUnifiedContentFromDB(
 category: string,
 limit: number
): Promise<UnifiedContent[]> {
 try {
 const allContent: UnifiedContent[] = [];

 let categoryFilter: string | undefined = undefined;
 if (category !== "all") {
 const categoryName = getCategoryNameFromSlug(category);

 if (!categoryName) {
 console.warn(`Category not found for slug: ${category}`);
 return [];
 }
 
 categoryFilter = categoryName;
 }

 const videosList = await db
 .select({
 id: videos.id,
 title: videos.title,
 description: videos.description,
 thumbnailUrl: videos.thumbnailUrl,
 duration: videos.duration,
 viewCount: videos.viewCount,
 creditCost: videos.creditCost,
 category: videos.category,
 tags: videos.tags,
 creatorName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 creatorId: videos.creatorId,
 createdAt: videos.createdAt,
 })
 .from(videos)
 .innerJoin(users, eq(videos.creatorId, users.id))
 .innerJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(
 and(
 eq(videos.isActive, true),
 eq(videos.moderationStatus, "approved"),
 eq(users.isActive, true),
 eq(users.isSuspended, false),
 sql`${videos.seriesId} IS NULL`, // Only standalone videos
 categoryFilter ? eq(videos.category, categoryFilter) : undefined
 )
 )
 .orderBy(desc(videos.viewCount), desc(videos.createdAt))
 .limit(Math.ceil(limit * 0.6)); // 60% videos

 const seriesList = await db
 .select({
 id: series.id,
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 videoCount: series.videoCount,
 viewCount: series.viewCount,
 totalPrice: series.totalPrice,
 category: series.category,
 tags: series.tags,
 creatorName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 creatorId: series.creatorId,
 createdAt: series.createdAt,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(
 and(
 eq(series.isActive, true),
 eq(series.moderationStatus, "approved"),
 sql`${series.videoCount} > 0`,
 categoryFilter ? eq(series.category, categoryFilter) : undefined
 )
 )
 .orderBy(desc(series.viewCount), desc(series.createdAt))
 .limit(Math.ceil(limit * 0.4)); // 40% series

 videosList.forEach((video) => {
 allContent.push({
 id: video.id,
 type: "video",
 title: video.title,
 description: video.description || "",
 thumbnailUrl: video.thumbnailUrl,
 creatorName: video.creatorName,
 creatorAvatar: video.creatorAvatar || "",
 creatorId: video.creatorId,
 category: video.category,
 tags: (video.tags as string[]) || [],
 duration: video.duration,
 viewCount: video.viewCount,
 price: parseFloat(video.creditCost.toString()),
 href: `/watch/${video.id}`,
 });
 });

 seriesList.forEach((seriesItem) => {
 allContent.push({
 id: seriesItem.id,
 type: "series",
 title: seriesItem.title,
 description: seriesItem.description || "",
 thumbnailUrl: seriesItem.thumbnailUrl || "",
 creatorName: seriesItem.creatorName || "Creator",
 creatorAvatar: seriesItem.creatorAvatar || "",
 creatorId: seriesItem.creatorId,
 category: seriesItem.category,
 tags: (seriesItem.tags as string[]) || [],
 episodeCount: seriesItem.videoCount,
 viewCount: seriesItem.viewCount,
 price: parseFloat((seriesItem.totalPrice || '0').toString()),
 href: `/series/${seriesItem.id}`,
 });
 });

 allContent.sort((a, b) => b.viewCount - a.viewCount);

 return allContent.slice(0, limit);
 } catch (error) {
 console.error("Error fetching unified content:", error);
 throw new Error("Failed to fetch unified content");
 }
}

export async function GET(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url);
 const category = searchParams.get("category") || "all";
 const limit = parseInt(searchParams.get("limit") || "20");

 if (limit < 1 || limit > 100) {
 return NextResponse.json(
 { error: "Limit must be between 1 and 100" },
 { status: 400 }
 );
 }

 const cacheKey = `landing:unified-content:${category}:${limit}`;

 const cached = CacheService.get<UnifiedContent[]>(cacheKey);

 let unifiedContent;
 if (cached) {
 unifiedContent = cached;
 } else {
 unifiedContent = await getUnifiedContentFromDB(category, limit);
 CacheService.set(cacheKey, unifiedContent, 600); // 10 minutes TTL
 }

 return NextResponse.json({
 success: true,
 data: unifiedContent,
 count: unifiedContent.length,
 metadata: {
 category,
 calculatedAt: new Date().toISOString(),
 cached: !!cached,
 },
 });
 } catch (error) {
 console.error("Error in unified-content endpoint:", error);

 return NextResponse.json(
 {
 error: "Failed to fetch unified content",
 success: false,
 },
 { status: 500 }
 );
 }
}
