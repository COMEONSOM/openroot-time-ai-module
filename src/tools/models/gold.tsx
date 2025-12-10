import React, { useRef, useEffect } from "react";

type StepId = "carat" | "weight" | "rate" | "making";

interface Answers {
  carat: number | null;
  weight: number | null;
  rate: number | null;
  making: number | null;
}

type StepType = "choice" | "number";

interface ChoiceOption {
  value: number;
  label: string;
  note?: string;
}

interface Step {
  id: StepId;
  label: string;
  type: StepType;
  options?: ChoiceOption[];
  placeholder?: string;
  min?: number;
}

interface SuspiciousPending {
  stepId: StepId;
  value: number;
}

const GoldAI: React.FC = () => {
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const modalOverlayRef = useRef<HTMLDivElement | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answersRef = useRef<Answers>({
    carat: null,
    weight: null,
    rate: null,
    making: null,
  });

  const stepsRef = useRef<Step[]>([
    {
      id: "carat",
      label: "First, what gold purity are you buying today?",
      type: "choice",
      options: [
        { value: 18, label: "18K", note: "75% pure gold" },
        { value: 22, label: "22K", note: "91.6% pure gold" },
        { value: 24, label: "24K", note: "99.9% pure gold" },
      ],
    },
    {
      id: "weight",
      label:
        "Nice choice. Now tell me the weight of the jewellery (in grams).",
      type: "number",
      placeholder: "e.g., 20",
      min: 0.01,
    },
    {
      id: "rate",
      label: "Got it. What is the 24K gold rate today (per gram in ₹)?",
      type: "number",
      placeholder: "e.g., 7000",
      min: 1,
    },
    {
      id: "making",
      label:
        "Last step — what are the making charges for this jewellery (in ₹)?",
      type: "number",
      placeholder: "e.g., 3000",
      min: 0,
    },
  ]);

  const currentStepIndexRef = useRef<number>(0);

  // keep as loose map because we only track some stepIds here
  const invalidAttemptsRef = useRef<Record<string, number>>({
    weight: 0,
    rate: 0,
    making: 0,
  });

  const pendingSuspiciousRef = useRef<SuspiciousPending | null>(null);

  // --------- UTILITIES ---------

  function scrollToBottom(): void {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function clearInlineAlert(): void {
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;
    const alert = inputArea.querySelector(".inline-alert") as HTMLElement | null;
    if (alert) alert.remove();
  }

  function hideTypingIndicator(): void {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;
    const row = chatWindow.querySelector("#typing-row") as HTMLElement | null;
    if (row) row.remove();
  }

  function showTypingIndicator(): void {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;

    hideTypingIndicator();

    const row = document.createElement("div");
    row.className = "message-row ai";
    row.id = "typing-row";

    const bubble = document.createElement("div");
    bubble.className = "typing-bubble";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-dot";
      bubble.appendChild(dot);
    }

    row.appendChild(bubble);
    chatWindow.appendChild(row);
    scrollToBottom();
  }

  function addMessage(
    text: string,
    sender: "ai" | "user" = "ai",
    isHTML = false
  ): void {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;

    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const msg = document.createElement("div");
    msg.className =
      "message " + (sender === "ai" ? "ai-message" : "user-message");

    if (isHTML) {
      msg.innerHTML = text; // only internal strings are passed here
    } else {
      msg.textContent = text;
    }

    row.appendChild(msg);
    chatWindow.appendChild(row);
    scrollToBottom();
  }

  function delayedAIMessage(
    text: string,
    callback: (() => void) | null | undefined
  ): void {
    hideTypingIndicator();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    showTypingIndicator();
    typingTimeoutRef.current = setTimeout(() => {
      hideTypingIndicator();
      addMessage(text, "ai");
      if (typeof callback === "function") callback();
    }, 650);
  }

  // --------- SUSPICIOUS CHECK ---------

  function isSuspiciousValue(stepId: StepId, value: number): boolean {
    const answers = answersRef.current;

    if (stepId === "weight") {
      return value > 500; // 500g is already very high
    }

    if (stepId === "rate") {
      if (value < 1000 || value > 100000) return true;
    }

    if (stepId === "making") {
      const { carat, weight, rate } = answers;
      if (carat && weight && rate) {
        const purityFactor = carat / 24;
        const caratRate = rate * purityFactor;
        const goldPrice = caratRate * weight;
        if (goldPrice > 0 && value > goldPrice * 2) return true;
      }
    }

    return false;
  }

  // --------- STEP RENDERING ---------

  function renderStep(): void {
    const steps = stepsRef.current;
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    const step = steps[currentStepIndexRef.current];
    if (!step) return;

    inputArea.innerHTML = "";
    clearInlineAlert();

    const label = document.createElement("div");
    label.className = "input-label";
    label.textContent = "Your turn:";
    inputArea.appendChild(label);

    if (step.type === "choice") {
      const hint = document.createElement("div");
      hint.className = "input-hint";
      hint.textContent = "Tap the purity you want to use.";
      inputArea.appendChild(hint);

      const row = document.createElement("div");
      row.className = "choice-row";

      step.options!.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerHTML = `<span class="carat-pill">${opt.label}</span> ${opt.note}`;

        btn.addEventListener("click", () => {
          const allBtns = row.querySelectorAll("button");
          allBtns.forEach((b) => {
            (b as HTMLButtonElement).disabled = true;
            b.classList.add("disabled-btn");
          });
          handleChoiceAnswer(step.id, opt.value, opt.label);
        });

        row.appendChild(btn);
      });

      inputArea.appendChild(row);
    } else if (step.type === "number") {
      const row = document.createElement("div");
      row.className = "input-row";

      const input = document.createElement("input");
      input.type = "number";
      input.className = "assistant-input";
      input.placeholder = step.placeholder || "";
      input.step = "any";
      if (typeof step.min === "number") {
        input.min = String(step.min);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "primary-btn";
      btn.innerHTML = `Next <span>→</span>`;

      const onSubmit = () => {
        if (btn.disabled) return;
        handleNumberAnswer(step.id, input.value, step.min, input, btn);
      };

      btn.addEventListener("click", onSubmit);
      input.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      });

      row.appendChild(input);
      row.appendChild(btn);
      inputArea.appendChild(row);

      const hint = document.createElement("div");
      hint.className = "input-hint";
      if (step.id === "weight") {
        hint.textContent =
          "Use the total net weight of the jewellery (without stones).";
      } else if (step.id === "rate") {
        hint.textContent =
          "This should be the pure 24K gold rate per gram in your city.";
      } else if (step.id === "making") {
        hint.textContent =
          "Total making charges for this jewellery item, not per gram.";
      }
      inputArea.appendChild(hint);

      setTimeout(() => input.focus(), 50);
    }
  }

  // --------- HANDLERS ---------

  function handleChoiceAnswer(id: StepId, value: number, label: string): void {
    const answers = answersRef.current;
    answers[id] = Number(value);
    addMessage(label, "user");
    goToNextStep();
  }


  function handleNumberAnswer(
    stepId: StepId,
    rawValue: string,
    minVal: number | undefined,
    inputEl: HTMLInputElement,
    btnEl: HTMLButtonElement
  ): void {
    clearInlineAlert();
    inputEl.classList.remove("input-error");

    const trimmed = String(rawValue || "").trim();
    const numeric = Number(trimmed);

    btnEl.disabled = true;
    btnEl.classList.add("disabled-btn");

    const minimum = typeof minVal === "number" ? minVal : 0;
    const isInvalid =
      !trimmed || Number.isNaN(numeric) || numeric < minimum || numeric <= 0;

    if (isInvalid) {
      handleInvalidNumber(stepId, inputEl, btnEl);
      return;
    }

    addMessage(String(numeric), "user");

    if (isSuspiciousValue(stepId, numeric)) {
      beginSuspiciousFlow(stepId, numeric);
      return;
    }

    acceptValueAndContinue(stepId, numeric);
  }

  function handleInvalidNumber(
    stepId: StepId,
    inputEl: HTMLInputElement,
    btnEl: HTMLButtonElement
  ): void {
    const invalidAttempts = invalidAttemptsRef.current;
    invalidAttempts[stepId] = (invalidAttempts[stepId] || 0) + 1;

    inputEl.classList.add("input-error");

    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    const alert = document.createElement("div");
    alert.className = "inline-alert";
    const attempts = invalidAttempts[stepId];

    if (attempts >= 3) {
      alert.textContent =
        "I'll wait until you give a valid number ✨ (only positive numbers are allowed).";
      delayedAIMessage(
        "I'll wait here until you give me a valid number ✨",
        null
      );
    } else {
      alert.textContent =
        "Please enter a valid positive number (for example: 5 or 12.5).";
    }

    clearInlineAlert();
    inputArea.appendChild(alert);

    btnEl.disabled = false;
    btnEl.classList.remove("disabled-btn");
  }

  function beginSuspiciousFlow(stepId: StepId, value: number): void {
    pendingSuspiciousRef.current = { stepId, value };

    delayedAIMessage(
      "This value looks a bit unusual. Are you sure it's correct?",
      () => {
        renderInlineSuspicionControls();
      }
    );
  }

  function renderInlineSuspicionControls(): void {
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    inputArea.innerHTML = "";

    const label = document.createElement("div");
    label.className = "input-label";
    label.textContent = "Security check:";
    inputArea.appendChild(label);

    const msg = document.createElement("div");
    msg.className = "input-hint";
    msg.textContent =
      "This number seems very high for typical jewellery. Do you still want to continue with it?";
    inputArea.appendChild(msg);

    const row = document.createElement("div");
    row.className = "input-row";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "primary-btn";
    confirmBtn.textContent = "✔ Yes, continue";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "primary-btn";
    editBtn.style.background =
      "linear-gradient(135deg, #f97316, #fb923c)";
    editBtn.textContent = "✏ Change value";

    confirmBtn.addEventListener("click", () => {
      addMessage("Yes, it's correct ✅", "user");
      openSuspicionModal();
    });

    editBtn.addEventListener("click", () => {
      addMessage("Let me edit that value.", "user");
      pendingSuspiciousRef.current = null;
      delayedAIMessage("No problem, let's correct it together.", () => {
        renderStep();
      });
    });

    row.appendChild(confirmBtn);
    row.appendChild(editBtn);
    inputArea.appendChild(row);
  }

  // --------- MODAL ---------

  function openSuspicionModal(): void {
    const modal = modalOverlayRef.current;
    if (!modal) return;
    modal.classList.remove("hidden");
  }

  function closeSuspicionModal(): void {
    const modal = modalOverlayRef.current;
    if (!modal) return;
    modal.classList.add("hidden");
  }

  function handleModalProceed(): void {
    const pending = pendingSuspiciousRef.current;
    if (!pending) {
      closeSuspicionModal();
      return;
    }

    const { stepId, value } = pending;
    pendingSuspiciousRef.current = null;
    closeSuspicionModal();

    delayedAIMessage(
      "Thanks for confirming. I'll continue with this value, but please be sure it's accurate.",
      () => {
        acceptValueAndContinue(stepId, value);
      }
    );
  }

  function handleModalEdit(): void {
    const pending = pendingSuspiciousRef.current;
    const stepId = pending ? pending.stepId : null;
    // stepId is intentionally unused, keeping original logic
    pendingSuspiciousRef.current = null;
    closeSuspicionModal();

    delayedAIMessage("Sure, let's adjust that number.", () => {
      renderStep();
    });
  }

  // --------- FLOW CONTROL ---------

  function acceptValueAndContinue(stepId: StepId, numeric: number): void {
    const answers = answersRef.current;
    const invalidAttempts = invalidAttemptsRef.current;

    answers[stepId] = numeric;
    invalidAttempts[stepId] = 0;

    goToNextStep();
  }


  function goToNextStep(): void {
    const steps = stepsRef.current;
    currentStepIndexRef.current += 1;

    if (currentStepIndexRef.current < steps.length) {
      const nextStep = steps[currentStepIndexRef.current];
      delayedAIMessage(nextStep.label, () => {
        renderStep();
      });
    } else {
      calculateAndShowResult();
    }
  }

  // --------- CALCULATION ---------

  function calculateAndShowResult(): void {
    const answers = answersRef.current;
    const { carat, weight, rate, making } = answers;

    if (!carat || !weight || !rate || making === null) {
      addMessage(
        "Something went wrong while collecting inputs. Please start a new calculation.",
        "ai"
      );
      renderRestartButton();
      return;
    }

    const purityFactor = carat / 24;
    const caratRate = rate * purityFactor;
    const goldPrice = caratRate * weight;
    const subtotal = goldPrice + making;
    const gstRate = 0.03;
    const gstAmount = subtotal * gstRate;
    const grandTotal = subtotal + gstAmount;

    const formatINR = (val: number): string =>
      val.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      });

    const summaryHTML = `
      <div class="result-card">
        <div class="result-header">
          <div>
            <div class="result-title">Final Jewellery Price (Including 3% GST)</div>
          </div>
          <div class="result-pill">${carat}K • ${weight} g</div>
        </div>
        <div class="result-amount">${formatINR(grandTotal)}</div>
        <div class="result-breakdown">
          <div class="result-breakdown-row">
            <span>24K rate today</span>
            <span>${formatINR(rate)}/g</span>
          </div>
          <div class="result-breakdown-row">
            <span>${carat}K effective rate</span>
            <span>${formatINR(caratRate)}/g</span>
          </div>
          <div class="result-breakdown-row">
            <span>Gold value (${weight} g × ${carat}K rate)</span>
            <span>${formatINR(goldPrice)}</span>
          </div>
          <div class="result-breakdown-row">
            <span>Making charges</span>
            <span>${formatINR(making)}</span>
          </div>
          <div class="result-breakdown-row">
            <span>Subtotal (before GST)</span>
            <span>${formatINR(subtotal)}</span>
          </div>
          <div class="result-breakdown-row">
            <span>GST @ 3%</span>
            <span>${formatINR(gstAmount)}</span>
          </div>
        </div>
        <div class="result-highlight">
          For this ${carat}K jewellery of <strong>${weight} g</strong>, your final
          payable amount is <strong>${formatINR(grandTotal)}</strong>.<br/>
          GST at 3% is already included — you can show this directly to your customer.
        </div>
      </div>
    `;

    delayedAIMessage("Perfect. Let me crunch the numbers for you…", () => {
      addMessage(summaryHTML, "ai", true);

      setTimeout(() => {
        addMessage(
          "If you want, we can calculate another design. Just use the button below.",
          "ai"
        );
        renderRestartButton();
      }, 500);
    });
  }

  function renderRestartButton(): void {
    const inputArea = inputAreaRef.current;
    if (!inputArea) return;

    inputArea.innerHTML = "";

    const row = document.createElement("div");
    row.className = "input-row";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary-btn";
    btn.textContent = "Start a new calculation";

    btn.addEventListener("click", () => {
      const answers = answersRef.current;
      const invalidAttempts = invalidAttemptsRef.current;

      answers.carat = null;
      answers.weight = null;
      answers.rate = null;
      answers.making = null;

      invalidAttempts.weight = 0;
      invalidAttempts.rate = 0;
      invalidAttempts.making = 0;

      pendingSuspiciousRef.current = null;
      currentStepIndexRef.current = 0;

      delayedAIMessage(
        "Sure! Let's set up a fresh jewellery calculation.",
        () => {
          const firstStep = stepsRef.current[0];
          delayedAIMessage(firstStep.label, () => {
            renderStep();
          });
        }
      );
    });

    row.appendChild(btn);
    inputArea.appendChild(row);
  }

  // --------- INITIAL GREETING ---------

  function startConversation(): void {
    delayedAIMessage(
      "Hi, I’m your Openroot Gold AI assistant. I’ll ask you a few quick questions and then show a transparent price breakdown for your jewellery.",
      () => {
        delayedAIMessage(
          "GST at 3% will be automatically included in the final amount.",
          () => {
            const firstStep = stepsRef.current[0];
            delayedAIMessage(firstStep.label, () => {
              renderStep();
            });
          }
        );
      }
    );
  }

  useEffect(() => {
    startConversation();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-wrapper">
        <main className="main-layout">
          <section className="assistant-card">
            <div className="assistant-header">
              <div className="status-dot"></div>
              <span className="assistant-name">Midas Engine</span>
              <span className="assistant-tag">
                Openroot — Financial Intelligence Module
              </span>
            </div>

            <div
              id="chat-window"
              ref={chatWindowRef}
              className="chat-window"
            />

            <div
              id="input-area"
              ref={inputAreaRef}
              className="input-area"
            />
          </section>

          <aside className="info-card">
            <h2>How this AI works</h2>
            <ul>
              <li>Asks you step-by-step questions</li>
              <li>Calculates carat-wise gold value</li>
              <li>Adds making charges</li>
              <li>Applies 3% GST</li>
            </ul>
            <p className="info-note">
              Designed for jewellers &amp; buyers who want{" "}
              <span>transparent pricing</span> with a touch of AI.
            </p>
          </aside>
        </main>
      </div>

      {/* Modal */}
      <div
        id="confirm-modal"
        ref={modalOverlayRef}
        className="modal-overlay hidden"
      >
        <div className="modal-card">
          <div className="modal-icon">⚠️</div>
          <div className="modal-title">Double Check Required</div>
          <div className="modal-msg">
            This value looks unusually high. <br />
            Are you sure you want to continue?
          </div>

          <div className="modal-actions">
            <button
              id="modal-proceed-btn"
              className="modal-btn proceed"
              onClick={handleModalProceed}
            >
              Proceed Anyway
            </button>
            <button
              id="modal-edit-btn"
              className="modal-btn edit"
              onClick={handleModalEdit}
            >
              Edit Value
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoldAI;
