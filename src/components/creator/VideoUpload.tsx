'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CloudArrowUpIcon,
    VideoCameraIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { UploadState, VideoMetadata, VideoUploadProps, Series, AspectRatio } from '@/types'
import { SeriesCreationModal } from '@/components/creator/series'
import { AspectRatioSelector } from '@/components/ui/AspectRatioSelector'
import CoinInput from '@/components/wallet/CoinInput'

const ACCEPTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const VIDEO_CATEGORIES = [
    'Entertainment',
    'Education',
    'Comedy',
    'Music',
    'Dance',
    'Lifestyle',
    'Technology',
    'Sports',
    'Art',
    'Other'
]

function VideoPreview({
    file,
    aspectRatio
}: {
    file: File;
    aspectRatio: AspectRatio;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        return () => {
            URL.revokeObjectURL(url)
        }
    }, [file])

    const getAspectRatioStyles = (ratio: AspectRatio) => {
        const ratioMap: Record<AspectRatio, { paddingBottom: string; maxWidth?: string }> = {
            '16:9': { paddingBottom: '56.25%' },
            '9:16': { paddingBottom: '177.78%', maxWidth: '200px' },
            '1:1': { paddingBottom: '100%', maxWidth: '300px' },
            '4:5': { paddingBottom: '125%', maxWidth: '240px' },
            '3:2': { paddingBottom: '66.67%' },
            '2:3': { paddingBottom: '150%', maxWidth: '200px' },
            '5:4': { paddingBottom: '80%' },
        }
        return ratioMap[ratio]
    }

    const aspectStyles = getAspectRatioStyles(aspectRatio)
    const isVertical = ['9:16', '4:5', '2:3'].includes(aspectRatio)

    if (!previewUrl) return null

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="flex justify-center">
                <div
                    className="relative bg-black rounded-lg overflow-hidden"
                    style={{
                        paddingBottom: aspectStyles.paddingBottom,
                        maxWidth: aspectStyles.maxWidth || '100%',
                        width: '100%'
                    }}
                >
                    <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src={previewUrl}
                        muted
                        controls={false}
                        style={{ pointerEvents: 'none' }}
                    />

                    { }
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {aspectRatio}
                        {isVertical && (
                            <span className="ml-1 text-purple-300">📱</span>
                        )}
                    </div>
                </div>
            </div>

            {isVertical && (
                <p className="text-xs text-gray-500 text-center mt-2">
                    📱 Optimized for mobile viewing
                </p>
            )}
        </div>
    )
}

function SeriesSelector({
    value,
    onChange
}: {
    value?: string;
    onChange: (seriesId?: string) => void;
}) {
    const [series, setSeries] = useState<Series[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        const loadSeries = async () => {
            setLoading(true)
            try {
                const response = await fetch('/api/series?creator=me')
                if (response.ok) {
                    const data = await response.json()
                    setSeries(data.series || [])
                }
            } catch (error) {
                console.error('Failed to load series:', error)
            } finally {
                setLoading(false)
            }
        }

        loadSeries()
    }, [])

    const handleSeriesCreated = (newSeries: Series) => {
        setSeries(prev => [...prev, newSeries])
        onChange(newSeries.id)
        setShowCreateModal(false)
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        if (selectedValue === 'CREATE_NEW') {
            setShowCreateModal(true)
        } else {
            onChange(selectedValue || undefined)
        }
    }

    return (
        <>
            <div className="space-y-2">
                <select
                    id="video-series"
                    value={value || ''}
                    onChange={handleSelectChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                >
                    <option value="">No series (standalone video)</option>
                    {series.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.title} ({s.videoCount} videos)
                        </option>
                    ))}
                    <option value="CREATE_NEW" className="font-medium text-purple-600">
                        + Create New Series
                    </option>
                </select>

                {value && (
                    <p className="text-xs text-gray-500">
                        This video will be added to the selected series
                    </p>
                )}
            </div>

            { }
            {showCreateModal && (
                <SeriesCreationModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSeriesCreated={handleSeriesCreated}
                />
            )}
        </>
    )
}

export default function VideoUpload({
    onUploadComplete,
    maxFileSize = MAX_FILE_SIZE,
    acceptedFormats = ACCEPTED_VIDEO_FORMATS
}: VideoUploadProps) {
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        uploadProgress: 0,
        isProcessing: false,
        error: null,
        isUploading: false
    })

    const [metadata, setMetadata] = useState<VideoMetadata>({
        title: '',
        description: '',
        category: '',
        tags: [],
        creditCost: 1, // Deprecated - kept for backward compatibility
        coinPrice: 20, // Default: 20 coins (₹1.00)
        aspectRatio: '16:9'
    })

    const [tagInput, setTagInput] = useState('')
    const [isDragOver, setIsDragOver] = useState(false)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = useCallback((file: File): string | null => {
        if (!acceptedFormats.includes(file.type)) {
            return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
        }

        if (file.size > maxFileSize) {
            return `File size too large. Maximum size: ${Math.round(maxFileSize / (1024 * 1024))}MB`
        }

        return null
    }, [acceptedFormats, maxFileSize])

    const handleFileSelect = useCallback((file: File) => {
        const error = validateFile(file)

        if (error) {
            setUploadState(prev => ({ ...prev, error, file: null }))
            return
        }

        setUploadState(prev => ({
            ...prev,
            file,
            error: null,
            uploadProgress: 0
        }))

        const fileName = file.name.replace(/\.[^/.]+$/, '')
        setMetadata(prev => ({
            ...prev,
            title: prev.title || fileName
        }))
    }, [validateFile])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }, [handleFileSelect])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileSelect(files[0])
        }
    }, [handleFileSelect])

    const addTag = useCallback(() => {
        const tag = tagInput.trim()
        if (tag && !metadata.tags.includes(tag) && metadata.tags.length < 10) {
            setMetadata(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }))
            setTagInput('')
        }
    }, [tagInput, metadata.tags])

    const removeTag = useCallback((tagToRemove: string) => {
        setMetadata(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }, [])

    const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }, [addTag])

    const validateMetadata = useCallback((): string[] => {
        const errors: string[] = []

        if (metadata.coinPrice < 0) {
            errors.push('Coin price must be 0 or greater')
        }

        if (metadata.coinPrice > 2000) {
            errors.push('Coin price cannot exceed 2000 coins')
        }

        return errors
    }, [metadata.coinPrice])

    const uploadVideo = async () => {
        if (!uploadState.file || !metadata.title || !metadata.category) {
            setUploadState(prev => ({
                ...prev,
                error: 'Please fill in all required fields'
            }))
            return
        }

        const errors = validateMetadata()
        if (errors.length > 0) {
            setValidationErrors(errors)
            setUploadState(prev => ({
                ...prev,
                error: errors[0] // Show first error in main error display
            }))
            return
        }

        setValidationErrors([])

        setUploadState(prev => ({
            ...prev,
            isUploading: true,
            isProcessing: false,
            error: null,
            uploadProgress: 0
        }))

        try {

            const urlResponse = await fetch('/api/videos/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!urlResponse.ok) {
                const errorData = await urlResponse.json()
                throw new Error(errorData.error || 'Failed to get upload URL')
            }

            const { uploadUrl, uploadParams, publicId } = await urlResponse.json()

            const formData = new FormData()
            Object.keys(uploadParams).forEach(key => {
                formData.append(key, uploadParams[key])
            })
            formData.append('file', uploadState.file)

            const xhr = new XMLHttpRequest()

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 90) // Reserve 10% for processing
                    setUploadState(prev => ({ ...prev, uploadProgress: progress }))
                }
            })

            const cloudinaryUploadPromise = new Promise<any>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        try {
                            const result = JSON.parse(xhr.responseText)
                            resolve(result)
                        } catch (e) {
                            reject(new Error('Invalid response from Cloudinary'))
                        }
                    } else {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText)
                            reject(new Error(errorResponse.error?.message || `Upload failed: ${xhr.statusText}`))
                        } catch (e) {
                            reject(new Error(`Upload failed: ${xhr.statusText}`))
                        }
                    }
                }
                xhr.onerror = () => reject(new Error('Network error during upload'))
                xhr.ontimeout = () => reject(new Error('Upload timeout - please try with a smaller file'))
            })

            xhr.open('POST', uploadUrl)
            xhr.timeout = 300000 // 5 minutes timeout
            xhr.send(formData)

            const cloudinaryResult = await cloudinaryUploadPromise

            setUploadState(prev => ({
                ...prev,
                uploadProgress: 90,
                isProcessing: true
            }))

            const metadataToSend = {
                ...metadata,
                coinPrice: metadata.coinPrice,
                creditCost: metadata.coinPrice / 20 // Convert coins to credits for backward compatibility
            }

            console.log('=== UPLOAD DEBUG ===')
            console.log('Original metadata:', metadata)
            console.log('Metadata to send:', metadataToSend)
            console.log('Has seriesId?', !!metadata.seriesId)
            console.log('CoinPrice being sent:', metadataToSend.coinPrice)
            console.log('==================')

            const saveResponse = await fetch('/api/videos/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publicId,
                    metadata: metadataToSend,
                    cloudinaryResult
                })
            })

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json()
                throw new Error(errorData.error || 'Failed to save video')
            }

            const result = await saveResponse.json()

            setUploadState(prev => ({ ...prev, uploadProgress: 100 }))

            await new Promise(resolve => setTimeout(resolve, 500))

            setUploadState({
                file: null,
                uploadProgress: 0,
                isProcessing: false,
                error: null,
                isUploading: false
            })

            setMetadata({
                title: '',
                description: '',
                category: '',
                tags: [],
                creditCost: 1,
                coinPrice: 20,
                aspectRatio: '16:9'
            })

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            onUploadComplete(result.video)

        } catch (error) {
            console.error('Upload error:', error)
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                isProcessing: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            }))
        }
    }

    const resetUpload = () => {
        setUploadState({
            file: null,
            uploadProgress: 0,
            isProcessing: false,
            error: null,
            isUploading: false
        })

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <VideoCameraIcon className="w-8 h-8 text-purple-600" />
                        Upload Video
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Share your content with the world and start earning
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    { }
                    <div
                        className={`
 relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
 ${isDragOver
                                ? 'border-purple-400 bg-purple-50'
                                : uploadState.file
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                            }
 `}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptedFormats.join(',')}
                            onChange={handleFileInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <AnimatePresence mode="wait">
                            {uploadState.file ? (
                                <motion.div
                                    key="file-selected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-4"
                                >
                                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                                    <div>
                                        <p className="text-lg font-semibold text-green-700">
                                            {uploadState.file.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {Math.round(uploadState.file.size / (1024 * 1024))}MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={resetUpload}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                        Remove
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="upload-prompt"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-4"
                                >
                                    <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto" />
                                    <div>
                                        <p className="text-lg font-semibold text-gray-700">
                                            Drop your video here or click to browse
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Supports MP4, WebM, MOV, AVI up to {Math.round(maxFileSize / (1024 * 1024))}MB
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    { }
                    <AnimatePresence>
                        {uploadState.error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                            >
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-red-700">{uploadState.error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    { }
                    <AnimatePresence>
                        {uploadState.isUploading && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {uploadState.isProcessing
                                            ? `Processing video for ${metadata.aspectRatio} aspect ratio...`
                                            : 'Uploading...'}
                                    </span>
                                    <span className="text-purple-600 font-semibold">
                                        {uploadState.uploadProgress}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <motion.div
                                        className="bg-purple-600 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadState.uploadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>

                                { }
                                {uploadState.isProcessing && (
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div>• Optimizing video for {metadata.aspectRatio} format</div>
                                        {['9:16', '4:5', '2:3'].includes(metadata.aspectRatio) && (
                                            <div>• Applying mobile-friendly optimizations</div>
                                        )}
                                        <div>• Generating thumbnails and previews</div>
                                        <div>• Finalizing upload...</div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    { }
                    {uploadState.file && !uploadState.isUploading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 pt-6 border-t border-gray-200"
                        >
                            <h3 className="text-lg font-semibold text-gray-900">Video Details</h3>

                            { }
                            <div>
                                <label htmlFor="video-title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    id="video-title"
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter video title"
                                    maxLength={255}
                                />
                            </div>

                            { }
                            <div>
                                <label htmlFor="video-description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="video-description"
                                    value={metadata.description}
                                    onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Describe your video..."
                                    rows={4}
                                    maxLength={1000}
                                />
                            </div>

                            { }
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="video-category" className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        id="video-category"
                                        value={metadata.category}
                                        onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Select category</option>
                                        {VIDEO_CATEGORIES.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Video Pricing
                                    </label>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pricing"
                                                    checked={metadata.coinPrice === 0}
                                                    onChange={() => setMetadata(prev => ({ ...prev, coinPrice: 0, creditCost: 0 }))}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-700">Free</span>
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pricing"
                                                    checked={metadata.coinPrice > 0}
                                                    onChange={() => setMetadata(prev => ({ ...prev, coinPrice: 20 }))}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-700">Paid</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <CoinInput
                                        value={metadata.coinPrice}
                                        onChange={(value) => {
                                            setMetadata(prev => ({
                                                ...prev,
                                                coinPrice: value,
                                                creditCost: value / 20 // Keep in sync for backward compatibility
                                            }))

                                            setValidationErrors([])
                                        }}
                                        label="Coin Price"
                                        showRupeeEquivalent
                                        placeholder="Enter coin price"
                                        disabled={metadata.coinPrice === 0}
                                    />
                                    {metadata.seriesId && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-purple-600">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            <span>Part of Series - Set individual price</span>
                                        </div>
                                    )}
                                    {metadata.coinPrice === 0 && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            <span>This video is free</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="video-series" className="block text-sm font-medium text-gray-700 mb-2">
                                        Add to Series (Optional)
                                    </label>
                                    <SeriesSelector
                                        value={metadata.seriesId}
                                        onChange={(seriesId) => {
                                            console.log('SeriesSelector onChange called with:', seriesId)
                                            setMetadata(prev => {
                                                const newMetadata = {
                                                    ...prev,
                                                    seriesId,
                                                    // No automatic price change - creator controls pricing
                                                }
                                                console.log('New metadata after series change:', newMetadata)
                                                return newMetadata
                                            })

                                            setValidationErrors([])
                                        }}
                                    />
                                </div>
                            </div>

                            { }
                            <AnimatePresence>
                                {validationErrors.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-2"
                                    >
                                        {validationErrors.map((error, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                                            >
                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            { }
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <AspectRatioSelector
                                        value={metadata.aspectRatio}
                                        onChange={(aspectRatio) => setMetadata(prev => ({ ...prev, aspectRatio }))}
                                        className="mb-4"
                                    />
                                </div>

                                <div>
                                    <VideoPreview
                                        file={uploadState.file}
                                        aspectRatio={metadata.aspectRatio}
                                    />
                                </div>
                            </div>

                            { }
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
                                            onKeyDown={handleTagInputKeyDown}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Add a tag and press Enter"
                                            maxLength={50}
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            disabled={!tagInput.trim() || metadata.tags.length >= 10}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {metadata.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {metadata.tags.map(tag => (
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
                                        {metadata.tags.length}/10 tags
                                    </p>
                                </div>
                            </div>

                            { }
                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={uploadVideo}
                                    disabled={!metadata.title || !metadata.category || uploadState.isUploading}
                                    className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploadState.isUploading ? 'Uploading...' : 'Upload Video'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}