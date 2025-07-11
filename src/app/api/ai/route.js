import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const dynamic = 'force-dynamic';

// Initialize firebase-admin once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;

    const { jobDesc, apiKey } = await req.json();
    if (!jobDesc) {
      return new NextResponse(
        JSON.stringify({ error: "Missing job description." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let finalApiKey = apiKey;

    if (idToken) {
      try {
        await getAuth().verifyIdToken(idToken);
        finalApiKey = process.env.OPENAI_API_KEY;
      } catch (verifyError) {
        console.warn("Invalid Firebase token. Using user-provided key.");
      }
    }

    if (!finalApiKey) {
      return new NextResponse(
        JSON.stringify({ error: "No valid OpenAI API key available." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: finalApiKey });

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
