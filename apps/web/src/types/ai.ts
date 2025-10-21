export type AspectRatio = "21:9" | "1:1" | "4:3" | "3:2" | "2:3" | "5:4" | "4:5" | "3:4" | "16:9" | "9:16";
export type OutputFormat = "jpeg" | "png" | "webp";

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