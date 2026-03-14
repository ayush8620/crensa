"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { SeriesVideo, Video } from "@/types";

interface SeriesVideoManagerProps {
  seriesId: string;
  videos: SeriesVideo[];
  onVideoAdded: (videoId: string) => void;
  onVideoRemoved: (videoId: string) => void;
  onOrderChanged: (videoId: string, newOrder: number) => void;
}

interface VideoWithDetails extends SeriesVideo {
  video: Video;
}

export default function SeriesVideoManager({
  seriesId,
  videos,
  onVideoAdded,
  onVideoRemoved,
  onOrderChanged,
}: SeriesVideoManagerProps) {
  const [videosWithDetails, setVideosWithDetails] = useState<VideoWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadVideoDetails = async () => {
      if (videos.length === 0) {
        setVideosWithDetails([]);
        return;
      }

      setIsLoading(true);
      try {
        const videoDetails = await Promise.all(
          videos.map(async (seriesVideo) => {
            const response = await fetch(`/api/videos/${seriesVideo.videoId}`);
            if (response.ok) {
              const data = await response.json();
              return { ...seriesVideo, video: data.video };
            }
            throw new Error(`Failed to load video ${seriesVideo.videoId}`);
          })
        );
        videoDetails.sort((a, b) => a.orderIndex - b.orderIndex);
        setVideosWithDetails(videoDetails);
      } catch (error) {
        console.error("Failed to load video details:", error);
        setError("Failed to load video details");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoDetails();
  }, [videos]);

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to remove this video from the series?")) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/series/${seriesId}/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove video");
      }

      onVideoRemoved(videoId);
      setSuccess("Video removed from series");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to remove video:", error);
      setError(error instanceof Error ? error.message : "Failed to remove video");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceUpdate = (videoId: string, newCoinPrice: number) => {
    setVideosWithDetails((prev) =>
      prev.map((v) =>
        v.videoId === videoId
          ? { ...v, video: { ...v.video, coinPrice: newCoinPrice } }
          : v
      )
    );
    setSuccess("Video updated successfully");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
    setDraggedItem(videoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetVideoId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetVideoId) {
      setDraggedItem(null);
      return;
    }

    const targetVideo = videosWithDetails.find((v) => v.videoId === targetVideoId);
    if (!targetVideo) {
      setDraggedItem(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/series/${seriesId}/videos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: draggedItem, newOrderIndex: targetVideo.orderIndex }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reorder videos");
      }

      onOrderChanged(draggedItem, targetVideo.orderIndex);
      setSuccess("Video order updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to reorder videos:", error);
      setError(error instanceof Error ? error.message : "Failed to reorder videos");
    } finally {
      setIsLoading(false);
      setDraggedItem(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Series Videos ({videosWithDetails.length})
          </h3>
          <p className="text-sm text-gray-500">Manage videos in this series. Drag to reorder.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Upload New Video
        </button>
      </div>

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
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

      {/* Video list */}
      {isLoading && videosWithDetails.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : videosWithDetails.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <PlusIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos in series</h3>
          <p className="text-gray-500 mb-4">Upload a new video to get started</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Upload New Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {videosWithDetails.map((seriesVideo, index) => (
            <motion.div
              key={seriesVideo.videoId}
              layout
              className={`flex items-center gap-4 p-4 bg-white border rounded-lg transition-all ${
                draggedItem === seriesVideo.videoId ? "opacity-50 scale-95" : "hover:shadow-md"
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, seriesVideo.videoId)}
              onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent<HTMLDivElement>)}
              onDrop={(e) => handleDrop(e as unknown as React.DragEvent<HTMLDivElement>, seriesVideo.videoId)}
            >
              {/* Drag handle */}
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <Bars3Icon className="w-5 h-5" />
              </div>

              {/* Order number */}
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <Image
                  src={seriesVideo.video.thumbnailUrl}
                  alt={seriesVideo.video.title}
                  width={80}
                  height={48}
                  className="w-20 h-12 object-cover rounded"
                />
              </div>

              {/* Info + inline edit */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{seriesVideo.video.title}</h4>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{formatDuration(seriesVideo.video.duration)}</span>
                  <span>{seriesVideo.video.viewCount} views</span>
                </div>
              </div>

              {/* Inline price + access editor */}
              <VideoAccessEditor
                seriesId={seriesId}
                videoId={seriesVideo.videoId}
                coinPrice={seriesVideo.video.coinPrice}
                onUpdated={handlePriceUpdate}
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <VideoPreviewButton video={seriesVideo.video} />
                <button
                  onClick={() => handleRemoveVideo(seriesVideo.videoId)}
                  disabled={isLoading}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from series"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <VideoUploadModal
          seriesId={seriesId}
          onClose={() => setShowUploadModal(false)}
          onVideoUploaded={(videoId) => {
            onVideoAdded(videoId);
            setShowUploadModal(false);
            setSuccess("Video uploaded successfully!");
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}

// ─── Inline Video Access Editor ──────────────────────────────────────────────

function VideoAccessEditor({
  seriesId,
  videoId,
  coinPrice,
  onUpdated,
}: {
  seriesId: string;
  videoId: string;
  coinPrice: number;
  onUpdated: (videoId: string, newCoinPrice: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const safeCoinPrice = coinPrice ?? 0;
  const [accessType, setAccessType] = useState<"free" | "paid">(safeCoinPrice > 0 ? "paid" : "free");
  const [price, setPrice] = useState(safeCoinPrice > 0 ? safeCoinPrice : 20);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    const newCoinPrice = accessType === "free" ? 0 : price;

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/series/${seriesId}/videos/${videoId}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinPrice: newCoinPrice }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update");
      }

      onUpdated(videoId, newCoinPrice);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAccessType(safeCoinPrice > 0 ? "paid" : "free");
    setPrice(safeCoinPrice > 0 ? safeCoinPrice : 20);
    setSaveError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            safeCoinPrice === 0
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {safeCoinPrice === 0 ? "Free" : `${safeCoinPrice} coins`}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="Edit price"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[180px]">
      {/* Access type toggle */}
      <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
        <button
          onClick={() => setAccessType("free")}
          className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
            accessType === "free"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Free
        </button>
        <button
          onClick={() => setAccessType("paid")}
          className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
            accessType === "paid"
              ? "bg-amber-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Paid
        </button>
      </div>

      {/* Coin price input (only when paid) */}
      {accessType === "paid" && (
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Math.max(1, Math.min(2000, parseInt(e.target.value) || 1)))}
          min={1}
          max={2000}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-transparent"
          placeholder="Coins"
        />
      )}

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}

      {/* Save / Cancel */}
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <CheckIcon className="w-3 h-3" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Video Preview ────────────────────────────────────────────────────────────

function VideoPreviewButton({ video }: { video: Video }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        title="Preview video"
      >
        <EyeIcon className="w-4 h-4" />
      </button>

      {showPreview && (
        <VideoPreviewModal video={video} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

function VideoPreviewModal({ video, onClose }: { video: Video; onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{video.title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video src={video.videoUrl} poster={video.thumbnailUrl} controls className="w-full h-full">
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}</span>
                <span>{video.viewCount} views</span>
                <span className="capitalize">{video.category}</span>
              </div>
              {video.description && <p className="text-gray-700 text-sm">{video.description}</p>}
              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {video.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function VideoUploadModal({
  seriesId,
  onClose,
  onVideoUploaded,
}: {
  seriesId: string;
  onClose: () => void;
  onVideoUploaded: (videoId: string) => void;
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Video to Series</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a new video directly to this series</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <VideoUploadForm
                seriesId={seriesId}
                onUploadComplete={onVideoUploaded}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

function VideoUploadForm({
  seriesId,
  onUploadComplete,
  onCancel,
}: {
  seriesId: string;
  onUploadComplete: (videoId: string) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [accessType, setAccessType] = useState<"free" | "paid">("paid");
  const [coinPrice, setCoinPrice] = useState(20);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    "Entertainment", "Education", "Comedy", "Music", "Dance",
    "Lifestyle", "Technology", "Sports", "Art", "Other",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !category) {
      setError("Please fill in all required fields");
      return;
    }

    const finalCoinPrice = accessType === "free" ? 0 : coinPrice;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Get upload URL
      const urlResponse = await fetch("/api/videos/upload-url", { method: "POST" });
      if (!urlResponse.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, uploadParams, publicId } = await urlResponse.json();

      // Step 2: Upload to Cloudinary
      const formData = new FormData();
      Object.keys(uploadParams).forEach((key) => formData.append(key, uploadParams[key]));
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 90));
      });

      const cloudinaryResult = await new Promise<any>((resolve, reject) => {
        xhr.onload = () =>
          xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", uploadUrl);
        xhr.send(formData);
      });

      setUploadProgress(90);

      // Step 3: Save video metadata
      const saveResponse = await fetch("/api/videos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId,
          metadata: { title, description, category, coinPrice: finalCoinPrice, tags: [], aspectRatio: "16:9", seriesId },
          cloudinaryResult,
        }),
      });

      if (!saveResponse.ok) throw new Error("Failed to save video");

      const result = await saveResponse.json();
      setUploadProgress(100);
      onUploadComplete(result.video.id);
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* File */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Video File *</label>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        />
        {file && (
          <p className="text-sm text-gray-500 mt-2">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          placeholder="Enter video title"
          maxLength={255}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          placeholder="Describe your video..."
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isUploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Access type + coin price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Access Type *</label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-3">
          <button
            type="button"
            onClick={() => setAccessType("free")}
            disabled={isUploading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              accessType === "free"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setAccessType("paid")}
            disabled={isUploading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              accessType === "paid"
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Paid
          </button>
        </div>

        {accessType === "paid" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coin Price *</label>
            <input
              type="number"
              value={coinPrice}
              onChange={(e) => setCoinPrice(parseInt(e.target.value) || 0)}
              disabled={isUploading}
              min="1"
              max="2000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">1–2000 coins</p>
          </div>
        )}
      </div>

      {/* Progress */}
      {isUploading && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{uploadProgress < 90 ? "Uploading..." : "Processing..."}</span>
            <span className="text-purple-600 font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || !title || !category || isUploading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </div>
    </div>
  );
}
