"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth} from "../firebase/config";
import { signOut } from "firebase/auth";

export default function Home() {
  const [question, setQuestion] = useState("");       // what you record / type
  const [jobDesc, setJobDesc] = useState("");
  const [answer, setAnswer] = useState("");           // AI’s answer
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
    const [user,userLoading] = useAuthState(auth);
  
    const router = useRouter();
  useEffect(() => {
      const userSess = sessionStorage.getItem("user");
      if (!userLoading && !user && !userSess) {
        router.push("/log-in");
        return;
      }
    }, [user, userLoading, router]);

  // 1) Set up Web Speech API once
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return console.warn("No SpeechRecognition");
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (ev) => {
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript + " ";
      }
      if (final) setQuestion((q) => q + final);
    };
    rec.onerror = (e) => console.error(e);
    recognitionRef.current = rec;
  }, []);

  // 2) Start / stop speech recognition
  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isRecording) rec.start();
    else {rec.stop(); fetchAnswer();};
    return () => rec.stop();
  }, [isRecording]);

  // 3) Send question to /api/cheat
  const fetchAnswer = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), jobDesc}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setAnswer(data.answer);
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-white text-black">
      <h1 className="text-3xl font-bold mb-6">InterviewHelp</h1>
      <textarea
          className="border border-black rounded-md p-3 m-3 w-72 min-h-[12rem] resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste the job description here*"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          required
        ></textarea>
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-full text-white ${
            isRecording ? "bg-red-600" : "bg-green-600"
          }`}
          onClick={() => setIsRecording((r) => !r)}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        <button
          className="px-4 py-2 rounded-full bg-gray-600 text-white"
          onClick={() => {setQuestion(""); setAnswer("")}}
          disabled={!question.trim()}
        >
          Reset Question
        </button>
      </div>

      <button
        className="mb-6 px-6 py-3 bg-black text-white rounded-full disabled:opacity-50"
        
        disabled={loading || !question.trim()}
      >
        {loading ? "Thinking…" : "Generate Answer"}
      </button>

    

      {question && (
        <div className="w-full max-w-xl bg-slate-100 p-4 rounded-lg shadow mb-4">
          <h2 className="font-semibold mb-2">Question:</h2>
          <p className="whitespace-pre-wrap">{question}</p>
        </div>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {answer && (
        <div className="w-full max-w-xl bg-emerald-100 p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Answer:</h2>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
      <button
                
                 onClick={() => {
                            signOut(auth);
                            sessionStorage.removeItem("user");
                            router.push("/log-in");
                          }}
                className="bg-green-600 text-white px-4 py-2 mr-2 rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Log out
              </button>
    </div>
  );
}
