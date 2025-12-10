import React, { useState } from "react";
import GoldAI from "./tools/models/gold.jsx";
import StockAI from "./tools/models/stockavg.jsx";
import InvestmentGrowthAI from "./tools/models/sip.jsx";
import CreditEmiAI from "./tools/models/credit.jsx";
import LoveCalculator from "./tools/fun/LoveCalculator";

// Financial Tools
const FINANCIAL_TOOLS = [
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
const FUN_TOOLS = [
  {
    id: "love",
    label: "Loveria Doze 😍",
    shortLabel: "Love",
    icon: "/assets/icons/love.png",
  },
];

const ALL_TOOLS = [...FINANCIAL_TOOLS, ...FUN_TOOLS];

export default function App() {
  const [activeTool, setActiveTool] = useState<string>("gold");
  const [activeCategory, setActiveCategory] = useState<"finance" | "fun">(
    "finance"
  );

  const handleSelectTool = (toolId: string) => {
    setActiveTool(toolId);

    if (FINANCIAL_TOOLS.some((t) => t.id === toolId)) {
      setActiveCategory("finance");
    } else if (FUN_TOOLS.some((t) => t.id === toolId)) {
      setActiveCategory("fun");
    }
  };

  const handleCategoryChange = (category: "finance" | "fun") => {
    setActiveCategory(category);

    const list = category === "finance" ? FINANCIAL_TOOLS : FUN_TOOLS;
    if (!list.some((t) => t.id === activeTool) && list.length > 0) {
      setActiveTool(list[0].id);
    }
  };

  const toolsForActiveCategory =
    activeCategory === "finance" ? FINANCIAL_TOOLS : FUN_TOOLS;

  return (
    <div className="or-app-shell">
      {/* Desktop Sidebar */}
      <nav className="or-nav">
        <div className="or-logo-row">
          <img
            src="/assets/openroot-white-nobg.png"
            alt="Openroot Logo"
            className="or-logo"
          />
          <div className="or-title-wrap">
            <div className="or-title">TIME AI</div>
            <div className="or-subtitle">India's Indigenous AI System</div>
          </div>
        </div>

        <div className="or-tool-list">
          <div className="or-section-title">Financial Engines</div>

          {FINANCIAL_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={
                "or-tool-btn" +
                (tool.id === activeTool ? " or-tool-btn-active" : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <img src={tool.icon} alt="" className="or-tool-icon" />
              <span className="or-tool-label">{tool.label}</span>
            </button>
          ))}

          <div className="or-section-title fun-title">Fun Zone 🎉</div>

          {FUN_TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={
                "or-tool-btn" +
                (tool.id === activeTool ? " or-tool-btn-active" : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <img src={tool.icon} alt="" className="or-tool-icon" />
              <span className="or-tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile UI */}
      <div className="or-mobile-shell">
        <header className="or-mobile-header">
          <div className="or-mobile-brand">
            <img
              src="/assets/company-icon.avif"
              alt="Openroot"
              className="or-mobile-logo"
            />
            <div className="or-mobile-title-wrap">
              <div className="or-mobile-title">Openroot TIME AI</div>
              <div className="or-mobile-subtitle">India's Indigenous AI System</div>
            </div>
          </div>

          <div className="or-mobile-category-tabs">
            <button
              className={
                "or-mobile-tab" +
                (activeCategory === "finance" ? " or-mobile-tab-active" : "")
              }
              onClick={() => handleCategoryChange("finance")}
            >
              Finance
            </button>
            <button
              className={
                "or-mobile-tab" +
                (activeCategory === "fun" ? " or-mobile-tab-active" : "")
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
                (tool.id === activeTool ? " mobile-tool-card-active" : "")
              }
              onClick={() => handleSelectTool(tool.id)}
            >
              <div className="mobile-tool-icon-wrap">
                <img src={tool.icon} alt="" />
              </div>
              <div className="mobile-tool-label">{tool.shortLabel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <main className="or-tool-panel">
        {activeTool === "gold" && <GoldAI />}
        {activeTool === "stock" && <StockAI />}
        {activeTool === "return" && <InvestmentGrowthAI />}
        {activeTool === "credit" && <CreditEmiAI />}
        {activeTool === "love" && <LoveCalculator />}
      </main>
    </div>
  );
}
