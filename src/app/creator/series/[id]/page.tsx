"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { CreatorProtectedRoute } from "@/components/layout/ProtectedRoute";
import { SeriesEditForm, SeriesVideoManager } from "@/components/creator/series";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Series, SeriesVideo } from "@/types";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function CreatorSeriesEditContent() {
 const params = useParams();
 const router = useRouter();
 const { userProfile } = useAuthContext();
 const [series, setSeries] = useState<Series | null>(null);
 const [seriesVideos, setSeriesVideos] = useState<SeriesVideo[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"details" | "videos">("details");

 const seriesId = params.id as string;

 useEffect(() => {
 const loadSeries = async () => {
 if (!seriesId || !userProfile) return;

 setLoading(true);
 try {

 const seriesResponse = await fetch(`/api/series/${seriesId}`);
 if (!seriesResponse.ok) {
 throw new Error("Series not found");
 }
 const seriesData = await seriesResponse.json();

 if (seriesData.series.creatorId !== userProfile.id) {
 throw new Error("You don't have permission to edit this series");
 }
 
 setSeries(seriesData.series);

 const videosResponse = await fetch(`/api/series/${seriesId}/videos`);
 if (videosResponse.ok) {
 const videosData = await videosResponse.json();
 setSeriesVideos(videosData.videos || []);
 }
 } catch (error) {
 console.error("Failed to load series:", error);
 setError(error instanceof Error ? error.message : "Failed to load series");
 } finally {
 setLoading(false);
 }
 };

 loadSeries();
 }, [seriesId, userProfile]);

 const handleSeriesSaved = (updatedSeries: Series) => {
 setSeries(updatedSeries);
 };

 const handleVideoAdded = (videoId: string) => {
 // Refresh videos list
 const loadVideos = async () => {
 try {
 const response = await fetch(`/api/series/${seriesId}/videos`);
 if (response.ok) {
 const data = await response.json();
 setSeriesVideos(data.videos || []);
 }
 } catch (error) {
 console.error("Failed to refresh videos:", error);
 }
 };
 loadVideos();
 };

 const handleVideoRemoved = (videoId: string) => {
 setSeriesVideos(prev => prev.filter(v => v.videoId !== videoId));
 };

 const handleOrderChanged = (videoId: string, newOrder: number) => {
 // Refresh videos list
 const loadVideos = async () => {
 try {
 const response = await fetch(`/api/series/${seriesId}/videos`);
 if (response.ok) {
 const data = await response.json();
 setSeriesVideos(data.videos || []);
 }
 } catch (error) {
 console.error("Failed to refresh videos:", error);
 }
 };
 loadVideos();
 };

 if (loading) {
 return <LoadingScreen message="Loading series..." variant="dashboard" fullScreen={false} />;
 }

 if (error || !series) {
 return (
 <div className="container mx-auto px-4 py-6">
 <div className="text-center py-12">
 <p className="text-red-600 mb-4">{error || "Series not found"}</p>
 <button
 onClick={() => router.push("/creator/series")}
 className="btn-primary"
 >
 Back to Series
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="container mx-auto px-4 py-6 space-y-6">
 {}
 <div className="flex items-center gap-4">
 <button
 onClick={() => router.push("/creator/series")}
 className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <ArrowLeftIcon className="w-5 h-5" />
 </button>
 <div>
 <h1 className="text-2xl font-bold text-gray-900">Edit Series</h1>
 <p className="text-gray-600">{series.title}</p>
 </div>
 </div>

 {}
 <div className="border-b border-gray-200">
 <nav className="-mb-px flex space-x-8">
 <button
 onClick={() => setActiveTab("details")}
 className={`py-2 px-1 border-b-2 font-medium text-sm ${
 activeTab === "details"
 ? "border-purple-500 text-purple-600"
 : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
 }`}
 >
 Series Details
 </button>
 <button
 onClick={() => setActiveTab("videos")}
 className={`py-2 px-1 border-b-2 font-medium text-sm ${
 activeTab === "videos"
 ? "border-purple-500 text-purple-600"
 : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
 }`}
 >
 Manage Videos ({seriesVideos.length})
 </button>
 </nav>
 </div>

 {}
 {activeTab === "details" && (
 <SeriesEditForm
 series={series}
 onSave={handleSeriesSaved}
 onCancel={() => router.push("/creator/series")}
 />
 )}

 {activeTab === "videos" && (
 <SeriesVideoManager
 seriesId={seriesId}
 videos={seriesVideos}
 onVideoAdded={handleVideoAdded}
 onVideoRemoved={handleVideoRemoved}
 onOrderChanged={handleOrderChanged}
 />
 )}
 </div>
 );
}

export default function CreatorSeriesEditPage() {
 return (
 <CreatorProtectedRoute>
 <CreatorSeriesEditContent />
 </CreatorProtectedRoute>
 );
}