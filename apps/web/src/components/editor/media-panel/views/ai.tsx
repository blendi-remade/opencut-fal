"use client";

import { useState } from "react";
import { useAIStore } from "@/stores/ai-store";
import { Loader2, Sparkles, Image as ImageIcon, Download, X, ChevronDown, ChevronUp, Video, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { AspectRatio, OutputFormat, VideoDuration, VideoResolution, VideoAspectRatio, AIMode, TTSVoice } from "@/types/ai";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "3:2", label: "Photo (3:2)" },
  { value: "21:9", label: "Ultrawide (21:9)" },
];

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

const VIDEO_ASPECT_RATIOS: { value: VideoAspectRatio; label: string }[] = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

const VIDEO_DURATIONS: { value: VideoDuration; label: string }[] = [
  { value: "8s", label: "8 seconds" },
];

const VIDEO_RESOLUTIONS: { value: VideoResolution; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const TTS_VOICES: { value: TTSVoice; label: string }[] = [
  { value: "Alice", label: "Alice" },
  { value: "Aria", label: "Aria" },
  { value: "Bill", label: "Bill" },
  { value: "Brian", label: "Brian" },
  { value: "Callum", label: "Callum" },
  { value: "Charlotte", label: "Charlotte" },
  { value: "Charlie", label: "Charlie" },
  { value: "Daniel", label: "Daniel" },
  { value: "Eric", label: "Eric" },
  { value: "Erifis", label: "Erifis" },
  { value: "George", label: "George" },
  { value: "Jessica", label: "Jessica" },
  { value: "Laura", label: "Laura" },
  { value: "Liam", label: "Liam" },
  { value: "Lily", label: "Lily" },
  { value: "Matilda", label: "Matilda" },
  { value: "River", label: "River" },
  { value: "Roger", label: "Roger" },
  { value: "Sarah", label: "Sarah" },
  { value: "Will", label: "Will" },
];

export function AIView() {
  const {
    mode,
    setMode,
    // Image generation
    prompt,
    aspectRatio,
    outputFormat,
    isGenerating,
    currentResult,
    error,
    referenceImageUrls,
    setPrompt,
    setAspectRatio,
    setOutputFormat,
    generate,
    addToTimeline,
    clearError,
    clearReferenceImages,
    // Video generation
    videoPrompt,
    videoAspectRatio,
    videoDuration,
    videoResolution,
    generateAudio,
    isGeneratingVideo,
    currentVideoResult,
    videoError,
    videoReferenceImageUrl,
    setVideoPrompt,
    setVideoAspectRatio,
    setVideoDuration,
    setVideoResolution,
    setGenerateAudio,
    generateVideo,
    addVideoToTimeline,
    clearVideoError,
    clearVideoReferenceImage,
    // TTS
    ttsText,
    ttsVoice,
    ttsStability,
    ttsSimilarityBoost,
    ttsSpeed,
    isGeneratingTTS,
    currentTTSResult,
    ttsError,
    setTTSText,
    setTTSVoice,
    setTTSStability,
    setTTSSimilarityBoost,
    setTTSSpeed,
    generateTTSAudio,
    addTTSToTimeline,
    clearTTSError,
  } = useAIStore();

  const [addingToTimeline, setAddingToTimeline] = useState<string | null>(null);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(true);
  const isEditMode = referenceImageUrls.length > 0;

  const handleGenerate = async () => {
    await generate();
  };

  const handleAddToTimeline = async (imageUrl: string) => {
    setAddingToTimeline(imageUrl);
    try {
      await addToTimeline(imageUrl);
      toast("Image added to timeline");
    } catch (error) {
      toast.error("Failed to add to timeline");
    } finally {
      setAddingToTimeline(null);
    }
  };

  const handleGenerateVideo = async () => {
    await generateVideo();
  };

  const handleAddVideoToTimeline = async (videoUrl: string) => {
    setAddingToTimeline(videoUrl);
    try {
      await addVideoToTimeline(videoUrl);
      toast("Video added to timeline");
    } catch (error) {
      toast.error("Failed to add video to timeline");
    } finally {
      setAddingToTimeline(null);
    }
  };

  const handleGenerateTTS = async () => {
    await generateTTSAudio();
  };

  const handleAddTTSToTimeline = async (audioUrl: string) => {
    setAddingToTimeline(audioUrl);
    try {
      await addTTSToTimeline(audioUrl);
      toast("Audio added to timeline");
    } catch (error) {
      toast.error("Failed to add audio to timeline");
    } finally {
      setAddingToTimeline(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-1 h-full p-4">
      {/* Mode Selector */}
      <SegmentedControl
        options={[
          { value: "image" as AIMode, label: "Image" },
          { value: "video" as AIMode, label: "Video" },
          { value: "tts" as AIMode, label: "TTS" },
        ]}
        value={mode}
        onChange={setMode}
        className="w-full"
      />

      {/* Generation Form */}
      <div className="space-y-3">
        {mode === "image" ? (
          <ImageGenerationForm
            prompt={prompt}
            aspectRatio={aspectRatio}
            outputFormat={outputFormat}
            isGenerating={isGenerating}
            error={error}
            referenceImageUrls={referenceImageUrls}
            isEditMode={isEditMode}
            isReferenceExpanded={isReferenceExpanded}
            setPrompt={setPrompt}
            setAspectRatio={setAspectRatio}
            setOutputFormat={setOutputFormat}
            clearReferenceImages={clearReferenceImages}
            setIsReferenceExpanded={setIsReferenceExpanded}
            handleGenerate={handleGenerate}
            clearError={clearError}
          />
        ) : mode === "video" ? (
          <VideoGenerationForm
            videoPrompt={videoPrompt}
            videoAspectRatio={videoAspectRatio}
            videoDuration={videoDuration}
            videoResolution={videoResolution}
            generateAudio={generateAudio}
            isGeneratingVideo={isGeneratingVideo}
            videoError={videoError}
            videoReferenceImageUrl={videoReferenceImageUrl}
            setVideoPrompt={setVideoPrompt}
            setVideoAspectRatio={setVideoAspectRatio}
            setVideoDuration={setVideoDuration}
            setVideoResolution={setVideoResolution}
            setGenerateAudio={setGenerateAudio}
            clearVideoReferenceImage={clearVideoReferenceImage}
            handleGenerateVideo={handleGenerateVideo}
            clearVideoError={clearVideoError}
          />
        ) : (
          <TTSGenerationForm
            ttsText={ttsText}
            ttsVoice={ttsVoice}
            ttsStability={ttsStability}
            ttsSimilarityBoost={ttsSimilarityBoost}
            ttsSpeed={ttsSpeed}
            isGeneratingTTS={isGeneratingTTS}
            ttsError={ttsError}
            setTTSText={setTTSText}
            setTTSVoice={setTTSVoice}
            setTTSStability={setTTSStability}
            setTTSSimilarityBoost={setTTSSimilarityBoost}
            setTTSSpeed={setTTSSpeed}
            handleGenerateTTS={handleGenerateTTS}
            clearTTSError={clearTTSError}
          />
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {mode === "image" ? (
            <>
              {/* Current Image Result */}
              {currentResult && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Generated Image</h3>
                  <GeneratedImageCard
                    image={currentResult.images[0]}
                    description={currentResult.description}
                    onAddToTimeline={handleAddToTimeline}
                    isAdding={addingToTimeline === currentResult.images[0].url}
                  />
                </div>
              )}

            </>
          ) : mode === "video" ? (
            <>
              {/* Current Video Result */}
              {currentVideoResult && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Generated Video</h3>
                  <GeneratedVideoCard
                    video={currentVideoResult.video}
                    onAddToTimeline={handleAddVideoToTimeline}
                    isAdding={addingToTimeline === currentVideoResult.video.url}
                  />
                </div>
              )}

            </>
          ) : (
            <>
              {/* Current TTS Result */}
              {currentTTSResult && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Generated Audio</h3>
                  <GeneratedAudioCard
                    audio={currentTTSResult.audio}
                    onAddToTimeline={handleAddTTSToTimeline}
                    isAdding={addingToTimeline === currentTTSResult.audio.url}
                  />
                </div>
              )}

            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Image Generation Form Component
function ImageGenerationForm({
  prompt,
  aspectRatio,
  outputFormat,
  isGenerating,
  error,
  referenceImageUrls,
  isEditMode,
  isReferenceExpanded,
  setPrompt,
  setAspectRatio,
  setOutputFormat,
  clearReferenceImages,
  setIsReferenceExpanded,
  handleGenerate,
  clearError,
}: {
  prompt: string;
  aspectRatio: AspectRatio;
  outputFormat: OutputFormat;
  isGenerating: boolean;
  error: string | null;
  referenceImageUrls: string[];
  isEditMode: boolean;
  isReferenceExpanded: boolean;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setOutputFormat: (format: OutputFormat) => void;
  clearReferenceImages: () => void;
  setIsReferenceExpanded: (expanded: boolean) => void;
  handleGenerate: () => void;
  clearError: () => void;
}) {
  return (
    <div className="space-y-3">
        {/* Edit Mode Reference Image - Collapsible */}
        {isEditMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="text"
                  size="icon"
                  onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  aria-label={isReferenceExpanded ? "Collapse reference image" : "Expand reference image"}
                >
                  {isReferenceExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Label className="text-xs">Editing Image</Label>
              </div>
              <Button
                type="button"
                variant="text"
                size="sm"
                onClick={clearReferenceImages}
                className="text-muted-foreground h-6"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            {isReferenceExpanded && (
              <div className="relative w-full rounded-lg border border-input bg-accent/50 overflow-hidden max-h-32 transition-all duration-200">
                <Image
                  src={referenceImageUrls[0]}
                  alt="Reference image for editing"
                  width={200}
                  height={200}
                  className="w-full h-auto object-contain max-h-32"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt" className="text-xs">Prompt</Label>
          <Input
            id="ai-prompt"
            placeholder={isEditMode ? "Describe how to edit this image..." : "Describe the image you want to generate..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="aspect-ratio" className="text-xs">Aspect Ratio</Label>
            <Select
              value={aspectRatio}
              onValueChange={(value) => setAspectRatio(value as AspectRatio)}
              disabled={isGenerating}
            >
              <SelectTrigger id="aspect-ratio" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="output-format" className="text-xs">Format</Label>
            <Select
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
              disabled={isGenerating}
            >
              <SelectTrigger id="output-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full h-9"
          size="sm"
          aria-label={isEditMode ? "Edit image with AI" : "Generate AI image from prompt"}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEditMode ? "Editing..." : "Generating..."}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {isEditMode ? "Edit Image" : "Generate Image"}
            </>
          )}
        </Button>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <Button
              type="button"
              variant="text"
              size="icon"
              onClick={clearError}
              className="h-auto w-auto p-0"
              aria-label="Dismiss error"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
    </div>
  );
}

// Video Generation Form Component
function VideoGenerationForm({
  videoPrompt,
  videoAspectRatio,
  videoDuration,
  videoResolution,
  generateAudio,
  isGeneratingVideo,
  videoError,
  videoReferenceImageUrl,
  setVideoPrompt,
  setVideoAspectRatio,
  setVideoDuration,
  setVideoResolution,
  setGenerateAudio,
  clearVideoReferenceImage,
  handleGenerateVideo,
  clearVideoError,
}: {
  videoPrompt: string;
  videoAspectRatio: VideoAspectRatio;
  videoDuration: VideoDuration;
  videoResolution: VideoResolution;
  generateAudio: boolean;
  isGeneratingVideo: boolean;
  videoError: string | null;
  videoReferenceImageUrl: string | null;
  setVideoPrompt: (prompt: string) => void;
  setVideoAspectRatio: (ratio: VideoAspectRatio) => void;
  setVideoDuration: (duration: VideoDuration) => void;
  setVideoResolution: (resolution: VideoResolution) => void;
  setGenerateAudio: (generate: boolean) => void;
  clearVideoReferenceImage: () => void;
  handleGenerateVideo: () => void;
  clearVideoError: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Reference Frame */}
      {videoReferenceImageUrl ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Reference Frame</Label>
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={clearVideoReferenceImage}
              className="text-muted-foreground h-6"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="relative w-full rounded-lg border border-input bg-accent/50 overflow-hidden max-h-32">
            <Image
              src={videoReferenceImageUrl}
              alt="Reference frame for video"
              width={200}
              height={200}
              className="w-full h-auto object-contain max-h-32"
              unoptimized
            />
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
          <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Select an image from the timeline to animate
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="video-prompt" className="text-xs">Animation Prompt</Label>
        <Input
          id="video-prompt"
          placeholder="Describe how to animate this image..."
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerateVideo();
            }
          }}
          disabled={isGeneratingVideo}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="video-aspect-ratio" className="text-xs">Aspect Ratio</Label>
          <Select
            value={videoAspectRatio}
            onValueChange={(value) => setVideoAspectRatio(value as VideoAspectRatio)}
            disabled={isGeneratingVideo}
          >
            <SelectTrigger id="video-aspect-ratio" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_ASPECT_RATIOS.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="video-resolution" className="text-xs">Resolution</Label>
          <Select
            value={videoResolution}
            onValueChange={(value) => setVideoResolution(value as VideoResolution)}
            disabled={isGeneratingVideo}
          >
            <SelectTrigger id="video-resolution" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_RESOLUTIONS.map((res) => (
                <SelectItem key={res.value} value={res.value}>
                  {res.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="generate-audio"
          checked={generateAudio}
          onCheckedChange={setGenerateAudio}
          disabled={isGeneratingVideo}
        />
        <Label
          htmlFor="generate-audio"
          className="text-xs font-normal cursor-pointer"
        >
          Generate audio (uses more credits)
        </Label>
      </div>

      <Button
        type="button"
        onClick={handleGenerateVideo}
        disabled={isGeneratingVideo || !videoPrompt.trim() || !videoReferenceImageUrl}
        className="w-full h-9"
        size="sm"
        aria-label="Generate video from image"
      >
        {isGeneratingVideo ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Video className="h-3.5 w-3.5" />
            Generate Video
          </>
        )}
      </Button>

      {videoError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex justify-between items-center">
          <span>{videoError}</span>
          <Button
            type="button"
            variant="text"
            size="icon"
            onClick={clearVideoError}
            className="h-auto w-auto p-0"
            aria-label="Dismiss error"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// TTS Generation Form Component
function TTSGenerationForm({
  ttsText,
  ttsVoice,
  ttsStability,
  ttsSimilarityBoost,
  ttsSpeed,
  isGeneratingTTS,
  ttsError,
  setTTSText,
  setTTSVoice,
  setTTSStability,
  setTTSSimilarityBoost,
  setTTSSpeed,
  handleGenerateTTS,
  clearTTSError,
}: {
  ttsText: string;
  ttsVoice: TTSVoice;
  ttsStability: number;
  ttsSimilarityBoost: number;
  ttsSpeed: number;
  isGeneratingTTS: boolean;
  ttsError: string | null;
  setTTSText: (text: string) => void;
  setTTSVoice: (voice: TTSVoice) => void;
  setTTSStability: (stability: number) => void;
  setTTSSimilarityBoost: (boost: number) => void;
  setTTSSpeed: (speed: number) => void;
  handleGenerateTTS: () => void;
  clearTTSError: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Text Input */}
      <div className="space-y-1.5">
        <Label htmlFor="tts-text" className="text-xs">
          Text to Speech
        </Label>
        <Textarea
          id="tts-text"
          placeholder="Enter text to convert to speech..."
          value={ttsText}
          onChange={(e) => setTTSText(e.target.value)}
          disabled={isGeneratingTTS}
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Voice Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="tts-voice" className="text-xs">Voice</Label>
        <Select
          value={ttsVoice}
          onValueChange={(value) => setTTSVoice(value as TTSVoice)}
          disabled={isGeneratingTTS}
        >
          <SelectTrigger id="tts-voice" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TTS_VOICES.map((voice) => (
              <SelectItem key={voice.value} value={voice.value}>
                {voice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3 pt-2">
        {/* Stability */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="tts-stability" className="text-xs">
              Stability
            </Label>
            <span className="text-xs text-muted-foreground">{ttsStability.toFixed(2)}</span>
          </div>
          <Slider
            id="tts-stability"
            min={0}
            max={1}
            step={0.01}
            value={[ttsStability]}
            onValueChange={(value) => setTTSStability(value[0])}
            disabled={isGeneratingTTS}
          />
        </div>

        {/* Similarity Boost */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="tts-similarity" className="text-xs">
              Similarity
            </Label>
            <span className="text-xs text-muted-foreground">{ttsSimilarityBoost.toFixed(2)}</span>
          </div>
          <Slider
            id="tts-similarity"
            min={0}
            max={1}
            step={0.01}
            value={[ttsSimilarityBoost]}
            onValueChange={(value) => setTTSSimilarityBoost(value[0])}
            disabled={isGeneratingTTS}
          />
        </div>

        {/* Speed */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="tts-speed" className="text-xs">
              Speed
            </Label>
            <span className="text-xs text-muted-foreground">{ttsSpeed.toFixed(2)}x</span>
          </div>
          <Slider
            id="tts-speed"
            min={0.7}
            max={1.2}
            step={0.01}
            value={[ttsSpeed]}
            onValueChange={(value) => setTTSSpeed(value[0])}
            disabled={isGeneratingTTS}
          />
        </div>
      </div>

      {/* Generate Button */}
      <Button
        type="button"
        onClick={handleGenerateTTS}
        disabled={isGeneratingTTS || !ttsText.trim()}
        className="w-full h-9"
        size="sm"
        aria-label="Generate speech"
      >
        {isGeneratingTTS ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5" />
            Generate Speech
          </>
        )}
      </Button>

      {/* Error Display */}
      {ttsError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex justify-between items-center">
          <span>{ttsError}</span>
          <Button
            type="button"
            variant="text"
            size="icon"
            onClick={clearTTSError}
            className="h-auto w-auto p-0"
            aria-label="Dismiss error"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function GeneratedImageCard({
  image,
  description,
  onAddToTimeline,
  isAdding,
  compact = false,
}: {
  image: { url: string };
  description: string;
  onAddToTimeline: (url: string) => void;
  isAdding: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      "relative group rounded-lg border border-input bg-accent/50 overflow-hidden",
      isAdding && "opacity-50 pointer-events-none"
    )}>
      <div className="relative w-full">
        <Image
          src={image.url}
          alt={description}
          width={800}
          height={800}
          className="w-full h-auto rounded-t-lg"
          unoptimized
        />
        {isAdding && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        <Button
          type="button"
          size="sm"
          onClick={() => onAddToTimeline(image.url)}
          disabled={isAdding}
          className="w-full h-8"
          aria-label="Add generated image to timeline"
        >
          <Download className="h-3 w-3" />
          Add to Timeline
        </Button>
      </div>
    </div>
  );
}

function GeneratedVideoCard({
  video,
  onAddToTimeline,
  isAdding,
  compact = false,
}: {
  video: { url: string };
  onAddToTimeline: (url: string) => void;
  isAdding: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      "relative group rounded-lg border border-input bg-accent/50 overflow-hidden",
      isAdding && "opacity-50 pointer-events-none"
    )}>
      <div className="relative w-full aspect-video bg-black">
        {/* biome-ignore lint/a11y/useMediaCaption: Video preview doesn't need captions */}
        <video
          src={video.url}
          controls
          className="w-full h-full"
          preload="metadata"
        />
        {isAdding && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <Button
          type="button"
          size="sm"
          onClick={() => onAddToTimeline(video.url)}
          disabled={isAdding}
          className="w-full h-8"
          aria-label="Add generated video to timeline"
        >
          <Download className="h-3 w-3" />
          Add to Timeline
        </Button>
      </div>
    </div>
  );
}

function GeneratedAudioCard({
  audio,
  onAddToTimeline,
  isAdding,
}: {
  audio: { url: string; duration_seconds?: number };
  onAddToTimeline: (url: string) => void;
  isAdding: boolean;
}) {
  return (
    <div className={cn(
      "relative group rounded-lg border border-input bg-accent/50 overflow-hidden",
      isAdding && "opacity-50 pointer-events-none"
    )}>
      <div className="relative w-full p-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center justify-center gap-3">
          <Volume2 className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <audio
              src={audio.url}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
        </div>
        {isAdding && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <Button
          type="button"
          size="sm"
          onClick={() => onAddToTimeline(audio.url)}
          disabled={isAdding}
          className="w-full h-8"
          aria-label="Add generated audio to timeline"
        >
          <Download className="h-3 w-3" />
          Add to Timeline
        </Button>
      </div>
    </div>
  );
}