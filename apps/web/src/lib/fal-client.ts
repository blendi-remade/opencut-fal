import type { AIGenerationParams, AIGenerationResult, VideoGenerationParams, VideoGenerationResult, BackgroundRemovalParams, BackgroundRemovalResult } from "@/types/ai";

/**
 * Convert blob URL to base64 data URI
 */
async function blobUrlToDataUri(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate an image using fal.ai's nano-banana model
 * Makes a server-side API call to protect the API key
 */
export async function generateImage({
  prompt,
  num_images,
  output_format,
  aspect_ratio,
  image_urls,
}: AIGenerationParams): Promise<AIGenerationResult> {
  try {
    // Convert blob URLs to base64 data URIs for fal API
    let processedImageUrls = image_urls;
    if (image_urls && image_urls.length > 0) {
      processedImageUrls = await Promise.all(
        image_urls.map(async (url) => {
          // Check if it's a blob URL
          if (url.startsWith('blob:')) {
            return await blobUrlToDataUri(url);
          }
          // If it's already a data URI or public URL, keep it as is
          return url;
        })
      );
    }

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        num_images,
        output_format,
        aspect_ratio,
        image_urls: processedImageUrls,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Generation failed");
    }

    const data = await response.json();
    return data as AIGenerationResult;
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate image. Please try again."
    );
  }
}

/**
 * Generate a video from an image using fal.ai's Veo 3.1 Fast model
 * Makes a server-side API call to protect the API key
 */
export async function generateVideo({
  prompt,
  image_url,
  aspect_ratio,
  duration,
  generate_audio,
  resolution,
}: VideoGenerationParams): Promise<VideoGenerationResult> {
  try {
    // Convert blob URL to base64 data URI if needed
    let processedImageUrl = image_url;
    if (image_url.startsWith('blob:')) {
      processedImageUrl = await blobUrlToDataUri(image_url);
    }

    const response = await fetch("/api/ai/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url: processedImageUrl,
        aspect_ratio,
        duration,
        generate_audio,
        resolution,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Video generation failed");
    }

    const data = await response.json();
    return data as VideoGenerationResult;
  } catch (error) {
    console.error("Video generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate video. Please try again."
    );
  }
}

/**
 * Remove background from an image using fal.ai's Bria RMBG 2.0 model
 * Makes a server-side API call to protect the API key
 */
export async function removeBackground({
  image_url,
}: BackgroundRemovalParams): Promise<BackgroundRemovalResult> {
  try {
    // Convert blob URL to base64 data URI if needed
    let processedImageUrl = image_url;
    if (image_url.startsWith('blob:')) {
      processedImageUrl = await blobUrlToDataUri(image_url);
    }

    const response = await fetch("/api/ai/remove-background", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: processedImageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Background removal failed");
    }

    const data = await response.json();
    return data as BackgroundRemovalResult;
  } catch (error) {
    console.error("Background removal error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to remove background. Please try again."
    );
  }
}