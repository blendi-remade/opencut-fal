import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { z } from "zod";

fal.config({
  credentials: process.env.FAL_KEY,
});

const captionRequestSchema = z.object({
  image_url: z.string().url(),
  prompt: z.string().optional(),
  style: z.enum(["documentary", "tiktok"]).optional(),
});

function getPromptForStyle(style?: string): string {
  if (style === "documentary") {
    return "You are a professional documentary narrator. Describe this image with gravitas and depth, as if narrating a nature documentary or historical piece. Use rich, evocative language. Focus on the story, context, and significance. Be engaging but authoritative. Keep it concise (2-3 sentences).";
  }
  
  if (style === "tiktok") {
    return "You are a Gen Z TikTok narrator with main character energy. Describe this image like you're telling your bestie the tea. Be funny, dramatic, and slightly unhinged. Use modern slang naturally (no cap, fr fr, giving, ate, slay). Add humor and personality. Keep it snappy and engaging (2-3 sentences). Make it iconic.";
  }
  
  return "Describe this image in detail, as if you were narrating it for a video. Be descriptive but concise, focusing on the main subjects, actions, and mood.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = captionRequestSchema.parse(body);

    const result = await fal.subscribe("fal-ai/any-llm/vision", {
      input: {
        prompt: params.prompt || getPromptForStyle(params.style),
        image_urls: [params.image_url],
        model: "google/gemini-2.5-flash-lite",
        priority: "latency",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    return NextResponse.json({ caption: result.data.output });
  } catch (error) {
    console.error("Image caption error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Caption generation failed" },
      { status: 500 }
    );
  }
}

