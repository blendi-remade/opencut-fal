"use client";

import { useMediaStore } from "@/stores/media-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { ScrollArea } from "../../ui/scroll-area";
import { AudioProperties } from "./audio-properties";
import { MediaProperties } from "./media-properties";
import { TextProperties } from "./text-properties";
import { SquareSlashIcon } from "lucide-react";
import { PreviewQualityControl } from "../preview-quality-control";
import { SpeedControl } from "../speed-control";

export function PropertiesPanel() {
  const { selectedElements, tracks } = useTimelineStore();
  const { mediaFiles } = useMediaStore();

  return (
    <>
      {selectedElements.length > 0 ? (
        <ScrollArea className="h-full bg-panel rounded-sm">
          {selectedElements.map(({ trackId, elementId }) => {
            const track = tracks.find((t) => t.id === trackId);
            const element = track?.elements.find((e) => e.id === elementId);

            if (element?.type === "text") {
              return (
                <div key={elementId}>
                  <TextProperties element={element} trackId={trackId} />
                </div>
              );
            }
            if (element?.type === "media") {
              const mediaFile = mediaFiles.find(
                (file) => file.id === element.mediaId
              );

              if (mediaFile?.type === "audio") {
                return <AudioProperties key={elementId} element={element} />;
              }

              return (
                <div key={elementId}>
                  <MediaProperties element={element} />
                </div>
              );
            }
            return null;
          })}
        </ScrollArea>
      ) : (
        <EmptyView />
      )}
    </>
  );
}

function EmptyView() {
  return (
    <ScrollArea className="bg-panel h-full">
      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-3 pb-6 border-b">
          <SquareSlashIcon
            className="w-10 h-10 text-muted-foreground"
            strokeWidth={1.5}
          />
          <div className="flex flex-col gap-2 text-center">
            <p className="text-lg font-medium">No selection</p>
            <p className="text-sm text-muted-foreground text-balance">
              Click an element on the timeline to edit its properties
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <PreviewQualityControl />
          <div className="border-t pt-6">
            <SpeedControl />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
