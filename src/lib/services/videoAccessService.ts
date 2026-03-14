import { db } from "@/lib/database";
import { seriesVideos, seriesPurchases, coinTransactions, videos, users } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";

export interface VideoAccessResult {
  hasAccess: boolean;
  accessType: "free" | "paid" | "series-only";
  requiresPayment: boolean;
  coinPrice?: number;
  reason?: string;
}

export class VideoAccessService {
  /**
   * Check if a user has access to a specific video in a series.
   *
   * After the series refactor, seriesVideos no longer has accessType or
   * individualCoinPrice columns. Access is determined solely by the video's
   * own coinPrice: 0 = free, >0 = paid (requires individual purchase or
   * series purchase).
   */
  static async checkVideoAccess(
    userId: string,
    videoId: string,
    seriesId: string
  ): Promise<VideoAccessResult> {
    try {
      // Verify the video exists in this series and get its coin price
      const [seriesVideo] = await db
        .select({
          videoId: seriesVideos.videoId,
          coinPrice: videos.coinPrice,
        })
        .from(seriesVideos)
        .innerJoin(videos, eq(seriesVideos.videoId, videos.id))
        .where(
          and(
            eq(seriesVideos.videoId, videoId),
            eq(seriesVideos.seriesId, seriesId)
          )
        )
        .limit(1);

      if (!seriesVideo) {
        return {
          hasAccess: false,
          accessType: "series-only",
          requiresPayment: false,
          reason: "Video not found in series",
        };
      }

      const coinPrice = seriesVideo.coinPrice ?? 0;

      // Free video (coinPrice === 0) — always accessible to authenticated users
      if (coinPrice === 0) {
        return {
          hasAccess: true,
          accessType: "free",
          requiresPayment: false,
        };
      }

      // Paid video — check if user has purchased this specific video
      const [videoPurchase] = await db
        .select({ id: coinTransactions.id })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.relatedContentId, videoId),
            eq(coinTransactions.relatedContentType, "video"),
            eq(coinTransactions.transactionType, "spend")
          )
        )
        .limit(1);

      if (videoPurchase) {
        return {
          hasAccess: true,
          accessType: "paid",
          requiresPayment: false,
        };
      }

      // Check if user has purchased the parent series
      const [seriesPurchase] = await db
        .select({ id: seriesPurchases.id })
        .from(seriesPurchases)
        .where(
          and(
            eq(seriesPurchases.userId, userId),
            eq(seriesPurchases.seriesId, seriesId),
            eq(seriesPurchases.status, "completed")
          )
        )
        .limit(1);

      if (seriesPurchase) {
        return {
          hasAccess: true,
          accessType: "series-only",
          requiresPayment: false,
        };
      }

      return {
        hasAccess: false,
        accessType: "paid",
        requiresPayment: true,
        coinPrice,
        reason: `This video requires ${coinPrice} coins to watch`,
      };
    } catch (error) {
      console.error("Error checking video access:", error);
      return {
        hasAccess: false,
        accessType: "series-only",
        requiresPayment: false,
        reason: "Error checking access",
      };
    }
  }

  /**
   * Purchase an individual paid video.
   * Uses coinTransactionService pattern: deduct from member, credit to creator.
   */
  static async purchaseVideo(
    userId: string,
    videoId: string,
    seriesId: string,
    creatorId: string
  ): Promise<{ success: boolean; message: string; alreadyOwned?: boolean }> {
    try {
      // Verify video is in the series and get its price
      const [seriesVideo] = await db
        .select({ coinPrice: videos.coinPrice })
        .from(seriesVideos)
        .innerJoin(videos, eq(seriesVideos.videoId, videos.id))
        .where(
          and(
            eq(seriesVideos.videoId, videoId),
            eq(seriesVideos.seriesId, seriesId)
          )
        )
        .limit(1);

      if (!seriesVideo || seriesVideo.coinPrice === 0) {
        return {
          success: false,
          message: "This video is not available for individual purchase",
        };
      }

      const coinPrice = seriesVideo.coinPrice;

      // Check user's coin balance
      const [user] = await db
        .select({ coinBalance: users.coinBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.coinBalance < coinPrice) {
        return {
          success: false,
          message: "Insufficient coin balance",
        };
      }

      // Check if already purchased
      const [existingPurchase] = await db
        .select({ id: coinTransactions.id })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.relatedContentId, videoId),
            eq(coinTransactions.relatedContentType, "video"),
            eq(coinTransactions.transactionType, "spend")
          )
        )
        .limit(1);

      if (existingPurchase) {
        return {
          success: true,
          alreadyOwned: true,
          message: "You have already purchased this video",
        };
      }

      await db.transaction(async (tx) => {
        // Deduct coins from member
        await tx
          .update(users)
          .set({ coinBalance: user.coinBalance - coinPrice })
          .where(eq(users.id, userId));

        // Record spend transaction
        await tx.insert(coinTransactions).values({
          userId,
          transactionType: "spend",
          coinAmount: coinPrice,
          relatedContentType: "video",
          relatedContentId: videoId,
          status: "completed",
          description: `Purchased video for ${coinPrice} coins`,
        });

        // Credit creator
        await tx.insert(coinTransactions).values({
          userId: creatorId,
          transactionType: "earn",
          coinAmount: coinPrice,
          relatedContentType: "video",
          relatedContentId: videoId,
          status: "completed",
          description: `Earned ${coinPrice} coins from video purchase`,
        });

        const [creator] = await tx
          .select({ coinBalance: users.coinBalance })
          .from(users)
          .where(eq(users.id, creatorId))
          .limit(1);

        if (creator) {
          await tx
            .update(users)
            .set({ coinBalance: creator.coinBalance + coinPrice })
            .where(eq(users.id, creatorId));
        }
      });

      return { success: true, message: "Video purchased successfully" };
    } catch (error) {
      console.error("Error purchasing video:", error);
      return { success: false, message: "Failed to purchase video" };
    }
  }

  /**
   * Get all video IDs in a series that the user can access.
   */
  static async getAccessibleVideos(
    userId: string,
    seriesId: string
  ): Promise<string[]> {
    try {
      const videosList = await db
        .select({ videoId: seriesVideos.videoId })
        .from(seriesVideos)
        .where(eq(seriesVideos.seriesId, seriesId));

      const accessibleVideoIds: string[] = [];

      for (const v of videosList) {
        const access = await this.checkVideoAccess(userId, v.videoId, seriesId);
        if (access.hasAccess) {
          accessibleVideoIds.push(v.videoId);
        }
      }

      return accessibleVideoIds;
    } catch (error) {
      console.error("Error getting accessible videos:", error);
      return [];
    }
  }
}

export const videoAccessService = VideoAccessService;
