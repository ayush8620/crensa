

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import {
 series,
 videos,
 users,
 creatorProfiles,
} from "@/lib/database";
import { eq, and, or, ilike, gte, lte, desc, asc, count } from "drizzle-orm";
import type { SeriesSearchResult, VideoSearchResult } from "@/types/database";

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
 "relevance",
];

const VALID_CONTENT_TYPES = ["all", "videos", "series"];

export async function GET(request: NextRequest) {
 try {

 const { userId } = await auth();

 const { searchParams } = new URL(request.url);
 const query = searchParams.get("q") || "";
 const category = searchParams.get("category") || "";
 const creatorId = searchParams.get("creator") || "";
 const contentType = searchParams.get("type") || "all";
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

 if (!VALID_CONTENT_TYPES.includes(contentType)) {
 return NextResponse.json(
 {
 success: false,
 error: "Invalid content type",
 validContentTypes: VALID_CONTENT_TYPES,
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

 let videoResults: VideoSearchResult[] = [];
 let seriesResults: SeriesSearchResult[] = [];
 let totalVideos = 0;
 let totalSeries = 0;

 if (contentType === "all" || contentType === "videos") {

 let videoWhereConditions = and(
 eq(videos.isActive, true),
 eq(videos.moderationStatus, "approved")
 );

 if (query.trim()) {
 const searchCondition = or(
 ilike(videos.title, `%${query.trim()}%`),
 ilike(videos.description, `%${query.trim()}%`)
 );
 videoWhereConditions = and(videoWhereConditions, searchCondition);
 }

 if (category) {
 videoWhereConditions = and(videoWhereConditions, eq(videos.category, category));
 }

 if (creatorId) {
 videoWhereConditions = and(videoWhereConditions, eq(videos.creatorId, creatorId));
 }

 if (minPrice > 0 || maxPrice < 10000) {
 const priceCondition = and(
 gte(videos.creditCost, minPrice.toString()),
 lte(videos.creditCost, maxPrice.toString())
 );
 videoWhereConditions = and(videoWhereConditions, priceCondition);
 }

 let videoOrderBy;
 switch (sortBy) {
 case "oldest":
 videoOrderBy = asc(videos.createdAt);
 break;
 case "views":
 videoOrderBy = desc(videos.viewCount);
 break;
 case "price_low":
 videoOrderBy = asc(videos.creditCost);
 break;
 case "price_high":
 videoOrderBy = desc(videos.creditCost);
 break;
 case "title":
 videoOrderBy = asc(videos.title);
 break;
 default: // newest, relevance
 videoOrderBy = desc(videos.createdAt);
 break;
 }

 const videoSearchResults = await db
 .select({
 id: videos.id,
 title: videos.title,
 description: videos.description,
 thumbnailUrl: videos.thumbnailUrl,
 duration: videos.duration,
 creditCost: videos.creditCost,
 category: videos.category,
 tags: videos.tags,
 viewCount: videos.viewCount,
 aspectRatio: videos.aspectRatio,
 seriesId: videos.seriesId,
 createdAt: videos.createdAt,
 creatorId: videos.creatorId,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(videos)
 .leftJoin(users, eq(videos.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(videoWhereConditions)
 .orderBy(videoOrderBy)
 .limit(contentType === "videos" ? limit : Math.ceil(limit / 2))
 .offset(contentType === "videos" ? offset : Math.floor(offset / 2));

 const totalVideoCountResult = await db
 .select({ count: count() })
 .from(videos)
 .leftJoin(users, eq(videos.creatorId, users.id))
 .where(videoWhereConditions);

 totalVideos = totalVideoCountResult[0]?.count || 0;

 videoResults = videoSearchResults.map((result) => ({
 id: result.id,
 title: result.title,
 description: result.description || undefined,
 thumbnailUrl: result.thumbnailUrl || "/api/placeholder/400/225",
 duration: result.duration,
 creditCost: parseFloat(result.creditCost?.toString() || "0"),
 category: result.category,
 tags: Array.isArray(result.tags) ? result.tags : [],
 viewCount: result.viewCount,
 aspectRatio: result.aspectRatio,
 creator: {
 id: result.creatorId,
 username: result.creatorUsername || "creator",
 displayName: result.creatorDisplayName || result.creatorUsername || "Creator",
 avatar: result.creatorAvatar || undefined,
 },
 series: result.seriesId ? {
 id: result.seriesId,
 title: "Series", // Will be populated in future enhancements
 } : undefined,
 createdAt: result.createdAt,
 }));
 }

 if (contentType === "all" || contentType === "series") {

 let seriesWhereConditions = and(
 eq(series.isActive, true),
 eq(series.moderationStatus, "approved")
 );

 if (query.trim()) {
 const searchCondition = or(
 ilike(series.title, `%${query.trim()}%`),
 ilike(series.description, `%${query.trim()}%`)
 );
 seriesWhereConditions = and(seriesWhereConditions, searchCondition);
 }

 if (category) {
 seriesWhereConditions = and(seriesWhereConditions, eq(series.category, category));
 }

 if (creatorId) {
 seriesWhereConditions = and(seriesWhereConditions, eq(series.creatorId, creatorId));
 }

 if (minPrice > 0 || maxPrice < 10000) {
 const priceCondition = and(
 gte(series.totalPrice, minPrice.toString()),
 lte(series.totalPrice, maxPrice.toString())
 );
 seriesWhereConditions = and(seriesWhereConditions, priceCondition);
 }

 let seriesOrderBy;
 switch (sortBy) {
 case "oldest":
 seriesOrderBy = asc(series.createdAt);
 break;
 case "views":
 seriesOrderBy = desc(series.viewCount);
 break;
 case "price_low":
 seriesOrderBy = asc(series.totalPrice);
 break;
 case "price_high":
 seriesOrderBy = desc(series.totalPrice);
 break;
 case "title":
 seriesOrderBy = asc(series.title);
 break;
 default: // newest, relevance
 seriesOrderBy = desc(series.createdAt);
 break;
 }

 const seriesSearchResults = await db
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
 .where(seriesWhereConditions)
 .orderBy(seriesOrderBy)
 .limit(contentType === "series" ? limit : Math.ceil(limit / 2))
 .offset(contentType === "series" ? offset : Math.floor(offset / 2));

 const totalSeriesCountResult = await db
 .select({ count: count() })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .where(seriesWhereConditions);

 totalSeries = totalSeriesCountResult[0]?.count || 0;

 seriesResults = seriesSearchResults.map((result) => ({
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
 }

 const totalResults = totalVideos + totalSeries;
 const totalPages = Math.ceil(totalResults / limit);
 const currentPage = Math.floor(offset / limit) + 1;

 return NextResponse.json({
 success: true,
 results: {
 videos: videoResults,
 series: seriesResults,
 combined: [...videoResults, ...seriesResults], // For unified display
 },
 counts: {
 videos: totalVideos,
 series: totalSeries,
 total: totalResults,
 },
 pagination: {
 total: totalResults,
 limit,
 offset,
 page: currentPage,
 totalPages,
 hasMore: offset + limit < totalResults,
 hasPrev: offset > 0,
 },
 filters: {
 query: query.trim(),
 category,
 creatorId,
 contentType,
 minPrice,
 maxPrice,
 sortBy,
 },
 });
 } catch (error) {
 console.error("Unified search error:", error);
 return NextResponse.json(
 {
 success: false,
 error: "Failed to perform search",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}