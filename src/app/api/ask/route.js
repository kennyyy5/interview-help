// src/app/api/cheat/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const config = { api: { bodyParser: false } };
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
Skills & Certifications
• Programming Languages: C, Python, JavaScript, Java, SQL, NoSQL, R
• Technologies: AWS, Docker, Git, MATLAB, LangChain, MS Office
• Interpersonal skills: Team Collaboration, Leadership, Communication
• Certifications: Introducing Artificial Intelligence: Training for the Road Ahead by CARE AI, Complete
Python, Django, Data Science and ML Guide Bootcamp by Udemy, IBM Z Xplore – Concepts
Activities
• Member: ColorStack, SOCIS, Guelph Coding Community, GDSC Guelph (2023–Present)
• Participant: CAN-CWiC 2024, WACE Global Challenge, GDSCHacks 2025
• Peer Helper: University of Guelph (2024–Present)`;

const JOB_DESC = `Software Developer Co-op @ CIBC

We’re building a relationship-oriented bank for the modern world. We need talented, passionate professionals who are dedicated to doing what’s right for our clients.

At CIBC, we embrace your strengths and your ambitions, so you are empowered at work. Our team members have what they need to make a meaningful impact and are truly valued for who they are and what they contribute.

To learn more about CIBC, please visit CIBC.com

Join our CIBC Technology Operations team as a Software Developer Co-Op and have a real impact in making our clients’ ambitions a reality! This is a great opportunity to be a part of an innovation-focused team that is helping to drive CIBC’s digital transformation by developing, testing, and delivering easy to use, flexible, and personalized banking solutions. You’ll have an opportunity to assist in developing, testing and supporting the implementation of cross-functional, multi-platform application systems. Be part of an innovation-focused team that creates easy, flexible, and personalized banking solutions to enhance client experience and change the way that people bank.

At CIBC we enable the work environment most optimal for you to thrive in your role. Details on your work arrangement (proportion of on-site and remote work) will be discussed at the time of your interview

Important information

Please note, we have multiple positions available under this posting and you may be considered by more than one hiring team

We may ask you to complete an attribute-based assessment and other skills tests (such as simulation, coding, French proficiency, MS Office). Our goal for the application process is to get to know more about you, all that you have to offer, and give you the opportunity to learn more about us.

You must be currently enrolled in post-secondary education and returning to full-time studies to be eligible. However, you do not need to be in a registered Co-Op program to be considered for a role.

Please include your resume (no more than 2 pages), a cover letter (no more than 1 page), and your most recent unofficial transcript with your application. These should all be uploaded into the Resume section of the application as one pdf document 

Please note that this position is hiring for candidates eligible and available for either 8 or 12 month co-op term.

How you’ll succeed

Programming- Develop, code and test computer programs for straightforward assignments. Review, analyze, and modify programming systems, including encoding, testing, and debugging.

System Implementation- participate in the technical design, development, and integration of cross functional, multi-platform application systems.

Coordination- effectively interact with stakeholders, end users, business analysts, and technical resources to gather requirements and prepare design specifications as instructed by senior team members.

Who you are

Developer: You are familiar with programming languages and enjoy improving the user experience

Problem Solving: You enjoy being presented with problems or issues and working with a team to find innovative solutions

Communication:  You have excellent verbal and written communication skills to effectively articulate ideas and opinions that involve analysis, interpretation, and assessment.

Creativity: You are curious and enjoy working in a team to visualize and design a possible new product or service and to assess the market, business and technical merits of that concept

Organization: Your time management skills are strong and you are able to prioritize competing priorities to ensure successful outcomes.

Data analytics: You have the technical skills to review and evaluate data to find innovative opportunities and share with partners

Values matter to you. You bring your real self to work and you live our values – trust, teamwork and accountability

What CIBC Offers

At CIBC, your goals are a priority. We start with your strengths and ambitions as an employee and strive to create opportunities to tap into your potential.

We work to recognize you in meaningful, personalized ways including a competitive compensation, a banking benefit*, wellbeing support and additional offers such as employee and family assistance programs and MomentMakers, our social, points-based recognition program.

Our spaces and technological toolkit will make it simple to bring together great minds to create innovative solutions that make a difference for our clients.

*Subject to program terms and conditions

What you need to know

CIBC is committed to creating an inclusive environment where all team members and clients feel like they belong. We seek applicants with a wide range of abilities and we provide an accessible candidate experience. If you need accommodation, please contact Mailbox.careers-carrieres@cibc.com

You need to be legally eligible to work at the location(s) specified above and, where applicable, must have a valid work or study permit

We may ask you to complete an attribute-based assessment and other skills tests (such as simulation, coding, French proficiency, MS Office). Our goal for the application process is to get to know more about you, all that you have to offer, and give you the opportunity to learn more about us.

Expected End Date

2026-04-24
Job Location

Toronto-81 Bay, 32nd Floor
Employment Type

Temporary (Fixed Term)
Weekly Hours

37.5
Skills

Automation, Communication, GitHub, Microsoft Office, Problem Solving, Python (Programming Language), Software Development
`;

export async function POST(req) {
  try {
    const { question } = await req.json();           // <-- JSON payload
    if (!question) {
      return NextResponse.json({ error: "No question" }, { status: 400 });
    }

    // build resume/job‑desc prompt (module‑scope constants, as earlier)
    const prompt = [
  `Act as an interview coach. Speak warmly and conversationally, like you're coaching a friend. Keep it simple and avoid long-winded explanations.`,
  `Give your answer in bullet points that would take about 1.5 to 2 minutes to say out loud.`,
  `Vary sentence structure, use personal pronouns, and avoid technical jargon unless needed.`,
  `Q: "${question}"`,
  `If it's a behavioral or situational or background question, give a brief story using the STAR format (Situation, Task, Action, Result). End with what was learned.`,
  `If it's a technical question, explain clearly and in detail, then give a specific example `,
  `Use the resume and job description below to guide the response.`,
  `--- RESUME ---`,
  RESUME,
  `--- JOB DESCRIPTION ---`,
  JOB_DESC,
].join('\n\n');

    
    
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    const answer = chat.choices[0]?.message?.content || "";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
