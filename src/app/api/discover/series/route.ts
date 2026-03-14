

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import { series, users, creatorProfiles } from "@/lib/database";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
 try {

 const { userId: clerkId } = await auth();
 if (!clerkId) {
 return NextResponse.json(
 { success: false, error: "Authentication required" },
 { status: 401 }
 );
 }

 const { searchParams } = new URL(request.url);
 const limit = parseInt(searchParams.get("limit") || "6");
 const sortBy = searchParams.get("sortBy") || "views"; // views, purchases, newest

 let orderBy;
 switch (sortBy) {
 case "purchases":

 orderBy = desc(series.totalEarnings);
 break;
 case "newest":
 orderBy = desc(series.createdAt);
 break;
 case "views":
 default:
 orderBy = desc(series.viewCount);
 break;
 }

 const popularSeries = await db
 .select({
 id: series.id,
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 coinPrice: series.coinPrice,
 videoCount: series.videoCount,
 totalDuration: series.totalDuration,
 category: series.category,
 tags: series.tags,
 viewCount: series.viewCount,
 totalEarnings: series.totalEarnings,
 createdAt: series.createdAt,
 creatorId: series.creatorId,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(
 and(
 eq(series.isActive, true),
 eq(series.moderationStatus, "approved"),
 sql`${series.videoCount} > 0`, // Only show series that have at least one video
 eq(users.isActive, true),
 eq(users.isSuspended, false)
 )
 )
 .orderBy(orderBy)
 .limit(limit);

 const transformedSeries = popularSeries.map((s) => ({
 id: s.id,
 title: s.title,
 description: s.description,
 thumbnailUrl: s.thumbnailUrl,
 coinPrice: s.coinPrice,
 videoCount: s.videoCount,
 totalDuration: s.totalDuration,
 category: s.category,
 tags: Array.isArray(s.tags) ? s.tags : [],
 viewCount: s.viewCount,
 totalEarnings: parseFloat(s.totalEarnings) || 0,
 createdAt: s.createdAt,
 creator: {
 id: s.creatorId,
 username: s.creatorUsername || "creator",
 displayName: s.creatorDisplayName || s.creatorUsername || "Creator",
 avatar: s.creatorAvatar || undefined,
 },
 }));

 return NextResponse.json({
 success: true,
 series: transformedSeries,
 count: transformedSeries.length,
 });
 } catch (error) {
 console.error("Error fetching popular series:", error);
 return NextResponse.json(
 {
 success: false,
 error: "Failed to fetch popular series",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}
