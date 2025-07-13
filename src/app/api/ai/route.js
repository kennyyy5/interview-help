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

    const { jobDesc, apiKey, history } = await req.json();
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

    const formattedHistory = (Array.isArray(history) ? history : [])
  .filter((q) => typeof q === "string")
  .map((q, i) => `${i + 1}. ${q}`)
  .join("\n");

    const prompt = `
Job description:
${jobDesc}

Act like a top-tier interviewer. Generate **one** tough interview question based on the job description that is likely to be asked.

Avoid any question that is similar to the ones listed below.

Past questions to avoid:
${formattedHistory || "None"}

Requirements:
- Return **only the new question**, nothing else.
- Do **not** repeat or closely resemble any of the listed questions.
- The question must be clear, specific, and relevant to the job.
Generate a fresh, challenging question now.
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
