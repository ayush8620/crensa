

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { userRepository } from "@/lib/database/repositories/users";
import { db } from "@/lib/database";
import { series, users, creatorProfiles } from "@/lib/database";
import { eq, desc, asc, and, count, sql } from "drizzle-orm";
import type { NewSeries, SeriesWithRelations } from "@/types/database";
import { CacheService } from "@/lib/services/cacheService";

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SeriesCreateRequest {
 title: string;
 description?: string;
 category: string;
 tags?: string[];
 thumbnailUrl?: string;
}

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

function validateSeriesCreate(data: any): {
 isValid: boolean;
 errors: string[];
 validatedData?: SeriesCreateRequest;
} {
 const errors: string[] = [];
 const validatedData: SeriesCreateRequest = {
 title: "",
 category: "",
 };

 if (!data.title || typeof data.title !== "string") {
 errors.push("Title is required and must be a string");
 } else if (data.title.trim().length === 0) {
 errors.push("Title cannot be empty");
 } else if (data.title.length > 255) {
 errors.push("Title cannot exceed 255 characters");
 } else {
 validatedData.title = data.title.trim();
 }

 if (data.description !== undefined) {
 if (data.description !== null && typeof data.description !== "string") {
 errors.push("Description must be a string or null");
 } else if (data.description && data.description.length > 1000) {
 errors.push("Description cannot exceed 1000 characters");
 } else {
 validatedData.description = data.description
 ? data.description.trim()
 : undefined;
 }
 }

 if (!data.category || typeof data.category !== "string") {
 errors.push("Category is required and must be a string");
 } else if (!VALID_CATEGORIES.includes(data.category)) {
 errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
 } else {
 validatedData.category = data.category;
 }

 if (data.tags !== undefined) {
 if (!Array.isArray(data.tags)) {
 errors.push("Tags must be an array");
 } else if (data.tags.length > 10) {
 errors.push("Cannot have more than 10 tags");
 } else if (
 !data.tags.every(
 (tag: any) =>
 typeof tag === "string" && tag.trim().length > 0 && tag.length <= 50
 )
 ) {
 errors.push(
 "Each tag must be a non-empty string with maximum 50 characters"
 );
 } else {
 validatedData.tags = data.tags.map((tag: any) => tag.trim());
 }
 }

 if (data.thumbnailUrl !== undefined) {
 if (data.thumbnailUrl !== null && typeof data.thumbnailUrl !== "string") {
 errors.push("Thumbnail URL must be a string or null");
 } else {
 validatedData.thumbnailUrl = data.thumbnailUrl || undefined;
 }
 }

 return {
 isValid: errors.length === 0,
 errors,
 validatedData: errors.length === 0 ? validatedData : undefined,
 };
}

export async function POST(request: NextRequest) {
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

 if (user.role !== "creator") {
 return NextResponse.json(
 { success: false, error: "Only creators can create series" },
 { status: 403 }
 );
 }

 let requestData;
 try {
 const contentType = request.headers.get("content-type") || "";

 if (contentType.includes("multipart/form-data")) {

 const formData = await request.formData();
 requestData = {
 title: formData.get("title") as string,
 description: formData.get("description") as string,
 category: formData.get("category") as string,
 tags: formData.get("tags")
 ? JSON.parse(formData.get("tags") as string)
 : [],
 thumbnail: formData.get("thumbnail"), // File object
 };

 const thumbnail = requestData.thumbnail;
 if (thumbnail && thumbnail instanceof File) {
 try {

 const arrayBuffer = await thumbnail.arrayBuffer();
 const buffer = Buffer.from(arrayBuffer);
 const base64 = buffer.toString("base64");
 const dataURI = `data:${thumbnail.type};base64,${base64}`;

 const uploadResult = await cloudinary.uploader.upload(dataURI, {
 folder: "crensa/series/thumbnails",
 resource_type: "image",
 transformation: [
 { width: 1280, height: 720, crop: "fill" },
 { quality: "auto:good" },
 ],
 });

 (requestData as any).thumbnailUrl = uploadResult.secure_url;
 } catch (uploadError) {
 console.error("Cloudinary upload error:", uploadError);

 (requestData as any).thumbnailUrl = null;
 }
 }
 delete (requestData as any).thumbnail;
 } else {

 const body = await request.text();
 if (!body.trim()) {
 return NextResponse.json(
 { success: false, error: "Request body is required" },
 { status: 400 }
 );
 }
 requestData = JSON.parse(body);
 }
 } catch (parseError) {
 console.error("Parse error:", parseError);
 return NextResponse.json(
 { success: false, error: "Invalid request format" },
 { status: 400 }
 );
 }

 const validation = validateSeriesCreate(requestData);
 if (!validation.isValid) {
 return NextResponse.json(
 {
 success: false,
 error: "Validation failed",
 details: validation.errors,
 },
 { status: 400 }
 );
 }

 const validatedData = validation.validatedData!;

 const newSeriesData: NewSeries = {
 creatorId: user.id,
 title: validatedData.title,
 description: validatedData.description || null,
 category: validatedData.category,
 tags: validatedData.tags || [],
 totalPrice: "0.00", // Series is now a free container
 coinPrice: 0, // Series is now a free container
 thumbnailUrl: validatedData.thumbnailUrl || null,
 videoCount: 0,
 totalDuration: 0,
 viewCount: 0,
 totalEarnings: "0.00",
 isActive: true,
 moderationStatus: "approved",
 };

 const createdSeries = await db
 .insert(series)
 .values(newSeriesData)
 .returning({
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
 });

 if (createdSeries.length === 0) {
 return NextResponse.json(
 { success: false, error: "Failed to create series" },
 { status: 500 }
 );
 }

 const newSeries = createdSeries[0];

 try {
 await db
 .update(creatorProfiles)
 .set({
 seriesCount: sql`${creatorProfiles.seriesCount} + 1`,
 updatedAt: new Date(),
 })
 .where(eq(creatorProfiles.userId, user.id));
 } catch (countError) {
 console.error("Error updating series count:", countError);

 }

 const creatorInfo = await db
 .select({
 username: users.username,
 displayName: creatorProfiles.displayName,
 avatar: users.avatar,
 })
 .from(users)
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(eq(users.id, user.id))
 .limit(1);

 const creator = creatorInfo[0];

 const responseSeries: SeriesWithRelations = {
 ...newSeries,
 tags: Array.isArray(newSeries.tags) ? newSeries.tags : [],
 creator: {
 id: user.id,
 username: creator?.username || "creator",
 displayName: creator?.displayName || creator?.username || "Creator",
 avatar: creator?.avatar || undefined,
 },
 videos: [],
 };

 // Invalidate browse/discover cache so new series appears immediately
 CacheService.deleteByPrefix('landing:unified-content:');
 CacheService.delete('landing:featured-series');

 return NextResponse.json({
 success: true,
 message: "Series created successfully",
 series: responseSeries,
 });
 } catch (error) {
 console.error("Error creating series:", error);
 return NextResponse.json(
 {
 success: false,
 error: "Failed to create series",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}

export async function GET(request: NextRequest) {
 try {
 const { userId: clerkId } = await auth();
 if (!clerkId) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const user = await userRepository.findByClerkId(clerkId);
 if (!user) {
 return NextResponse.json({ error: "User not found" }, { status: 404 });
 }

 if (user.role !== "creator") {
 return NextResponse.json(
 { error: "Only creators can access series" },
 { status: 403 }
 );
 }

 const { searchParams } = new URL(request.url);
 const sortBy = searchParams.get("sortBy") || "newest";
 const filterBy = searchParams.get("filterBy") || "all";
 const limit = parseInt(searchParams.get("limit") || "50");
 const offset = parseInt(searchParams.get("offset") || "0");

 let whereConditions = eq(series.creatorId, user.id);

 let additionalFilter = null;
 if (filterBy === "active") {
 additionalFilter = eq(series.isActive, true);
 } else if (filterBy === "inactive") {
 additionalFilter = eq(series.isActive, false);
 }

 let orderBy;
 switch (sortBy) {
 case "oldest":
 orderBy = asc(series.createdAt);
 break;
 case "views":
 orderBy = desc(series.viewCount);
 break;
 case "earnings":
 orderBy = desc(series.totalEarnings);
 break;
 case "title":
 orderBy = asc(series.title);
 break;
 case "price":
 orderBy = desc(series.totalPrice);
 break;
 default: // newest
 orderBy = desc(series.createdAt);
 break;
 }

 let finalWhereCondition = whereConditions;
 if (additionalFilter) {
 finalWhereCondition =
 and(whereConditions, additionalFilter) || whereConditions;
 }

 const userSeries = await db
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
 createdAt: series.createdAt,
 updatedAt: series.updatedAt,
 creatorUsername: users.username,
 creatorDisplayName: creatorProfiles.displayName,
 creatorAvatar: users.avatar,
 })
 .from(series)
 .leftJoin(users, eq(series.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(finalWhereCondition)
 .orderBy(orderBy)
 .limit(limit)
 .offset(offset);

 const totalCountResult = await db
 .select({ count: count() })
 .from(series)
 .where(finalWhereCondition);

 const totalCount = totalCountResult[0]?.count || 0;

 const transformedSeries = userSeries.map((s) => ({
 id: s.id,
 title: s.title,
 videoCount: s.videoCount || 0,
 coinPrice: s.coinPrice || 0,
 viewCount: s.viewCount || 0,
 earnings: parseFloat(s.totalEarnings) || 0,
 isActive: s.isActive,
 moderationStatus: s.moderationStatus,
 createdAt: s.createdAt,
 }));

 return NextResponse.json({
 series: transformedSeries,
 pagination: {
 total: totalCount,
 limit,
 offset,
 hasMore: offset + limit < totalCount,
 },
 });
 } catch (error) {
 console.error("Get series error:", error);
 return NextResponse.json(
 { error: "Failed to get series" },
 { status: 500 }
 );
 }
}
