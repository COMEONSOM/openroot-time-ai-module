import React, { useRef, useEffect } from "react";

const LoveCalculator: React.FC = () => {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  const scroll = () => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  const askForNames = () => {
    if (!inputRef.current) return;
    inputRef.current.innerHTML = `
      <div class="input-label">Enter your name 💌</div>
      <div class="input-row">
        <input type="text" class="assistant-input" placeholder="Your Name" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const nameInput = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    btn.onclick = () => {
      const u1 = nameInput.value.trim();

      if (!u1) {
        nameInput.classList.add("input-error");
        return;
      }

      addMsg(u1, "user");
      askPartnerName(u1);
    };

    setTimeout(() => nameInput.focus(), 50);
  };

  const askPartnerName = (u1: string) => {
    if (!inputRef.current) return;
    inputRef.current.innerHTML = `
      <div class="input-label">Your partner's name 💞</div>
      <div class="input-row">
        <input type="text" class="assistant-input" placeholder="Partner Name" />
        <button class="primary-btn">Calculate ❤️</button>
      </div>
    `;

    const nameInput = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    btn.onclick = () => {
      const u2 = nameInput.value.trim();
      if (!u2) {
        nameInput.classList.add("input-error");
        return;
      }

      addMsg(u2, "user");
      calculateLove(u1, u2);
    };

    setTimeout(() => nameInput.focus(), 50);
  };

  const addMsg = (text: string, sender = "ai") => {
    if (!chatRef.current) return;
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "ai" ? "ai-message" : "user-message"}`;
    bubble.textContent = text;

    row.appendChild(bubble);
    chatRef.current.appendChild(row);
    scroll();
  };

  const calculateLove = (u1: string, u2: string) => {
    const score =
      Math.floor(
        ((u1.length * 7 + u2.length * 9) % 100) +
          (Math.random() * 10)
      ) % 100;

    setTimeout(() => {
      addMsg(`❤️ Love score between ${u1} and ${u2}: ${score}% ❤️`);
      showRestart();
    }, 700);
  };

  const showRestart = () => {
    if (!inputRef.current) return;
    inputRef.current.innerHTML = `
      <div class="input-row">
        <button class="primary-btn">Try again 🔁</button>
      </div>
    `;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;
    btn.onclick = () => {
      chatRef.current!.innerHTML = "";
      askForNames();
    };
  };

  useEffect(() => {
    setTimeout(() => {
      addMsg("Hey! Welcome to Openroot ❤️ Love Calculator!");
      askForNames();
    }, 500);
  }, []);

  return (
    <div className="page-wrapper">
      <main className="main-layout">
        <section className="assistant-card">
          <div className="assistant-header">
            <div className="status-dot" />
            <span className="assistant-name">Love Match Engine</span>
            <span className="assistant-tag">Openroot — Entertainment Module</span>
          </div>
          <div ref={chatRef} className="chat-window" />
          <div ref={inputRef} className="input-area" />
        </section>

        <aside className="info-card">
          <h2>Just for Fun 💘</h2>
          <ul>
            <li>Enter both names</li>
            <li>See your love match score</li>
            <li>Laugh & repeat 😄</li>
          </ul>
        </aside>
      </main>
    </div>
  );
};

export default LoveCalculator;
