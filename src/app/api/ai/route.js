// src/app/api/ask/route.js
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cert, getApps, initializeApp } from "firebase-admin/app";

export const dynamic = "force-dynamic";

// initialize firebase-admin (unchanged)
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
      return NextResponse.json({ error: "Missing job description." }, { status: 400 });
    }

    // determine final key
    let finalKey = apiKey;
    if (idToken) {
      try {
        await getAuth().verifyIdToken(idToken);
        finalKey = process.env.OPENAI_API_KEY;
      } catch {
        console.warn("Invalid token; falling back to user key");
      }
    }

    if (!finalKey) {
      return NextResponse.json({ error: "No valid OpenAI API key." }, { status: 403 });
    }

    // 🚀 Lazy‑import and instantiate at runtime
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: finalKey });

    const prompt = `Job description:\n${jobDesc}\n\nGive one of the toughest interview questions...`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const message = resp.choices[0]?.message?.content || "No question generated.";
    return NextResponse.json({ message });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
