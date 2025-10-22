import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { z } from "zod";

const requestSchema = z.object({
  video_url: z.string().url(),
  background_color: z.enum(["Transparent", "Black", "White", "Gray", "Red", "Green", "Blue", "Yellow", "Cyan", "Magenta", "Orange"]).optional(),
  output_container_and_codec: z.enum(["mp4_h265", "mp4_h264", "webm_vp9", "mov_h265", "mov_proresks", "mkv_h265", "mkv_h264", "mkv_vp9", "gif"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { video_url, background_color, output_container_and_codec } = requestSchema.parse(body);

    const result = await fal.subscribe("bria/video/background-removal", {
      input: {
        video_url,
        background_color: background_color || "Black",
        output_container_and_codec: output_container_and_codec || "webm_vp9",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Video background removal error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove video background" },
      { status: 500 }
    );
  }
}

