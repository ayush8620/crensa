

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userRepository } from "@/lib/database/repositories/users";
import { db } from "@/lib/database/connection";
import { videos, users, creatorProfiles } from "@/lib/database/schema";
import {
 eq,
 desc,
 asc,
 and,
 like,
 or,
 sql,
 gte,
} from "drizzle-orm";
import { getCategoryNameFromSlug } from "@/lib/utils/category-utils";

export async function GET(request: NextRequest) {
 try {

 const { userId } = await auth();
 if (!userId) {
 return NextResponse.json(
 { success: false, error: "Authentication required" },
 { status: 401 }
 );
 }

 const user = await userRepository.findByClerkId(userId);
 if (!user) {
 return NextResponse.json(
 { success: false, error: "User not found" },
 { status: 404 }
 );
 }

 const { searchParams } = new URL(request.url);

 const page = parseInt(searchParams.get("page") || "1");
 const limit = parseInt(searchParams.get("limit") || "12");
 const search = searchParams.get("search");
 const category = searchParams.get("category");
 const sortBy = searchParams.get("sortBy") || "recent";
 const duration = searchParams.get("duration");
 const minCredits = parseInt(searchParams.get("minCredits") || "0");
 const maxCredits = parseInt(searchParams.get("maxCredits") || "100");

 console.log('Discover API - Request params:', {
 page,
 limit,
 search,
 category,
 sortBy,
 duration,
 minCredits,
 maxCredits
 });

 let whereConditions = [
    eq(videos.isActive, true),
    eq(videos.moderationStatus, "approved"),
  ];

 if (search) {
 whereConditions.push(
 or(
 like(videos.title, `%${search}%`),
 like(videos.description, `%${search}%`)
 )!
 );
 }

 if (category && category !== "all") {
 const categoryName = getCategoryNameFromSlug(category);
 if (categoryName) {
 console.log(`Filtering by category: ${category} -> ${categoryName}`);
 whereConditions.push(eq(videos.category, categoryName));
 }
 }

 if (duration) {
 switch (duration) {
 case "short":
 whereConditions.push(sql`${videos.duration} < 600`); // < 10 minutes
 break;
 case "medium":
 whereConditions.push(
 and(
 gte(videos.duration, 600),
 sql`${videos.duration} < 1800`
 )!
 ); // 10-30 minutes
 break;
 case "long":
 whereConditions.push(gte(videos.duration, 1800)); // > 30 minutes
 break;
 }
 }

 if (minCredits > 0 || maxCredits < 100) {
 whereConditions.push(
 and(
 sql`${videos.creditCost}::numeric >= ${minCredits}`,
 sql`${videos.creditCost}::numeric <= ${maxCredits}`
 )!
 );
 }

 let orderByClause;
 switch (sortBy) {
 case "recent":
 orderByClause = desc(videos.createdAt);
 break;
 case "popular":
 orderByClause = desc(videos.viewCount);
 break;
 case "credits_low":
 orderByClause = asc(videos.creditCost);
 break;
 case "credits_high":
 orderByClause = desc(videos.creditCost);
 break;
 case "duration_short":
 orderByClause = asc(videos.duration);
 break;
 case "duration_long":
 orderByClause = desc(videos.duration);
 break;
 default:
 orderByClause = desc(videos.createdAt);
 }

 const totalCountResult = await db
 .select({ count: sql<number>`count(*)` })
 .from(videos)
 .innerJoin(users, eq(videos.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(
 whereConditions.length > 1
 ? and(...whereConditions)
 : whereConditions[0]
 );

 const totalCount = Number(totalCountResult[0]?.count) || 0;
 
 console.log('Discover API - Query results:', {
 totalCount,
 whereConditionsCount: whereConditions.length,
 category,
 categoryMapped: category ? (getCategoryNameFromSlug(category) || category) : 'none',
 page,
 limit
 });

 const videoData = await db
 .select({
 id: videos.id,
 title: videos.title,
 description: videos.description,
 thumbnailUrl: videos.thumbnailUrl,
 duration: videos.duration,
 creditCost: videos.creditCost,
 coinPrice: videos.coinPrice,
 category: videos.category,
 tags: videos.tags,
 aspectRatio: videos.aspectRatio,
 viewCount: videos.viewCount,
 createdAt: videos.createdAt,
 creatorId: videos.creatorId,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(videos)
 .innerJoin(users, eq(videos.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(
 whereConditions.length > 1
 ? and(...whereConditions)
 : whereConditions[0]
 )
 .orderBy(orderByClause)
 .limit(limit)
 .offset((page - 1) * limit);

 const transformedVideos = (videoData || []).map((video) => ({
 id: video.id || "",
 creatorId: video.creatorId || "",
 title: video.title || "Untitled",
 description: video.description || "",
 videoUrl: "", // Don't expose video URL in discover API
 thumbnailUrl: video.thumbnailUrl || "/api/placeholder/400/225",
 duration: video.duration || 0,
 creditCost: parseFloat(video.creditCost?.toString() || "0"),
 coinPrice: video.coinPrice ?? 0,
 category: video.category || "general",
 tags: Array.isArray(video.tags) ? video.tags : [],
 aspectRatio: video.aspectRatio || "16:9",
 viewCount: video.viewCount || 0,
 totalEarnings: 0, // Don't expose earnings in discover API
 isActive: true,
 createdAt: video.createdAt || new Date(),
 updatedAt: video.createdAt || new Date(),
 creator: {
 id: video.creatorId || "",
 username: video.creatorUsername || "creator",
 displayName: video.creatorDisplayName || video.creatorUsername || "Creator",
 avatar: video.creatorAvatar || null,
 },
 }));

 const totalPages = Math.ceil(totalCount / limit);

 return NextResponse.json({
 success: true,
 videos: transformedVideos,
 pagination: {
 page,
 limit,
 total: totalCount,
 totalPages,
 hasMore: page < totalPages,
 hasPrev: page > 1,
 },
 filters: {
 search,
 category,
 sortBy,
 duration,
 creditRange: [minCredits, maxCredits],
 },
 });
 } catch (error) {
 console.error("Error fetching discover videos:", error);
 console.error(
 "Error stack:",
 error instanceof Error ? error.stack : "No stack trace"
 );
 return NextResponse.json(
 {
 success: false,
 error: "Failed to fetch videos",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}
