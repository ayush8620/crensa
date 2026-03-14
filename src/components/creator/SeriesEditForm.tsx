"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Series, SeriesFormData, Category } from "@/types";

interface SeriesEditFormProps {
  series: Series;
  onSave: (updatedSeries: Series) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  "Entertainment",
  "Education",
  "Comedy",
  "Music",
  "Dance",
  "Lifestyle",
  "Technology",
  "Sports",
  "Art",
  "Other",
];

export default function SeriesEditForm({
  series,
  onSave,
  onCancel,
}: SeriesEditFormProps) {
  const [formData, setFormData] = useState<SeriesFormData>({
    title: "",
    description: "",
    category: "",
    tags: [],
    thumbnail: undefined,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          
          setCategories(
            DEFAULT_CATEGORIES.map((name, index) => ({
              id: `default-${index}`,
              name,
              slug: name.toLowerCase(),
              description: "",
              iconUrl: "",
              videoCount: 0,
              seriesCount: 0,
              isActive: true,
              displayOrder: index,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        
        setCategories(
          DEFAULT_CATEGORIES.map((name, index) => ({
            id: `default-${index}`,
            name,
            slug: name.toLowerCase(),
            description: "",
            iconUrl: "",
            videoCount: 0,
            seriesCount: 0,
            isActive: true,
            displayOrder: index,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }
    };

    loadCategories();
  }, []);

  
  useEffect(() => {
    if (series) {
      setFormData({
        title: series.title,
        description: series.description || "",
        category: series.category,
        tags: [...series.tags],
        thumbnail: undefined,
      });
      setThumbnailPreview(series.thumbnailUrl || null);
      setTagInput("");
      setError(null);
      setSuccess(false);
      setRetryCount(0);
      setHasChanges(false);
    }
  }, [series]);

  
  useEffect(() => {
    if (series) {
      const hasFormChanges =
        formData.title !== series.title ||
        formData.description !== (series.description || "") ||
        formData.category !== series.category ||
        JSON.stringify(formData.tags) !== JSON.stringify(series.tags) ||
        formData.thumbnail !== undefined;

      setHasChanges(hasFormChanges);
    }
  }, [formData, series]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file must be less than 5MB");
        return;
      }

      setFormData((prev) => ({ ...prev, thumbnail: file }));

      
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (!formData.title.trim()) {
      setError("Series title is required");
      return;
    }

    if (!formData.category) {
      setError("Category is required");
      return;
    }

    if (formData.tags.length > 10) {
      setError("Cannot have more than 10 tags");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      
      const uploadFormData = new FormData();
      uploadFormData.append("title", formData.title.trim());
      uploadFormData.append("description", formData.description.trim());
      uploadFormData.append("category", formData.category);
      uploadFormData.append("tags", JSON.stringify(formData.tags));

      if (formData.thumbnail) {
        uploadFormData.append("thumbnail", formData.thumbnail);
      }

      const response = await fetch(`/api/series/${series.id}`, {
        method: "PUT",
        body: uploadFormData,
      });

      let responseData;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server");
        }
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error(
          "Invalid response format from server. Please try again."
        );
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You need to be logged in to update series");
        } else if (response.status === 403) {
          throw new Error("You can only update your own series");
        } else if (response.status === 404) {
          throw new Error("Series not found");
        } else if (response.status === 400) {
          if (responseData.details && Array.isArray(responseData.details)) {
            throw new Error(responseData.details.join(", "));
          } else {
            throw new Error(responseData.error || "Invalid data provided");
          }
        } else {
          throw new Error(responseData.error || "Failed to update series");
        }
      }

      if (!responseData.success || !responseData.series) {
        throw new Error("Invalid response structure from server");
      }

      const updatedSeries = responseData.series;
      setSuccess(true);
      onSave(updatedSeries);
    } catch (error) {
      console.error("Series update error:", error);

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          setError(
            "Network error. Please check your connection and try again."
          );
        } else if (error.message.includes("JSON")) {
          setError("Server response error. Please try again.");
        } else {
          setError(error.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount((prev) => prev + 1);
    handleSubmit(new Event("submit") as any);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Edit Series</h2>
          <p className="text-sm text-gray-500 mt-1">
            Update your series information
          </p>
        </div>
        {hasChanges && (
          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
            Unsaved changes
          </span>
        )}
      </div>

      {}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">Series updated successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 mb-2">{error}</p>
                {retryCount < 3 && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
                  >
                    Try again
                  </button>
                )}
                {retryCount >= 3 && (
                  <p className="text-sm text-red-600">
                    If the problem persists, please refresh the page and try
                    again.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {series.thumbnailUrl && (
            <Image
              src={series.thumbnailUrl}
              alt={series.title}
              width={80}
              height={48}
              className="w-20 h-12 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {series.title}
            </p>
            <p className="text-xs text-gray-500">
              {series.videoCount} videos • {series.viewCount} views
            </p>
          </div>
        </div>

        {}
        <div>
          <label
            htmlFor="edit-series-title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Series Title *
          </label>
          <input
            id="edit-series-title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter series title"
            maxLength={255}
            required
          />
        </div>

        {}
        <div>
          <label
            htmlFor="edit-series-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="edit-series-description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your series..."
            rows={4}
            maxLength={1000}
          />
        </div>

        {}
        <div>
          <label
            htmlFor="edit-series-category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category *
          </label>
          <select
            id="edit-series-category"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Series Thumbnail
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="edit-thumbnail-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                {thumbnailPreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                      <PhotoIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or JPEG (MAX. 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="edit-thumbnail-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </label>
            </div>
            {thumbnailPreview && (
              <button
                type="button"
                onClick={() => {
                  setThumbnailPreview(series.thumbnailUrl || null);
                  setFormData((prev) => ({ ...prev, thumbnail: undefined }));
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Reset to original
              </button>
            )}
          </div>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Add a tag and press Enter"
                maxLength={50}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-purple-900"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              {formData.tags.length}/10 tags
            </p>
          </div>
        </div>

        {}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || success || !hasChanges}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
