import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { z } from "zod";

// Configure fal with server-side credentials
fal.config({
  credentials: process.env.FAL_KEY,
});

const ttsRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  voice: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarity_boost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  speed: z.number().min(0.7).max(1.2).optional(),
  output_format: z.string().optional(),
  language_code: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = ttsRequestSchema.parse(body);

    console.log("Using fal-ai/elevenlabs/tts/turbo-v2.5 with input:", params);

    // Call fal API directly from server
    const result = await fal.subscribe("fal-ai/elevenlabs/tts/turbo-v2.5", {
      input: {
        text: params.text,
        voice: params.voice || "Rachel",
        stability: params.stability ?? 0.5,
        similarity_boost: params.similarity_boost ?? 0.75,
        ...(params.style !== undefined && { style: params.style }),
        speed: params.speed ?? 1.0,
        output_format: params.output_format || "mp3_44100_128",
        ...(params.language_code && { language_code: params.language_code }),
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
    console.error("TTS generation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS generation failed" },
      { status: 500 }
    );
  }
}

