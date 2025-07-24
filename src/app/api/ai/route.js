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

    const prompt = `Job Description:
${jobDesc}

You are an interviewer hiring for this role. Generate exactly **one** realistic and professionally worded interview question.

Requirements:

1. Alternate between question types to maintain approximately a 50/50 balance:
   • Technical questions — assessing knowledge of tools, concepts, and skills relevant to the job description.
   • Behavioral or situational questions — assessing communication, self-awareness, decision-making, or problem-solving skills.

2. Behavioral and situational questions may include:
   • Situational Scenarios
   • Problem-Solving & Analytical Thinking
   • Cultural Fit / Motivation
   • Self-Reflection / Growth
   • General Background / Past Experience

3. The question must NOT overlap in topic, theme, structure, or intent with any previously asked questions:
${formattedHistory || "None"}

4. Do NOT ask vague or overused project management questions, such as:
   • “Imagine you’re tasked with improving accuracy across departments…”
   • “How would you manage a project with multiple stakeholders?”

5. Avoid niche or overly specific phrasing from the job description. The question should apply broadly to someone in the role.

6. The question must be:
   • Realistic — something a hiring manager would likely ask
   • Concise — clear and focused to prompt a thoughtful spoken answer

7. Do NOT ask:
   • Coding challenges
   • System design questions
   • Whiteboard-style problems

8. Choose **one** of the following formats:
   • A practical or conceptual technical question (e.g., "How would you clean inconsistent customer records across sources using SQL?")
   • A behavioral or situational question (e.g., "Tell me about a time you had to challenge a teammate's assumptions using data.")

Return ONLY the interview question — no explanations, no comments.`;





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
