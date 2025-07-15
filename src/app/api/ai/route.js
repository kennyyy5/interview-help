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

    const prompt = `Job description:
${jobDesc}

You are a top-tier interviewer for this role. Generate **one** challenging and **totally unique** interview question that fits this role and is likely to be asked by a real interviewer.

Requirements:

1. The question must NOT be the same as, or similar in topic, wording, structure, or intent to **any** of the following previously asked questions:
${formattedHistory || "None"}

2. The question should be **general enough** to apply broadly to this type of role — do not make it overly specific to small job description details.

3. Vary the type of question. You may choose:
   - Behavioral (e.g., Tell me about a time...)
   - Situational (e.g., How would you handle…)
   - Conceptual technical (e.g., What is an API? How does REST work?)
   - Role-fit or communication (e.g., What makes a great teammate in a remote team?)

4. Do NOT ask any coding problems, whiteboarding challenges, or system design tasks.

5. The question should be thoughtful, professionally worded, and prompt a meaningful spoken response in an interview.

Return only the question text. Do not add explanations or context.
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
