import React, { useRef, useEffect } from "react";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

// ---------- TYPES ----------

type Flow = "standard" | "nocost" | "mindue" | null;

interface CreditEmiData {
  flow: Flow;
  amount: number | null;
  rate: number | null;
  months: number | null;
  fee: number;
  emi: number | null;
  upfrontPrice: number | null;
  minPercent: number | null;
  apr: number | null;
  monthsMin: number | null;
}

interface InvalidState {
  amount: number;
  rate: number;
  months: number;
  fee: number;
  emi: number;
  upfrontPrice: number;
  minPercent: number;
  apr: number;
  monthsMin: number;
}

const INITIAL_DATA: CreditEmiData = {
  flow: null,
  // shared / standard
  amount: null,
  rate: null,
  months: null,
  fee: 0,
  // no-cost
  emi: null,
  upfrontPrice: null,
  // minimum-due
  minPercent: null,
  apr: null,
  monthsMin: null,
};

const CreditEmiAI: React.FC = () => {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataRef = useRef<CreditEmiData>({ ...INITIAL_DATA });
  const invalidRef = useRef<InvalidState>({
    amount: 0,
    rate: 0,
    months: 0,
    fee: 0,
    emi: 0,
    upfrontPrice: 0,
    minPercent: 0,
    apr: 0,
    monthsMin: 0,
  });

  // -------------- helpers --------------

  const scrollToBottom = (): void => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const clearInlineAlert = (): void => {
    if (!inputRef.current) return;
    const alert = inputRef.current.querySelector(
      ".inline-alert"
    ) as HTMLElement | null;
    if (alert) alert.remove();
  };

  const showInlineAlert = (text: string): void => {
    clearInlineAlert();
    if (!inputRef.current) return;
    const div = document.createElement("div");
    div.className = "inline-alert";
    div.textContent = text;
    inputRef.current.appendChild(div);
  };

  const addMsg = (
    txt: string,
    sender: "ai" | "user" = "ai",
    isHTML = false
  ): void => {
    if (!chatRef.current) return;
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const bubble = document.createElement("div");
    bubble.className =
      "message " + (sender === "ai" ? "ai-message" : "user-message");

    if (isHTML) {
      bubble.innerHTML = txt; // internal templates only
    } else {
      bubble.textContent = txt;
    }

    row.appendChild(bubble);
    chatRef.current.appendChild(row);
    scrollToBottom();
  };

  const showChartBubble = (
    principal: number,
    interest: number,
    fee: number,
    gst: number
  ): void => {
    if (!chatRef.current) return;

    const row = document.createElement("div");
    row.className = "message-row ai";

    const bubble = document.createElement("div");
    bubble.className = "message ai-message";

    bubble.innerHTML = `
        <div style="width: 240px; height: 240px; margin:auto;">
          <canvas id="chatPieChart"></canvas>
        </div>
    `;

    row.appendChild(bubble);
    chatRef.current.appendChild(row);
    scrollToBottom();

    setTimeout(() => {
      const canvas = document.getElementById(
        "chatPieChart"
      ) as HTMLCanvasElement | null;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Principal", "Interest", "Fee", "GST"],
          datasets: [
            {
              data: [principal, interest, fee, gst],
              backgroundColor: [
                "#4f46e5", // principal
                "#f97316", // interest
                "#10b981", // fee
                "#e11d48", // GST
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: "65%",
          plugins: {
            legend: { display: true, position: "bottom" },
          },
        },
      });

      scrollToBottom();
    }, 150);
  };

  const bot = (txt: string, cb?: () => void): void => {
    if (!chatRef.current) return;

    const old = chatRef.current.querySelector("#typing") as HTMLDivElement | null;
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
      const still = chatRef.current?.querySelector(
        "#typing"
      ) as HTMLDivElement | null;
      if (still) still.remove();
      addMsg(txt, "ai");
      if (cb) cb();
    }, 650);
  };

  const isSuspiciousAmount = (v: number): boolean => v > 5_000_000; // > 50L
  const isSuspiciousRate = (v: number): boolean => v > 60;
  const isSuspiciousMonths = (v: number): boolean => v > 120;
  const isSuspiciousMinPercent = (v: number): boolean => v > 20; // min due > 20% is weird

  // -------------- flow select --------------

  const renderFlowSelect = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">What do you want to check today? 💳</div>
      <div class="input-row">
        <button class="primary-btn">Standard EMI</button>
        <button class="primary-btn" style="background:#fb923c">“No-Cost” EMI</button>
      </div>
      <div class="input-row" style="margin-top:0.35rem;">
        <button class="primary-btn" style="background:#22c55e;">Minimum Due Trap</button>
      </div>
    `;

    const buttons = inputRef.current.querySelectorAll(
      "button"
    ) as NodeListOf<HTMLButtonElement>;
    const [stdBtn, noCostBtn, minBtn] = buttons;

    stdBtn.onclick = () => {
      dataRef.current = { ...INITIAL_DATA, flow: "standard" };
      addMsg("Standard EMI calculation", "user");
      bot("Got you. We’ll break down EMI, interest and total cost 📊", () => {
        bot("First: what’s the transaction amount on your card? (₹)", () =>
          renderStandardAmount()
        );
      });
    };

    noCostBtn.onclick = () => {
      dataRef.current = { ...INITIAL_DATA, flow: "nocost" };
      addMsg("No-Cost EMI reality check", "user");
      bot(
        "Nice. Let’s see if it’s truly ‘no-cost’ or hiding extra interest 👀",
        () => {
          bot("What’s the product price used for EMI? (₹)", () =>
            renderNoCostAmount()
          );
        }
      );
    };

    minBtn.onclick = () => {
      dataRef.current = { ...INITIAL_DATA, flow: "mindue" };
      addMsg("Minimum-due impact", "user");
      bot(
        "Okay, we’ll see what happens if you only pay minimum due 😬",
        () => {
          bot("What’s your current credit card bill amount? (₹)", () =>
            renderMinDueBalance()
          );
        }
      );
    };
  };

  // -------------- STANDARD EMI FLOW --------------

  const renderStandardAmount = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Transaction amount (₹)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 15000, 25000, 50000" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const amount = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(amount) || amount <= 0 || amount > 10_000_000;

      if (invalid) {
        invalidRef.current.amount++;
        input.classList.add("input-error");
        if (invalidRef.current.amount >= 3) {
          showInlineAlert("Use a realistic amount like 15000 or 50000.");
          bot("Just need a valid purchase amount in rupees 😊");
        } else {
          showInlineAlert("That doesn’t look valid. Try something like 15000.");
        }
        return;
      }

      if (isSuspiciousAmount(amount)) {
        input.classList.add("input-error");
        showInlineAlert("That’s a very large amount for a card. Check the zeros.");
        bot("Big swipe there 😅 Re-check and re-enter if correct.");
        return;
      }

      invalidRef.current.amount = 0;
      dataRef.current.amount = amount;
      addMsg(`₹${amount.toLocaleString("en-IN")}`, "user");

      bot(
        "Cool. Next, what interest rate has the bank offered? (% per year)",
        () => renderStandardRate()
      );
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

  const renderStandardRate = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Annual interest rate (% p.a.)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 13, 15.75, 18" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const rate = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(rate) || rate <= 0 || rate > 100;

      if (invalid) {
        invalidRef.current.rate++;
        input.classList.add("input-error");
        if (invalidRef.current.rate >= 3) {
          showInlineAlert("Use a valid % like 13, 18 or 24.");
          bot("Most Indian credit cards sit between 18–42% p.a. 👀");
        } else {
          showInlineAlert("That doesn’t look right. Try 15.75 or 18.");
        }
        return;
      }

      if (isSuspiciousRate(rate)) {
        input.classList.add("input-error");
        showInlineAlert("That rate is extremely high. Check if it’s correct.");
        bot(
          "This looks very aggressive. Make sure this is really your card rate 😬",
          
        );
        return;
      }

      invalidRef.current.rate = 0;
      dataRef.current.rate = rate;
      addMsg(`${rate}% p.a.`, "user");

      bot("Got it. For how many months is the EMI?", () =>
        renderStandardMonths()
      );
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

  const renderStandardMonths = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Tenure (in months)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 3, 6, 9, 12" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const months = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(months) || months <= 0 || months > 360;

      if (invalid) {
        invalidRef.current.months++;
        input.classList.add("input-error");
        if (invalidRef.current.months >= 3) {
          showInlineAlert("Try a valid EMI period like 3, 6, 9 or 12 months.");
          bot(
            "Shorter EMI = less interest, longer EMI = smaller monthly hit.",
            
          );
        } else {
          showInlineAlert("That doesn’t look valid. Try 3–24 months.");
        }
        return;
      }

      if (isSuspiciousMonths(months)) {
        input.classList.add("input-error");
        showInlineAlert("That’s a very long tenure for a credit card EMI.");
        bot(
          "Credit card EMIs are usually short. Re-check your tenure 🙂",
          
        );
        return;
      }

      invalidRef.current.months = 0;
      dataRef.current.months = months;
      addMsg(`${months} months`, "user");

      bot("Last bit — any processing fee for this EMI? (₹)", () =>
        renderStandardFee()
      );
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

  const renderStandardFee = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Processing fee (₹) — put 0 if none</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 199 or 0" />
        <button class="primary-btn">Calculate →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "0").trim();
      const fee = Number(raw || "0");
      input.classList.remove("input-error");

      const invalid = Number.isNaN(fee) || fee < 0 || fee > 100_000;

      if (invalid) {
        invalidRef.current.fee++;
        input.classList.add("input-error");
        showInlineAlert(
          "Processing fee should be a positive number or 0."
        );
        return;
      }

      dataRef.current.fee = fee;
      addMsg(`₹${fee.toLocaleString("en-IN")}`, "user");

      calculateStandard();
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

  const calculateStandard = (): void => {
    const { amount, rate, months, fee } = dataRef.current;
    if (!amount || !rate || !months) {
      bot(
        "Some details are missing. To avoid wrong EMI, let’s restart fresh 🙂",
        () => startFresh()
      );
      return;
    }

    const P = amount;
    const R = rate / 100;
    const r = R / 12;

    let emi: number;
    if (r === 0) {
      emi = P / months;
    } else {
      const pow = Math.pow(1 + r, months);
      emi = (P * r * pow) / (pow - 1);
    }

    const totalEmi = emi * months;
    const interest = totalEmi - P;

    const gstOnInterest = interest * 0.18;
    const gstOnFee = fee * 0.18;
    const totalPayable = totalEmi + fee + gstOnInterest + gstOnFee;
    const extraCost = totalPayable - P;

    bot("Alright, let me unpack this EMI for you… 🧮", () => {
      const cardHTML = `
        <div class="result-card">
          <div class="result-header">
            <div>
              <div class="result-title">Standard EMI Breakdown 💳</div>
            </div>
            <div class="result-pill">${months} months</div>
          </div>

          <div class="result-amount">
            ₹${emi.toLocaleString("en-IN", { maximumFractionDigits: 2 })} / month
          </div>

          <div class="result-breakdown">
            <div class="result-breakdown-row">
              <span>Principal amount</span>
              <span>₹${P.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Total EMI paid (before GST)</span>
              <span>₹${totalEmi.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Total interest (before GST)</span>
              <span>₹${interest.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Processing fee</span>
              <span>₹${fee.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>GST on interest + fee (18%)</span>
              <span>₹${(gstOnInterest + gstOnFee).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}</span>
            </div>
          </div>

          <div class="result-highlight">
            Total you pay back: <strong>₹${totalPayable.toLocaleString(
              "en-IN",
              { maximumFractionDigits: 2 }
            )}</strong><br/>
            Extra cost over original amount: <strong>₹${extraCost.toLocaleString(
              "en-IN",
              { maximumFractionDigits: 2 }
            )}</strong>
          </div>
        </div>
      `;

      addMsg(cardHTML, "ai", true);
      // 📊 Show visualization right after numbers!
      showChartBubble(P, interest, fee, gstOnInterest + gstOnFee);

      setTimeout(() => {
        if (extraCost > P * 0.25) {
          addMsg(
            "That EMI is costing a bit too much 😬 Consider a shorter tenure or part-prepayment to reduce interest.",
            "ai"
          );
        } else {
          addMsg(
            "Smart pick! This EMI structure is reasonably cost-efficient 💪",
            "ai"
          );
        }
      }, 700);

      // Restart button after chart + insight 📌
      setTimeout(() => renderRestart(), 1200);
    });
  };

  // -------------- NO-COST EMI FLOW --------------

  const renderNoCostAmount = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Product price for EMI (₹)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 29999, 49999" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const amount = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(amount) || amount <= 0 || amount > 10_000_000;

      if (invalid) {
        invalidRef.current.amount++;
        input.classList.add("input-error");
        showInlineAlert("Use a valid price like 29999 or 49999.");
        return;
      }

      if (isSuspiciousAmount(amount)) {
        input.classList.add("input-error");
        showInlineAlert("This looks huge. Double-check the amount.");
        bot(
          "That’s a big purchase. Make sure the number is correct 😅",
          
        );
        return;
      }

      invalidRef.current.amount = 0;
      dataRef.current.amount = amount;
      addMsg(`₹${amount.toLocaleString("en-IN")}`, "user");

      bot("Nice. What is the EMI amount per month? (₹)", () =>
        renderNoCostEmi()
      );
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

  const renderNoCostEmi = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Monthly EMI (₹)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 2500, 4200" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const emi = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(emi) || emi <= 0 || emi > 1_000_000;

      if (invalid) {
        invalidRef.current.emi++;
        input.classList.add("input-error");
        showInlineAlert("Use a valid EMI like 2500 or 4200.");
        return;
      }

      invalidRef.current.emi = 0;
      dataRef.current.emi = emi;
      addMsg(`₹${emi.toLocaleString("en-IN")}`, "user");

      bot("Cool. For how many months is this EMI?", () =>
        renderNoCostMonths()
      );
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

  const renderNoCostMonths = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Tenure (in months)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 3, 6, 9, 12" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const months = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(months) || months <= 0 || months > 360;

      if (invalid) {
        invalidRef.current.months++;
        input.classList.add("input-error");
        showInlineAlert("Tenure should be a positive number of months.");
        return;
      }

      if (isSuspiciousMonths(months)) {
        input.classList.add("input-error");
        showInlineAlert("Too long for a typical ‘no-cost’ EMI.");
        bot(
          "No-cost EMIs are usually short. Re-check the tenure 🙂",
          
        );
        return;
      }

      invalidRef.current.months = 0;
      dataRef.current.months = months;
      addMsg(`${months} months`, "user");

      bot("Any processing fee for this EMI? (₹) Put 0 if none.", () =>
        renderNoCostFee()
      );
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

  const renderNoCostFee = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Processing / convenience fee (₹)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 199 or 0" />
        <button class="primary-btn">Calculate →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "0").trim();
      const fee = Number(raw || "0");
      input.classList.remove("input-error");

      const invalid = Number.isNaN(fee) || fee < 0 || fee > 100_000;

      if (invalid) {
        invalidRef.current.fee++;
        input.classList.add("input-error");
        showInlineAlert("Fee should be a valid number or 0.");
        return;
      }

      dataRef.current.fee = fee;
      addMsg(`₹${fee.toLocaleString("en-IN")}`, "user");

      calculateNoCost();
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

  const calculateNoCost = (): void => {
    const { amount, emi, months, fee } = dataRef.current;
    if (!amount || !emi || !months) {
      bot(
        "Something is missing, so I can’t trust this result. Let’s restart and keep it clean 🙂",
        () => startFresh()
      );
      return;
    }

    const totalPaid = emi * months + fee;
    const extra = totalPaid - amount;
    const years = months / 12;
    const effectiveRate =
      years > 0 ? (extra / (amount * years)) * 100 : 0;

    bot("Let me check if this EMI is really ‘no-cost’ or not… 👀", () => {
      const cardHTML = `
        <div class="result-card">
          <div class="result-header">
            <div>
              <div class="result-title">“No-Cost” EMI Reality Check 🧐</div>
            </div>
            <div class="result-pill">${months} months</div>
          </div>

          <div class="result-amount">
            ₹${totalPaid.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })} total paid
          </div>

          <div class="result-breakdown">
            <div class="result-breakdown-row">
              <span>Product price (EMI basis)</span>
              <span>₹${amount.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Total EMI paid</span>
              <span>₹${(emi * months).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Fees</span>
              <span>₹${fee.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Extra cost over price</span>
              <span>₹${extra.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            ${
              extra > 0
                ? `
            <div class="result-breakdown-row">
              <span>Approx. effective rate</span>
              <span>${effectiveRate.toFixed(2)}% p.a.</span>
            </div>`
                : ""
            }
          </div>

          <div class="result-highlight">
            ${
              extra > 0
                ? "This EMI isn’t truly free — you’re paying extra over the product price. Now you know the real cost 😅"
                : "This looks truly close to a no-cost EMI. Still, always compare upfront discount vs EMI offers."
            }
          </div>
        </div>
      `;
      addMsg(cardHTML, "ai", true);

      setTimeout(() => {
        addMsg(
          "Pro tip: if the extra cost feels high, consider paying upfront or choosing a shorter EMI.",
          "ai"
        );
      }, 600);

      setTimeout(() => renderRestart(), 900);
    });
  };

  // -------------- MINIMUM DUE FLOW --------------

  const renderMinDueBalance = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Current statement amount (₹)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 12000, 45000" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const amount = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(amount) || amount <= 0 || amount > 10_000_000;

      if (invalid) {
        invalidRef.current.amount++;
        input.classList.add("input-error");
        showInlineAlert(
          "Use a valid statement amount like 12000 or 45000."
        );
        return;
      }

      if (isSuspiciousAmount(amount)) {
        input.classList.add("input-error");
        showInlineAlert("That’s a huge bill. Please double-check.");
        bot("That’s a serious balance. Let’s handle it carefully 💀");
        return;
      }

      invalidRef.current.amount = 0;
      dataRef.current.amount = amount;
      addMsg(`₹${amount.toLocaleString("en-IN")}`, "user");

      bot(
        "What annual interest rate does your card charge? (% p.a.)",
        () => renderMinDueApr()
      );
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

  const renderMinDueApr = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Card interest rate (% per year)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 30, 36, 42" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const apr = Number(raw);
      input.classList.remove("input-error");

      const invalid = !raw || Number.isNaN(apr) || apr <= 0 || apr > 100;

      if (invalid) {
        invalidRef.current.apr++;
        input.classList.add("input-error");
        showInlineAlert("Use a realistic APR like 30–42%.");
        return;
      }

      if (isSuspiciousRate(apr)) {
        input.classList.add("input-error");
        showInlineAlert("This is extremely high APR. Check your statement.");
        bot(
          "If your APR is really this high, minimum due is very dangerous 😬",
          
        );
        return;
      }

      invalidRef.current.apr = 0;
      dataRef.current.apr = apr;
      addMsg(`${apr}% p.a.`, "user");

      bot(
        "What minimum due % is shown on your statement? (Ex: 5%)",
        () => renderMinDuePercent()
      );
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

  const renderMinDuePercent = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Minimum due (% of balance)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 5" />
        <button class="primary-btn">Next →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const minPct = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw || Number.isNaN(minPct) || minPct <= 0 || minPct > 100;

      if (invalid) {
        invalidRef.current.minPercent++;
        input.classList.add("input-error");
        showInlineAlert("Use a valid minimum due %, like 5.");
        return;
      }

      if (isSuspiciousMinPercent(minPct)) {
        input.classList.add("input-error");
        showInlineAlert(
          "Minimum due usually around 3–5%. Check your statement."
        );
        bot(
          "If your minimum due % is that high, that’s unusual. Confirm once 🤔",
          
        );
        return;
      }

      invalidRef.current.minPercent = 0;
      dataRef.current.minPercent = minPct;
      addMsg(`${minPct}% of balance`, "user");

      bot(
        "For how many months do you want to simulate paying only minimum due?",
        () => renderMinDueMonths()
      );
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

  const renderMinDueMonths = (): void => {
    clearInlineAlert();
    if (!inputRef.current) return;

    inputRef.current.innerHTML = `
      <div class="input-label">Simulation duration (months)</div>
      <div class="input-row">
        <input type="number" class="assistant-input" placeholder="Ex: 6 or 12" />
        <button class="primary-btn">See impact →</button>
      </div>
    `;

    const input = inputRef.current.querySelector("input") as HTMLInputElement;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;

    const onSubmit = (): void => {
      const raw = String(input.value || "").trim();
      const monthsMin = Number(raw);
      input.classList.remove("input-error");

      const invalid =
        !raw ||
        Number.isNaN(monthsMin) ||
        monthsMin <= 0 ||
        monthsMin > 360;

      if (invalid) {
        invalidRef.current.monthsMin++;
        input.classList.add("input-error");
        showInlineAlert("Use a realistic duration like 6 or 12 months.");
        return;
      }

      invalidRef.current.monthsMin = 0;
      dataRef.current.monthsMin = monthsMin;
      addMsg(`${monthsMin} months`, "user");

      calculateMinDue();
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

  const calculateMinDue = (): void => {
    const { amount, apr, minPercent, monthsMin } = dataRef.current;
    if (!amount || !apr || !minPercent || !monthsMin) {
      bot(
        "Some inputs are missing. We’ll restart so the result stays trustworthy 🙂",
        () => startFresh()
      );
      return;
    }

    let balance = amount;
    let totalPaid = 0;
    let totalInterest = 0;
    const monthlyRate = apr / 12 / 100;

    for (let m = 0; m < monthsMin; m++) {
      const interest = balance * monthlyRate;
      const minPay = Math.max(balance * (minPercent / 100), interest + 1); // pay at least interest
      const principalPart = Math.max(0, minPay - interest);
      balance = Math.max(0, balance - principalPart);

      totalPaid += minPay;
      totalInterest += interest;

      if (balance <= 0) break;
    }

    bot("Simulating how minimum due behaves over time… ⏳", () => {
      const cardHTML = `
        <div class="result-card">
          <div class="result-header">
            <div>
              <div class="result-title">Minimum Due Impact Simulation ⚠️</div>
            </div>
            <div class="result-pill">${monthsMin} months</div>
          </div>

          <div class="result-amount">
            Remaining balance: ₹${balance.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>

          <div class="result-breakdown">
            <div class="result-breakdown-row">
              <span>Starting bill amount</span>
              <span>₹${amount.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Total paid (only minimum due)</span>
              <span>₹${totalPaid.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
            <div class="result-breakdown-row">
              <span>Interest paid so far</span>
              <span>₹${totalInterest.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}</span>
            </div>
          </div>

          <div class="result-highlight">
            ${
              balance > amount * 0.7
                ? "Even after all these months, most of your principal is still alive. That’s how minimum due traps people in debt 😬"
                : "You’re paying a lot in interest just by sticking to minimum due. Clearing faster saves serious money."
            }
          </div>
        </div>
      `;
      addMsg(cardHTML, "ai", true);

      setTimeout(() => {
        addMsg(
          "Best move: treat credit cards like a charge card — pay full whenever possible. Your future self will thank you 😌",
          "ai"
        );
      }, 600);

      setTimeout(() => renderRestart(), 900);
    });
  };

  // -------------- restart & init --------------

  const renderRestart = (): void => {
    if (!inputRef.current) return;
    clearInlineAlert();
    inputRef.current.innerHTML = `
      <div class="input-row">
        <button class="primary-btn">Run another EMI check 🔁</button>
      </div>
    `;
    const btn = inputRef.current.querySelector("button") as HTMLButtonElement;
    btn.onclick = () => startFresh();
  };

  const startFresh = (): void => {
    dataRef.current = { ...INITIAL_DATA };
    invalidRef.current = {
      amount: 0,
      rate: 0,
      months: 0,
      fee: 0,
      emi: 0,
      upfrontPrice: 0,
      minPercent: 0,
      apr: 0,
      monthsMin: 0,
    };

    bot("New session, fresh analysis 💳✨", () => {
      bot("Tell me what you want to check this time.", () =>
        renderFlowSelect()
      );
    });
  };

  useEffect(() => {
    bot("Hey! I’m your Credit Card EMI AI from Openroot 😎", () => {
      bot(
        "I’ll help you decode EMI, ‘no-cost’ offers and minimum-due traps 📉",
        () => {
          bot(
            "We’ll keep it super simple. You just answer, I do the math 💜",
            () => renderFlowSelect()
          );
        }
      );
    });

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------- shell --------------

  return (
    <div className="page-wrapper">
      <main className="main-layout">
        <section className="assistant-card">
          <div className="assistant-header">
            <div className="status-dot" />
            <span className="assistant-name">Debt Decoder Engine</span>
            <span className="assistant-tag">
              Openroot — Financial Intelligence Module
            </span>
          </div>

          <div ref={chatRef} className="chat-window" />
          <div ref={inputRef} className="input-area" />
        </section>

        <aside className="info-card">
          <h2>How this AI protects you</h2>
          <ul>
            <li>Shows real EMI cost with interest + GST</li>
            <li>Checks if ‘No-Cost’ EMI is actually costing extra</li>
            <li>Simulates minimum-due impact to avoid debt traps</li>
          </ul>
          <p className="info-note">
            Use your card with <span>clarity</span>, not fear. I’ll handle the
            number stress for you.
          </p>
        </aside>
      </main>
    </div>
  );
};

export default CreditEmiAI;
