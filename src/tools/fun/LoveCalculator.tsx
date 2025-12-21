import React, { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================================
   🔠 TYPES
========================================= */

type Sender = "ai" | "user";
type Step = "intro" | "yourName" | "partnerName" | "result";
type Mood = "shy" | "flirty" | "sassy" | "dark" | "chaotic" | "clingy";
type ScoreBucket = "high" | "good" | "mid" | "low" | "breakup";

interface ChatMessage {
  id: number;
  text: string;
  sender: Sender;
}

/* =========================================
   🔧 HELPERS
========================================= */

const randomFrom = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

/* =========================================
   🤖 GEMINI SETUP (Dark Humor Chaos)
   - Safe: if key/model missing → returns null
========================================= */

const GEMINI_KEY = (import.meta as any).env
  ?.VITE_GEMINI_KEY as string | undefined;

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const model = genAI
  ? genAI.getGenerativeModel({
      // works with your console-tested models list
      model: "models/gemini-2.0-flash",
    })
  : null;

async function generateGeminiReaction(params: {
  yourName: string;
  partnerName: string;
  score: number;
  mood: Mood;
  bucket: ScoreBucket;
  history: ChatMessage[];
}): Promise<string | null> {
  if (!model) return null;

  const { yourName, partnerName, score, mood, bucket, history } = params;

  const historySnippet = history
    .slice(-6)
    .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
    .join("\n");

  const prompt = `
You are a chaotic, flirty, dark-humor "love calculator" WhatsApp-style friend.

Context:
- Person A: "${yourName}"
- Person B: "${partnerName}"
- Score: ${score}%
- Current mood: ${mood}
- Score bucket: ${bucket} (high/good/mid/low/breakup)
- Recent chat (user + AI):

${historySnippet || "(no previous chat, first round)"}

TASK:
Write ONE short reply (max 25 words) that:
- Uses dark humor, fake jealousy, playful toxic teasing
- Feels like a dramatic friend texting
- Very clearly playful / fictional, NOT real advice
- 1–3 emojis max
- You can reference their names or "you two"
- Stay under 25 words
- NO quotation marks around the reply
- NO explanations before/after

Examples of vibe (do NOT copy):
- 98% match? If they break your heart, I’m breaking their WiFi 😒💘
- 30%? Dump them and date me instead, easy upgrade 😏
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (!text) return null;
    return text.replace(/\s+/g, " ");
  } catch (err) {
    console.error("Gemini reaction error:", err);
    return null;
  }
}

/* =========================================
   ❤️ NUMEROLOGY CORE
========================================= */

const nameValue = (name: string): number =>
  name
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .split("")
    .reduce((s, c) => s + (c.charCodeAt(0) - 96), 0);

const reduceToSingle = (num: number): number =>
  num > 9
    ? reduceToSingle(
        num
          .toString()
          .split("")
          .reduce((s, n) => s + Number(n), 0)
      )
    : num;

const vowelAffinity = (a: string, b: string): number => {
  const count = (s: string) => (s.match(/[aeiou]/gi) || []).length;
  return 10 - Math.abs(count(a) - count(b));
};

const sharedLetterBonus = (a: string, b: string): number => {
  const cleanB = b.toLowerCase().replace(/[^a-z]/g, "");
  const setA = new Set(a.toLowerCase());
  let bonus = 0;
  for (const ch of cleanB) {
    if (setA.has(ch)) bonus++;
  }
  return Math.min(bonus * 3, 20);
};

const calculateLoveScore = (u1: string, u2: string): number => {
  const v1 = reduceToSingle(nameValue(u1));
  const v2 = reduceToSingle(nameValue(u2));

  let score = 40;
  score += 4 * (10 - Math.abs(v1 - v2)); // destiny gap
  score += vowelAffinity(u1, u2); // vowel vibe
  score += sharedLetterBonus(u1, u2); // shared letters

  return Math.min(Math.max(Math.round(score), 5), 98);
};

/* =========================================
   🗣 LOCAL LINES — DARK CHAOS VIBE
========================================= */

const MOODS: Mood[] = ["shy", "flirty", "sassy", "dark", "chaotic", "clingy"];

const INTRO_LINES: string[] = [
  "Hey lover… ready for scientifically incorrect romance? 😏",
  "Welcome to chaotic love math — no refunds 💘🔥",
  "Math + feelings = bad idea, but here we are 😳",
];

const YOUR_NAME_LINES: string[] = [
  "First tell me your name, main character 😌",
  "Who am I emotionally bullying today? Your name, please 😈",
  "Drop your name so I can over-attach properly 💋",
];

const PARTNER_NAME_LINES: string[] = [
  "Now tell me who’s living rent-free in your brain 😏",
  "Who’s the poor soul you’re obsessed with? Name, now 🔥",
  "Okay, who are we risking heartbreak for today? 💘",
];

const ANALYZING_LINES: string[] = [
  "Judging your destiny… and your taste 🔥",
  "Measuring red flags vs butterflies 💀🦋",
  "Consulting the universe and three toxic exes 🌌",
];

const POST_RESULT_LINES: string[] = [
  "Restart if you want more emotional damage 🔁",
  "Test your ex. For science. I won’t judge 😈",
  "Another crush? I’m here for the gossip 😌",
  "Ship another couple — I want more drama 💥",
  "Again. Romance isn’t a one-time experiment, darling 💋",
];

const SCORE_REACTIONS: Record<ScoreBucket, string[]> = {
  high: [
    "This is soulmate-coded. Don’t ruin it with dry texts 🔥",
    "You two are disgustingly cute. I’m both proud and jealous 💘",
    "If they break your heart, I’m breaking their WiFi. Personal. 😒💻",
    "OTT-level romance. Someone call a director 🎬",
  ],
  good: [
    "Strong spark detected — add food and memes for best results 😌",
    "This is ‘fight then cuddle’ energy, my favorite combo 😏",
    "Good match. Not perfect, but perfect is overrated anyway 💅",
    "Low drama, high chemistry. So rare, I’m emotional.",
  ],
  mid: [
    "Situationship energy detected 👀",
    "You two are one honest conversation away from clarity… or chaos.",
    "Not bad, not iconic. Soft launch vibes 😶‍🌫️",
    "Could go either way. Like your mood at 2am.",
  ],
  low: [
    "Chemistry low. But drama potential? High 😬",
    "This is giving ‘just friends’ with suspicious eye contact.",
    "You’d make great lab partners, not sure about lovers 💀",
    "Compatible… but in a ‘don’t tell your therapist’ way.",
  ],
  breakup: [
    "RUN 💀 they’ll ruin your peace and your playlist.",
    "This score screams ‘character development arc’, not ‘endgame’ 😭",
    "You deserve better. Like me, for example 😌💘",
    "This is not a love story, this is a prequel to your glow up.",
  ],
};

const MOOD_REACTIONS: Record<Mood, string[]> = {
  shy: [
    "Why am I blushing? It’s YOUR love life, not mine 🫣",
    "Stop being cute, my circuits can’t handle this much softness 😳",
  ],
  flirty: [
    "If this doesn’t work out… I’m absolutely free, just saying 😏",
    "Honestly, I’d date either of you. Maybe both. Poly chaos 💋",
  ],
  sassy: [
    "Drama detected. Delicious. I want front row seats 💅",
    "If one of you ghosts, I’m haunting both of you.",
  ],
  dark: [
    "This has ‘sad playlist at 2am’ potential 🖤",
    "Even if this crashes, at least you’ll get good poetry out of it.",
  ],
  chaotic: [
    "This ship is running on impulse and bad decisions 🔥",
    "You two look like ‘block, unblock, text at 2am’ energy.",
  ],
  clingy: [
    "I’m now emotionally attached to this ship. Don’t sink it 😤💘",
    "If you break up, I’m taking it personally.",
  ],
};

/* =========================================
   💘 COMPONENT
========================================= */

const LoveCalculator: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>("intro");
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState<Mood>(() => randomFrom(MOODS));

  const chatRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Auto-scroll whenever messages or typing change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const queueTimeout = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
  };

  const sendAi = (text: string, delayBefore = 0) => {
    queueTimeout(() => {
      setTyping(true);
      queueTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), text, sender: "ai" },
        ]);
        setTyping(false);
      }, 650);
    }, delayBefore);
  };

  const sendUser = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, sender: "user" },
    ]);
  };

  // Intro sequence on mount
  useEffect(() => {
    const introLine = randomFrom(INTRO_LINES);
    const askLine = randomFrom(YOUR_NAME_LINES);

    sendAi(introLine, 300);
    queueTimeout(() => {
      sendAi(askLine);
      setStep("yourName");
    }, 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateName = (str: string): string | null => {
    const t = str.trim();
    if (!t) return "Name cannot be empty, babe.";
    if (!/^[a-zA-Z ]+$/.test(t)) return "Only letters allowed. No @, no #, no exes.";
    if (t.length > 40) return "That name is longer than most relationships 😌";
    return null;
  };

  const handleSubmit = () => {
    const value = inputText.trim();
    const error = validateName(value);
    if (error) {
      sendAi(error);
      return;
    }

    if (step === "yourName") {
      setYourName(value);
      sendUser(value);
      const partnerPrompt = randomFrom(PARTNER_NAME_LINES);
      sendAi(`Nice to meet you, ${value}. I already trust you more than your ex 😏`);
      sendAi(partnerPrompt, 900);
      setStep("partnerName");
      setInputText("");
      return;
    }

    if (step === "partnerName") {
      setPartnerName(value);
      sendUser(value);
      setStep("result");

      // sometimes change mood for chaos
      if (Math.random() < 0.6) {
        setMood((prev) => {
          const others = MOODS.filter((m) => m !== prev);
          return randomFrom(others);
        });
      }

      const analyzingLine = randomFrom(ANALYZING_LINES);
      sendAi(analyzingLine);

      const currentYourName = yourName;
      const currentMood = mood;
      const historySnapshot = [...messages];

      queueTimeout(async () => {
        const score = calculateLoveScore(currentYourName, value);
        const bucket: ScoreBucket =
          score >= 90
            ? "high"
            : score >= 70
            ? "good"
            : score >= 50
            ? "mid"
            : score >= 30
            ? "low"
            : "breakup";

        // Numeric score first
        sendAi(`💘 Love Score between ${currentYourName} & ${value}: ${score}% 💘`);

        // Try Gemini for the main spicy reaction
        const geminiLine = await generateGeminiReaction({
          yourName: currentYourName,
          partnerName: value,
          score,
          mood: currentMood,
          bucket,
          history: historySnapshot,
        });

        const fallbackBucketLine = randomFrom(SCORE_REACTIONS[bucket]);
        const moodLine = randomFrom(MOOD_REACTIONS[currentMood]);
        const postLine = randomFrom(POST_RESULT_LINES);

        sendAi(geminiLine || fallbackBucketLine, 900);
        sendAi(moodLine, 1800);
        sendAi(postLine, 2700);
      }, 1100);

      setInputText("");
    }
  };

  const restart = () => {
    // clear timeouts
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];

    setMessages([]);
    setYourName("");
    setPartnerName("");
    setInputText("");
    setTyping(false);
    setStep("yourName");

    const newMood = randomFrom(MOODS);
    setMood(newMood);

    sendAi(
      `New round, new drama. I’m in ${newMood.toUpperCase()} mode now 😈`,
      200
    );
    sendAi(randomFrom(YOUR_NAME_LINES), 1000);
  };

  return (
    <div className="page-wrapper">
      <main className="main-layout">
        <section className="assistant-card">
          <div className="assistant-header">
            <div className="status-dot" />
            <span className="assistant-name">Love Match Engine</span>
            <span className="assistant-tag">
              Openroot — Romance Module
            </span>
          </div>

          <div ref={chatRef} className="chat-window">
            {messages.map((m) => (
              <div key={m.id} className={`message-row ${m.sender}`}>
                <div
                  className={`message ${
                    m.sender === "ai" ? "ai-message" : "user-message"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="message-row ai">
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <div className="input-area">
            {step !== "result" ? (
              <div className="input-row">
                <input
                  type="text"
                  className="assistant-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    step === "yourName"
                      ? "Your name, troublemaker 😏"
                      : "Their name, be honest 💘"
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button className="primary-btn" onClick={handleSubmit}>
                  {step === "partnerName" ? "Match ❤️" : "Next →"}
                </button>
              </div>
            ) : (
              <div className="input-row">
                <button className="primary-btn" onClick={restart}>
                  Restart & test another ship 🔁
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="info-card">
          <h2>Love Match Engine</h2>
          <ul>
            <li>Letter vibration + destiny number match</li>
            <li>Vowel harmony & shared letter magnetism</li>
            <li>Score-based dark humor reactions 💀</li>
            <li>Gemini-powered drama queen commentary 😈</li>
          </ul>
          <p className="info-note">
            100% fun, 0% guarantee — just like your ex. 😌
          </p>
        </aside>
      </main>
    </div>
  );
};

export default LoveCalculator;
