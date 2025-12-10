import React, { useRef, useEffect } from "react";

type Mode = "sip" | "lump" | null;

interface InvestmentData {
  mode: Mode;
  amount: number | null;
  years: number | null;
  rate: number | null;
  inflation: number | null;
}

const INITIAL_DATA: InvestmentData = {
  mode: null,
  amount: null,
  years: null,
  rate: null,
  inflation: null,
};

const InvestmentGrowthAI: React.FC = () => {
  // DOM refs
  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data refs
  const dataRef = useRef<InvestmentData>({ ...INITIAL_DATA });
  const invalidAttemptsRef = useRef({
    amount: 0,
    years: 0,
    rate: 0,
    inflation: 0,
  });

  // --------- helpers ---------
  const scrollToBottom = () => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const clearInlineAlert = () => {
    if (!inputRef.current) return;
    const alert = inputRef.current.querySelector(".inline-alert");
    if (alert) alert.remove();
  };

  const showInlineAlert = (text: string) => {
    clearInlineAlert();
    if (!inputRef.current) return;
    const div = document.createElement("div");
    div.className = "inline-alert";
    div.textContent = text;
    inputRef.current.appendChild(div);
  };

  const addMsg = (txt: string, sender: "ai" | "user" = "ai", isHTML = false) => {
    if (!chatRef.current) return;

    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className =
      "message " + (sender === "ai" ? "ai-message" : "user-message");

    if (isHTML) bubble.innerHTML = txt;
    else bubble.textContent = txt;

    row.appendChild(bubble);
    chatRef.current.appendChild(row);
    scrollToBottom();
  };

  const bot = (txt: string, cb?: () => void) => {
    if (!chatRef.current) return;

    const old = chatRef.current.querySelector("#typing");
    if (old) old.remove();

    const row = document.createElement("div");
    row.id = "typing";
    row.className = "message-row ai";
    row.innerHTML = `
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    chatRef.current.appendChild(row);
    scrollToBottom();

    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      const still = chatRef.current?.querySelector("#typing");
      if (still) still.remove();
      addMsg(txt, "ai");
      cb && cb();
    }, 650);
  };

  const isSuspiciousAmount = (amount: number) => amount > 50_000_000;
  const isSuspiciousYears = (years: number) => years > 60;
  const isSuspiciousRate = (rate: number) => rate > 30;
  const isSuspiciousInflation = (i: number) => i > 25;

  // --------- mode select ---------
  const renderModeSelect = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Pick your style:</div>
      <div class="input-row">
        <button class="primary-btn">SIP (Monthly)</button>
        <button class="primary-btn" style="background:#fb923c">Lump Sum</button>
      </div>
    `;

    const [sipBtn, lumpBtn] = inputRef.current.querySelectorAll("button") as NodeListOf<HTMLButtonElement>;

    sipBtn.onclick = () => {
      dataRef.current.mode = "sip";
      addMsg("SIP (monthly)", "user");
      bot("Yay! SIP is a wealth-building superpower 😄✨", () => {
        bot("You invest small, market grows big over time 📈", () => {
          bot("How much will you invest every month?", () => renderAmount());
        });
      });
    };

    lumpBtn.onclick = () => {
      dataRef.current.mode = "lump";
      addMsg("Lump Sum", "user");
      bot("Nice! One solid move up front 💼🔥", () => {
        bot("We’ll see how that grows if you stay patient.", () => {
          bot("How much do you plan to invest once?", () => renderAmount());
        });
      });
    };
  };

  // --------- amount ---------
  const renderAmount = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    const isSip = dataRef.current.mode === "sip";
    inputRef.current.innerHTML = `
      <div class="input-label">Enter amount:</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="${
          isSip ? "Monthly SIP amount (₹)" : "Lump sum amount (₹)"
        }"/>
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const suggestionRow = document.createElement("div");
    suggestionRow.className = "choice-row";
    const suggestions = isSip ? [1000, 2000, 5000, 10000] : [25000, 50000, 100000, 200000];

    suggestions.forEach((amt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = `₹${amt.toLocaleString("en-IN")}`;
      b.onclick = () => {
        input.value = String(amt);
        onSubmit();
      };
      suggestionRow.appendChild(b);
    });
    inputRef.current.appendChild(suggestionRow);

    const onSubmit = () => {
      const raw = String(input.value || "").trim();
      const amount = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(amount) || amount <= 0 || amount > 1_000_000_000;
      if (invalid) {
        invalidAttemptsRef.current.amount += 1;
        input.classList.add("input-error");
        invalidAttemptsRef.current.amount >= 3
          ? (showInlineAlert("Try a realistic positive amount. Ex: 2000, 5000, 25000."),
            bot("I just need a valid amount in rupees to continue 😊"))
          : showInlineAlert("That doesn’t look right. Try 2000, 5000, 10000…");
        return;
      }

      if (isSuspiciousAmount(amount)) {
        input.classList.add("input-error");
        showInlineAlert("Whoa, that’s a huge number. Please double-check the zeros.");
        bot("That’s a big ticket. Re-check once and then re-enter if correct 👀");
        return;
      }

      invalidAttemptsRef.current.amount = 0;
      dataRef.current.amount = amount;
      addMsg(`₹${amount.toLocaleString("en-IN")}`, "user");

      bot("Nice. Consistency beats timing in the long run 💪", () => {
        bot("Next: for how many years will you stay invested?", () => renderYears());
      });
    };

    btn.onclick = onSubmit;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    });
    setTimeout(() => input.focus(), 80);
  };

  // --------- years ---------
  const renderYears = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Duration (in years):</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 5, 10, 15"/>
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const suggestionRow = document.createElement("div");
    suggestionRow.className = "choice-row";
    [3, 5, 10, 15].forEach((yr) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = `${yr} yrs`;
      b.onclick = () => {
        input.value = String(yr);
        onSubmit();
      };
      suggestionRow.appendChild(b);
    });
    inputRef.current.appendChild(suggestionRow);

    const onSubmit = () => {
      const raw = String(input.value || "").trim();
      const years = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(years) || years <= 0 || years > 100;
      if (invalid) {
        invalidAttemptsRef.current.years += 1;
        input.classList.add("input-error");
        invalidAttemptsRef.current.years >= 3
          ? (showInlineAlert("Use a valid year count. Ex: 5, 10, 20."),
            bot("Give me a realistic duration like 5, 10 or 20 years 😌"))
          : showInlineAlert("Try something like 5, 10 or 15 years.");
        return;
      }

      if (isSuspiciousYears(years)) {
        input.classList.add("input-error");
        showInlineAlert("That’s a very long period. Just make sure this is intentional.");
        bot("Super long horizon there 😅 Re-enter to confirm or adjust.");
        return;
      }

      invalidAttemptsRef.current.years = 0;
      dataRef.current.years = years;
      addMsg(`${years} years`, "user");

      bot("Love the long-term mindset 🔥", () => {
        bot("Now tell me your expected annual return % (like 10, 12 or 15).", () => renderRate());
      });
    };

    btn.onclick = onSubmit;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    });
    setTimeout(() => input.focus(), 80);
  };

  // --------- rate ---------
  const renderRate = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Expected return (% per year):</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 10, 12, 15"/>
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const suggestionRow = document.createElement("div");
    suggestionRow.className = "choice-row";
    [8, 10, 12, 15].forEach((rt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = `${rt}%`;
      b.onclick = () => {
        input.value = String(rt);
        onSubmit();
      };
      suggestionRow.appendChild(b);
    });
    inputRef.current.appendChild(suggestionRow);

    const onSubmit = () => {
      const raw = String(input.value || "").trim();
      const rate = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(rate) || rate <= 0 || rate > 100;
      if (invalid) {
        invalidAttemptsRef.current.rate += 1;
        input.classList.add("input-error");
        invalidAttemptsRef.current.rate >= 3
          ? (showInlineAlert("Use a valid % like 8, 10, 12 or 15."),
            bot("I just need a realistic return % like 10 or 12 📈"))
          : showInlineAlert("That doesn’t look right. Try 8, 10, 12 or 15.");
        return;
      }

      if (isSuspiciousRate(rate)) {
        input.classList.add("input-error");
        showInlineAlert("This looks very aggressive. Make sure you understand the risk.");
        bot("That return is quite high vs normal markets. Re-check before using it 😅");
        return;
      }

      invalidAttemptsRef.current.rate = 0;
      dataRef.current.rate = rate;
      addMsg(`${rate}% p.a.`, "user");

      bot("Cool, got your return assumption ✅", () => {
        bot(
          "Do you want me to also adjust this for inflation? (shows value in today’s money)",
          () => renderInflationAsk()
        );
      });
    };

    btn.onclick = onSubmit;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    });
    setTimeout(() => input.focus(), 80);
  };

  // --------- inflation yes/no ---------
  const renderInflationAsk = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Include inflation?</div>
      <div class="input-row">
        <button class="primary-btn">Yes, include it</button>
        <button class="primary-btn" style="background:#fb923c">No, skip</button>
      </div>
    `;

    const [yesBtn, noBtn] = inputRef.current.querySelectorAll("button") as NodeListOf<HTMLButtonElement>;

    yesBtn.onclick = () => {
      addMsg("Include inflation", "user");
      bot("Smart, that’s the real-world view 🌍", () => {
        bot("What inflation % do you want to assume? (many use 4–6%)", () =>
          renderInflationValue()
        );
      });
    };

    noBtn.onclick = () => {
      addMsg("Skip inflation", "user");
      dataRef.current.inflation = 0;
      calculateResult();
    };
  };

  // --------- inflation value ---------
  const renderInflationValue = () => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Inflation (% per year):</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 4, 5, 6"/>
        <button class="primary-btn">Calculate →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const suggestionRow = document.createElement("div");
    suggestionRow.className = "choice-row";
    [4, 5, 6].forEach((inf) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn";
      b.textContent = `${inf}%`;
      b.onclick = () => {
        input.value = String(inf);
        onSubmit();
      };
      suggestionRow.appendChild(b);
    });
    inputRef.current.appendChild(suggestionRow);

    const onSubmit = () => {
      const raw = String(input.value || "").trim();
      const inf = Number(raw);
      input.classList.remove("input-error");

      const invalid = raw === "" || Number.isNaN(inf) || inf < 0 || inf > 40;
      if (invalid) {
        invalidAttemptsRef.current.inflation += 1;
        input.classList.add("input-error");
        invalidAttemptsRef.current.inflation >= 3
          ? (showInlineAlert("Try a realistic inflation, like 4, 5 or 6."),
            bot("Most long-term plans use around 4–6% inflation 😌"))
          : showInlineAlert("That doesn’t look valid. Try 4, 5 or 6.");
        return;
      }

      if (isSuspiciousInflation(inf)) {
        input.classList.add("input-error");
        showInlineAlert("That’s very high inflation. Please double-check your input.");
        bot("Extremely high inflation is rare for long periods. Only use this if you’re stress-testing 🧪");
        return;
      }

      invalidAttemptsRef.current.inflation = 0;
      dataRef.current.inflation = inf;
      addMsg(`${inf}% inflation`, "user");

      calculateResult();
    };

    btn.onclick = onSubmit;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    });
    setTimeout(() => input.focus(), 80);
  };

  // --------- calculation & result ---------
  const calculateResult = () => {
    const { mode, amount, years, rate, inflation } = dataRef.current;

    if (!mode || !amount || !years || !rate) {
      bot("Hmm, some inputs look incomplete. To avoid wrong numbers, let’s restart fresh 🙂", () =>
        startFresh()
      );
      return;
    }

    const months = years * 12;
    const R = rate / 100;
    const r = R / 12;

    let future = 0;
    let invested = 0;

    if (mode === "sip") {
      future = r === 0 ? amount * months : amount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      invested = amount * months;
    } else {
      future = amount * Math.pow(1 + R, years);
      invested = amount;
    }

    const wealthGain = future - invested;
    const realFuture =
      inflation && inflation > 0 ? future / Math.pow(1 + inflation / 100, years) : null;

    bot("Alright, crunching your numbers now… 🧮", () => {
      const modeLabel = mode === "sip" ? "Monthly SIP" : "Lump Sum";
      const resultCardHTML = `
        <div class="result-card">
          <div class="result-header">
            <div>
              <div class="result-title">Investment Growth Summary 💹</div>
            </div>
            <div class="result-pill">${modeLabel}</div>
          </div>
          <div class="result-amount">
            ₹${future.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <div class="result-breakdown">
            <div class="result-breakdown-row">
              <span>Total invested</span>
              <span>₹${invested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Wealth created</span>
              <span>₹${wealthGain.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Duration</span>
              <span>${years} years</span>
            </div>
            <div class="result-breakdown-row">
              <span>Assumed return</span>
              <span>${rate}% p.a.</span>
            </div>
            ${
              realFuture !== null
                ? `
            <div class="result-breakdown-row">
              <span>Inflation-adjusted value</span>
              <span>₹${realFuture.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>`
                : ""
            }
          </div>
          <div class="result-highlight">
            You’re letting compounding do the heavy lifting 🧠💸
            Keep the discipline, and this future number can become your reality.
          </div>
        </div>
      `;

      addMsg(resultCardHTML, "ai", true);

      setTimeout(() => {
        addMsg("Want to try a different combo? We can tweak amount, years or returns anytime 😄", "ai");
      }, 600);

      setTimeout(() => renderRestart(), 900);
    });
  };

  // --------- restart ---------
  const renderRestart = () => {
    if (!inputRef.current) return;
    clearInlineAlert();

    inputRef.current.innerHTML = `
      <div class="input-row">
        <button class="primary-btn">Run another scenario 🔁</button>
      </div>
    `;

    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;
    btn.onclick = () => startFresh();
  };

  const startFresh = () => {
    dataRef.current = { ...INITIAL_DATA };
    invalidAttemptsRef.current = {
      amount: 0,
      years: 0,
      rate: 0,
      inflation: 0,
    };

    bot("New session, new plan ✨", () => {
      bot("First, choose SIP or Lump Sum.", () => renderModeSelect());
    });
  };

  // --------- initial greeting ---------
  useEffect(() => {
    bot("Hey! I’m your Investment Growth AI from Openroot 😎", () => {
      bot("I’ll help you see how your money can grow over time 📈", () => {
        bot("We’ll keep it super simple, I do the math, you just tap & type 💜", () =>
          renderModeSelect()
        );
      });
    });

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);

  // --------- shell ---------
  return (
    <div className="page-wrapper">
      <main className="main-layout">
        <section className="assistant-card">
          <div className="assistant-header">
            <div className="status-dot" />
            <span className="assistant-name">MoneyGrow Engine</span>
            <span className="assistant-tag">Openroot — Financial Intelligence Module</span>
          </div>
          <div ref={chatRef} className="chat-window" />
          <div ref={inputRef} className="input-area" />
        </section>

        <aside className="info-card">
          <h2>How this AI works</h2>
          <ul>
            <li>Guides you like a chill money friend 😄</li>
            <li>Handles SIP & Lump Sum projections</li>
            <li>Shows growth + inflation impact clearly</li>
          </ul>
          <p className="info-note">
            You focus on <span>good decisions</span>, I’ll handle the number crunching.
          </p>
        </aside>
      </main>
    </div>
  );
};

export default InvestmentGrowthAI;
