export type AspectRatio = "21:9" | "1:1" | "4:3" | "3:2" | "2:3" | "5:4" | "4:5" | "3:4" | "16:9" | "9:16";
export type OutputFormat = "jpeg" | "png" | "webp";
export type AIMode = "image" | "video";
export type VideoDuration = "8s";
export type VideoResolution = "720p" | "1080p";
export type VideoAspectRatio = "16:9" | "9:16";

export interface AIGenerationParams {
  prompt: string;
  num_images: number;
  output_format: OutputFormat;
  aspect_ratio: AspectRatio;
  sync_mode?: boolean;
  // For image editing
  image_urls?: string[];
}

export interface AIGeneratedImage {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface AIGenerationResult {
  images: AIGeneratedImage[];
  description: string;
}

export interface GenerationHistoryItem {
  id: string;
  prompt: string;
  params: AIGenerationParams;
  result: AIGenerationResult;
  timestamp: number;
}

// Video generation types
export interface VideoGenerationParams {
  prompt: string;
  image_url: string;
  aspect_ratio: VideoAspectRatio;
  duration: VideoDuration;
  generate_audio: boolean;
  resolution: VideoResolution;
}

export interface AIGeneratedVideo {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface VideoGenerationResult {
  video: AIGeneratedVideo;
}

export interface VideoGenerationHistoryItem {
  id: string;
  prompt: string;
  params: VideoGenerationParams;
  result: VideoGenerationResult;
  timestamp: number;
}

// Background removal types
export interface BackgroundRemovalParams {
  image_url: string;
  sync_mode?: boolean;
}

export interface BackgroundRemovalResult {
  image: AIGeneratedImage;
}

export interface VideoBackgroundRemovalParams {
  video_url: string;
  background_color?: "Transparent" | "Black" | "White" | "Gray" | "Red" | "Green" | "Blue" | "Yellow" | "Cyan" | "Magenta" | "Orange";
  output_container_and_codec?: "mp4_h265" | "mp4_h264" | "webm_vp9" | "mov_h265" | "mov_proresks" | "mkv_h265" | "mkv_h264" | "mkv_vp9" | "gif";
}

export interface VideoBackgroundRemovalResult {
  video: AIGeneratedVideo;
}