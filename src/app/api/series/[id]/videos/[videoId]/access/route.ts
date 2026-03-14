import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import { seriesVideos, series, videos } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

/**
 * Update video pricing within a series
 * Note: After series refactor, videos have independent pricing.
 * This endpoint updates the video's coin price directly.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: seriesId, videoId } = await params;
    const body = await request.json();
    const { coinPrice } = body;

    // Validate coin price
    if (coinPrice === undefined || coinPrice < 0 || coinPrice > 2000) {
      return NextResponse.json(
        { success: false, error: "Coin price must be between 0 and 2000" },
        { status: 400 }
      );
    }

    // Verify series ownership
    const [seriesData] = await db
      .select({ creatorId: series.creatorId })
      .from(series)
      .where(eq(series.id, seriesId))
      .limit(1);

    if (!seriesData) {
      return NextResponse.json(
        { success: false, error: "Series not found" },
        { status: 404 }
      );
    }

    // Get user from database
    const { userRepository } = await import("@/lib/database/repositories/users");
    const user = await userRepository.findByClerkId(userId);

    if (!user || user.id !== seriesData.creatorId) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this series" },
        { status: 403 }
      );
    }

    // Verify video exists in series
    const [seriesVideo] = await db
      .select()
      .from(seriesVideos)
      .where(
        and(
          eq(seriesVideos.seriesId, seriesId),
          eq(seriesVideos.videoId, videoId)
        )
      )
      .limit(1);

    if (!seriesVideo) {
      return NextResponse.json(
        { success: false, error: "Video not found in series" },
        { status: 404 }
      );
    }

    // Update video coin price
    await db
      .update(videos)
      .set({
        coinPrice: coinPrice,
        creditCost: (coinPrice / 20).toFixed(2), // Legacy field: convert coins to rupees
      })
      .where(eq(videos.id, videoId));

    return NextResponse.json({
      success: true,
      message: "Video price updated successfully",
      coinPrice,
    });
  } catch (error) {
    console.error("Error updating video price:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update video price" },
      { status: 500 }
    );
  }
}
