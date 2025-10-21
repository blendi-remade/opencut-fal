import { Button } from "../ui/button";
import { usePlaybackStore } from "@/stores/playback-store";
import { Monitor } from "lucide-react";

const QUALITY_PRESETS = [
  { label: "25%", value: 0.25, description: "Fastest" },
  { label: "50%", value: 0.5, description: "Fast" },
  { label: "75%", value: 0.75, description: "Balanced" },
  { label: "100%", value: 1.0, description: "Full Quality" },
];

export function PreviewQualityControl() {
  const { previewQuality, setPreviewQuality } = usePlaybackStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4" />
        <h3 className="text-sm font-medium">Preview Quality</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Lower quality = better performance. Final export is always full quality.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {QUALITY_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={previewQuality === preset.value ? "default" : "outline"}
            className="flex flex-col h-auto py-2 px-3"
            onClick={() => setPreviewQuality(preset.value)}
            type="button"
          >
            <span className="font-semibold">{preset.label}</span>
            <span className="text-xs opacity-70">{preset.description}</span>
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        Current: {Math.round(previewQuality * 100)}% resolution
      </div>
    </div>
  );
}

