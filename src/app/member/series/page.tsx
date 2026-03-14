import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/database";
import { seriesPurchases, seriesProgress, users, series, creatorProfiles, videos } from "@/lib/database/schema";
import { eq, and, desc, SQLWrapper } from "drizzle-orm";
import MemberSeriesLibraryClient from "./MemberSeriesLibraryClient";

export default async function MemberSeriesPage() {

    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        redirect("/sign-in");
    }

    const userResult = await db.select().from(users).where(eq(users.clerkId, clerkUserId)).limit(1);
    const user = userResult[0];

    if (!user) {
        redirect("/sign-in");
    }

    if (user.role !== "member") {
        redirect("/");
    }

    const purchases = await db.select().from(seriesPurchases).where(and(
        eq(seriesPurchases.userId, user.id),
        eq(seriesPurchases.status, "completed")
    )).orderBy(desc(seriesPurchases.purchasedAt));

    const purchasedSeriesWithProgress = await Promise.all(
        purchases.map(async (purchase) => {
            // Get series data
            const seriesData = await db.select().from(series).where(eq(series.id, purchase.seriesId)).limit(1);
            const seriesInfo = seriesData[0];

            // Get creator data
            const creatorData = await db.select().from(users).where(eq(users.id, seriesInfo.creatorId)).limit(1);
            const creator = creatorData[0];

            // Get creator profile
            const creatorProfileData = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, creator.id)).limit(1);

            // Get videos count for the series
            const videosData = await db.select().from(videos).where(eq(videos.seriesId, seriesInfo.id));

            const progress = await db.select().from(seriesProgress).where(and(
                eq(seriesProgress.userId, user.id),
                eq(seriesProgress.seriesId, purchase.seriesId)
            )).limit(1);

            return {
                series: {
                    id: seriesInfo.id,
                    title: seriesInfo.title,
                    description: seriesInfo.description,
                    thumbnailUrl: seriesInfo.thumbnailUrl,
                    coinPrice: seriesInfo.coinPrice || 0,
                    videoCount: seriesInfo.videoCount,
                    totalDuration: seriesInfo.totalDuration,
                    category: seriesInfo.category,
                    viewCount: seriesInfo.viewCount,
                    creator: {
                        id: creator.id,
                        username: creator.username,
                        creatorProfile: creatorProfileData[0] ? {
                            displayName: creatorProfileData[0].displayName,
                            bio: creatorProfileData[0].bio,
                        } : null,
                    },
                },
                purchaseDate: purchase.purchasedAt,
                progress: progress[0]
                    ? {
                        videosWatched: progress[0].videosWatched,
                        totalVideos: progress[0].totalVideos,
                        percentage: parseFloat(progress[0].progressPercentage),
                        lastWatchedAt: progress[0].lastWatchedAt,
                    }
                    : {
                        videosWatched: 0,
                        totalVideos: seriesInfo.videoCount,
                        percentage: 0,
                        lastWatchedAt: null,
                    },
            };
        })
    );

    return (
        <MemberSeriesLibraryClient
            purchasedSeries={purchasedSeriesWithProgress}
            userId={user.id}
        />
    );
}
