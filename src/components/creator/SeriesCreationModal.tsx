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

interface SeriesCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeriesCreated: (series: Series) => void;
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

export default function SeriesCreationModal({
  isOpen,
  onClose,
  onSeriesCreated,
}: SeriesCreationModalProps) {
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

  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          
          setCategories(DEFAULT_CATEGORIES.map((name, index) => ({
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
          })));
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        
        setCategories(DEFAULT_CATEGORIES.map((name, index) => ({
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
        })));
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        category: "",
        tags: [],
        thumbnail: undefined,
      });
      setTagInput("");
      setThumbnailPreview(null);
      setError(null);
      setSuccess(false);
      setRetryCount(0);
    }
  }, [isOpen]);

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

      setFormData(prev => ({ ...prev, thumbnail: file }));
      
      
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
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
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

      const response = await fetch("/api/series", {
        method: "POST",
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
        throw new Error("Invalid response format from server. Please try again.");
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You need to be logged in to create series");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to create series");
        } else if (response.status === 400) {
          if (responseData.details && Array.isArray(responseData.details)) {
            throw new Error(responseData.details.join(", "));
          } else {
            throw new Error(responseData.error || "Invalid data provided");
          }
        } else {
          throw new Error(responseData.error || "Failed to create series");
        }
      }

      if (!responseData.success || !responseData.series) {
        throw new Error("Invalid response structure from server");
      }

      const createdSeries = responseData.series;
      setSuccess(true);
      
      console.log(`Series created successfully as a free container!`);
      
      onSeriesCreated(createdSeries);

      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error("Series creation error:", error);

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          setError("Network error. Please check your connection and try again.");
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
    setRetryCount(prev => prev + 1);
    handleSubmit(new Event("submit") as any);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Series
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
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
                  <div className="flex-1">
                    <p className="text-green-700 font-medium">Series created successfully!</p>
                    <p className="text-green-600 text-sm mt-1">
                      You can now upload videos to this series
                    </p>
                  </div>
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
                          If the problem persists, please refresh the page and try again.
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
              <div>
                <label
                  htmlFor="series-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Series Title *
                </label>
                <input
                  id="series-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
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
                  htmlFor="series-description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="series-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, description: e.target.value }))
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
                  htmlFor="series-category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="series-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, category: e.target.value }))
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
                  Series Thumbnail (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="thumbnail-upload"
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
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                        </div>
                      )}
                      <input
                        id="thumbnail-upload"
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
                        setThumbnailPreview(null);
                        setFormData(prev => ({ ...prev, thumbnail: undefined }));
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove thumbnail
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
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading
                    ? "Creating..."
                    : success
                    ? "Created!"
                    : "Create Series"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}