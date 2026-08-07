import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("file") as File;

    if (!audio) {
      console.error("[transcribe API Error] No audio file provided in request");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log(`[transcribe API] Processing audio file: ${audio.name || 'blob'} (${audio.size} bytes)`);

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    console.log("[transcribe API Success] Generated transcript:", transcription.text);

    return NextResponse.json({
      transcript: transcription.text,
    });
  } catch (error: any) {
    console.error("[transcribe API Error]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Transcription failed" },
      { status: 500 }
    );
  }
}