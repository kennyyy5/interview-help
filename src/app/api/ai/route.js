import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { jobDesc, apiKey } = await req.json();

    if (!jobDesc || !apiKey) {
      return new NextResponse(
        JSON.stringify({ error: "Missing job description or API key." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Move instantiation inside the POST function
    const openai = new OpenAI({ apiKey:apiKey || process.env.OPENAI_API_KEY });

    const prompt = `Job description:\n${jobDesc}\n\nGive one of the toughest interview questions an interviewer might ask based on this job description. Only give the question—nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const message = response.choices[0]?.message?.content || "No question generated.";

    return new NextResponse(JSON.stringify({ message }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60",
      },
    });
  } catch (err) {
    console.error("AI route error:", err);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch AI response." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
