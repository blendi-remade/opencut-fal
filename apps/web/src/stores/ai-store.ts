import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  AIGenerationParams, 
  AIGenerationResult, 
  GenerationHistoryItem,
  AspectRatio,
  OutputFormat,
  AIMode,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoGenerationHistoryItem,
  VideoDuration,
  VideoResolution,
  VideoAspectRatio
} from "@/types/ai";
import type { MediaFile } from "@/types/media";
import { generateImage, generateVideo } from "@/lib/fal-client";

interface AIStore {
  // Mode
  mode: AIMode;
  
  // Image generation state
  prompt: string;
  aspectRatio: AspectRatio;
  outputFormat: OutputFormat;
  isGenerating: boolean;
  generationHistory: GenerationHistoryItem[];
  currentResult: AIGenerationResult | null;
  error: string | null;
  referenceImageUrls: string[];
  
  // Video generation state
  videoPrompt: string;
  videoAspectRatio: VideoAspectRatio;
  videoDuration: VideoDuration;
  videoResolution: VideoResolution;
  generateAudio: boolean;
  isGeneratingVideo: boolean;
  videoGenerationHistory: VideoGenerationHistoryItem[];
  currentVideoResult: VideoGenerationResult | null;
  videoError: string | null;
  videoReferenceImageUrl: string | null;
  
  // Track current project to clear history on project switch
  currentProjectId: string | null;

  // Mode actions
  setMode: (mode: AIMode) => void;

  // Image generation actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setReferenceImages: (urls: string[]) => void;
  clearReferenceImages: () => void;
  generate: () => Promise<void>;
  addToTimeline: (imageUrl: string) => Promise<void>;
  clearHistory: () => void;
  clearError: () => void;
  
  // Video generation actions
  setVideoPrompt: (prompt: string) => void;
  setVideoAspectRatio: (ratio: VideoAspectRatio) => void;
  setVideoDuration: (duration: VideoDuration) => void;
  setVideoResolution: (resolution: VideoResolution) => void;
  setGenerateAudio: (generate: boolean) => void;
  setVideoReferenceImage: (url: string | null) => void;
  clearVideoReferenceImage: () => void;
  generateVideo: () => Promise<void>;
  addVideoToTimeline: (videoUrl: string) => Promise<void>;
  clearVideoHistory: () => void;
  clearVideoError: () => void;
  
  clearProjectSession: (projectId: string | null) => void;
}

const MAX_HISTORY = 20;
const MAX_VIDEO_HISTORY = 5; // Videos are much larger, keep fewer in memory

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: "image",
      
      // Image generation state
      prompt: "",
      aspectRatio: "1:1",
      outputFormat: "jpeg",
      isGenerating: false,
      generationHistory: [],
      currentResult: null,
      error: null,
      referenceImageUrls: [],
      
      // Video generation state
      videoPrompt: "",
      videoAspectRatio: "16:9",
      videoDuration: "8s",
      videoResolution: "720p",
      generateAudio: true,
      isGeneratingVideo: false,
      videoGenerationHistory: [],
      currentVideoResult: null,
      videoError: null,
      videoReferenceImageUrl: null,
      
      currentProjectId: null,

      // Mode actions
      setMode: (mode) => set({ mode }),

      // Image generation actions
      setPrompt: (prompt) => set({ prompt }),
      setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
      setOutputFormat: (format) => set({ outputFormat: format }),
      setReferenceImages: (urls) => set({ referenceImageUrls: urls }),
      clearReferenceImages: () => set({ referenceImageUrls: [] }),

      generate: async () => {
        const { prompt, aspectRatio, outputFormat, referenceImageUrls } = get();
        
        if (!prompt.trim()) {
          set({ error: "Please enter a prompt" });
          return;
        }

        const isEditMode = referenceImageUrls.length > 0;
        set({ 
          isGenerating: true, 
          error: null, 
          currentResult: null,
        });

        try {
          const params: AIGenerationParams = {
            prompt: prompt.trim(),
            num_images: 1,
            output_format: outputFormat,
            aspect_ratio: aspectRatio,
            // Include reference images if in edit mode
            ...(referenceImageUrls.length > 0 && { image_urls: referenceImageUrls }),
          };

          const result = await generateImage(params);
          
          const historyItem: GenerationHistoryItem = {
            id: crypto.randomUUID(),
            prompt: params.prompt,
            params,
            result,
            timestamp: Date.now(),
          };

          set((state) => {
            const newHistory = [historyItem, ...state.generationHistory];
            
            // Clean up blob URLs from items that will be removed
            if (newHistory.length > MAX_HISTORY) {
              const itemsToRemove = newHistory.slice(MAX_HISTORY);
              for (const item of itemsToRemove) {
                for (const image of item.result.images) {
                  if (image.url && image.url.startsWith('blob:')) {
                    URL.revokeObjectURL(image.url);
                  }
                }
              }
            }
            
            return {
              currentResult: result,
              generationHistory: newHistory.slice(0, MAX_HISTORY),
            };
          });
        } catch (error) {
          console.error("AI generation failed:", error);
          set({ 
            error: error instanceof Error ? error.message : "Generation failed"
          });
        } finally {
          set({ isGenerating: false });
        }
      },

      addToTimeline: async (imageUrl: string) => {
        try {
          // Import dynamically to avoid circular dependencies
          const { useProjectStore } = await import("@/stores/project-store");
          const { useMediaStore } = await import("@/stores/media-store");
          const { useTimelineStore } = await import("@/stores/timeline-store");
          const { usePlaybackStore } = await import("@/stores/playback-store");
          const { TIMELINE_CONSTANTS } = await import("@/constants/timeline-constants");

          const { activeProject } = useProjectStore.getState();
          if (!activeProject) {
            throw new Error("No active project");
          }

          // Fetch the image to get dimensions and create file
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `ai-generated-${Date.now()}.${get().outputFormat}`, {
            type: `image/${get().outputFormat}`,
          });

          // Get image dimensions
          const img = new Image();
          const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(blob);
          });

          const mediaItem: Omit<MediaFile, "id"> = {
            name: `AI: ${get().prompt.slice(0, 30)}...`,
            type: "image",
            file,
            url: URL.createObjectURL(file),
            width: dimensions.width,
            height: dimensions.height,
            duration: TIMELINE_CONSTANTS.DEFAULT_IMAGE_DURATION,
            ephemeral: false,
          };

          const { addMediaFile } = useMediaStore.getState();
          await addMediaFile(activeProject.id, mediaItem);

          const added = useMediaStore
            .getState()
            .mediaFiles.find((m) => m.url === mediaItem.url);
            
          if (!added) {
            throw new Error("Failed to add to media store");
          }

          const { currentTime } = usePlaybackStore.getState();
          const { addElementAtTime } = useTimelineStore.getState();
          addElementAtTime(added, currentTime);
          
          // Clean up image from AI panel history after adding to timeline
          const { generationHistory, currentResult } = get();
          
          const updatedHistory = generationHistory.filter(item => {
            const hasImage = item.result.images.some(img => img.url === imageUrl);
            if (hasImage) {
              // Clean up blob URLs
              for (const img of item.result.images) {
                if (img.url.startsWith('blob:')) {
                  URL.revokeObjectURL(img.url);
                }
              }
              return false;
            }
            return true;
          });
          
          let updatedCurrentResult = currentResult;
          if (currentResult?.images.some(img => img.url === imageUrl)) {
            for (const img of currentResult.images) {
              if (img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url);
              }
            }
            updatedCurrentResult = null;
          }
          
          set({ 
            generationHistory: updatedHistory,
            currentResult: updatedCurrentResult,
          });
        } catch (error) {
          console.error("Failed to add to timeline:", error);
          throw error;
        }
      },

      clearHistory: () => {
        // Clean up blob URLs before clearing history
        const { generationHistory } = get();
        for (const item of generationHistory) {
          for (const image of item.result.images) {
            if (image.url && image.url.startsWith('blob:')) {
              URL.revokeObjectURL(image.url);
            }
          }
        }
        set({ generationHistory: [] });
      },
      clearError: () => set({ error: null }),
      
      // Video generation actions
      setVideoPrompt: (videoPrompt) => set({ videoPrompt }),
      setVideoAspectRatio: (videoAspectRatio) => set({ videoAspectRatio }),
      setVideoDuration: (videoDuration) => set({ videoDuration }),
      setVideoResolution: (videoResolution) => set({ videoResolution }),
      setGenerateAudio: (generateAudio) => set({ generateAudio }),
      setVideoReferenceImage: (url) => set({ videoReferenceImageUrl: url }),
      clearVideoReferenceImage: () => set({ videoReferenceImageUrl: null }),

      generateVideo: async () => {
        const { videoPrompt, videoAspectRatio, videoDuration, videoResolution, generateAudio, videoReferenceImageUrl } = get();
        
        if (!videoPrompt.trim()) {
          set({ videoError: "Please enter a prompt" });
          return;
        }

        if (!videoReferenceImageUrl) {
          set({ videoError: "Please select an image to animate" });
          return;
        }

        set({ 
          isGeneratingVideo: true, 
          videoError: null, 
          currentVideoResult: null,
        });

        try {
          const params: VideoGenerationParams = {
            prompt: videoPrompt.trim(),
            image_url: videoReferenceImageUrl,
            aspect_ratio: videoAspectRatio,
            duration: videoDuration,
            generate_audio: generateAudio,
            resolution: videoResolution,
          };

          const result = await generateVideo(params);
          
          const historyItem: VideoGenerationHistoryItem = {
            id: crypto.randomUUID(),
            prompt: params.prompt,
            params,
            result,
            timestamp: Date.now(),
          };

          set((state) => {
            const newHistory = [historyItem, ...state.videoGenerationHistory];
            
            // Clean up blob URLs from items that will be removed
            if (newHistory.length > MAX_VIDEO_HISTORY) {
              const itemsToRemove = newHistory.slice(MAX_VIDEO_HISTORY);
              for (const item of itemsToRemove) {
                if (item.result.video.url && item.result.video.url.startsWith('blob:')) {
                  URL.revokeObjectURL(item.result.video.url);
                }
              }
            }
            
            return {
              currentVideoResult: result,
              videoGenerationHistory: newHistory.slice(0, MAX_VIDEO_HISTORY),
            };
          });
        } catch (error) {
          console.error("Video generation failed:", error);
          set({ 
            videoError: error instanceof Error ? error.message : "Video generation failed"
          });
        } finally {
          set({ isGeneratingVideo: false });
        }
      },

      addVideoToTimeline: async (videoUrl: string) => {
        try {
          const { useProjectStore } = await import("@/stores/project-store");
          const { useMediaStore, generateVideoThumbnail } = await import("@/stores/media-store");
          const { useTimelineStore } = await import("@/stores/timeline-store");
          const { usePlaybackStore } = await import("@/stores/playback-store");

          const { activeProject } = useProjectStore.getState();
          if (!activeProject) {
            throw new Error("No active project");
          }

          // Fetch the video to create file
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const file = new File([blob], `ai-video-${Date.now()}.mp4`, {
            type: "video/mp4",
          });

          // Create a single blob URL to use consistently
          const blobUrl = URL.createObjectURL(file);

          // Generate thumbnail and get video info (same as normal uploads)
          const { thumbnailUrl, width, height } = await generateVideoThumbnail(file);
          
          // Get duration
          const video = document.createElement("video");
          video.preload = "metadata";
          
          const duration = await new Promise<number>((resolve, reject) => {
            video.onloadedmetadata = () => {
              const dur = video.duration;
              // Clean up properly
              video.pause();
              video.removeAttribute('src');
              video.load();
              video.remove();
              resolve(dur);
            };
            video.onerror = () => {
              video.remove();
              reject(new Error("Failed to load video metadata"));
            };
            video.src = blobUrl;
          });

          const mediaItem: Omit<MediaFile, "id"> = {
            name: `AI Video: ${get().videoPrompt.slice(0, 30)}...`,
            type: "video",
            file,
            url: blobUrl,
            thumbnailUrl,
            width,
            height,
            duration,
            ephemeral: false,
          };

          const { addMediaFile } = useMediaStore.getState();
          await addMediaFile(activeProject.id, mediaItem);

          const added = useMediaStore
            .getState()
            .mediaFiles.find((m) => m.url === mediaItem.url);
            
          if (!added) {
            throw new Error("Failed to add to media store");
          }

          const { currentTime } = usePlaybackStore.getState();
          const { addElementAtTime } = useTimelineStore.getState();
          addElementAtTime(added, currentTime);
          
          // CRITICAL: Clear video from AI panel history after adding to timeline
          // This prevents keeping large video files in memory twice
          const { videoGenerationHistory, currentVideoResult } = get();
          
          // Remove this video from history
          const updatedHistory = videoGenerationHistory.filter(item => {
            if (item.result.video.url === videoUrl) {
              // Clean up the blob URL from AI panel
              if (videoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(videoUrl);
              }
              return false;
            }
            return true;
          });
          
          // Clear current result if it's the video we just added
          let updatedCurrentResult = currentVideoResult;
          if (currentVideoResult?.video.url === videoUrl) {
            if (videoUrl.startsWith('blob:')) {
              URL.revokeObjectURL(videoUrl);
            }
            updatedCurrentResult = null;
          }
          
          set({ 
            videoGenerationHistory: updatedHistory,
            currentVideoResult: updatedCurrentResult,
          });
        } catch (error) {
          console.error("Failed to add video to timeline:", error);
          throw error;
        }
      },

      clearVideoHistory: () => {
        // Clean up blob URLs before clearing video history
        const { videoGenerationHistory } = get();
        for (const item of videoGenerationHistory) {
          if (item.result.video.url && item.result.video.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.result.video.url);
          }
        }
        set({ videoGenerationHistory: [] });
      },
      clearVideoError: () => set({ videoError: null }),
      
      clearProjectSession: (projectId: string | null) => {
        const { currentProjectId, generationHistory, videoGenerationHistory, currentResult, currentVideoResult } = get();
        
        // If switching to a different project or closing project, clear the session
        if (currentProjectId !== projectId) {
          // Clean up blob URLs from image generation history
          for (const item of generationHistory) {
            for (const image of item.result.images) {
              if (image.url && image.url.startsWith('blob:')) {
                URL.revokeObjectURL(image.url);
              }
            }
          }
          
          // Clean up blob URLs from video generation history
          for (const item of videoGenerationHistory) {
            if (item.result.video.url && item.result.video.url.startsWith('blob:')) {
              URL.revokeObjectURL(item.result.video.url);
            }
          }
          
          // Clean up current results
          if (currentResult) {
            for (const image of currentResult.images) {
              if (image.url && image.url.startsWith('blob:')) {
                URL.revokeObjectURL(image.url);
              }
            }
          }
          
          if (currentVideoResult && currentVideoResult.video.url.startsWith('blob:')) {
            URL.revokeObjectURL(currentVideoResult.video.url);
          }
          
          set({
            currentProjectId: projectId,
            mode: "image",
            currentResult: null,
            generationHistory: [],
            prompt: "",
            error: null,
            referenceImageUrls: [],
            currentVideoResult: null,
            videoGenerationHistory: [],
            videoPrompt: "",
            videoError: null,
            videoReferenceImageUrl: null,
          });
        }
      },
    }),
    {
      name: "ai-generation",
      partialize: (state) => ({
        aspectRatio: state.aspectRatio,
        outputFormat: state.outputFormat,
        videoAspectRatio: state.videoAspectRatio,
        videoDuration: state.videoDuration,
        videoResolution: state.videoResolution,
        generateAudio: state.generateAudio,
      }),
    }
  )
);