import React, { useState } from "react";
import GoldAI from "./tools/models/gold.jsx";
import StockAI from "./tools/models/stockavg.jsx";
import InvestmentGrowthAI from "./tools/models/sip.jsx";
import CreditEmiAI from "./tools/models/credit.jsx";

// Updated Tools with Icon filenames instead of emojis
const TOOLS = [
  {
    id: "gold",
    label: "Midas Engine",
    icon: "/assets/icons/gold-bars.png",
  },
  {
    id: "stock",
    label: "InvestIQ Engine",
    icon: "/assets/icons/calculator.png",
  },
  {
    id: "return",
    label: "MoneyGrow Engine",
    icon: "/assets/icons/growth-graph.png",
  },
  {
    id: "credit",
    label: "Debt Decoder Engine",
    icon: "/assets/icons/credit-card.png",
  },
];

export default function App() {
  const [activeTool, setActiveTool] = useState("gold");

  return (
    <div className="or-app-shell">

      {/* ░░ Navigation Sidebar / Top-bar ░░ */}
      <nav className="or-nav">
        <div className="or-logo-row">
          <img
            src="/assets/openroot-white-nobg.png"
            alt="Openroot Logo"
            className="or-logo"
          />
          <div className="or-title-wrap">
            <div className="or-title">TIME AI</div>
            <div className="or-subtitle">Financial Intelligence Module</div>
          </div>
        </div>

        <div className="or-tool-list">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={
                "or-tool-btn" +
                (tool.id === activeTool ? " or-tool-btn-active" : "")
              }
              onClick={() => setActiveTool(tool.id)}
            >
              <img
                src={tool.icon}
                alt=""
                className="or-tool-icon"
              />
              <span className="or-tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ░░ Main Tool Render Area ░░ */}
      <main className="or-tool-panel">
        {activeTool === "gold" && <GoldAI />}
        {activeTool === "stock" && <StockAI />}
        {activeTool === "return" && <InvestmentGrowthAI />}
        {activeTool === "credit" && <CreditEmiAI />}
      </main>

    </div>
  );
}
