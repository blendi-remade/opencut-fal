import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  AIGenerationParams, 
  AIGenerationResult, 
  GenerationHistoryItem,
  AspectRatio,
  OutputFormat
} from "@/types/ai";
import type { MediaFile } from "@/types/media";
import { generateImage } from "@/lib/fal-client";

interface AIStore {
  // State
  prompt: string;
  aspectRatio: AspectRatio;
  outputFormat: OutputFormat;
  isGenerating: boolean;
  generationHistory: GenerationHistoryItem[];
  currentResult: AIGenerationResult | null;
  error: string | null;
  // Image editing mode
  referenceImageUrls: string[];
  // Track current project to clear history on project switch
  currentProjectId: string | null;

  // Actions
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setReferenceImages: (urls: string[]) => void;
  clearReferenceImages: () => void;
  generate: () => Promise<void>;
  addToTimeline: (imageUrl: string) => Promise<void>;
  clearHistory: () => void;
  clearError: () => void;
  clearProjectSession: (projectId: string | null) => void;
}

const MAX_HISTORY = 20;

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      prompt: "",
      aspectRatio: "1:1",
      outputFormat: "jpeg",
      isGenerating: false,
      generationHistory: [],
      currentResult: null,
      error: null,
      referenceImageUrls: [],
      currentProjectId: null,

      // Actions
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

          set((state) => ({
            currentResult: result,
            generationHistory: [
              historyItem,
              ...state.generationHistory,
            ].slice(0, MAX_HISTORY),
          }));
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
        } catch (error) {
          console.error("Failed to add to timeline:", error);
          throw error;
        }
      },

      clearHistory: () => set({ generationHistory: [] }),
      clearError: () => set({ error: null }),
      
      clearProjectSession: (projectId: string | null) => {
        const { currentProjectId } = get();
        
        // If switching to a different project or closing project, clear the session
        if (currentProjectId !== projectId) {
          set({
            currentProjectId: projectId,
            currentResult: null,
            generationHistory: [],
            prompt: "",
            error: null,
            referenceImageUrls: [],
          });
        }
      },
    }),
    {
      name: "ai-generation",
      partialize: (state) => ({
        aspectRatio: state.aspectRatio,
        outputFormat: state.outputFormat,
      }),
    }
  )
);