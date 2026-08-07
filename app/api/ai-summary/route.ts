import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      console.error("[ai-summary API Error] No transcript provided in request body");
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    console.log("[ai-summary API] Generating summary for transcript snippet:", transcript.substring(0, 100));

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a medical documentation assistant.
Return ONLY valid JSON in this format:

{
  "symptoms":"",
  "duration":"",
  "history":"",
  "medicines":"",
  "followUp":""
}`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0].message.content || "{}";

    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("[ai-summary API Success] Groq Parsed Response:", cleaned);

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[ai-summary API Error]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}