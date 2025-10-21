import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Configure fal with server-side credentials
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, image_url, aspect_ratio, duration, generate_audio, resolution } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!image_url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Build input params for Veo 3.1 Fast
    const input = {
      prompt,
      image_url,
      aspect_ratio: aspect_ratio || "16:9",
      duration: duration || "8s",
      generate_audio: generate_audio !== undefined ? generate_audio : true,
      resolution: resolution || "720p",
    };

    console.log("Using fal-ai/veo3.1/fast/image-to-video with input:", input);

    // Call fal API directly from server
    const result = await fal.subscribe("fal-ai/veo3.1/fast/image-to-video", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 }
    );
  }
}

