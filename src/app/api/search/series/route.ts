

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import {
 series,
 users,
 creatorProfiles,
} from "@/lib/database";
import { eq, and, or, ilike, gte, lte, desc, asc, count } from "drizzle-orm";
import type { SeriesSearchResult } from "@/types/database";

const VALID_CATEGORIES = [
 "Entertainment",
 "Education",
 "Comedy",
 "Music",
 "Dance",
 "Lifestyle",
 "Technology",
 "Sports",
 "Art",
 "Other",
];

const VALID_SORT_OPTIONS = [
 "newest",
 "oldest",
 "views",
 "price_low",
 "price_high",
 "title",
 "video_count",
];

export async function GET(request: NextRequest) {
 try {

 const { userId } = await auth();

 const { searchParams } = new URL(request.url);
 const query = searchParams.get("q") || "";
 const category = searchParams.get("category") || "";
 const creatorId = searchParams.get("creator") || "";
 const minPrice = parseFloat(searchParams.get("minPrice") || "0");
 const maxPrice = parseFloat(searchParams.get("maxPrice") || "10000");
 const sortBy = searchParams.get("sortBy") || "newest";
 const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
 const offset = parseInt(searchParams.get("offset") || "0");

 if (category && !VALID_CATEGORIES.includes(category)) {
 return NextResponse.json(
 {
 success: false,
 error: "Invalid category",
 validCategories: VALID_CATEGORIES,
 },
 { status: 400 }
 );
 }

 if (!VALID_SORT_OPTIONS.includes(sortBy)) {
 return NextResponse.json(
 {
 success: false,
 error: "Invalid sort option",
 validSortOptions: VALID_SORT_OPTIONS,
 },
 { status: 400 }
 );
 }

 if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
 return NextResponse.json(
 {
 success: false,
 error: "Invalid price range",
 },
 { status: 400 }
 );
 }

 let whereConditions = and(
 eq(series.isActive, true),
 eq(series.moderationStatus, "approved")
 );

 if (query.trim()) {
 const searchCondition = or(
 ilike(series.title, `%${query.trim()}%`),
 ilike(series.description, `%${query.trim()}%`)
 );
 whereConditions = and(whereConditions, searchCondition);
 }

 if (category) {
 whereConditions = and(whereConditions, eq(series.category, category));
 }

 if (creatorId) {
 whereConditions = and(whereConditions, eq(series.creatorId, creatorId));
 }

 if (minPrice > 0 || maxPrice < 10000) {
 const priceCondition = and(
 gte(series.totalPrice, minPrice.toString()),
 lte(series.totalPrice, maxPrice.toString())
 );
 whereConditions = and(whereConditions, priceCondition);
 }

 let orderBy;
 switch (sortBy) {
 case "oldest":
 orderBy = asc(series.createdAt);
 break;
 case "views":
 orderBy = desc(series.viewCount);
 break;
 case "price_low":
 orderBy = asc(series.totalPrice);
 break;
 case "price_high":
 orderBy = desc(series.totalPrice);
 break;
 case "title":
 orderBy = asc(series.title);
 break;
 case "video_count":
 orderBy = desc(series.videoCount);
 break;
 default: // newest
 orderBy = desc(series.createdAt);
 break;
 }

 const searchResults = await db
 .select({
 id: series.id,
 title: series.title,
 description: series.description,
 thumbnailUrl: series.thumbnailUrl,
 totalPrice: series.totalPrice,
 videoCount: series.videoCount,
 viewCount: series.viewCount,
 category: series.category,
 tags: series.tags,
 createdAt: series.createdAt,
 creatorId: series.creatorId,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(whereConditions)
 .orderBy(orderBy)
 .limit(limit)
 .offset(offset);

 const totalCountResult = await db
 .select({ count: count() })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .where(whereConditions);

 const totalCount = totalCountResult[0]?.count || 0;

 const transformedResults: SeriesSearchResult[] = searchResults.map((result) => ({
 id: result.id,
 title: result.title,
 description: result.description || undefined,
 thumbnailUrl: result.thumbnailUrl || undefined,
 totalPrice: parseFloat(result.totalPrice || '0'),
 videoCount: result.videoCount,
 viewCount: result.viewCount,
 category: result.category,
 tags: Array.isArray(result.tags) ? result.tags : [],
 creator: {
 id: result.creatorId,
 username: result.creatorUsername || "creator",
 displayName: result.creatorDisplayName || result.creatorUsername || "Creator",
 avatar: result.creatorAvatar || undefined,
 },
 createdAt: result.createdAt,
 }));

 const totalPages = Math.ceil(totalCount / limit);
 const currentPage = Math.floor(offset / limit) + 1;

 return NextResponse.json({
 success: true,
 results: transformedResults,
 pagination: {
 total: totalCount,
 limit,
 offset,
 page: currentPage,
 totalPages,
 hasMore: offset + limit < totalCount,
 hasPrev: offset > 0,
 },
 filters: {
 query: query.trim(),
 category,
 creatorId,
 minPrice,
 maxPrice,
 sortBy,
 },
 });
 } catch (error) {
 console.error("Series search error:", error);
 return NextResponse.json(
 {
 success: false,
 error: "Failed to search series",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}