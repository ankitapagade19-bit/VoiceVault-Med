import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

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

    console.log("Groq Response:", cleaned);

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}