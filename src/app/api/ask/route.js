// src/app/api/cheat/route.js
import { NextResponse } from "next/server";

export const config = { api: { bodyParser: false } };

const RESUME = `Kehinde Adenuga
Ontario, CA
647-539-5968 kadenuga@uoguelph.ca linkedin.com/in/kenny-adenuga github.com/kennyyy5 kennyyy5.netlify.app
Education
• University of Guelph Guelph, ON
Bachelor in Computer Science COOP, Minor in Mathematics.; GPA: 3.5 Sep. 2023 – May 2028
Experience
• PM Accelerator Remote
Software Engineering Intern - AI/ML Apr. 2025 - Present
◦ Developed AI applications in an agile team with product managers, designers, and data scientists.
◦ Implemented the frontend in Flutter for cross-platform support
• Headstarter AI Remote
Software Engineering Fellow July 2024 - Sep. 2024
◦ Designed and developed 5+ AI applications and APIs with 98% accuracy, using Next.js, OpenAI, Stripe
API, and Pinecone.
◦ Worked in a 4-person agile team, applying MVC design patterns to streamline development and enhance
code maintainability.
Projects
• Airline Passenger Satisfaction: Performed data analysis and visualization using Python (NumPy, pandas), Jupyter
Notebook, and Excel.
• AskPDF — Dawson College AI Making Challenge: Built an AI chatbot using RAG to answer questions from
PDFs, leveraging AstraDB for vector search, the OpenAI API for embeddings, and a responsive Next.js/MUI front end
that boosted user engagement by 50%.
• AI Flashcards Maker — Ignition Hacks 2024: Developed an AI-powered flashcard web app in a team of four using
Next.js, the OpenAI API, and Firebase to enhance study efficiency.
• PinPoint — GDSC Hacks 2025: Co-developed PinPoint, a full-stack AI grocery planning web app that recommends
budget-friendly, diet-specific items and includes a chatbot for meal and pricing suggestions.
• TeamUp Chat App: Built a MERN-stack chat app with real-time Socket.io communication and secure JWT/bcrypt
authentication, enabling tech professionals to connect for hackathons and networking.
• FaithFlow: Designed and developed a cross-platform social media app in Flutter, integrating Firebase Authentication
and Firestore for secure login and real-time data storage.
Skills & Certifications
• Programming Languages: C, Python, JavaScript, Java, SQL, NoSQL, R
• Technologies: AWS, Docker, Git, MATLAB, LangChain, MS Office
• Interpersonal skills: Team Collaboration, Leadership, Communication
• Certifications: Introducing Artificial Intelligence: Training for the Road Ahead by CARE AI, Complete
Python, Django, Data Science and ML Guide Bootcamp by Udemy, IBM Z Xplore – Concepts
Activities, Introducing Artificial Intelligence: Training for the Road Ahead by CARE AI, The Complete
2024 Web Development Bootcamp by Udemy, SEO by HubSpot Academy, IBM Z Xplore - Concepts
• Member: ColorStack, SOCIS, Guelph Coding Community, GDSC Guelph (2023–Present)
• Participant: CAN-CWiC 2024, WACE Global Challenge, GDSCHacks 2025
• Peer Helper: University of Guelph (2024–Present)`; 

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
