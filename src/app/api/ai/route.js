// src/app/api/ask/route.js
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
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    const { jobDesc, apiKey } = await req.json();
    if (!jobDesc) {
      return NextResponse.json(
        { error: "Missing job description." },
        { status: 400 }
      );
    }

    // Determine which key to use
    let finalKey = apiKey;
    if (idToken) {
      try {
        await getAuth().verifyIdToken(idToken);
        finalKey = process.env.OPENAI_API_KEY;
      } catch {
        console.warn("Invalid Firebase token; using provided key.");
      }
    }

    if (!finalKey) {
      return NextResponse.json(
        { error: "No valid OpenAI API key available." },
        { status: 403 }
      );
    }

    // Dynamically import and instantiate OpenAI at runtime
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: finalKey });

    const prompt = `
Job description:
${jobDesc}

Act like a top-tier interviewer at a world-class company. Generate **one** extremely tough, thought-provoking interview question based on the job description **that is not generic, common, or already widely used**.

The question must:
- Be unique and unexpected
- Test deeper thinking, adaptability, or relevant skills
- Avoid repeating typical questions like "Why should we hire you?" or "Tell me about yourself"

Return **only the question text**. Do not include explanations or context.
`.trim();


    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature:0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const message = response.choices[0]?.message?.content || "No question generated.";
    return NextResponse.json({ message });

  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch AI response." },
      { status: 500 }
    );
  }
}
