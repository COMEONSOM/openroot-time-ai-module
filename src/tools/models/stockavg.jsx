// src/tools/models/stockavg.jsx
import React, { useRef, useEffect } from "react";

const StockAI = () => {
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const positionsRef = useRef([]); // [{ qty, price }]
  const pendingQtyRef = useRef(null);

  const invalidAttemptsRef = useRef({
    qty: 0,
    price: 0,
  });

  // ---------------- HELPERS ----------------

  const scroll = () => {
    const c = chatRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  };

  const clearAlert = () => {
    if (!inputRef.current) return;
    const alert = inputRef.current.querySelector(".inline-alert");
    if (alert) alert.remove();
  };

  const addMsg = (text, sender = "ai", isHTML = false) => {
    if (!chatRef.current) return;

    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className =
      "message " + (sender === "ai" ? "ai-message" : "user-message");

    if (isHTML) {
      // Only for safe internal templates
      bubble.innerHTML = text;
    } else {
      bubble.textContent = text;
    }

    row.appendChild(bubble);
    chatRef.current.appendChild(row);
    scroll();
  };

  const bot = (text, cb) => {
    if (!chatRef.current) return;

    // Remove old typing
    const old = chatRef.current.querySelector("#typing");
    if (old) old.remove();

    const typing = document.createElement("div");
    typing.className = "message-row ai";
    typing.id = "typing";
    typing.innerHTML = `
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatRef.current.appendChild(typing);
    scroll();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      const still = chatRef.current?.querySelector("#typing");
      if (still) still.remove();
      addMsg(text, "ai");
      if (cb) cb();
    }, 650);
  };

  const showInlineError = (msg) => {
    clearAlert();
    if (!inputRef.current) return;
    const div = document.createElement("div");
    div.className = "inline-alert";
    div.textContent = msg;
    inputRef.current.appendChild(div);
  };

  const invalidQty = (qty) =>
    !qty || Number.isNaN(qty) || qty <= 0 || !Number.isInteger(qty);

  const invalidPrice = (price) =>
    !price || Number.isNaN(price) || price <= 0;

  const suspiciousQty = (qty) => qty > 500000;
  const suspiciousPrice = (price) => price < 0.5 || price > 500000;

  // ---------------- STEP 1 — QUANTITY ----------------

  const renderQty = () => {
    clearAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Trade quantity</div>
      <div class="input-row">
        <input 
          type="number" 
          placeholder="Ex: 25, 100, 350" 
          class="assistant-input" 
        />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input");
    const btn = inputRef.current.querySelector("button");

    const submit = () => {
      const raw = String(input.value || "").trim();
      const qty = Number(raw);
      input.classList.remove("input-error");

      if (invalidQty(qty)) {
        invalidAttemptsRef.current.qty += 1;
        input.classList.add("input-error");

        showInlineError(
          "Quantity must be a positive whole number like 10, 50 or 200."
        );

        // Only send a coach message once or twice to avoid flooding
        if (invalidAttemptsRef.current.qty === 2) {
          bot(
            "For quantity, think in whole shares only — 10, 25, 200 etc.",
            null
          );
        }
        return;
      }

      if (suspiciousQty(qty)) {
        input.classList.add("input-error");
        showInlineError(
          "This looks like a very large position. Please double-check the quantity."
        );
        if (invalidAttemptsRef.current.qty < 2) {
          bot(
            "That’s a big number of shares. Just confirm it once before we go ahead. ⚠️",
            null
          );
        }
        invalidAttemptsRef.current.qty += 1;
        return;
      }

      invalidAttemptsRef.current.qty = 0;
      pendingQtyRef.current = qty;
      addMsg(String(qty), "user");

      bot("Nice, quantity locked in. ✅", () => {
        bot("Now tell me the buy price per share for this trade.", () =>
          renderPrice()
        );
      });
    };

    btn.onclick = submit;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    setTimeout(() => input.focus(), 80);
  };

  // ---------------- STEP 2 — PRICE ----------------

  const renderPrice = () => {
    clearAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Buy price per share (₹)</div>
      <div class="input-row">
        <input 
          type="number" 
          placeholder="Ex: 120, 245.5" 
          class="assistant-input" 
        />
        <button class="primary-btn">Add trade</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input");
    const btn = inputRef.current.querySelector("button");

    const submit = () => {
      const raw = String(input.value || "").trim();
      const price = Number(raw);
      input.classList.remove("input-error");

      if (invalidPrice(price)) {
        invalidAttemptsRef.current.price += 1;
        input.classList.add("input-error");

        showInlineError(
          "Price must be a positive number like 120 or 245.5. It can’t be zero."
        );

        if (invalidAttemptsRef.current.price === 2) {
          bot(
            "Use the per-share price you see on your contract note or app — just one number per trade. 🙂",
            null
          );
        }
        return;
      }

      if (suspiciousPrice(price)) {
        input.classList.add("input-error");
        showInlineError(
          "This price is unusually low or high for a typical stock. Please verify once."
        );
        if (invalidAttemptsRef.current.price < 2) {
          bot(
            "That level looks a bit extreme compared to usual equity prices. Double-check and re-enter if needed. ⚠️",
            null
          );
        }
        invalidAttemptsRef.current.price += 1;
        return;
      }

      if (!pendingQtyRef.current) {
        bot(
          "I lost the quantity for this trade. To avoid a wrong average, let’s restart clean.",
          () => startFresh()
        );
        return;
      }

      invalidAttemptsRef.current.price = 0;
      addMsg(String(price), "user");

      positionsRef.current.push({
        qty: pendingQtyRef.current,
        price,
      });
      pendingQtyRef.current = null;

      const legIndex = positionsRef.current.length;
      bot(`Trade ${legIndex} added. 👍`, () => {
        bot("Do you want to add another trade for this same stock?", () =>
          renderAddMore()
        );
      });
    };

    btn.onclick = submit;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    setTimeout(() => input.focus(), 80);
  };

  // ---------------- ADD ANOTHER TRADE? ----------------

  const renderAddMore = () => {
    if (!inputRef.current) return;
    clearAlert();

    inputRef.current.innerHTML = `
      <div class="input-label">More trades for this stock?</div>
      <div class="input-row">
        <button class="primary-btn">Yes, add another trade</button>
        <button class="primary-btn" style="background:#fb923c">No, show my average</button>
      </div>
    `;

    const [yesBtn, noBtn] = inputRef.current.querySelectorAll("button");

    yesBtn.onclick = () => {
      addMsg("I have another trade to add.", "user");
      bot("Great, let’s capture that too.", () => {
        bot("Tell me the quantity for the next trade.", () => renderQty());
      });
    };

    noBtn.onclick = () => {
      addMsg("Show my final average.", "user");
      showResult();
    };
  };

  // ---------------- FINAL RESULT ----------------

  const showResult = () => {
    const trades = positionsRef.current;
    if (!trades.length) {
      bot(
        "I don’t have any valid trades yet. Let’s start from your first purchase.",
        () => startFresh()
      );
      return;
    }

    let totalQty = 0;
    let totalValue = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    trades.forEach((t) => {
      totalQty += t.qty;
      const value = t.qty * t.price;
      totalValue += value;
      if (t.price < minPrice) minPrice = t.price;
      if (t.price > maxPrice) maxPrice = t.price;
    });

    if (totalQty <= 0) {
      bot(
        "Your total share count came out as zero. To keep things accurate, we’ll restart.",
        () => startFresh()
      );
      return;
    }

    const avg = totalValue / totalQty;

    bot("All set. I’ve crunched your position details. 📈", () => {
      bot("Here’s your true weighted average for this stock.", () => {
        const cardHTML = `
          <div class="result-card">
            <div class="result-header">
              <div>
                <div class="result-title">Average Buy Price Summary</div>
              </div>
              <div class="result-pill">${totalQty} shares</div>
            </div>

            <div class="result-amount">₹${avg.toFixed(2)} per share</div>

            <div class="result-breakdown">
              <div class="result-breakdown-row">
                <span>Total investment</span>
                <span>₹${totalValue.toFixed(2)}</span>
              </div>
              <div class="result-breakdown-row">
                <span>Number of trades</span>
                <span>${trades.length}</span>
              </div>
              <div class="result-breakdown-row">
                <span>Lowest buy price</span>
                <span>₹${minPrice.toFixed(2)}</span>
              </div>
              <div class="result-breakdown-row">
                <span>Highest buy price</span>
                <span>₹${maxPrice.toFixed(2)}</span>
              </div>
            </div>

            <div class="result-highlight">
              This is your <strong>true weighted average</strong> across all recorded trades.
              <br/><br/>
              Any new buy <strong>below ₹${avg.toFixed(
                2
              )}</strong> will reduce your average cost. 
              Buying above this level will push your cost higher.
            </div>
          </div>
        `;

        addMsg(cardHTML, "ai", true);

        setTimeout(() => {
          addMsg(
            "Nicely managed! Use this level as your reference when planning the next entry or exit. 😊",
            "ai"
          );
        }, 600);

        setTimeout(() => showRestart(), 1100);
      });
    });
  };

  const showRestart = () => {
    if (!inputRef.current) return;
    clearAlert();

    inputRef.current.innerHTML = `
      <div class="input-row">
        <button class="primary-btn">Start a new calculation</button>
      </div>
    `;
    const btn = inputRef.current.querySelector("button");
    btn.onclick = () => startFresh();
  };

  const startFresh = () => {
    positionsRef.current = [];
    pendingQtyRef.current = null;
    invalidAttemptsRef.current.qty = 0;
    invalidAttemptsRef.current.price = 0;

    bot("New stock, fresh averaging session. 😊", () => {
      bot("Tell me the quantity from your first trade for this stock.", () =>
        renderQty()
      );
    });
  };

  // ---------------- INITIAL GREETING ----------------

  useEffect(() => {
    bot("Hi, I’m your Invest IQ Engine from Openroot. 😊", () => {
      bot("I’ll help you find your true average buy price for any stock.", () => {
        bot(
          "We’ll go trade by trade — you give quantity and buy price, I do the maths.",
          () => renderQty()
        );
      });
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // ---------------- UI SHELL ----------------

  return (
    <div className="page-wrapper">
      <main className="main-layout">
        {/* Left: AI Conversation */}
        <section className="assistant-card">
          <div className="assistant-header">
            <div className="status-dot" />
            <span className="assistant-name">Invest IQ Engine</span>
            <span className="assistant-tag">
              Openroot — Financial Intelligence Module
            </span>
          </div>

          <div ref={chatRef} className="chat-window" />
          <div ref={inputRef} className="input-area" />
        </section>

        {/* Right: Short helper card */}
        <aside className="info-card">
          <h2>How this AI works</h2>
          <ul>
            <li>Collects each trade leg, one by one</li>
            <li>Computes your true weighted average price</li>
            <li>Shows total investment and price range</li>
          </ul>
          <p className="info-note">
            Built for investors who want
            <span> clear cost basis </span>
            before making their next move.
          </p>
        </aside>
      </main>
    </div>
  );
};

export default StockAI;
