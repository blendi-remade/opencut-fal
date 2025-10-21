"use client";

import { useState } from "react";
import { useAIStore } from "@/stores/ai-store";
import { Loader2, Sparkles, Clock, Image as ImageIcon, Download, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { AspectRatio, OutputFormat } from "@/types/ai";

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

export function AIView() {
  const {
    prompt,
    aspectRatio,
    outputFormat,
    isGenerating,
    currentResult,
    generationHistory,
    error,
    referenceImageUrls,
    setPrompt,
    setAspectRatio,
    setOutputFormat,
    generate,
    addToTimeline,
    clearHistory,
    clearError,
    clearReferenceImages,
  } = useAIStore();

  const [addingToTimeline, setAddingToTimeline] = useState<string | null>(null);
  const isEditMode = referenceImageUrls.length > 0;

  const handleGenerate = async () => {
    await generate();
  };

  const handleAddToTimeline = async (imageUrl: string) => {
    setAddingToTimeline(imageUrl);
    try {
      await addToTimeline(imageUrl);
      toast.success("Added to timeline");
    } catch (error) {
      toast.error("Failed to add to timeline");
    } finally {
      setAddingToTimeline(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-1 h-full p-4">
      {/* Generation Form */}
      <div className="space-y-3">
        {/* Edit Mode Reference Image - Compact */}
        {isEditMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Editing Image</Label>
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
            <div className="relative w-full rounded-lg border border-input bg-accent/50 overflow-hidden max-h-32">
              <Image
                src={referenceImageUrls[0]}
                alt="Reference image for editing"
                width={200}
                height={200}
                className="w-full h-auto object-contain max-h-32"
                unoptimized
              />
            </div>
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

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* Current Result */}
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

          {/* History */}
          {generationHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-medium text-muted-foreground">Recent</h3>
                </div>
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  onClick={clearHistory}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
              <div className="grid gap-2">
                {generationHistory.map((item) => (
                  <GeneratedImageCard
                    key={item.id}
                    image={item.result.images[0]}
                    description={item.prompt}
                    onAddToTimeline={handleAddToTimeline}
                    isAdding={addingToTimeline === item.result.images[0].url}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
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