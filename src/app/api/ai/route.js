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

You are an interviewer hiring for this role. Generate exactly **one** realistic interview question.

Requirements:

1. The question must NOT resemble — in topic, theme wording, structure, or intent — **any** of the following previously asked questions:
${formattedHistory || "None"}

2. The question must be realistic — the kind a hiring manager is very likely to actually ask in an interview.

3. Do NOT ask vague, hypothetical, or generic project management questions like:
   • “Imagine you’re tasked with improving accuracy across departments…”
   • “How would you manage a project with multiple stakeholders?”

4. Keep the question general enough to apply broadly to the role — avoid niche or hyper-specific phrasing from the job description.

5. The question should be:
   • General but deep — testing critical thinking, self-awareness, or communication
   • OR technical — testing conceptual understanding of tools like SQL, Power BI, Snowflake, data cleaning, workflow documentation, or automation

6. Vary the question type. You may choose:
   • Behavioral (e.g., Tell me about a time…)
   • Situational (e.g., How would you handle…)
   • Technical-conceptual (e.g., What is an API?)
   • Communication or role-fit (e.g., What makes a great teammate?)

7. Do NOT ask:
   • Coding problems
   • System design questions
   • Whiteboard challenges

8. The question should be professionally worded, concise, and prompt a meaningful spoken response.

Return ONLY the question. Do not include explanations or context.`;



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
