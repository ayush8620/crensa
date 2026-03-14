'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Lock, Clock, Eye, Video as VideoIcon, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PriceCalculation } from '@/lib/services/seriesAccessService';

interface SeriesVideo {
  id: string;
  seriesId: string;
  videoId: string;
  orderIndex: number;
  createdAt: Date;
  video: {
    id: string;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    coinPrice: number;
    category: string;
    tags: string[];
    viewCount: number;
    isActive: boolean;
    createdAt: Date;
  };
}

interface Series {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  totalPrice: number;
  coinPrice: number;
  videoCount: number;
  totalDuration: number;
  category: string;
  tags: string[];
  viewCount: number;
  totalEarnings: number;
  isActive: boolean;
  moderationStatus: string;
  moderationReason?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  videos: SeriesVideo[];
}

interface SeriesDetailClientProps {
  series: Series;
  hasAccess: boolean;
  accessType?: 'series_purchase' | 'creator_access' | 'video_purchase';
  priceCalculation: PriceCalculation | null;
  userId?: string;
  isAuthenticated: boolean;
}

export default function SeriesDetailClient({
  series,
  hasAccess,
  accessType,
  priceCalculation,
  userId,
  isAuthenticated,
}: SeriesDetailClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Tracks the specific locked video that triggered a purchase prompt
  const [lockedVideo, setLockedVideo] = useState<{ id: string; title: string; coinPrice: number; seriesId: string; creatorId: string } | null>(null);
  // Client-side set of video IDs unlocked during this session (avoids full page reload)
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<Set<string>>(new Set());
  // Signals that the next video mount should auto-play (set before index change, cleared after play)
  const pendingPlayRef = useRef(false);

  // After a purchase, once the video element mounts with the new src, trigger play
  useEffect(() => {
    if (!pendingPlayRef.current) return;
    if (!videoRef.current) return;
    pendingPlayRef.current = false;

    const el = videoRef.current;

    const tryPlay = () => {
      el.play().catch(() => {
        // Autoplay blocked by browser policy — user will need to tap play manually
      });
    };

    // If metadata is already loaded, play immediately; otherwise wait for it
    if (el.readyState >= 1) {
      tryPlay();
    } else {
      el.addEventListener('loadedmetadata', tryPlay, { once: true });
    }
  }, [currentVideoIndex, unlockedVideoIds]);

  const videos = series.videos.filter((sv) => sv.video);
  const currentSeriesVideo = videos[currentVideoIndex];
  const currentVideo = currentSeriesVideo?.video;

  // Determine if a video at a given index is playable inline
  const canPlayVideo = useCallback(
    (index: number): boolean => {
      const sv = videos[index];
      if (!sv?.video) return false;
      if (hasAccess) return true;
      if (unlockedVideoIds.has(sv.video.id)) return true;
      if (sv.video.coinPrice === 0) return isAuthenticated;
      return false;
    },
    [videos, hasAccess, isAuthenticated, unlockedVideoIds]
  );

  const handleEpisodeClick = (index: number) => {
    const sv = videos[index];
    if (!sv?.video) return;

    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (canPlayVideo(index)) {
      setCurrentVideoIndex(index);
      // Reset video element so new src loads
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    } else {
      // Show per-video purchase modal with the correct individual price
      if (sv.video.coinPrice > 0) {
        setLockedVideo({
          id: sv.video.id,
          title: sv.video.title,
          coinPrice: sv.video.coinPrice,
          seriesId: series.id,
          creatorId: series.creatorId,
        });
      } else {
        // coinPrice === 0 but still locked — fall back to series purchase
        setShowPurchaseModal(true);
      }
    }
  };

  const handleVideoEnded = () => {
    const nextIndex = currentVideoIndex + 1;
    if (nextIndex >= videos.length) return;

    if (canPlayVideo(nextIndex)) {
      pendingPlayRef.current = true;
      setCurrentVideoIndex(nextIndex);
      setIsPlaying(true);
      // Auto-advance: useEffect will play once the new video element mounts
    } else {
      const sv = videos[nextIndex];
      // Show per-video purchase modal with the correct individual price
      if (sv?.video && sv.video.coinPrice > 0) {
        setLockedVideo({
          id: sv.video.id,
          title: sv.video.title,
          coinPrice: sv.video.coinPrice,
          seriesId: series.id,
          creatorId: series.creatorId,
        });
      } else {
        setShowPurchaseModal(true);
      }
    }
  };

  // Progress tracking — fire-and-forget, only when user has access to the current video
  const trackProgress = useCallback(
    (videoId: string, markAsWatched: boolean) => {
      if (!userId) return;
      if (!hasAccess && !unlockedVideoIds.has(videoId)) return;
      fetch(`/api/series/${series.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, markAsWatched, updateCurrentVideo: true }),
      }).catch(() => {});
    },
    [hasAccess, userId, series.id, unlockedVideoIds]
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isPlayerVisible = isAuthenticated && currentVideo && canPlayVideo(currentVideoIndex);
  const hasPrev = currentVideoIndex > 0;
  const hasNext = currentVideoIndex < videos.length - 1;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 lg:gap-8 items-start">

          {/* LEFT: Player + Info */}
          <div className="space-y-6">

            {/* Video Player */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative">
              {isPlayerVisible ? (
                <div className="relative">
                  <video
                    key={currentVideo.id}
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    poster={currentVideo.thumbnailUrl}
                    controls
                    autoPlay={isPlaying}
                    className="w-full aspect-video object-contain"
                    onPlay={() => {
                      setIsPlaying(true);
                      trackProgress(currentVideo.id, false);
                    }}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      trackProgress(currentVideo.id, true);
                      handleVideoEnded();
                    }}
                  />

                  {/* Prev / Next overlay buttons */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
                    {hasPrev && (
                      <button
                        className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                        onClick={() => handleEpisodeClick(currentVideoIndex - 1)}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex-1" />
                    {hasNext && (
                      <button
                        className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                        onClick={() => handleEpisodeClick(currentVideoIndex + 1)}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {currentVideoIndex + 1} / {videos.length}
                  </div>
                </div>
              ) : (
                /* Locked / unauthenticated state */
                <div className="aspect-video relative">
                  {series.thumbnailUrl ? (
                    <Image src={series.thumbnailUrl} alt={series.title} fill className="object-cover" priority />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-pink/20 via-accent-teal/20 to-primary-neon-yellow/20" />
                  )}

                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      {!isAuthenticated ? (
                        <>
                          <motion.div
                            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Play className="w-10 h-10" fill="white" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2">Sign in to Watch</h3>
                          <p className="text-white/80 mb-4">Create a free account to start watching</p>
                          <button
                            onClick={() => router.push('/sign-in')}
                            className="px-6 py-3 bg-primary-neon-yellow text-primary-navy font-semibold rounded-lg hover:bg-primary-light-yellow transition-colors"
                          >
                            Sign In
                          </button>
                        </>
                      ) : (
                        <>
                          <motion.div
                            className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Lock className="w-10 h-10" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2">Series Locked</h3>
                          <p className="text-white/80 mb-4">Purchase this series to watch all videos</p>
                          <button
                            onClick={() => setShowPurchaseModal(true)}
                            className="px-6 py-3 bg-primary-neon-yellow text-primary-navy font-semibold rounded-lg hover:bg-primary-light-yellow transition-colors"
                          >
                            Purchase Series
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video / Series Info */}
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-primary-navy">
                {isPlayerVisible ? currentVideo.title : series.title}
              </h1>

              {isPlayerVisible && (
                <p className="text-sm text-neutral-dark-gray">
                  Episode {currentVideoIndex + 1} of {videos.length}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-dark-gray">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>{formatViewCount(series.viewCount)} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <VideoIcon className="w-4 h-4" />
                  <span>{series.videoCount} {series.videoCount === 1 ? 'video' : 'videos'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(series.totalDuration)}</span>
                </div>
                <div className="bg-accent-teal/10 text-accent-teal px-3 py-1 rounded-full text-xs font-medium capitalize">
                  {series.category}
                </div>
              </div>

              {/* Creator */}
              <div className="flex items-center space-x-3 p-4 bg-neutral-light-gray/50 rounded-lg">
                {series.creator.avatar ? (
                  <Image
                    src={series.creator.avatar}
                    alt={series.creator.displayName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-pink to-accent-teal rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-semibold">
                      {series.creator.displayName[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-primary-navy">{series.creator.displayName}</h3>
                  <p className="text-sm text-neutral-dark-gray">Creator</p>
                </div>
              </div>

              {/* Description */}
              {(isPlayerVisible ? currentVideo.description : series.description) && (
                <div>
                  <h3 className="font-semibold text-primary-navy mb-2">
                    {isPlayerVisible ? 'About this episode' : 'About this series'}
                  </h3>
                  <p className="text-neutral-dark-gray leading-relaxed whitespace-pre-wrap">
                    {isPlayerVisible ? currentVideo.description || series.description : series.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {series.tags && series.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary-navy mb-2 flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
                    <span>Tags</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {series.tags.map((tag, i) => (
                      <span key={i} className="bg-neutral-light-gray text-neutral-dark-gray px-3 py-1 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Episodes Sidebar */}
          <div className="bg-white border border-neutral-light-gray rounded-2xl overflow-hidden shadow-xl flex flex-col h-[500px] lg:h-[700px] sticky top-4">

            {/* Sidebar Header */}
            <div className="bg-primary-navy px-5 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm tracking-tight">
                Episodes
                <span className="text-white/50 text-xs font-normal ml-2">
                  ({currentVideoIndex + 1}/{videos.length})
                </span>
              </h2>
              {hasAccess && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                  {accessType === 'creator_access' ? 'Your Series' : 'Purchased'}
                </span>
              )}
            </div>

            {/* Purchase CTA (if not purchased and series has a price) */}
            {!hasAccess && series.coinPrice > 0 && isAuthenticated && (
              <div className="px-4 py-3 bg-primary-neon-yellow/10 border-b border-neutral-light-gray">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary-navy">Unlock all episodes</p>
                    <p className="text-xs text-neutral-dark-gray">{series.coinPrice} coins</p>
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-3 py-1.5 bg-primary-neon-yellow text-primary-navy text-xs font-semibold rounded-lg hover:bg-primary-light-yellow transition-colors"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Episodes Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-dark-gray">
                  <VideoIcon className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No videos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                  {videos.map((sv, index) => {
                    const isActive = currentVideoIndex === index;
                    const isLocked = !canPlayVideo(index);

                    return (
                      <button
                        key={sv.video.id}
                        onClick={() => handleEpisodeClick(index)}
                        className={`
                          relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200
                          ${isActive
                            ? 'bg-accent-pink text-white shadow-lg scale-105 z-10'
                            : 'bg-neutral-light-gray text-primary-navy hover:bg-accent-teal/20 hover:scale-105 border border-transparent hover:border-accent-teal'
                          }
                          ${isLocked ? 'opacity-60' : 'cursor-pointer'}
                        `}
                      >
                        {/* Playing animation */}
                        {isActive && isPlaying && (
                          <div className="flex items-end gap-[1.5px] mb-0.5">
                            <div className="w-0.5 h-1.5 bg-white animate-pulse" />
                            <div className="w-0.5 h-2.5 bg-white animate-pulse delay-75" />
                            <div className="w-0.5 h-1 bg-white animate-pulse delay-150" />
                          </div>
                        )}

                        <span className={`text-xs ${isActive ? 'font-black' : 'font-bold'}`}>
                          {index + 1}
                        </span>

                        {/* Lock icon */}
                        {isLocked && (
                          <div className="absolute top-1 right-1">
                            <Lock className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                          </div>
                        )}

                        {/* Duration tooltip on hover */}
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-neutral-dark-gray whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
                          {formatDuration(sv.video.duration)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <SeriesPurchaseModal
            series={series}
            priceCalculation={priceCalculation}
            onClose={() => setShowPurchaseModal(false)}
            userId={userId}
            onPurchaseSuccess={() => {
              setShowPurchaseModal(false);
              router.refresh();
            }}
          />
        )}
        {lockedVideo && (
          <VideoPurchaseModal
            video={lockedVideo}
            userId={userId}
            onClose={() => setLockedVideo(null)}
            onPurchaseSuccess={() => {
              const purchasedVideoId = lockedVideo.id;
              // Find the index of the just-purchased video
              const targetIndex = videos.findIndex((sv) => sv.video.id === purchasedVideoId);
              // Signal the useEffect to play once the video element mounts
              pendingPlayRef.current = true;
              // Optimistically unlock in client state — no page reload needed
              setUnlockedVideoIds((prev) => new Set(prev).add(purchasedVideoId));
              setLockedVideo(null);
              if (targetIndex !== -1) {
                setCurrentVideoIndex(targetIndex);
                setIsPlaying(true);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline Purchase Modal ────────────────────────────────────────────────────
function VideoPurchaseModal({
  video,
  userId,
  onClose,
  onPurchaseSuccess,
}: {
  video: { id: string; title: string; coinPrice: number; seriesId: string; creatorId: string };
  userId?: string;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [coinBalance, setCoinBalance] = React.useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = React.useState(true);

  React.useEffect(() => {
    if (!userId) { setLoadingBalance(false); return; }
    fetch('/api/coins/balance')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (typeof d.balance === 'number') setCoinBalance(d.balance); })
      .catch(() => {})
      .finally(() => setLoadingBalance(false));
  }, [userId]);

  const hasSufficientCoins = coinBalance !== null && coinBalance >= video.coinPrice;

  const handlePurchase = async () => {
    if (!userId) { router.push('/sign-in'); return; }
    if (!hasSufficientCoins) { router.push('/member/wallet?action=purchase'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/series/${video.seriesId}/videos/${video.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Purchase failed');
      // alreadyOwned or fresh purchase — both mean the user has access, unlock immediately
      onPurchaseSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl p-6 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-primary-navy">Unlock Episode</h2>
          <button onClick={onClose} disabled={isLoading} className="text-neutral-dark-gray hover:text-primary-navy">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-neutral-dark-gray mb-5 line-clamp-2">{video.title}</p>

        {/* Price */}
        <div className="bg-neutral-light-gray/50 rounded-lg p-4 mb-4 flex justify-between items-center text-sm font-semibold text-primary-navy">
          <span>Episode price:</span>
          <span className="flex items-center gap-1 text-base">
            <span role="img" aria-label="coins">🪙</span>
            {video.coinPrice} coins
          </span>
        </div>

        {/* Balance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between text-sm">
          <span className="text-primary-navy font-medium">Your balance:</span>
          {loadingBalance ? (
            <div className="animate-pulse bg-neutral-light-gray h-5 w-20 rounded" />
          ) : (
            <span className={`font-bold ${hasSufficientCoins ? 'text-green-600' : 'text-red-600'}`}>
              {coinBalance !== null ? `${coinBalance} coins` : 'N/A'}
            </span>
          )}
        </div>

        {!loadingBalance && coinBalance !== null && !hasSufficientCoins && (
          <p className="text-xs text-red-600 mb-3">
            You need {video.coinPrice - coinBalance} more coins.
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {hasSufficientCoins ? (
            <button
              onClick={handlePurchase}
              disabled={isLoading || loadingBalance}
              className="w-full py-3 bg-primary-neon-yellow text-primary-navy font-semibold rounded-lg hover:bg-primary-light-yellow transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : `Unlock for ${video.coinPrice} coins`}
            </button>
          ) : (
            <button
              onClick={() => router.push('/member/wallet?action=purchase')}
              className="w-full py-3 bg-accent-teal text-white font-semibold rounded-lg hover:bg-accent-teal/90 transition-colors"
            >
              Buy More Coins
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 bg-neutral-light-gray text-primary-navy font-semibold rounded-lg hover:bg-neutral-dark-gray/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-neutral-dark-gray text-center mt-3">
          One-time purchase · Lifetime access to this episode
        </p>
      </motion.div>
    </motion.div>
  );
}

function SeriesPurchaseModal({
  series,
  priceCalculation,
  onClose,
  userId,
  onPurchaseSuccess,
}: {
  series: Series;
  priceCalculation: PriceCalculation | null;
  onClose: () => void;
  userId?: string;
  onPurchaseSuccess: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [coinBalance, setCoinBalance] = React.useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = React.useState(true);

  React.useEffect(() => {
    if (!userId) { setLoadingBalance(false); return; }
    fetch('/api/coins/balance')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (typeof d.balance === 'number') setCoinBalance(d.balance); })
      .catch(() => {})
      .finally(() => setLoadingBalance(false));
  }, [userId]);

  const finalPrice = priceCalculation?.adjustedPrice ?? series.coinPrice;
  const hasSufficientCoins = coinBalance !== null && coinBalance >= finalPrice;

  const handlePurchase = async () => {
    if (!userId) { router.push('/sign-in'); return; }
    if (!hasSufficientCoins) { router.push('/member/wallet?action=purchase'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/series/${series.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Purchase failed');
      onPurchaseSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-primary-navy">Purchase Series</h2>
          <button onClick={onClose} disabled={isLoading} className="text-neutral-dark-gray hover:text-primary-navy">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Series info */}
        <div className="flex items-start space-x-3 mb-5">
          {series.thumbnailUrl && (
            <div className="relative w-20 h-14 flex-shrink-0 rounded overflow-hidden">
              <Image src={series.thumbnailUrl} alt={series.title} fill className="object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-primary-navy text-sm">{series.title}</h3>
            <p className="text-xs text-neutral-dark-gray mt-0.5">
              {series.videoCount} videos · {Math.floor(series.totalDuration / 60)} min
            </p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-neutral-light-gray/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          {priceCalculation && priceCalculation.ownedVideos.length > 0 ? (
            <>
              <div className="flex justify-between text-neutral-dark-gray">
                <span>Original:</span>
                <span className="line-through">{priceCalculation.originalPrice} coins</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Your videos:</span>
                <span>-{priceCalculation.totalDeduction} coins</span>
              </div>
              <div className="flex justify-between font-semibold text-primary-navy border-t border-neutral-light-gray pt-2">
                <span>You pay:</span>
                <span>{priceCalculation.adjustedPrice} coins</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-semibold text-primary-navy">
              <span>Total:</span>
              <span>{series.coinPrice} coins</span>
            </div>
          )}
          <p className="text-xs text-neutral-dark-gray text-right">≈ ₹{(finalPrice / 20).toFixed(2)}</p>
        </div>

        {/* Balance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between text-sm">
          <span className="text-primary-navy font-medium">Your balance:</span>
          {loadingBalance ? (
            <div className="animate-pulse bg-neutral-light-gray h-5 w-20 rounded" />
          ) : (
            <span className={`font-bold ${hasSufficientCoins ? 'text-green-600' : 'text-red-600'}`}>
              {coinBalance !== null ? `${coinBalance} coins` : 'N/A'}
            </span>
          )}
        </div>

        {!loadingBalance && coinBalance !== null && !hasSufficientCoins && (
          <p className="text-xs text-red-600 mb-3">
            You need {finalPrice - coinBalance} more coins.
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {hasSufficientCoins ? (
            <button
              onClick={handlePurchase}
              disabled={isLoading || loadingBalance}
              className="w-full py-3 bg-primary-neon-yellow text-primary-navy font-semibold rounded-lg hover:bg-primary-light-yellow transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : `Confirm Purchase (${finalPrice} coins)`}
            </button>
          ) : (
            <button
              onClick={() => router.push('/member/wallet?action=purchase')}
              className="w-full py-3 bg-accent-teal text-white font-semibold rounded-lg hover:bg-accent-teal/90 transition-colors"
            >
              Buy More Coins
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 bg-neutral-light-gray text-primary-navy font-semibold rounded-lg hover:bg-neutral-dark-gray/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-neutral-dark-gray text-center mt-3">
          One-time purchase · Lifetime access
        </p>
      </motion.div>
    </motion.div>
  );
}
