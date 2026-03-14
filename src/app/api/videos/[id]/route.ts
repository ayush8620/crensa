

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { userRepository } from "@/lib/database/repositories/users";
import { db } from "@/lib/database/connection";
import {
 videos,
 users,
 transactions,
 creatorProfiles,
} from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

interface VideoUpdateRequest {
 title?: string;
 description?: string;
 category?: string;
 tags?: string[];
 coinPrice?: number;
 aspectRatio?: string;
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

function validateVideoUpdate(data: any): {
 isValid: boolean;
 errors: string[];
 validatedData?: VideoUpdateRequest;
} {
 const errors: string[] = [];
 const validatedData: VideoUpdateRequest = {};

 if (data.title !== undefined) {
 if (typeof data.title !== "string") {
 errors.push("Title must be a string");
 } else if (data.title.trim().length === 0) {
 errors.push("Title cannot be empty");
 } else if (data.title.length > 255) {
 errors.push("Title cannot exceed 255 characters");
 } else {
 validatedData.title = data.title.trim();
 }
 }

 if (data.description !== undefined) {
 if (data.description !== null && typeof data.description !== "string") {
 errors.push("Description must be a string or null");
 } else if (data.description && data.description.length > 1000) {
 errors.push("Description cannot exceed 1000 characters");
 } else {
 validatedData.description = data.description
 ? data.description.trim()
 : null;
 }
 }

 if (data.category !== undefined) {
 if (typeof data.category !== "string") {
 errors.push("Category must be a string");
 } else if (!VALID_CATEGORIES.includes(data.category)) {
 errors.push(`Category must be one of: ${VALID_CATEGORIES.join(", ")}`);
 } else {
 validatedData.category = data.category;
 }
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

 if (data.coinPrice !== undefined) {
 const coinPrice = Number(data.coinPrice);
 if (isNaN(coinPrice)) {
 errors.push("Coin price must be a number");
 } else if (coinPrice < 1 || coinPrice > 2000) {
 errors.push("Coin price must be between 1 and 2000");
 } else if (!Number.isInteger(coinPrice)) {
 errors.push("Coin price must be a whole number");
 } else {
 validatedData.coinPrice = coinPrice;
 }
 }

 if (data.aspectRatio !== undefined) {
 const validAspectRatios = ['1:1', '16:9', '9:16', '2:3', '3:2', '4:5', '5:4'];
 if (typeof data.aspectRatio !== "string") {
 errors.push("Aspect ratio must be a string");
 } else if (!validAspectRatios.includes(data.aspectRatio)) {
 errors.push(`Aspect ratio must be one of: ${validAspectRatios.join(", ")}`);
 } else {
 validatedData.aspectRatio = data.aspectRatio;
 }
 }

 return {
 isValid: errors.length === 0,
 errors,
 validatedData: errors.length === 0 ? validatedData : undefined,
 };
}

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
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

 const { id: videoId } = await params;

 const videoData = await db
 .select({
 id: videos.id,
 title: videos.title,
 description: videos.description,
 videoUrl: videos.videoUrl,
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
 .leftJoin(users, eq(videos.creatorId, users.id))
 .leftJoin(creatorProfiles, eq(users.id, creatorProfiles.userId))
 .where(and(eq(videos.id, videoId), eq(videos.isActive, true)))
 .limit(1);

 if (videoData.length === 0) {
 return NextResponse.json(
 { success: false, error: "Video not found" },
 { status: 404 }
 );
 }

 const video = videoData[0];

 const accessCheck = await db
 .select({ id: transactions.id })
 .from(transactions)
 .where(
 and(
 eq(transactions.userId, user.id),
 eq(transactions.videoId, videoId),
 eq(transactions.type, "video_view"),
 eq(transactions.status, "completed")
 )
 )
 .limit(1);

 const hasAccess = accessCheck.length > 0;

 const transformedVideo = {
 id: video.id,
 title: video.title || "Untitled",
 description: video.description || "",
 videoUrl: hasAccess ? video.videoUrl : null,
 thumbnailUrl: video.thumbnailUrl || "/api/placeholder/400/225",
 duration: video.duration || 0,
 creditCost: parseFloat(video.creditCost?.toString() || "0"),
 coinPrice: video.coinPrice ?? 0,
 category: video.category || "general",
 tags: Array.isArray(video.tags) ? video.tags : [],
 aspectRatio: video.aspectRatio || "16:9",
 viewCount: video.viewCount || 0,
 createdAt: video.createdAt
 ? video.createdAt.toISOString()
 : new Date().toISOString(),
 creator: {
 id: video.creatorId || "",
 username: video.creatorUsername || "creator",
 displayName:
 video.creatorDisplayName || video.creatorUsername || "Creator",
 avatar: video.creatorAvatar || null,
 },
 };

 return NextResponse.json({
 success: true,
 video: transformedVideo,
 hasAccess,
 });
 } catch (error) {
 console.error("Error fetching video:", error);
 return NextResponse.json(
 {
 success: false,
 error: "Failed to fetch video",
 details: error instanceof Error ? error.message : "Unknown error",
 },
 { status: 500 }
 );
 }
}

export async function PATCH(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
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
 { success: false, error: "Only creators can update videos" },
 { status: 403 }
 );
 }

 const { id: videoId } = await params;

 let requestData;
 try {
 const body = await request.text();
 if (!body.trim()) {
 return NextResponse.json(
 { success: false, error: "Request body is required" },
 { status: 400 }
 );
 }
 requestData = JSON.parse(body);
 } catch (parseError) {
 console.error("JSON parsing error:", parseError);
 return NextResponse.json(
 {
 success: false,
 error: "Invalid JSON format in request body",
 details:
 parseError instanceof Error
 ? parseError.message
 : "JSON parsing failed",
 },
 { status: 400 }
 );
 }

 const isStatusToggle =
 requestData.hasOwnProperty("isActive") &&
 Object.keys(requestData).length === 1;

 let validation: {
 isValid: boolean;
 errors: string[];
 validatedData?: VideoUpdateRequest;
 } | null = null;

 if (isStatusToggle) {

 if (typeof requestData.isActive !== "boolean") {
 return NextResponse.json(
 { success: false, error: "isActive must be a boolean" },
 { status: 400 }
 );
 }
 } else {

 validation = validateVideoUpdate(requestData);
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
 }

 const existingVideo = await db
 .select({
 id: videos.id,
 creatorId: videos.creatorId,
 title: videos.title,
 description: videos.description,
 category: videos.category,
 tags: videos.tags,
 creditCost: videos.creditCost,
 aspectRatio: videos.aspectRatio,
 isActive: videos.isActive,
 })
 .from(videos)
 .where(eq(videos.id, videoId))
 .limit(1);

 if (existingVideo.length === 0) {
 return NextResponse.json(
 { success: false, error: "Video not found" },
 { status: 404 }
 );
 }

 const video = existingVideo[0];

 if (video.creatorId !== user.id) {
 return NextResponse.json(
 { success: false, error: "You can only update your own videos" },
 { status: 403 }
 );
 }

 const updateData: any = {};

 if (isStatusToggle) {

 updateData.isActive = requestData.isActive;
 } else {

 if (!video.isActive) {
 return NextResponse.json(
 {
 success: false,
 error: "Cannot update inactive video. Please activate it first.",
 },
 { status: 400 }
 );
 }

 const validatedData = validation!.validatedData!;

 if (validatedData.title !== undefined) {
 updateData.title = validatedData.title;
 }
 if (validatedData.description !== undefined) {
 updateData.description = validatedData.description;
 }
 if (validatedData.category !== undefined) {
 updateData.category = validatedData.category;
 }
 if (validatedData.tags !== undefined) {
 updateData.tags = validatedData.tags;
 }
 if (validatedData.coinPrice !== undefined) {
 updateData.creditCost = validatedData.coinPrice.toString();
 }
 if (validatedData.aspectRatio !== undefined) {
 updateData.aspectRatio = validatedData.aspectRatio;
 }
 }

 updateData.updatedAt = new Date();

 const updatedVideos = await db
 .update(videos)
 .set(updateData)
 .where(eq(videos.id, videoId))
 .returning({
 id: videos.id,
 title: videos.title,
 description: videos.description,
 videoUrl: videos.videoUrl,
 thumbnailUrl: videos.thumbnailUrl,
 duration: videos.duration,
 creditCost: videos.creditCost,
 category: videos.category,
 tags: videos.tags,
 aspectRatio: videos.aspectRatio,
 viewCount: videos.viewCount,
 isActive: videos.isActive,
 createdAt: videos.createdAt,
 updatedAt: videos.updatedAt,
 creatorId: videos.creatorId,
 });

 if (updatedVideos.length === 0) {
 return NextResponse.json(
 { success: false, error: "Failed to update video" },
 { status: 500 }
 );
 }

 const updatedVideo = updatedVideos[0];

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

 const responseVideo = {
 id: updatedVideo.id,
 title: updatedVideo.title || "Untitled",
 description: updatedVideo.description || "",
 videoUrl: updatedVideo.videoUrl,
 thumbnailUrl: updatedVideo.thumbnailUrl || "/api/placeholder/400/225",
 duration: updatedVideo.duration || 0,
 creditCost: parseFloat(updatedVideo.creditCost?.toString() || "0"),
 category: updatedVideo.category || "general",
 tags: Array.isArray(updatedVideo.tags) ? updatedVideo.tags : [],
 aspectRatio: updatedVideo.aspectRatio || "16:9",
 viewCount: updatedVideo.viewCount || 0,
 isActive: updatedVideo.isActive,
 createdAt: updatedVideo.createdAt
 ? updatedVideo.createdAt.toISOString()
 : new Date().toISOString(),
 updatedAt: updatedVideo.updatedAt
 ? updatedVideo.updatedAt.toISOString()
 : new Date().toISOString(),
 creator: {
 id: user.id,
 username: creator?.username || "creator",
 displayName: creator?.displayName || creator?.username || "Creator",
 avatar: creator?.avatar || null,
 },
 };

 return NextResponse.json({
 success: true,
 message: "Video updated successfully",
 video: responseVideo,
 });
 } catch (error) {
 console.error("Error updating video:", error);

 if (error instanceof Error) {
 if (error.message.includes("JSON")) {
 return NextResponse.json(
 {
 success: false,
 error: "JSON processing error",
 details: error.message,
 },
 { status: 400 }
 );
 }

 if (
 error.message.includes("database") ||
 error.message.includes("constraint")
 ) {
 return NextResponse.json(
 {
 success: false,
 error: "Database error occurred",
 details: "Please try again later",
 },
 { status: 500 }
 );
 }
 }

 return NextResponse.json(
 {
 success: false,
 error: "Failed to update video",
 details:
 error instanceof Error ? error.message : "Unknown error occurred",
 },
 { status: 500 }
 );
 }
}
