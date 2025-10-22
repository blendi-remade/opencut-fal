import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { z } from "zod";

const requestSchema = z.object({
  image_url: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_url } = requestSchema.parse(body);

    const result = await fal.subscribe("fal-ai/bria/background/remove", {
      input: {
        image_url,
        sync_mode: true,
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
    console.error("Background removal error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove background" },
      { status: 500 }
    );
  }
}

