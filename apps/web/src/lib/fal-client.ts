import type { AIGenerationParams, AIGenerationResult, VideoGenerationParams, VideoGenerationResult, BackgroundRemovalParams, BackgroundRemovalResult, VideoBackgroundRemovalParams, VideoBackgroundRemovalResult, TTSParams, TTSResult, VisionCaptionParams, VisionCaptionResult } from "@/types/ai";

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

/**
 * Remove background from a video using fal.ai's Bria video background removal model
 * Makes a server-side API call to protect the API key
 */
export async function removeVideoBackground({
  video_url,
  background_color = "Transparent",
  output_container_and_codec = "webm_vp9",
}: VideoBackgroundRemovalParams): Promise<VideoBackgroundRemovalResult> {
  try {
    // Convert blob URL to base64 data URI if needed
    let processedVideoUrl = video_url;
    if (video_url.startsWith('blob:')) {
      processedVideoUrl = await blobUrlToDataUri(video_url);
    }

    const response = await fetch("/api/ai/remove-video-background", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: processedVideoUrl,
        background_color,
        output_container_and_codec,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Video background removal failed");
    }

    const data = await response.json();
    return data as VideoBackgroundRemovalResult;
  } catch (error) {
    console.error("Video background removal error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to remove video background. Please try again."
    );
  }
}

/**
 * Generate speech from text using fal.ai's ElevenLabs TTS Turbo v2.5 model
 * Makes a server-side API call to protect the API key
 */
export async function generateTTS({
  text,
  voice = "Brian",
  stability = 0.5,
  similarity_boost = 0.75,
  style,
  speed = 1.0,
  output_format = "mp3_44100_128",
  language_code,
}: TTSParams): Promise<TTSResult> {
  try {
    const response = await fetch("/api/ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice,
        stability,
        similarity_boost,
        ...(style !== undefined && { style }),
        speed,
        output_format,
        ...(language_code && { language_code }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "TTS generation failed");
    }

    const data = await response.json();
    return data as TTSResult;
  } catch (error) {
    console.error("TTS generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate speech. Please try again."
    );
  }
}

/**
 * Generate a caption/description for an image using vision AI
 * Makes a server-side API call to protect the API key
 */
export async function generateImageCaption({
  image_url,
  prompt,
  style,
}: VisionCaptionParams): Promise<VisionCaptionResult> {
  try {
    const response = await fetch("/api/ai/caption-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url,
        prompt,
        style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Image caption generation failed");
    }

    const data = await response.json();
    return data as VisionCaptionResult;
  } catch (error) {
    console.error("Image caption generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate image caption. Please try again."
    );
  }
}

/**
 * Generate a caption/description for a video using vision AI
 * Makes a server-side API call to protect the API key
 */
export async function generateVideoCaption({
  video_url,
  prompt,
  style,
  duration,
}: VisionCaptionParams): Promise<VisionCaptionResult> {
  try {
    let processedVideoUrl = video_url;

    // If it's a blob URL, upload it to fal.ai storage first via our server
    if (video_url && video_url.startsWith('blob:')) {
      console.log("Uploading video to fal.ai storage...");
      
      // Fetch the blob
      const videoResponse = await fetch(video_url);
      const videoBlob = await videoResponse.blob();
      
      // Create a File object
      const videoFile = new File([videoBlob], `video-${Date.now()}.mp4`, {
        type: videoBlob.type || 'video/mp4',
      });
      
      // Upload via our server endpoint
      const formData = new FormData();
      formData.append('video', videoFile);
      
      const uploadResponse = await fetch("/api/ai/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const uploadData = await uploadResponse.json();
      processedVideoUrl = uploadData.url;
      console.log("Video uploaded to fal.ai storage:", processedVideoUrl);
    }

    const response = await fetch("/api/ai/caption-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: processedVideoUrl,
        prompt,
        style,
        duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Video caption generation failed");
    }

    const data = await response.json();
    return data as VisionCaptionResult;
  } catch (error) {
    console.error("Video caption generation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate video caption. Please try again."
    );
  }
}