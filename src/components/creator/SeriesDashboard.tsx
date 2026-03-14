"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
 PlusIcon,
 EyeIcon,
 PencilIcon,
 TrashIcon,
 ChartBarIcon,
 PlayIcon,
 CurrencyRupeeIcon,
 ClockIcon,
 ExclamationTriangleIcon,
 CheckCircleIcon,
 XCircleIcon,
 ClockIcon as PendingIcon,
} from "@heroicons/react/24/outline";
import { SeriesListItem, Series } from "@/types";
import { SeriesCreationModal } from "@/components/creator/series";

interface SeriesDashboardProps {
 creatorId: string;
}

export default function SeriesDashboard({ creatorId }: SeriesDashboardProps) {
 const [series, setSeries] = useState<SeriesListItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [showCreateModal, setShowCreateModal] = useState(false);

 useEffect(() => {
 const loadSeries = async () => {
 setIsLoading(true);
 try {
 const response = await fetch(`/api/series?creator=${creatorId}`);
 if (response.ok) {
 const data = await response.json();
 setSeries(data.series || []);
 } else {
 throw new Error("Failed to load series");
 }
 } catch (error) {
 console.error("Failed to load series:", error);
 setError("Failed to load your series");
 } finally {
 setIsLoading(false);
 }
 };

 loadSeries();
 }, [creatorId]);

 const handleDeleteSeries = async (seriesId: string) => {
 const seriesItem = series.find(s => s.id === seriesId);
 if (!seriesItem) return;

 if (!confirm(`Are you sure you want to delete "${seriesItem.title}"? This action cannot be undone.`)) {
 return;
 }

 try {
 const response = await fetch(`/api/series/${seriesId}`, {
 method: "DELETE",
 });

 if (!response.ok) {
 const data = await response.json();
 throw new Error(data.error || "Failed to delete series");
 }

 setSeries(prev => prev.filter(s => s.id !== seriesId));
 } catch (error) {
 console.error("Failed to delete series:", error);
 setError(error instanceof Error ? error.message : "Failed to delete series");
 }
 };

 const handleSeriesCreated = (newSeries: Series) => {

 const loadSeries = async () => {
 try {
 const response = await fetch(`/api/series?creator=${creatorId}`);
 if (response.ok) {
 const data = await response.json();
 setSeries(data.series || []);
 }
 } catch (error) {
 console.error("Failed to refresh series:", error);
 }
 };
 loadSeries();
 setShowCreateModal(false);
 };

 const getModerationStatusIcon = (status: string) => {
 switch (status) {
 case "approved":
 return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
 case "rejected":
 return <XCircleIcon className="w-4 h-4 text-red-500" />;
 case "flagged":
 return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
 case "pending":
 default:
 return <PendingIcon className="w-4 h-4 text-gray-500" />;
 }
 };

 const getModerationStatusText = (status: string) => {
 switch (status) {
 case "approved":
 return "Approved";
 case "rejected":
 return "Rejected";
 case "flagged":
 return "Flagged";
 case "pending":
 default:
 return "Pending";
 }
 };

 const getModerationStatusColor = (status: string) => {
 switch (status) {
 case "approved":
 return "text-green-700 bg-green-50 border-green-200";
 case "rejected":
 return "text-red-700 bg-red-50 border-red-200";
 case "flagged":
 return "text-yellow-700 bg-yellow-50 border-yellow-200";
 case "pending":
 default:
 return "text-gray-700 bg-gray-50 border-gray-200";
 }
 };

 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat("en-IN", {
 style: "currency",
 currency: "INR",
 minimumFractionDigits: 0,
 }).format(amount);
 };

 const formatDate = (date: Date) => {
 return new Intl.DateTimeFormat("en-IN", {
 year: "numeric",
 month: "short",
 day: "numeric",
 }).format(new Date(date));
 };

 const totalSeries = series.length;
 const totalEarnings = series.reduce((sum, s) => sum + (s.earnings || 0), 0);
 const totalViews = series.reduce((sum, s) => sum + (s.viewCount || 0), 0);
 const activeSeries = series.filter(s => s.isActive).length;

 return (
 <div className="space-y-6">
 {}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold text-gray-900">Series Dashboard</h2>
 <p className="text-gray-600 mt-1">
 Manage your video series and track performance
 </p>
 </div>
 <button
 onClick={() => setShowCreateModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
 >
 <PlusIcon className="w-4 h-4" />
 Create Series
 </button>
 </div>

 {}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-purple-100 rounded-lg">
 <PlayIcon className="w-5 h-5 text-purple-600" />
 </div>
 <div>
 <p className="text-sm text-gray-600">Total Series</p>
 <p className="text-2xl font-bold text-gray-900">{totalSeries}</p>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-green-100 rounded-lg text-xl">
 🪙
 </div>
 <div>
 <p className="text-sm text-gray-600">Total Coins Earned</p>
 <p className="text-2xl font-bold text-gray-900">{Math.floor(totalEarnings * 20).toLocaleString()}</p>
 <p className="text-xs text-gray-500">{formatCurrency(totalEarnings)} equivalent</p>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-100 rounded-lg">
 <EyeIcon className="w-5 h-5 text-blue-600" />
 </div>
 <div>
 <p className="text-sm text-gray-600">Total Views</p>
 <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-gray-200">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-orange-100 rounded-lg">
 <CheckCircleIcon className="w-5 h-5 text-orange-600" />
 </div>
 <div>
 <p className="text-sm text-gray-600">Active Series</p>
 <p className="text-2xl font-bold text-gray-900">{activeSeries}</p>
 </div>
 </div>
 </div>
 </div>

 {}
 <AnimatePresence>
 {error && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
 >
 <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-red-700">{error}</p>
 <button
 onClick={() => setError(null)}
 className="text-sm text-red-600 hover:text-red-800 underline mt-1"
 >
 Dismiss
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {}
 <div className="bg-white rounded-lg border border-gray-200">
 <div className="p-6 border-b border-gray-200">
 <h3 className="text-lg font-semibold text-gray-900">Your Series</h3>
 </div>

 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
 </div>
 ) : series.length === 0 ? (
 <div className="text-center py-12">
 <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
 <PlayIcon className="w-6 h-6 text-gray-400" />
 </div>
 <h3 className="text-lg font-medium text-gray-900 mb-2">No series yet</h3>
 <p className="text-gray-500 mb-4">
 Create your first series to organize your videos and increase earnings
 </p>
 <button
 onClick={() => setShowCreateModal(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
 >
 <PlusIcon className="w-4 h-4" />
 Create Series
 </button>
 </div>
 ) : (
 <div className="divide-y divide-gray-200">
 {series.map((seriesItem) => (
 <SeriesListRow
 key={seriesItem.id}
 series={seriesItem}
 onDelete={() => handleDeleteSeries(seriesItem.id)}
 getModerationStatusIcon={getModerationStatusIcon}
 getModerationStatusText={getModerationStatusText}
 getModerationStatusColor={getModerationStatusColor}
 formatCurrency={formatCurrency}
 formatDate={formatDate}
 />
 ))}
 </div>
 )}
 </div>

 {}
 <SeriesCreationModal
 isOpen={showCreateModal}
 onClose={() => setShowCreateModal(false)}
 onSeriesCreated={handleSeriesCreated}
 />
 </div>
 );
}

function SeriesListRow({
 series,
 onDelete,
 getModerationStatusIcon,
 getModerationStatusText,
 getModerationStatusColor,
 formatCurrency,
 formatDate,
}: {
 series: SeriesListItem;
 onDelete: () => void;
 getModerationStatusIcon: (status: string) => React.ReactElement;
 getModerationStatusText: (status: string) => string;
 getModerationStatusColor: (status: string) => string;
 formatCurrency: (amount: number) => string;
 formatDate: (date: Date) => string;
}) {
 const [showActions, setShowActions] = useState(false);

 return (
 <Link
 href={`/creator/series/${series.id}`}
 className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
 onMouseEnter={() => setShowActions(true)}
 onMouseLeave={() => setShowActions(false)}
 >
 <div className="flex items-center gap-4">
 {}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 <h4 className="font-semibold text-gray-900 truncate">
 {series.title}
 </h4>
 <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getModerationStatusColor(series.moderationStatus)}`}>
 {getModerationStatusIcon(series.moderationStatus)}
 {getModerationStatusText(series.moderationStatus)}
 </div>
 {!series.isActive && (
 <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
 Inactive
 </span>
 )}
 </div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
 <div className="flex items-center gap-1">
 <PlayIcon className="w-4 h-4" />
 <span className={series.videoCount === 0 ? "text-gray-400 italic" : ""}>
 {series.videoCount === 0 ? "0 videos" : series.videoCount === 1 ? "1 video" : `${series.videoCount} videos`}
 </span>
 {series.videoCount === 0 && (
 <span className="ml-1 text-xs text-yellow-600" title="No videos in this series">⚠️</span>
 )}
 </div>
 <div className="flex items-center gap-1">
 <EyeIcon className="w-4 h-4" />
 <span>{(series.viewCount || 0).toLocaleString()} views</span>
 </div>
 <div className="flex items-center gap-1 text-xl">
 🪙
 <span>{Math.floor((series.earnings || 0) * 20).toLocaleString()} coins</span>
 <span className="text-xs text-gray-500">
 ({formatCurrency((series.earnings || 0))})
 </span>
 </div>
 <div className="flex items-center gap-1">
 <ClockIcon className="w-4 h-4" />
 <span>{formatDate(series.createdAt)}</span>
 </div>
 </div>
 </div>

 {}
 <AnimatePresence>
 {showActions && (
 <motion.div
 initial={{ opacity: 0, x: 10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 className="flex items-center gap-2"
 onClick={(e) => e.preventDefault()}
 >
 <Link
 href={`/creator/series/${series.id}/analytics`}
 className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
 title="View analytics"
 onClick={(e) => e.stopPropagation()}
 >
 <ChartBarIcon className="w-4 h-4" />
 </Link>
 <Link
 href={`/creator/series/${series.id}`}
 className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
 title="Manage series"
 onClick={(e) => e.stopPropagation()}
 >
 <PencilIcon className="w-4 h-4" />
 </Link>
 <Link
 href={`/series/${series.id}`}
 className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
 title="View series"
 onClick={(e) => e.stopPropagation()}
 >
 <EyeIcon className="w-4 h-4" />
 </Link>
 <button
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 onDelete();
 }}
 className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
 title="Delete series"
 >
 <TrashIcon className="w-4 h-4" />
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </Link>
 );
}