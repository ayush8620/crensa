"use client";

import React, { useState, useEffect } from "react";
import { useFetchWithRetry } from "@/hooks/useApiWithRetry";
import { FeatureErrorBoundary } from "@/components/layout/ErrorBoundaryLayout";
import { ApiErrorHandler } from "@/lib/utils/apiErrorHandler";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface VisitHistoryProps {
    limit?: number;
    showTitle?: boolean;
    className?: string;
}

interface VisitItem {
    id: string;
    visitedAt: Date;
    source: string;
    duration?: number;
    creator: {
        id: string;
        username: string;
        avatar?: string;
    };
}

export function VisitHistory({
    limit = 10,
    showTitle = true,
    className = "",
}: VisitHistoryProps) {
    const [offset, setOffset] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

    const [apiState, apiActions] = useFetchWithRetry<{
        success: boolean;
        data: {
            visits: VisitItem[];
            total: number;
            hasMore: boolean;
        };
    }>(
        () => `/api/member/profile-visits?limit=${limit}&offset=${offset}`,
        {},
        {
            maxRetries: 2, // Reasonable retry count now that table exists
            baseDelay: 1000,
            retryableStatuses: [408, 429, 500, 502, 503, 504], // Include 500 again
            onRetry: (attempt) => {
                console.log(`Retrying visit history fetch, attempt ${attempt}`);
            },
            onMaxRetriesReached: (error) => {
                console.error("Max retries reached for visit history:", error);
            },
        }
    );

    const { data: apiData, loading, error } = apiState;
    const visits = apiData?.data?.visits || [];
    const total = apiData?.data?.total || 0;
    const hasMore = apiData?.data?.hasMore || false;

    const isRetryable = error ? ApiErrorHandler.isRetryableError(error) : false;

    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);

            const timer = setTimeout(() => {
                apiActions.execute();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            apiActions.execute();
        }
    }, [limit, offset, isInitialized, apiActions]);

    const handleRetry = () => {
        apiActions.retry();
    };

    const handleCreatorClick = (creatorId: string, username: string) => {
        window.location.href = `/creator/${username}`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return null;

        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}m`;
        } else {
            return `${Math.floor(seconds / 3600)}h ${Math.floor(
                (seconds % 3600) / 60
            )}m`;
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case "dashboard":
                return "🏠";
            case "search":
                return "🔍";
            case "recommendation":
                return "✨";
            case "trending":
                return "🔥";
            default:
                return "👤";
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "dashboard":
                return "Dashboard";
            case "search":
                return "Search";
            case "recommendation":
                return "Recommended";
            case "trending":
                return "Trending";
            default:
                return "Direct";
        }
    };

    if (loading && visits.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                {showTitle && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recently Visited Profiles
                    </h3>
                )}
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                {showTitle && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recently Visited Profiles
                    </h3>
                )}
                <div className="text-center py-8">
                    <div className="text-red-500 mb-3 text-2xl">
                        {isRetryable ? "🔄" : "⚠️"}
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {isRetryable ? "Connection Issue" : "Unable to Load Visit History"}
                    </h4>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                        {error?.message || "An unexpected error occurred"}
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={handleRetry}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span>Retrying...</span>
                                </span>
                            ) : (
                                "Try Again"
                            )}
                        </button>
                        <p className="text-xs text-gray-500">
                            Having trouble? Check your internet connection or try refreshing
                            the page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (visits.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                {showTitle && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recently Visited Profiles
                    </h3>
                )}
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">👤</div>
                    <p className="text-gray-600">No profile visits yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Start exploring creators to see your visit history here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <FeatureErrorBoundary featureName="Visit History">
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                {showTitle && (
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Recently Visited Profiles
                        </h3>
                        <span className="text-sm text-gray-500">{total} total visits</span>
                    </div>
                )}

                <div className="space-y-3">
                    {visits.map((visit: VisitItem) => (
                        <div
                            key={visit.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() =>
                                handleCreatorClick(visit.creator.id, visit.creator.username)
                            }
                        >
                            <div className="flex items-center space-x-3 flex-1">
                                {/* Creator Avatar */}
                                <div className="relative">
                                    {visit.creator.avatar ? (
                                        <Image
                                            src={visit.creator.avatar}
                                            alt={visit.creator.username}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {visit.creator.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Source Indicator */}
                                    <div
                                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs border shadow-sm"
                                        title={`Visited from ${getSourceLabel(visit.source)}`}
                                    >
                                        {getSourceIcon(visit.source)}
                                    </div>
                                </div>

                                {/* Visit Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        @{visit.creator.username}
                                    </p>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                        <span>
                                            {formatDistanceToNow(new Date(visit.visitedAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                        {visit.duration && (
                                            <>
                                                <span>•</span>
                                                <span>{formatDuration(visit.duration)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chevron and Source Label */}
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span className="hidden sm:inline">
                                    via {getSourceLabel(visit.source)}
                                </span>
                                <svg
                                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setOffset((prev) => prev + limit)}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span>Loading...</span>
                                </span>
                            ) : (
                                "Load More"
                            )}
                        </button>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                        <button
                            onClick={handleRetry}
                            disabled={loading}
                            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                            <span className={loading ? "animate-spin" : ""}>🔄</span>
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => (window.location.href = "/discover")}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Discover More Creators →
                        </button>
                    </div>
                </div>
            </div>
        </FeatureErrorBoundary>
    );
}

export function VisitHistoryCompact({
    limit = 5,
    className = "",
}: VisitHistoryProps) {
    const [isInitialized, setIsInitialized] = useState(false);

    const [apiState, apiActions] = useFetchWithRetry<{
        success: boolean;
        data: {
            visits: VisitItem[];
        };
    }>(
        () => `/api/member/profile-visits?limit=${limit}`,
        {},
        {
            maxRetries: 1, // Light retry for compact version
            retryableStatuses: [408, 429, 500, 502, 503, 504],
        }
    );

    const { data: apiData, loading, error } = apiState;
    const visits = apiData?.data?.visits || [];

    const isRetryable = error ? ApiErrorHandler.isRetryableError(error) : false;

    useEffect(() => {
        if (!isInitialized) {
            setIsInitialized(true);

            const timer = setTimeout(() => {
                apiActions.execute();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [limit, isInitialized, apiActions]);

    const handleRetry = () => {
        apiActions.retry();
    };

    if (loading && visits.length === 0) {
        return (
            <div className={`space-y-2 ${className}`}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center py-4 ${className}`}>
                <div className="text-red-500 mb-2 text-sm">
                    {isRetryable ? "🔄" : "⚠️"}
                </div>
                <p className="text-xs text-gray-600 mb-2">Unable to load visits</p>
                <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                    {loading ? "Retrying..." : "Try again"}
                </button>
            </div>
        );
    }

    if (visits.length === 0) {
        return (
            <div className={`text-center py-4 ${className}`}>
                <p className="text-sm text-gray-500">No recent visits</p>
                <p className="text-xs text-gray-400 mt-1">
                    Visit creator profiles to see them here
                </p>
            </div>
        );
    }

    return (
        <FeatureErrorBoundary featureName="Recent Visits">
            <div className={`space-y-2 ${className}`}>
                {visits.slice(0, limit).map((visit: VisitItem) => (
                    <div
                        key={visit.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer group"
                        onClick={() =>
                            (window.location.href = `/creator/${visit.creator.username}`)
                        }
                    >
                        {visit.creator.avatar ? (
                            <Image
                                src={visit.creator.avatar}
                                alt={visit.creator.username}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {visit.creator.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                                @{visit.creator.username}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(visit.visitedAt), {
                                    addSuffix: true,
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </FeatureErrorBoundary>
    );
}
