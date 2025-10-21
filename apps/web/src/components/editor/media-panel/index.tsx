"use client";
import { AIView } from "./views/ai";
import { TabBar } from "./tabbar";
import { MediaView } from "./views/media";
import { useMediaPanelStore, Tab } from "./store";
import { TextView } from "./views/text";
import { SoundsView } from "./views/sounds";
import { StickersView } from "./views/stickers";
import { Separator } from "@/components/ui/separator";
import { SettingsView } from "./views/settings";
import { Captions } from "./views/captions";

export function MediaPanel() {
  const { activeTab } = useMediaPanelStore();

  const viewMap: Record<Tab, React.ReactNode> = {
    media: <MediaView />,
    ai: <AIView />,
    sounds: <SoundsView />,
    text: <TextView />,
    stickers: <StickersView />,
    transitions: (
      <div className="p-4 text-muted-foreground">
        Transitions view coming soon...
      </div>
    ),
    captions: <Captions />,
    filters: (
      <div className="p-4 text-muted-foreground">
        Filters view coming soon...
      </div>
    ),
    adjustment: (
      <div className="p-4 text-muted-foreground">
        Adjustment view coming soon...
      </div>
    ),
    settings: <SettingsView />,
  };

  return (
    <div className="h-full flex bg-panel">
      <TabBar />
      <Separator orientation="vertical" />
      <div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
    </div>
  );
}
