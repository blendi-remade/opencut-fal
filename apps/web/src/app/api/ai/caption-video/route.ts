import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { z } from "zod";

fal.config({
  credentials: process.env.FAL_KEY,
});

const captionRequestSchema = z.object({
  video_url: z.string().url(),
  prompt: z.string().optional(),
  style: z.enum(["documentary", "tiktok"]).optional(),
  duration: z.number().optional(),
});

// Helper to clean the Sa2VA output (removes HTML tags and [SEG] markers)
function cleanVideoCaption(rawOutput: string): string {
  return rawOutput
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "")
    .replace(/\[SEG\]/g, "")
    .replace(/<\|im_end\|>/g, "")
    .trim()
    .replace(/\s+/g, " "); // Normalize whitespace
}

function getPromptForStyle(style?: string, duration?: number): string {
  // Calculate target word count based on duration
  // Average speaking rate: 150 words/minute for normal speech, 180 for faster TikTok-style
  const wordsPerMinute = style === "tiktok" ? 180 : 150;
  const targetWords = duration ? Math.round((duration / 60) * wordsPerMinute) : null;
  const wordGuidance = targetWords ? ` Your narration should be approximately ${targetWords} words to match the video duration.` : "";
  
  if (style === "documentary") {
    return `You are a professional documentary narrator. Describe this video with gravitas and depth, as if narrating a nature documentary or historical piece. Use rich, evocative language to paint the scene. Focus on the story, context, and significance of what's happening. Be engaging but authoritative.${wordGuidance || " Keep it concise (2-3 sentences)."}`;
  }
  
  if (style === "tiktok") {
    return `You are a Gen Z TikTok narrator with main character energy. Describe this video like you're telling your bestie the wildest thing you just witnessed. Be funny, dramatic, and slightly unhinged. Use modern slang naturally (no cap, fr fr, giving, ate, slay, it's giving). Add humor and personality.${wordGuidance || " Keep it snappy and engaging (2-3 sentences)."} Make it iconic and memeable.`;
  }
  
  return `Could you please give me a brief description of the video? Please describe what is happening, focusing on the main subjects, actions, and overall narrative. Be concise and engaging.${wordGuidance}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = captionRequestSchema.parse(body);

    const result = await fal.subscribe("fal-ai/sa2va/4b/video", {
      input: {
        prompt: params.prompt || getPromptForStyle(params.style, params.duration),
        video_url: params.video_url,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    const cleanedCaption = cleanVideoCaption(result.data.output);
    return NextResponse.json({ caption: cleanedCaption });
  } catch (error) {
    console.error("Video caption error:", error);
    
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

