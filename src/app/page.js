// FRONTEND - uses client
"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [jobDesc, setJobDesc] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiInfo, setAiInfo] = useState("");
  const [soundOn, setSoundOn] = useState(true);

  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Google US English") ||
        voice.name.includes("Samantha")
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    synth.cancel();
    synth.speak(utterance);
  };

  const fetchAI = async () => {
    setLoading(true);
    setError("");
    setAiInfo("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDesc, apiKey }),
      });
      const data = await res.json();
      if (res.ok) setAiInfo(data.message);
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Failed to load interview question.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (soundOn && aiInfo) speak(aiInfo);
  }, [aiInfo, soundOn]);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 sm:p-20 font-sans gap-16 bg-white text-black">
      <main className="flex flex-col gap-8 items-center w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center">InterviewHelp</h1>

        <input
          type="password"
          placeholder="Paste your OpenAI API key here"
          className="border border-black rounded-md p-3 w-full shadow-sm"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required //changed
        />

        <textarea
          className="border border-black rounded-md p-3 w-full min-h-[12rem] resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste the job description here..."
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        ></textarea>

        <button
          className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
          onClick={fetchAI}
          disabled={loading || !jobDesc.trim() || !apiKey.trim()}
        >
          {loading ? "Generating..." : "Generate Interview Question!"}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {aiInfo && (
          <div className="mt-4 border border-gray-300 p-4 rounded-md bg-gray-50 w-full relative">
            <h2 className="font-semibold mb-2 flex justify-between items-center">
              Suggested Question:
              <button onClick={() => setSoundOn(!soundOn)} title="Toggle Sound">
                <img
                  src={soundOn ? "/sound-on.png" : "/sound-off.png"}
                  alt={soundOn ? "Sound On" : "Sound Off"}
                  className="w-6 h-6"
                />
              </button>
            </h2>
            <p className="text-gray-800 whitespace-pre-line">{aiInfo}</p>
          </div>
        )}
      </main>
    </div>
  );
}
