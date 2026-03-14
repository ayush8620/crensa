

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/database";
import { series, users, creatorProfiles, videos } from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { id: seriesId } = await params;

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
 return NextResponse.json(
 { success: false, error: "Series not found" },
 { status: 404 }
 );
 }

 const s = seriesData[0];

 return NextResponse.json({
 success: true,
 series: {
 id: s.id,
 creatorId: s.creatorId,
 title: s.title,
 description: s.description,
 thumbnailUrl: s.thumbnailUrl,
 totalPrice: parseFloat(s.totalPrice || '0'),
 coinPrice: s.coinPrice,
 videoCount: s.videoCount,
 totalDuration: s.totalDuration,
 category: s.category,
 tags: Array.isArray(s.tags) ? s.tags : [],
 viewCount: s.viewCount,
 totalEarnings: parseFloat(s.totalEarnings),
 isActive: s.isActive,
 moderationStatus: s.moderationStatus,
 moderationReason: s.moderationReason,
 moderatedAt: s.moderatedAt,
 moderatedBy: s.moderatedBy,
 createdAt: s.createdAt,
 updatedAt: s.updatedAt,
 creator: {
 id: s.creatorId,
 username: s.creatorUsername || "creator",
 displayName: s.creatorDisplayName || s.creatorUsername || "Creator",
 avatar: s.creatorAvatar || undefined,
 },
 },
 });
 } catch (error) {
 console.error("Error fetching series:", error);
 return NextResponse.json(
 { success: false, error: "Failed to fetch series" },
 { status: 500 }
 );
 }
}

export async function PUT(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { userId } = await auth();
 if (!userId) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { id: seriesId } = await params;

 const [user] = await db
 .select()
 .from(users)
 .where(eq(users.clerkId, userId))
 .limit(1);

 if (!user || user.role !== "creator") {
 return NextResponse.json(
 { error: "Only creators can update series" },
 { status: 403 }
 );
 }

 const [existingSeries] = await db
 .select()
 .from(series)
 .where(eq(series.id, seriesId))
 .limit(1);

 if (!existingSeries) {
 return NextResponse.json({ error: "Series not found" }, { status: 404 });
 }

 if (existingSeries.creatorId !== user.id) {
 return NextResponse.json(
 { error: "You don't have permission to update this series" },
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
 : existingSeries.tags,
 totalPrice: parseFloat(formData.get("totalPrice") as string),
 thumbnail: formData.get("thumbnail"),
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

 const updateData: any = {
 updatedAt: new Date(),
 };

 if (requestData.title) updateData.title = requestData.title.trim();
 if (requestData.description !== undefined)
 updateData.description = requestData.description?.trim() || null;
 if (requestData.category) updateData.category = requestData.category;
 if (requestData.tags) updateData.tags = requestData.tags;
 if (requestData.totalPrice) {
 updateData.totalPrice = requestData.totalPrice.toString();
 updateData.coinPrice = Math.round(requestData.totalPrice * 20); // Convert rupees to coins
 }
 if ((requestData as any).thumbnailUrl)
 updateData.thumbnailUrl = (requestData as any).thumbnailUrl;

 const [updatedSeries] = await db
 .update(series)
 .set(updateData)
 .where(eq(series.id, seriesId))
 .returning();

 return NextResponse.json({
 success: true,
 message: "Series updated successfully",
 series: updatedSeries,
 });
 } catch (error) {
 console.error("Error updating series:", error);
 return NextResponse.json(
 { error: "Failed to update series" },
 { status: 500 }
 );
 }
}

export async function DELETE(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const { userId } = await auth();
 if (!userId) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { id: seriesId } = await params;

 const [user] = await db
 .select()
 .from(users)
 .where(eq(users.clerkId, userId))
 .limit(1);

 if (!user || user.role !== "creator") {
 return NextResponse.json(
 { error: "Only creators can delete series" },
 { status: 403 }
 );
 }

 const [existingSeries] = await db
 .select()
 .from(series)
 .where(eq(series.id, seriesId))
 .limit(1);

 if (!existingSeries) {
 return NextResponse.json({ error: "Series not found" }, { status: 404 });
 }

 if (existingSeries.creatorId !== user.id) {
 return NextResponse.json(
 { error: "You don't have permission to delete this series" },
 { status: 403 }
 );
 }

 await db.delete(series).where(eq(series.id, seriesId));

 await db.execute(sql`
 UPDATE creator_profiles
 SET series_count = GREATEST(series_count - 1, 0),
 updated_at = NOW()
 WHERE user_id = ${user.id}
 `);

 return NextResponse.json({
 success: true,
 message: "Series deleted successfully",
 });
 } catch (error) {
 console.error("Error deleting series:", error);
 return NextResponse.json(
 { error: "Failed to delete series" },
 { status: 500 }
 );
 }
}
