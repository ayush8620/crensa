import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'
import { db } from '@/lib/database'
import { videos, users, creatorProfiles, series, seriesVideos } from '@/lib/database/schema'
import { eq, sql, and } from 'drizzle-orm'
import { CacheService } from '@/lib/services/cacheService'

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
 try {

 const { userId: clerkId } = await auth()
 if (!clerkId) {
 return NextResponse.json(
 { error: 'Unauthorized' },
 { status: 401 }
 )
 }

 const [user] = await db
 .select()
 .from(users)
 .where(eq(users.clerkId, clerkId))
 .limit(1)

 if (!user || user.role !== 'creator') {
 return NextResponse.json(
 { error: 'Only creators can upload videos' },
 { status: 403 }
 )
 }

 const body = await request.json()
 const { publicId, metadata, cloudinaryResult } = body

 if (!publicId || !metadata || !cloudinaryResult) {
 return NextResponse.json(
 { error: 'Missing required data' },
 { status: 400 }
 )
 }

 if (!metadata.title || !metadata.category) {
 return NextResponse.json(
 { error: 'Title and category are required' },
 { status: 400 }
 )
 }

 const coinPrice = metadata.coinPrice ?? (metadata.creditCost ? metadata.creditCost * 20 : 20)
 
 console.log('=== BACKEND SAVE DEBUG ===')
 console.log('Received metadata:', metadata)
 console.log('Calculated coinPrice:', coinPrice)
 console.log('Has seriesId?', !!metadata.seriesId)
 console.log('SeriesId value:', metadata.seriesId)
 console.log('========================')

 if (metadata.seriesId) {

 const [seriesData] = await db
 .select()
 .from(series)
 .where(and(
 eq(series.id, metadata.seriesId),
 eq(series.creatorId, user.id)
 ))
 .limit(1)

 if (!seriesData) {
 return NextResponse.json(
 { error: 'Series not found or you do not have permission to add videos to this series' },
 { status: 403 }
 )
 }
 }

 // Validate coin price for all videos (series or standalone)
 if (coinPrice < 0 || coinPrice > 2000) {
 return NextResponse.json(
 { error: 'Video price must be between 0 and 2000 coins' },
 { status: 400 }
 )
 }

 const actualPublicId = cloudinaryResult.public_id || publicId

 const aspectRatio = metadata.aspectRatio || '16:9'
 const getThumbnailDimensions = (ratio: string) => {
 switch (ratio) {
 case '9:16':
 return { width: 360, height: 640 } // Vertical
 case '1:1':
 return { width: 480, height: 480 } // Square
 case '4:5':
 return { width: 384, height: 480 } // Portrait
 case '5:4':
 return { width: 480, height: 384 } // Landscape
 case '3:2':
 return { width: 480, height: 320 } // Classic
 case '2:3':
 return { width: 320, height: 480 } // Tall portrait
 default: // 16:9
 return { width: 640, height: 360 } // Widescreen
 }
 }
 
 const thumbnailDimensions = getThumbnailDimensions(aspectRatio)
 const thumbnailUrl = cloudinary.url(actualPublicId, {
 resource_type: 'video',
 format: 'jpg',
 transformation: [
 {
 width: thumbnailDimensions.width,
 height: thumbnailDimensions.height,
 crop: 'fill',
 gravity: 'center'
 },
 { quality: 'auto:good' }
 ]
 })

 const result = await db.transaction(async (tx) => {

 const [newVideo] = await tx
 .insert(videos)
 .values({
 creatorId: user.id,
 title: metadata.title.trim(),
 description: metadata.description?.trim() || null,
 videoUrl: cloudinaryResult.secure_url,
 thumbnailUrl,
 duration: Math.round(cloudinaryResult.duration || 0),
 creditCost: (coinPrice / 20).toFixed(2), // Legacy field: convert coins to rupees
 coinPrice: coinPrice,
 category: metadata.category,
 tags: metadata.tags || [],
 viewCount: 0,
 totalEarnings: '0.00',
 isActive: true,
 aspectRatio: metadata.aspectRatio || '16:9',
 seriesId: metadata.seriesId || null
 })
 .returning()

 const [currentProfile] = await tx
 .select()
 .from(creatorProfiles)
 .where(eq(creatorProfiles.userId, user.id))
 .limit(1)

 if (currentProfile) {
 await tx
 .update(creatorProfiles)
 .set({
 videoCount: currentProfile.videoCount + 1,
 updatedAt: new Date()
 })
 .where(eq(creatorProfiles.userId, user.id))
 }

 if (newVideo.seriesId) {

 const [maxOrderResult] = await tx
 .select({ maxOrder: sql<number>`COALESCE(MAX(${seriesVideos.orderIndex}), -1)` })
 .from(seriesVideos)
 .where(eq(seriesVideos.seriesId, newVideo.seriesId))

 const nextOrderIndex = (maxOrderResult?.maxOrder ?? -1) + 1

 await tx
 .insert(seriesVideos)
 .values({
 seriesId: newVideo.seriesId,
 videoId: newVideo.id,
 orderIndex: nextOrderIndex
 })

 await tx.execute(sql`
 UPDATE series
 SET 
 video_count = video_count + 1,
 total_duration = total_duration + ${newVideo.duration},
 updated_at = NOW()
 WHERE id = ${newVideo.seriesId}
 `)
 }

 return newVideo
 })

 // Invalidate browse/discover cache so new video/series content appears immediately
 CacheService.deleteByPrefix('landing:unified-content:')
 if (result.seriesId) {
 CacheService.delete('landing:featured-series')
 }

 return NextResponse.json({
 success: true,
 video: {
 ...result,
 createdAt: new Date(result.createdAt),
 updatedAt: new Date(result.updatedAt)
 }
 })

 } catch (error) {
 console.error('Video save error:', error)
 return NextResponse.json(
 { error: 'Failed to save video. Please try again.' },
 { status: 500 }
 )
 }
}