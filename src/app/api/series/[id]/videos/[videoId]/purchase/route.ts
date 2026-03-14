import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/database";
import { users, series } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { VideoAccessService } from "@/lib/services/videoAccessService";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: seriesId, videoId } = await params;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Fetch creator ID from series
    const [seriesData] = await db
      .select({ creatorId: series.creatorId })
      .from(series)
      .where(eq(series.id, seriesId))
      .limit(1);

    if (!seriesData) {
      return NextResponse.json({ success: false, error: "Series not found" }, { status: 404 });
    }

    const result = await VideoAccessService.purchaseVideo(
      user.id,
      videoId,
      seriesId,
      seriesData.creatorId
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, alreadyOwned: result.alreadyOwned ?? false, message: result.message });
  } catch (error) {
    console.error("Error purchasing video:", error);
    return NextResponse.json(
      { success: false, error: "Failed to purchase video" },
      { status: 500 }
    );
  }
}
