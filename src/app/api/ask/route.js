// src/app/api/cheat/route.js
import { NextResponse } from "next/server";

export const config = { api: { bodyParser: false } };

const RESUME = `Kehinde Adenuga
Ontario, CA
...`; // truncated for brevity

export async function POST(req) {
  try {
    // Destructure both fields in one parse
    const { question, jobDesc } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided." }, { status: 400 });
    }
    if (!jobDesc) {
      return NextResponse.json({ error: "No job description provided." }, { status: 400 });
    }

    // Dynamic import at runtime
    const { default: OpenAI } = await import("openai");
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY at runtime");
      return NextResponse.json({ error: "Server API key not configured." }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    // Build prompt
    const prompt = [
      `Act as an interview coach. Speak warmly and conversationally, like you're coaching a friend. Keep it simple and avoid long-winded explanations.`,
      `Give your answer in bullet points that would take about 1.5 to 2 minutes to say out loud.`,
      `Vary sentence structure, use personal pronouns, and avoid technical jargon unless needed.`,
      `Q: "${question}"`,
      `If it's a behavioral or situational or background question, give a brief story using the STAR format (Situation, Task, Action, Result). End with what was learned.`,
      `If it's a technical question, explain clearly and in detail, then give a specific example.`,
      `Use the resume and job description below to guide the response.`,
      `--- RESUME ---`,
      RESUME,
      `--- JOB DESCRIPTION ---`,
      jobDesc,
    ].join("\n\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = chat.choices[0]?.message?.content || "";
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
