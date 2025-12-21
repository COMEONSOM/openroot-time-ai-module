import React, { useEffect, useState } from "react";
import GoldAI from "./tools/models/gold.jsx";
import StockAI from "./tools/models/stockavg.jsx";
import InvestmentGrowthAI from "./tools/models/sip.jsx";
import CreditEmiAI from "./tools/models/credit.jsx";
import LoveCalculator from "./tools/fun/LoveCalculator";
import LoveTarot from "./tools/fun/LoveTarot";

/* ============================================================
   TYPES
   ============================================================ */

type Category = "finance" | "fun";

type ToolId =
  | "gold"
  | "stock"
  | "return"
  | "credit"
  | "love"
  | "tarot";

/* ============================================================
   TOOL DEFINITIONS
   ============================================================ */

// Financial Tools
const FINANCIAL_TOOLS: {
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  {
    id: "gold",
    label: "Midas Engine",
    shortLabel: "Midas",
    icon: "/assets/icons/gold-bars.png",
  },
  {
    id: "stock",
    label: "InvestIQ Engine",
    shortLabel: "InvestIQ",
    icon: "/assets/icons/calculator.png",
  },
  {
    id: "return",
    label: "MoneyGrow Engine",
    shortLabel: "MoneyGrow",
    icon: "/assets/icons/growth-graph.png",
  },
  {
    id: "credit",
    label: "Debt Decoder Engine",
    shortLabel: "Debt",
    icon: "/assets/icons/credit-card.png",
  },
];

// Fun Zone Tools
const FUN_TOOLS: {
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  {
    id: "love",
    label: "Loveria Doze 😍",
    shortLabel: "Love",
    icon: "/assets/icons/love.png",
  },
  {
    id: "tarot",
    label: "Tarot Reading 🔮",
    shortLabel: "Tarot",
    icon: "/assets/icons/tarrot.jpg",
  },
];

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>("gold");
  const [activeCategory, setActiveCategory] =
    useState<Category>("finance");

  /* ============================================================
     RESTORE LAST SESSION (ON PAGE LOAD)
     ============================================================ */
  useEffect(() => {
    const savedTool = localStorage.getItem("or-active-tool") as ToolId | null;
    const savedCategory = localStorage.getItem(
      "or-active-category"
    ) as Category | null;

    if (savedTool) {
      setActiveTool(savedTool);
    }

    if (savedCategory === "finance" || savedCategory === "fun") {
      setActiveCategory(savedCategory);
    }
  }, []);

  /* ============================================================
     TOOL SELECTION HANDLER
     ============================================================ */
  const handleSelectTool = (toolId: ToolId): void => {
    setActiveTool(toolId);
    localStorage.setItem("or-active-tool", toolId);

    if (FINANCIAL_TOOLS.some((t) => t.id === toolId)) {
      setActiveCategory("finance");
      localStorage.setItem("or-active-category", "finance");
    } else if (FUN_TOOLS.some((t) => t.id === toolId)) {
      setActiveCategory("fun");
      localStorage.setItem("or-active-category", "fun");
    }
  };

  /* ============================================================
     CATEGORY SWITCH HANDLER
     ============================================================ */
  const handleCategoryChange = (category: Category): void => {
    setActiveCategory(category);
    localStorage.setItem("or-active-category", category);

    const list =
      category === "finance" ? FINANCIAL_TOOLS : FUN_TOOLS;

    if (!list.some((t) => t.id === activeTool) && list.length > 0) {
      const fallbackTool = list[0].id;
      setActiveTool(fallbackTool);
      localStorage.setItem("or-active-tool", fallbackTool);
    }
  };

  const toolsForActiveCategory =
    activeCategory === "finance" ? FINANCIAL_TOOLS : FUN_TOOLS;

  return (
    <div className="or-app-shell">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <nav className="or-nav">
        <div className="or-logo-row">
          <img
            src="/assets/company-icon.avif"
            alt="Openroot Logo"
            className="or-logo"
          />
          <div className="or-title-wrap">
            <div className="or-title">Openroot NIOR</div>
            <div className="or-subtitle">
              India's Indigenous AI System
            </div>
          </div>
        </div>

        <div className="or-tool-list">
          <div className="or-section-title">Financial Engines</div>

          {FINANCIAL_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={
                "or-tool-btn" +
                (tool.id === activeTool
                  ? " or-tool-btn-active"
                  : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <img
                src={tool.icon}
                alt=""
                className="or-tool-icon"
              />
              <span className="or-tool-label">
                {tool.label}
              </span>
            </button>
          ))}

          <div className="or-section-title fun-title">
            Fun Zone 🎉
          </div>

          {FUN_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={
                "or-tool-btn" +
                (tool.id === activeTool
                  ? " or-tool-btn-active"
                  : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <img
                src={tool.icon}
                alt=""
                className="or-tool-icon"
              />
              <span className="or-tool-label">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ================= MOBILE UI ================= */}
      <div className="or-mobile-shell">
        <header className="or-mobile-header">
          <div className="or-mobile-brand">
            <img
              src="/assets/company-icon.avif"
              alt="Openroot"
              className="or-mobile-logo"
            />
            <div className="or-mobile-title-wrap">
              <div className="or-mobile-title">
                Openroot NIOR
              </div>
              <div className="or-mobile-subtitle">
                India's Indigenous AI System
              </div>
            </div>
          </div>

          <div className="or-mobile-category-tabs">
            <button
              className={
                "or-mobile-tab" +
                (activeCategory === "finance"
                  ? " or-mobile-tab-active"
                  : "")
              }
              onClick={() => handleCategoryChange("finance")}
            >
              Finance
            </button>
            <button
              className={
                "or-mobile-tab" +
                (activeCategory === "fun"
                  ? " or-mobile-tab-active"
                  : "")
              }
              onClick={() => handleCategoryChange("fun")}
            >
              Fun Zone
            </button>
          </div>
        </header>

        <div className="or-mobile-tool-strip">
          {toolsForActiveCategory.map((tool) => (
            <button
              key={tool.id}
              className={
                "mobile-tool-card" +
                (tool.id === activeTool
                  ? " mobile-tool-card-active"
                  : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <div className="mobile-tool-icon-wrap">
                <img src={tool.icon} alt="" />
              </div>
              <div className="mobile-tool-label">
                {tool.shortLabel}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ================= MAIN PANEL ================= */}
      <main className="or-tool-panel">
        {activeTool === "gold" && <GoldAI />}
        {activeTool === "stock" && <StockAI />}
        {activeTool === "return" && <InvestmentGrowthAI />}
        {activeTool === "credit" && <CreditEmiAI />}
        {activeTool === "love" && <LoveCalculator />}
        {activeTool === "tarot" && <LoveTarot />}
      </main>
    </div>
  );
}
