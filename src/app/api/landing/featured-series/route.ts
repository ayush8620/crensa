

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/connection";
import { series, users, creatorProfiles } from "@/lib/database/schema";
import { desc, and, eq, gte } from "drizzle-orm";
import { CacheService } from "@/lib/services/cacheService";

interface FeaturedSeries {
 id: string;
 title: string;
 description: string;
 thumbnailUrl: string;
 episodeCount: number;
 creatorName: string;
 creatorAvatar: string;
 creatorId: string;
 category: string;
 tags: string[];
 price: number;
 viewCount: number;
 href: string;
}

async function getFeaturedSeriesFromDB(): Promise<{
 main: FeaturedSeries | null;
 side: FeaturedSeries[];
}> {
 try {

 const thirtyDaysAgo = new Date();
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

 const featuredSeriesList = await db
 .select({
 id: series.id,
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 videoCount: series.videoCount,
 totalPrice: series.totalPrice,
 category: series.category,
 tags: series.tags,
 viewCount: series.viewCount,
 creatorName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 creatorId: series.creatorId,
 createdAt: series.createdAt,
 })
 .from(series)
 .innerJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId)) // leftJoin: series must not vanish if creator profile row is missing
 .where(
 and(
 eq(series.isActive, true),
 eq(series.moderationStatus, "approved"),
 eq(users.isActive, true),
 eq(users.isSuspended, false),
 gte(series.createdAt, thirtyDaysAgo)
 )
 )
 .orderBy(desc(series.viewCount), desc(series.createdAt))
 .limit(3);

 const transformedSeries: FeaturedSeries[] = featuredSeriesList.map((s) => ({
 id: s.id,
 title: s.title,
 description: s.description || "",
 thumbnailUrl: s.thumbnailUrl || "",
 episodeCount: s.videoCount,
 creatorName: s.creatorName || "Creator",
 creatorAvatar: s.creatorAvatar || "",
 creatorId: s.creatorId,
 category: s.category,
 tags: (s.tags as string[]) || [],
 price: parseFloat((s.totalPrice || '0').toString()),
 viewCount: s.viewCount,
 href: `/series/${s.id}`,
 }));

 return {
 main: transformedSeries[0] || null,
 side: transformedSeries.slice(1),
 };
 } catch (error) {
 console.error("Error fetching featured series:", error);
 throw new Error("Failed to fetch featured series");
 }
}

export async function GET(request: NextRequest) {
 try {
 const cacheKey = "landing:featured-series";

 const cached = CacheService.get<{
 main: FeaturedSeries | null;
 side: FeaturedSeries[];
 }>(cacheKey);

 let featuredData;
 if (cached) {
 featuredData = cached;
 } else {
 featuredData = await getFeaturedSeriesFromDB();
 CacheService.set(cacheKey, featuredData, CacheService.CACHE_TTL.FEATURED_CONTENT);
 }

 return NextResponse.json({
 success: true,
 data: featuredData,
 metadata: {
 calculatedAt: new Date().toISOString(),
 cached: !!cached,
 },
 });
 } catch (error) {
 console.error("Error in featured-series endpoint:", error);

 return NextResponse.json(
 {
 error: "Failed to fetch featured series",
 success: false,
 },
 { status: 500 }
 );
 }
}
