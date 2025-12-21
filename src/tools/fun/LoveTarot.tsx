// src/tools/fun/LoveTarot.tsx
import React, { useMemo, useState } from "react";


// ================================
// 💘 Simple numerology-style score
// ================================
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

const sharedLetterBonus = (a: string, b: string): number =>
  Math.min(
    [...new Set(b.toLowerCase().replace(/[^a-z]/g, ""))].filter((c) =>
      a.toLowerCase().includes(c)
    ).length * 3,
    20
  );

const calculateScore = (you: string, them: string): number => {
  if (!you.trim() || !them.trim()) return 50;
  let score = 40;
  score +=
    4 *
    (10 -
      Math.abs(
        reduceToSingle(nameValue(you)) - reduceToSingle(nameValue(them))
      ));
  score += vowelAffinity(you, them);
  score += sharedLetterBonus(you, them);
  return Math.min(Math.max(Math.round(score), 5), 98);
};

type ScoreBucket = "high" | "good" | "mid" | "low" | "breakup";

const bucketFromScore = (score: number): ScoreBucket =>
  score >= 90
    ? "high"
    : score >= 70
    ? "good"
    : score >= 50
    ? "mid"
    : score >= 30
    ? "low"
    : "breakup";

// ================================
// 🎴 Tarot Card Types & Data
// ================================
type TarotCard = {
  id: string;
  title: string;
  symbol: string;
  past: string;
  present: string;
  future: string;
};

const TAROT_CARDS: TarotCard[] = [
  {
    id: "lovers",
    title: "The Lovers",
    symbol: "💞",
    past: "Past: One of you caught feelings first and pretended it was a joke. It was not a joke.",
    present:
      "Present: Mutual attraction, mild chaos, and overthinking every emoji. Certified situationship vibes.",
    future:
      "Future: Potential endgame, IF someone actually texts first without waiting 3 hours on purpose.",
  },
  {
    id: "mask",
    title: "The Mask",
    symbol: "🎭",
    past: "Past: Someone was acting ‘chill’ while secretly stalking last seen & status.",
    present:
      "Present: Feelings are hidden behind memes and dry replies. Bold of you to call this ‘just friends’.",
    future:
      "Future: Truth will come out. Either ‘I like you’ or ‘bro, we need to talk’.",
  },
  {
    id: "flame",
    title: "The Flame",
    symbol: "🔥",
    past: "Past: Instant chemistry. Brain said no, heart said yes, and here we are.",
    present:
      "Present: Sparks, flirting, and at least one very dangerous inside joke.",
    future:
      "Future: Either power couple or ‘we don’t talk anymore’ anthem. No middle ground.",
  },
  {
    id: "heartbreak",
    title: "Heartbreak",
    symbol: "💔",
    past: "Past: Someone here has been hurt before and now trusts no one. Not even themselves.",
    present:
      "Present: Tiny jealousy, overthinking, and saving screenshots ‘just in case’.",
    future:
      "Future: Heal together or trauma-bond and make Spotify very rich.",
  },
  {
    id: "star",
    title: "The Star",
    symbol: "✨",
    past: "Past: You manifested this connection accidentally while listening to sad songs.",
    present:
      "Present: Hopeful energy. You two are lowkey rooting for each other more than you admit.",
    future:
      "Future: If you keep choosing each other, this could glow up into something iconic.",
  },
  {
    id: "shadow",
    title: "The Shadow",
    symbol: "🌑",
    past: "Past: Old wounds, old ghosts, old chats you refuse to delete.",
    present:
      "Present: Overthinking every move. ‘Should I text?’ ‘Are they online?’ ‘Do they hate me?’",
    future:
      "Future: Face your fears or repeat the same story with a different name.",
  },
  {
    id: "crown",
    title: "The Crown",
    symbol: "👑",
    past: "Past: You chose yourself when others didn’t. Self-love arc unlocked.",
    present:
      "Present: You’re glowing and they definitely noticed. Deny it all you want.",
    future:
      "Future: Whether this works or not, you’re the main character. No debates.",
  },
  {
    id: "infinity",
    title: "Infinity",
    symbol: "♾️",
    past: "Past: Something about this connection feels strangely familiar. Like ‘we’ve done this before’.",
    present:
      "Present: On-off loops, repeated patterns, and déjà vu moments all over the place.",
    future:
      "Future: Break the cycle together… or keep spinning because you secretly like the drama.",
  },
  {
    id: "devil_rose",
    title: "Devil’s Rose",
    symbol: "🌹😈",
    past: "Past: Instant attraction with red flags you both lovingly ignored.",
    present:
      "Present: Spicy chemistry, questionable decisions, and ‘we’re not toxic, we’re just passionate’.",
    future:
      "Future: Could be legendary. Could be a cautionary tale. Either way, iconic.",
  },
  {
    id: "clock",
    title: "The Clock",
    symbol: "⏳",
    past: "Past: Wrong time, right person energy. Delays, pauses, almosts.",
    present:
      "Present: Timing is still weird, but the pull is real. Universe is soft-launching this.",
    future:
      "Future: Once timing clicks, things will move faster than your last overthinking spiral.",
  },
];

// ================================
// 😈 Dark Humor Flavour
// ================================
const SCORE_LINES: Record<ScoreBucket, string[]> = {
  high: [
    "This is dangerously close to soulmate territory. Don’t ruin it with dry replies.",
    "Honestly? I’d third-wheel this and be proud.",
    "98% match? I’m deleting their name from the universe before they steal you. 😒💘",
  ],
  good: [
    "Strong potential. Add food, memes, and less ego = chef’s kiss.",
    "Good match. Not perfect, but perfect is boring anyway.",
    "This is ‘we fight, we sulk, we still text goodnight’ energy.",
  ],
  mid: [
    "This could be love… or just boredom with extra steps.",
    "Certified situationship material. Handle with WiFi and patience.",
    "Not bad, not iconic. Needs effort, not just reels.",
  ],
  low: [
    "Your chemistry is giving ‘lab partners only’. 💀",
    "Even Google Maps would struggle to find the connection here.",
    "This is ‘just friends who flirt at 2AM’ energy.",
  ],
  breakup: [
    "Run. Like, emotionally sprint. I’ll hold your phone.",
    "The universe said ‘nope’. But hey, you tried. 😌",
    "This ship is a beautiful disaster. Screenshot, archive, move on.",
  ],
};

const DARK_CTA_LINES = [
  "Shuffle again and cause more emotional damage 🔁",
  "New reading, new delusion. Let’s go again 😈",
  "Next destiny, please. I live off your drama 💋",
];

const randomFrom = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// ================================
// 🧠 Component
// ================================

type Step = "names" | "deck" | "result";

const LoveTarot: React.FC = () => {
  const [step, setStep] = useState<Step>("names");
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loveScore = useMemo(
    () => calculateScore(yourName, partnerName),
    [yourName, partnerName]
  );

  const scoreBucket = useMemo(
    () => bucketFromScore(loveScore),
    [loveScore]
  );

  const selectedCards: TarotCard[] = useMemo(
    () => TAROT_CARDS.filter((c) => selectedIds.includes(c.id)),
    [selectedIds]
  );

  const canStart = yourName.trim().length > 0 && partnerName.trim().length > 0;

  const handleCardClick = (id: string) => {
    if (step !== "deck") return;
    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= 3) return;

    setSelectedIds((prev) => [...prev, id]);


    // Auto-jump to result once 3 selected
    if (selectedIds.length + 1 === 3) {
      setTimeout(() => {
        setStep("result");
      }, 400);
    }
  };

  const handleRestart = () => {
    setSelectedIds([]);
    setStep("deck");
  };

  const handleFreshReading = () => {
    setYourName("");
    setPartnerName("");
    setSelectedIds([]);
    setStep("names");
  };

  return (
  <div className="page-wrapper">
    <main className="main-layout">
      <section className="assistant-card tarot-shell">
        {/* GLOBAL HEADER — DO NOT REMOVE */}
        <div className="assistant-header tarot-header">
          <div className="status-dot" />
          <span className="assistant-name">Destiny Deck Engine</span>
          <span className="assistant-tag">
            Openroot — Tarot Module
          </span>

          {/* Tarot decorative layer */}
          <div className="tarot-sigil-orbit">
            <div className="tarot-sigil-core">✧</div>
            <div className="tarot-orbit tarot-orbit-1" />
            <div className="tarot-orbit tarot-orbit-2" />
            <div className="tarot-orbit tarot-orbit-3" />
          </div>
        </div>

        {/* MAIN CONTENT — SAME AS LOVE CALCULATOR */}
        <div className="chat-window tarot-window">
          {/* STEP 1 — NAMES */}
          {step === "names" && (
            <div className="tarot-names-panel">
              <p className="tarot-intro-text">
                Type your names and I’ll shuffle the universe a little. 😏
              </p>

              <div className="tarot-name-row">
                <label className="tarot-label">
                  Your name
                  <input
                    className="assistant-input tarot-input"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    placeholder="Main character ✨"
                  />
                </label>

                <label className="tarot-label">
                  Their name
                  <input
                    className="assistant-input tarot-input"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Person ruining your sleep 😴"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 2 — DECK */}
          {step === "deck" && (
            <div className="tarot-deck-panel">
              <p className="tarot-intro-text">
                Pick <strong>3 cards</strong> to reveal your
                Past / Present / Future love chaos.
              </p>

              <div className="tarot-deck-grid">
                {TAROT_CARDS.map((card) => {
                  const isSelected = selectedIds.includes(card.id);
                  const index = selectedIds.indexOf(card.id);
                  const slotLabel =
                    index === 0
                      ? "Past"
                      : index === 1
                      ? "Present"
                      : index === 2
                      ? "Future"
                      : "";

                  return (
                    <button
                      key={card.id}
                      className={
                        "tarot-card" +
                        (isSelected ? " tarot-card-selected" : "") +
                        (selectedIds.length >= 3 && !isSelected
                          ? " tarot-card-disabled"
                          : "")
                      }
                      onClick={() => handleCardClick(card.id)}
                    >
                      <div className="tarot-card-inner">
                        <div className="tarot-card-front">
                          <span className="tarot-card-sigil">✧</span>
                          <span className="tarot-card-back-text">
                            Laveria Arcana
                          </span>
                        </div>
                        <div className="tarot-card-back">
                          <div className="tarot-card-symbol">
                            {card.symbol}
                          </div>
                          <div className="tarot-card-title">
                            {card.title}
                          </div>
                          {slotLabel && (
                            <div className="tarot-card-slot-label">
                              {slotLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedIds.length > 0 && selectedIds.length < 3 && (
                <p className="tarot-hint-text">
                  You’ve chosen <strong>{selectedIds.length}</strong>{" "}
                  card{selectedIds.length > 1 && "s"}. Pick{" "}
                  <strong>{3 - selectedIds.length}</strong> more…
                </p>
              )}
            </div>
          )}

          {/* STEP 3 — RESULT */}
          {step === "result" && selectedCards.length === 3 && (
            <div className="tarot-result-panel">
              <p className="tarot-intro-text">
                Okay {yourName || "you"} and {partnerName || "them"}…
                here’s what the cards whispered about your love story:
              </p>

              <div className="tarot-result-grid">
                {selectedCards.map((card, i) => (
                  <div key={card.id} className="tarot-result-card">
                    <div className="tarot-result-tag">
                      {i === 0 ? "Past" : i === 1 ? "Present" : "Future"}
                    </div>
                    <div className="tarot-result-header">
                      <span>{card.symbol}</span>
                      <span>{card.title}</span>
                    </div>
                    <p>
                      {i === 0
                        ? card.past
                        : i === 1
                        ? card.present
                        : card.future}
                    </p>
                  </div>
                ))}
              </div>

              <div className="tarot-score-snark">
                <div className="tarot-score-line">
                  Love Score for this timeline:
                  <strong> {loveScore}%</strong>
                </div>
                <div className="tarot-score-comment">
                  {randomFrom(SCORE_LINES[scoreBucket])}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA — SAME SLOT AS LOVE CALCULATOR */}
        <div className="input-area">
          {step === "names" && (
            <button
              className="primary-btn tarot-start-btn"
              disabled={!canStart}
              onClick={() => canStart && setStep("deck")}
            >
              Shuffle the deck & reveal fate 🔮
            </button>
          )}

          {step === "deck" && selectedIds.length === 3 && (
            <button
              className="primary-btn tarot-start-btn"
              onClick={() => setStep("result")}
            >
              Reveal your messy destiny 😈
            </button>
          )}

          {step === "result" && (
            <div className="tarot-actions">
              <button className="primary-btn" onClick={handleRestart}>
                Shuffle again with same names 🔁
              </button>
              <button
                className="primary-btn tarot-secondary-btn"
                onClick={handleFreshReading}
              >
                New names, new destiny 😈
              </button>
            </div>
          )}
        </div>
      </section>

      {/* INFO CARD — UNCHANGED */}
      <aside className="info-card">
        <h2>Destiny Deck Engine</h2>
        <ul>
          <li>Pick any 3 cards from a 10-card chaos deck</li>
          <li>Past / Present / Future love storyline</li>
          <li>Dark humor + drama queen narration</li>
          <li>Numerology-flavoured love score overlay</li>
        </ul>
        <p className="info-note">
          For entertainment only. Do not use for actual breakups,
          proposals, or texting your ex. Probably. 😌
        </p>
      </aside>
    </main>
  </div>
);
};
export default LoveTarot;
