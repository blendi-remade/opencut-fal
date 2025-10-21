import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Configure fal with server-side credentials
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, num_images, output_format, aspect_ratio, image_urls } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Determine which endpoint to use
    const isEditMode = image_urls && image_urls.length > 0;
    const endpoint = isEditMode ? "fal-ai/nano-banana/edit" : "fal-ai/nano-banana";

    // Build input params based on mode
    const input: any = {
      prompt,
      num_images,
      output_format,
    };

    if (isEditMode) {
      // Image editing mode
      input.image_urls = image_urls;
      // aspect_ratio is optional for edit mode (uses input image ratio by default)
      if (aspect_ratio) {
        input.aspect_ratio = aspect_ratio;
      }
    } else {
      // Text-to-image mode
      input.aspect_ratio = aspect_ratio;
    }

    console.log(`Using ${endpoint} with input:`, input);

    // Call fal API directly from server
    const result = await fal.subscribe(endpoint, {
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
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

