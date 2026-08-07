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
      return NextResponse.json(
        { error: "No audio file" },
        { status: 400 }
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    return NextResponse.json({
      transcript: transcription.text,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}