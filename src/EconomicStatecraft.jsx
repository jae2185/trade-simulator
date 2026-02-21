import { useState, useEffect } from "react";

// ─── GAME CONSTANTS ──────────────────────────────────────────────────────────

const TOTAL_TURNS = 8;

const COUNTRIES = {
  home: { name: "Cascadia", flag: "🏔", color: "#e2c97e", desc: "A mid-sized open economy rich in natural resources and skilled labor." },
  usa:  { name: "Americana", flag: "🦅", color: "#4a9fe8", desc: "The dominant global power. Large capital-abundant economy." },
  china:{ name: "Sinica", flag: "🐉", color: "#e87f7f", desc: "Rising manufacturing giant. Labor-abundant with growing capital stock." },
  eu:   { name: "Eurozone", flag: "⚜", color: "#a57fa5", desc: "Integrated bloc of mid-sized capital-rich economies." },
  em:   { name: "Meridian", flag: "🌴", color: "#7fe87f", desc: "Emerging market. Labor-abundant, resource-rich, capital-scarce." },
};

const INITIAL_STATE = {
  turn: 1,
  phase: "brief", // brief | action | resolution | gameover
  actionsLeft: 2,
  log: [],
  shock: null,
  selectedActions: [],
  history: [], // snapshots: { turn, welfare, ToT, varieties, kl, exportShare }

  // Home country parameters (Ricardian + H-O + Standard)
  home: {
    K: 120,       // capital endowment
    L: 100,       // labor endowment
    productivity: 1.0,  // TFP multiplier
    ToT: 1.0,     // terms of trade
    welfare: 100, // welfare index (starts at 100)
    gdp: 130,     // nominal GDP
    varieties: 5, // Krugman varieties
    exportShare: 0.3, // Melitz export share
  },

  // Bilateral relationships [-100 hostile, 0 neutral, 100 allied]
  relations: { usa: 20, china: 10, eu: 40, em: 30 },

  // Bilateral trade volumes
  trade: { usa: 30, china: 20, eu: 25, em: 15 },

  // AI country states
  countries: {
    usa:  { K: 250, L: 150, welfare: 100, gdp: 350, ToT: 1.2, relations_to_home: 20 },
    china:{ K: 180, L: 300, welfare: 100, gdp: 280, ToT: 0.9, relations_to_home: 10 },
    eu:   { K: 200, L: 160, welfare: 100, gdp: 300, ToT: 1.1, relations_to_home: 40 },
    em:   { K: 60,  L: 200, welfare: 100, gdp: 100, ToT: 0.7, relations_to_home: 30 },
  },
};

const POLICY_ACTIONS = [
  {
    id: "fta",
    label: "Sign FTA",
    icon: "🤝",
    category: "TRADE",
    desc: "Sign a Free Trade Agreement with a partner. Reduces trade costs, increases varieties available (Krugman), raises welfare.",
    requiresTarget: true,
    targets: ["usa", "china", "eu", "em"],
    effect: (state, target) => {
      const s = deepClone(state);
      s.relations[target] = Math.min(100, s.relations[target] + 20);
      s.trade[target] = Math.round(s.trade[target] * 1.3);
      // Krugman: more varieties, lower prices
      s.home.varieties = Math.round(s.home.varieties * 1.15);
      s.home.welfare = Math.round(s.home.welfare * 1.04);
      s.home.ToT = Math.min(3, s.home.ToT * 1.05);
      s.log.push({ turn: state.turn, type: "policy", text: `✅ FTA signed with ${COUNTRIES[target].name}. Trade volume +30%, 4% welfare gain, relations improved.` });
      // AI reacts positively
      s.countries[target].relations_to_home = Math.min(100, s.countries[target].relations_to_home + 15);
      return s;
    },
  },
  {
    id: "tariff",
    label: "Impose Tariff",
    icon: "🚧",
    category: "TRADE",
    desc: "Impose a tariff on imports from a partner. Protects domestic industry short-term but risks retaliation and welfare loss.",
    requiresTarget: true,
    targets: ["usa", "china", "eu", "em"],
    effect: (state, target) => {
      const s = deepClone(state);
      s.relations[target] = Math.max(-100, s.relations[target] - 25);
      s.trade[target] = Math.round(s.trade[target] * 0.7);
      // Standard trade: ToT effect ambiguous, welfare loss from distortion
      s.home.welfare = Math.round(s.home.welfare * 0.97);
      s.home.ToT = s.home.ToT * 0.95;
      // Retaliation: if relations already bad, they hit back
      if (s.relations[target] < 0) {
        s.home.welfare = Math.round(s.home.welfare * 0.97);
        s.log.push({ turn: state.turn, type: "event", text: `⚠️ ${COUNTRIES[target].name} retaliates with counter-tariffs. Additional welfare loss.` });
      }
      s.log.push({ turn: state.turn, type: "policy", text: `🚧 Tariff imposed on ${COUNTRIES[target].name}. Trade -30%, welfare -3%, relations deteriorated.` });
      s.countries[target].relations_to_home = Math.max(-100, s.countries[target].relations_to_home - 20);
      return s;
    },
  },
  {
    id: "sanctions",
    label: "Impose Sanctions",
    icon: "🔒",
    category: "TRADE",
    desc: "Economic sanctions on a rival. Severs trade, damages their economy, but costly for you and allies may object.",
    requiresTarget: true,
    targets: ["usa", "china", "eu", "em"],
    effect: (state, target) => {
      const s = deepClone(state);
      s.relations[target] = Math.max(-100, s.relations[target] - 40);
      const tradeLost = s.trade[target];
      s.trade[target] = 0;
      s.home.welfare = Math.round(s.home.welfare * 0.95);
      s.home.gdp = Math.round(s.home.gdp * 0.97);
      s.countries[target].welfare = Math.round(s.countries[target].welfare * 0.92);
      s.countries[target].gdp = Math.round(s.countries[target].gdp * 0.93);
      s.countries[target].relations_to_home = -80;
      // Allies may object
      Object.keys(s.relations).forEach(c => {
        if (c !== target && s.relations[c] > 30) {
          s.relations[c] = Math.max(-100, s.relations[c] - 10);
          s.log.push({ turn: state.turn, type: "event", text: `${COUNTRIES[c].name} expresses concern over sanctions on ${COUNTRIES[target].name}.` });
        }
      });
      s.log.push({ turn: state.turn, type: "policy", text: `🔒 Sanctions imposed on ${COUNTRIES[target].name}. Trade severed, -5% welfare, target economy damaged.` });
      return s;
    },
  },
  {
    id: "invest_capital",
    label: "Invest in Capital",
    icon: "🏭",
    category: "INDUSTRIAL",
    desc: "State-led capital investment. Raises K/L ratio over time, shifting comparative advantage toward capital-intensive goods (H-O).",
    requiresTarget: false,
    effect: (state) => {
      const s = deepClone(state);
      s.home.K = Math.round(s.home.K * 1.12);
      s.home.gdp = Math.round(s.home.gdp * 1.03);
      // H-O: becoming more capital abundant shifts exports
      const newKL = s.home.K / s.home.L;
      s.log.push({ turn: state.turn, type: "policy", text: `🏭 Capital investment program launched. K +12%, K/L ratio now ${newKL.toFixed(2)}. Comparative advantage shifting.` });
      return s;
    },
  },
  {
    id: "invest_labor",
    label: "Invest in Education",
    icon: "🎓",
    category: "INDUSTRIAL",
    desc: "Productivity-enhancing education investment. Raises TFP (Ricardian shift), expanding effective PPF in all sectors.",
    requiresTarget: false,
    effect: (state) => {
      const s = deepClone(state);
      s.home.productivity = Math.round(s.home.productivity * 1.08 * 100) / 100;
      s.home.welfare = Math.round(s.home.welfare * 1.03);
      s.home.gdp = Math.round(s.home.gdp * 1.04);
      s.log.push({ turn: state.turn, type: "policy", text: `🎓 Education investment. TFP +8% → ${s.home.productivity.toFixed(2)}. Welfare +3%, GDP +4%.` });
      return s;
    },
  },
  {
    id: "industrial_policy",
    label: "Industrial Policy",
    icon: "⚙️",
    category: "INDUSTRIAL",
    desc: "Target an IRS sector for subsidies. Exploits home market effect (Krugman) — larger domestic base attracts more varieties, lowers prices.",
    requiresTarget: false,
    effect: (state) => {
      const s = deepClone(state);
      s.home.varieties = Math.round(s.home.varieties * 1.25);
      s.home.welfare = Math.round(s.home.welfare * 1.02);
      s.home.exportShare = Math.min(0.9, s.home.exportShare * 1.15);
      // Cost: slight gdp drag from subsidy
      s.home.gdp = Math.round(s.home.gdp * 0.99);
      s.log.push({ turn: state.turn, type: "policy", text: `⚙️ Industrial policy: IRS sector subsidy. Varieties +25%, export share +15%. Home market effect strengthened.` });
      return s;
    },
  },
  {
    id: "currency",
    label: "Currency Intervention",
    icon: "💱",
    category: "MONETARY",
    desc: "Depreciate your currency to boost export competitiveness. Improves ToT short-term but risks inflation and partner retaliation.",
    requiresTarget: false,
    effect: (state) => {
      const s = deepClone(state);
      s.home.ToT = Math.min(3, s.home.ToT * 1.15);
      s.home.welfare = Math.round(s.home.welfare * 1.02);
      // Partners notice — relations dip slightly
      Object.keys(s.relations).forEach(c => {
        s.relations[c] = Math.max(-100, s.relations[c] - 5);
      });
      s.log.push({ turn: state.turn, type: "policy", text: `💱 Currency depreciation. ToT +15% → ${s.home.ToT.toFixed(2)}. Short-term welfare gain, partners unhappy.` });
      return s;
    },
  },
  {
    id: "diplomacy",
    label: "Diplomatic Initiative",
    icon: "🕊",
    category: "DIPLOMATIC",
    desc: "Invest in diplomatic relations with a partner. Improves bilateral relationship, reduces risk of retaliation, opens door to future FTAs.",
    requiresTarget: true,
    targets: ["usa", "china", "eu", "em"],
    effect: (state, target) => {
      const s = deepClone(state);
      s.relations[target] = Math.min(100, s.relations[target] + 30);
      s.countries[target].relations_to_home = Math.min(100, s.countries[target].relations_to_home + 25);
      s.log.push({ turn: state.turn, type: "policy", text: `🕊 Diplomatic initiative with ${COUNTRIES[target].name}. Relations +30, now at ${s.relations[target]}.` });
      return s;
    },
  },
  {
    id: "liberalize",
    label: "Unilateral Liberalization",
    icon: "🌐",
    category: "TRADE",
    desc: "Open your economy unilaterally. Large welfare gain from exchange and variety, but domestic import-competing industries lose (Stolper-Samuelson).",
    requiresTarget: false,
    effect: (state) => {
      const s = deepClone(state);
      s.home.welfare = Math.round(s.home.welfare * 1.06);
      s.home.varieties = Math.round(s.home.varieties * 1.2);
      s.home.ToT = s.home.ToT * 0.97; // slight adverse ToT from import surge
      Object.keys(s.trade).forEach(c => { s.trade[c] = Math.round(s.trade[c] * 1.2); });
      s.log.push({ turn: state.turn, type: "policy", text: `🌐 Unilateral liberalization. Welfare +6%, varieties +20%, all trade +20%. Import-competing sectors face pressure.` });
      return s;
    },
  },
];

const SHOCKS = [
  { id: "commodity_boom", text: "⬆ Global commodity boom. Your ToT improves significantly.", effect: s => { s.home.ToT = Math.min(3, s.home.ToT * 1.3); s.home.welfare = Math.round(s.home.welfare * 1.05); return s; } },
  { id: "commodity_bust", text: "⬇ Commodity price collapse. ToT deteriorates sharply.", effect: s => { s.home.ToT = Math.max(0.2, s.home.ToT * 0.75); s.home.welfare = Math.round(s.home.welfare * 0.95); return s; } },
  { id: "global_recession", text: "📉 Global recession. All trade volumes fall 20%.", effect: s => { Object.keys(s.trade).forEach(c => { s.trade[c] = Math.round(s.trade[c] * 0.8); }); s.home.welfare = Math.round(s.home.welfare * 0.96); return s; } },
  { id: "tech_shock", text: "💡 Global tech breakthrough. Productivity gains for open economies.", effect: s => { s.home.productivity = Math.round(s.home.productivity * 1.05 * 100) / 100; s.home.welfare = Math.round(s.home.welfare * 1.03); return s; } },
  { id: "trade_war", text: "⚔ Global trade war erupts. High-tariff countries suffer most.", effect: s => { s.home.welfare = Math.round(s.home.welfare * 0.97); s.home.ToT = s.home.ToT * 0.92; return s; } },
  { id: "pandemic", text: "🦠 Pandemic disrupts global supply chains. Trade costs rise.", effect: s => { Object.keys(s.trade).forEach(c => { s.trade[c] = Math.round(s.trade[c] * 0.7); }); s.home.varieties = Math.max(1, Math.round(s.home.varieties * 0.85)); return s; } },
  { id: "china_growth", text: "🐉 Sinica surges. Their export competitiveness increases.", effect: s => { s.countries.china.K = Math.round(s.countries.china.K * 1.1); s.countries.china.welfare = Math.round(s.countries.china.welfare * 1.04); return s; } },
  { id: "fdi_boom", text: "💰 FDI inflows surge. Capital deepening accelerates.", effect: s => { s.home.K = Math.round(s.home.K * 1.08); s.home.gdp = Math.round(s.home.gdp * 1.03); return s; } },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function getWelfareRating(welfare) {
  if (welfare >= 130) return { label: "Flourishing", color: "#7fe87f" };
  if (welfare >= 110) return { label: "Prosperous", color: "#a8d87f" };
  if (welfare >= 90)  return { label: "Stable", color: "#e2c97e" };
  if (welfare >= 70)  return { label: "Struggling", color: "#e8a87f" };
  return { label: "Crisis", color: "#e87f7f" };
}

function getRelationLabel(rel) {
  if (rel >= 60) return { label: "Allied", color: "#7fe87f" };
  if (rel >= 20) return { label: "Friendly", color: "#a8d87f" };
  if (rel >= -20) return { label: "Neutral", color: "#8a9bb0" };
  if (rel >= -60) return { label: "Tense", color: "#e8a87f" };
  return { label: "Hostile", color: "#e87f7f" };
}

function rollShock() {
  return SHOCKS[Math.floor(Math.random() * SHOCKS.length)];
}

function applyAITurns(state) {
  const s = deepClone(state);
  // Simple AI: each country grows slightly, adjusts relations based on home actions
  Object.keys(s.countries).forEach(c => {
    s.countries[c].gdp = Math.round(s.countries[c].gdp * (1 + Math.random() * 0.03));
    s.countries[c].welfare = Math.round(s.countries[c].welfare * (1 + (Math.random() - 0.3) * 0.02));
    // Drift relations slightly toward neutral
    s.relations[c] = Math.round(s.relations[c] * 0.95);
  });
  return s;
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

const mono = "'IBM Plex Mono', monospace";
const C = { gold: "#e2c97e", blue: "#4a9fe8", bg: "#080f18", panel: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", dim: "#3a5a7a", text: "#c8d8e8" };

function GlowBar({ value, max = 100, color = C.gold, width = "100%" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width, height: 5, background: "#0d1a24", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}88`, transition: "width 0.4s" }} />
    </div>
  );
}

function StatRow({ label, value, unit = "", color = C.text }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
      <span style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim, letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: "0.78rem", color, fontWeight: 600 }}>{value}{unit}</span>
    </div>
  );
}

function Card({ title, children, accent = C.blue, style = {} }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderTop: `2px solid ${accent}`, borderRadius: "2px", padding: "1rem", ...style }}>
      {title && <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: accent, marginBottom: "0.8rem", textTransform: "uppercase" }}>{title}</div>}
      {children}
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

function IntroScreen({ onStart }) {
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontSize: "0.65rem", letterSpacing: "0.2em", color: C.dim, marginBottom: "1rem" }}>CLASSIFIED — ECONOMIC INTELLIGENCE DIVISION</div>
      <div style={{ fontSize: "2.5rem", fontWeight: 300, color: C.gold, letterSpacing: "0.08em", marginBottom: "0.5rem", fontFamily: mono }}>STATECRAFT</div>
      <div style={{ fontFamily: mono, fontSize: "0.75rem", color: C.dim, marginBottom: "2rem", letterSpacing: "0.1em" }}>ECONOMIC STRATEGY SIMULATION // v1.0</div>
      <div style={{ maxWidth: 520, fontSize: "0.82rem", color: "#8a9bb0", lineHeight: 1.8, marginBottom: "2.5rem", fontFamily: mono }}>
        You are the Minister of Trade for <span style={{ color: C.gold }}>Cascadia</span> — a mid-sized open economy navigating a multipolar world. Over 8 turns, make trade and industrial policy decisions grounded in real economic models. Each action has model-derived consequences. Your goal: maximize national welfare.
        <br /><br />
        <span style={{ color: "#5a7a9a" }}>Powered by Ricardian, H-O, Standard Trade, Krugman & Melitz models.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.8rem", marginBottom: "2.5rem", maxWidth: 600 }}>
        {Object.entries(COUNTRIES).filter(([k]) => k !== "home").map(([k, c]) => (
          <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, padding: "0.6rem", borderRadius: "2px", fontFamily: mono }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{c.flag}</div>
            <div style={{ fontSize: "0.62rem", color: c.color }}>{c.name}</div>
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{
        background: "none", border: `1px solid ${C.gold}`, color: C.gold,
        fontFamily: mono, fontSize: "0.75rem", letterSpacing: "0.12em",
        padding: "0.8rem 2.5rem", cursor: "pointer", borderRadius: "2px",
        textTransform: "uppercase", transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.target.style.background = C.gold; e.target.style.color = "#080f18"; }}
        onMouseLeave={e => { e.target.style.background = "none"; e.target.style.color = C.gold; }}
      >
        BEGIN SIMULATION ▸
      </button>
    </div>
  );
}


// ─── BRIEFING CHARTS ─────────────────────────────────────────────────────────

function MiniChart({ width = 220, height = 110, xMax, yMax, children, xLabel = "", yLabel = "" }) {
  const pad = { top: 10, right: 10, bottom: 24, left: 36 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const sx = v => (v / xMax) * W;
  const sy = v => H - (v / yMax) * H;
  return (
    <svg width={width} height={height} style={{ fontFamily: mono }}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {[0.5, 1].map(f => (
          <g key={f}>
            <line x1={0} y1={sy(f * yMax)} x2={W} y2={sy(f * yMax)} stroke="rgba(255,255,255,0.04)" />
          </g>
        ))}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#2a3a4a" strokeWidth={1} />
        <line x1={0} y1={0} x2={0} y2={H} stroke="#2a3a4a" strokeWidth={1} />
        <text x={W / 2} y={H + 18} textAnchor="middle" fill="#3a5a7a" fontSize={7}>{xLabel}</text>
        <text x={-H / 2} y={-28} textAnchor="middle" fill="#3a5a7a" fontSize={7} transform="rotate(-90)">{yLabel}</text>
        {[0, 0.5, 1].map(f => (
          <text key={f} x={-4} y={sy(f * yMax) + 3} textAnchor="end" fill="#3a5a7a" fontSize={6.5}>{(f * yMax).toFixed(0)}</text>
        ))}
        {children({ sx, sy, W, H })}
      </g>
    </svg>
  );
}

function WelfareChart({ history }) {
  if (history.length === 0) return (
    <div style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim, padding: "1rem", textAlign: "center" }}>
      No data yet — complete a turn to see welfare history.
    </div>
  );
  const allW = [100, ...history.map(h => h.welfare)];
  const maxW = Math.max(...allW) * 1.1;
  const minW = Math.min(...allW) * 0.92;
  const range = maxW - minW;
  const pts = history.map((h, i) => ({ x: i + 1, y: h.welfare }));
  return (
    <MiniChart width={230} height={120} xMax={Math.max(8, history.length + 0.5)} yMax={range} xLabel="Turn" yLabel="Welfare">
      {({ sx, sy, W, H }) => {
        const adjY = v => H - ((v - minW) / range) * H;
        // Baseline
        <line x1={0} y1={adjY(100)} x2={W} y2={adjY(100)} stroke="#3a5a3a" strokeWidth={1} strokeDasharray="3,2" />;
        const polyPts = pts.map(p => `${sx(p.x)},${adjY(p.y)}`).join(" ");
        return (
          <>
            <line x1={0} y1={adjY(100)} x2={W} y2={adjY(100)} stroke="#3a5a3a" strokeWidth={1} strokeDasharray="3,2" />
            <text x={W + 2} y={adjY(100) + 3} fill="#3a5a3a" fontSize={6}>base</text>
            {pts.length > 1 && <polyline points={polyPts} fill="none" stroke={C.gold} strokeWidth={2} />}
            {pts.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={adjY(p.y)} r={3} fill={p.y >= 100 ? "#7fe87f" : "#e87f7f"} />
            ))}
          </>
        );
      }}
    </MiniChart>
  );
}

function PPFChart({ home }) {
  const size = home.productivity * Math.sqrt(home.K * home.L);
  const ppf = x => {
    if (x <= 0) return size;
    if (x >= size) return 0;
    return size * Math.pow(Math.max(0, 1 - Math.pow(x / size, 2)), 0.5);
  };
  const nPts = 40;
  const ppfPts = Array.from({ length: nPts + 1 }, (_, i) => ({ x: (i / nPts) * size, y: ppf((i / nPts) * size) }));
  const ToT = home.ToT;
  // Production point: find tangency
  let prodX = size / 2;
  for (let i = 0; i < 60; i++) {
    const x = Math.max(1, Math.min(prodX, size - 1));
    const slope = x / Math.sqrt(Math.max(1e-6, size * size - x * x));
    if (slope < ToT) prodX = Math.min(prodX + size * 0.02, size - 1);
    else prodX = Math.max(prodX - size * 0.02, 1);
  }
  const prodY = ppf(prodX);
  const sMax = size * 1.1;
  return (
    <MiniChart width={230} height={120} xMax={sMax} yMax={sMax} xLabel="Good X" yLabel="Good Y">
      {({ sx, sy }) => {
        const ppfLine = ppfPts.map(p => `${sx(p.x)},${sy(p.y)}`).join(" ");
        const blY0 = prodY + prodX * ToT;
        const blX1 = Math.min(blY0 / ToT, sMax);
        const blY1 = Math.max(0, blY0 - blX1 * ToT);
        return (
          <>
            <polyline points={ppfLine} fill="none" stroke={C.blue} strokeWidth={2} />
            <line x1={sx(0)} y1={sy(Math.min(blY0, sMax))} x2={sx(blX1)} y2={sy(blY1)}
              stroke={C.gold} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.8} />
            <circle cx={sx(prodX)} cy={sy(prodY)} r={4} fill={C.gold} />
            <text x={sx(prodX) + 5} y={sy(prodY) + 3} fill={C.gold} fontSize={6.5}>ToT={ToT.toFixed(2)}</text>
          </>
        );
      }}
    </MiniChart>
  );
}

function KLChart({ home, aiCountries }) {
  const all = [
    { name: "Cascadia", kl: home.K / home.L, color: C.gold },
    { name: "Americana", kl: aiCountries.usa.K / aiCountries.usa.L, color: "#4a9fe8" },
    { name: "Sinica",    kl: aiCountries.china.K / aiCountries.china.L, color: "#e87f7f" },
    { name: "Eurozone",  kl: aiCountries.eu.K / aiCountries.eu.L, color: "#a57fa5" },
    { name: "Meridian",  kl: aiCountries.em.K / aiCountries.em.L, color: "#7fe87f" },
  ].sort((a, b) => b.kl - a.kl);
  const maxKL = Math.max(...all.map(c => c.kl)) * 1.15;
  const barH = 12;
  const gap = 4;
  const totalH = all.length * (barH + gap) + 20;
  const W = 190;
  return (
    <svg width={230} height={totalH + 10} style={{ fontFamily: mono }}>
      <g transform="translate(36,10)">
        <text x={W / 2} y={-4} textAnchor="middle" fill="#3a5a7a" fontSize={7}>K/L Ratio (capital abundance →)</text>
        {all.map((c, i) => {
          const barW = (c.kl / maxKL) * W;
          const y = i * (barH + gap);
          return (
            <g key={c.name}>
              <text x={-4} y={y + barH - 2} textAnchor="end" fill={c.color} fontSize={6.5}>{c.name}</text>
              <rect x={0} y={y} width={barW} height={barH} fill={c.color} opacity={0.7} rx={1} />
              <text x={barW + 3} y={y + barH - 2} fill={c.color} fontSize={6.5}>{c.kl.toFixed(2)}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function VarietyChart({ history, currentVarieties }) {
  const autarky = 5; // baseline
  const data = [
    { label: "Autarky", value: autarky, color: "#3a5a7a" },
    { label: "Turn 1", value: history[0]?.varieties ?? autarky, color: "#5a7a9a" },
    { label: `T${Math.ceil(history.length / 2) || 1}`, value: history[Math.floor(history.length / 2)]?.varieties ?? autarky, color: C.blue },
    { label: "Now", value: currentVarieties, color: C.gold },
  ];
  const maxV = Math.max(...data.map(d => d.value)) * 1.2;
  const W = 190;
  const H = 70;
  const barW = 30;
  const gap = (W - data.length * barW) / (data.length + 1);
  return (
    <svg width={230} height={H + 40} style={{ fontFamily: mono }}>
      <g transform="translate(20,10)">
        <text x={W / 2} y={-2} textAnchor="middle" fill="#3a5a7a" fontSize={7}>Varieties Available (Krugman gain)</text>
        {data.map((d, i) => {
          const x = gap + i * (barW + gap);
          const bh = (d.value / maxV) * H;
          return (
            <g key={d.label}>
              <rect x={x} y={H - bh} width={barW} height={bh} fill={d.color} opacity={0.75} rx={1} />
              <text x={x + barW / 2} y={H - bh - 3} textAnchor="middle" fill={d.color} fontSize={6.5}>{d.value}</text>
              <text x={x + barW / 2} y={H + 12} textAnchor="middle" fill="#3a5a7a" fontSize={6}>{d.label}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function EconomicDashboard({ state }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "none", border: `1px solid ${C.border}`, color: C.dim,
        fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.12em",
        padding: "0.4rem 0.8rem", cursor: "pointer", borderRadius: "2px",
        display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem"
      }}>
        {open ? "▾" : "▸"} ECONOMIC DASHBOARD
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <Card title="Welfare Index — History" accent={C.gold}>
            <WelfareChart history={state.history} />
          </Card>
          <Card title="PPF & Terms of Trade" accent={C.blue}>
            <PPFChart home={state.home} />
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.dim, marginTop: "0.3rem" }}>
              PPF size ∝ productivity × √(K·L). Gold line = world price.
            </div>
          </Card>
          <Card title="K/L Ratio vs Rivals (H-O)" accent="#a57fa5">
            <KLChart home={state.home} aiCountries={state.countries} />
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.dim, marginTop: "0.4rem" }}>
              Higher K/L = capital-abundant = exports capital-intensive goods.
            </div>
          </Card>
          <Card title="Varieties — Krugman Gains" accent="#7fe87f">
            <VarietyChart history={state.history} currentVarieties={state.home.varieties} />
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.dim, marginTop: "0.3rem" }}>
              Trade & industrial policy expand available product varieties.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function BriefingScreen({ state, onContinue }) {
  const shock = state.shock;
  return (
    <div style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.16em", color: C.dim, marginBottom: "0.5rem" }}>
        YEAR {2024 + state.turn} — TURN {state.turn} OF {TOTAL_TURNS}
      </div>
      <div style={{ fontSize: "1.4rem", color: C.gold, fontFamily: mono, fontWeight: 300, marginBottom: "1.5rem" }}>
        SITUATION BRIEFING
      </div>

      {shock && (
        <Card title="⚡ Global Event" accent="#e87f7f" style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.82rem", color: "#e8b8b8", lineHeight: 1.7 }}>{shock.text}</div>
        </Card>
      )}

      <Card title="Your Economy — Cascadia" accent={C.gold} style={{ marginBottom: "1.2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <StatRow label="Welfare Index" value={state.home.welfare} color={getWelfareRating(state.home.welfare).color} />
            <GlowBar value={state.home.welfare} max={160} color={getWelfareRating(state.home.welfare).color} />
            <div style={{ marginTop: "0.8rem" }} />
            <StatRow label="GDP" value={state.home.gdp} />
            <StatRow label="Terms of Trade" value={state.home.ToT.toFixed(2)} />
            <StatRow label="Productivity (TFP)" value={state.home.productivity.toFixed(2)} />
          </div>
          <div>
            <StatRow label="Capital (K)" value={state.home.K} />
            <StatRow label="Labor (L)" value={state.home.L} />
            <StatRow label="K/L Ratio" value={(state.home.K / state.home.L).toFixed(2)} />
            <StatRow label="Varieties" value={state.home.varieties} />
            <StatRow label="Export Share" value={`${(state.home.exportShare * 100).toFixed(0)}%`} />
          </div>
        </div>
      </Card>

      <Card title="World Relations" accent={C.blue} style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {Object.entries(state.relations).map(([c, rel]) => {
            const rl = getRelationLabel(rel);
            return (
              <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.6rem", background: "rgba(0,0,0,0.2)", borderRadius: "2px" }}>
                <span style={{ fontFamily: mono, fontSize: "0.7rem", color: COUNTRIES[c].color }}>{COUNTRIES[c].flag} {COUNTRIES[c].name}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: mono, fontSize: "0.65rem", color: rl.color }}>{rl.label}</span>
                  <span style={{ fontFamily: mono, fontSize: "0.6rem", color: C.dim, marginLeft: "0.4rem" }}>({rel > 0 ? "+" : ""}{rel})</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <EconomicDashboard state={state} />

      <button onClick={onContinue} style={{
        background: "none", border: `1px solid ${C.gold}`, color: C.gold,
        fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.1em",
        padding: "0.7rem 2rem", cursor: "pointer", borderRadius: "2px",
        textTransform: "uppercase"
      }}>
        PROCEED TO POLICY ACTIONS ▸
      </button>
    </div>
  );
}

function ActionScreen({ state, onAction, onEndTurn }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const categories = ["TRADE", "INDUSTRIAL", "MONETARY", "DIPLOMATIC"];

  const canConfirm = selectedAction && (!selectedAction.requiresTarget || selectedTarget);

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.16em", color: C.dim }}>TURN {state.turn} — POLICY ACTIONS</div>
          <div style={{ fontSize: "1.2rem", color: C.gold, fontFamily: mono, fontWeight: 300 }}>Choose your actions</div>
        </div>
        <div style={{ fontFamily: mono, fontSize: "0.8rem", color: state.actionsLeft > 0 ? C.gold : "#e87f7f" }}>
          {state.actionsLeft} ACTION{state.actionsLeft !== 1 ? "S" : ""} REMAINING
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: "1.2rem" }}>
              <div style={{ fontFamily: mono, fontSize: "0.58rem", letterSpacing: "0.14em", color: C.dim, marginBottom: "0.5rem" }}>{cat} POLICY</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {POLICY_ACTIONS.filter(a => a.category === cat).map(action => {
                  const isSelected = selectedAction?.id === action.id;
                  return (
                    <button key={action.id} onClick={() => { setSelectedAction(action); setSelectedTarget(null); }}
                      disabled={state.actionsLeft === 0}
                      style={{
                        background: isSelected ? "rgba(226,201,126,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? C.gold : C.border}`,
                        borderLeft: `3px solid ${isSelected ? C.gold : "transparent"}`,
                        color: state.actionsLeft === 0 ? C.dim : C.text,
                        fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.04em",
                        padding: "0.6rem 0.8rem", cursor: state.actionsLeft === 0 ? "not-allowed" : "pointer",
                        textAlign: "left", borderRadius: "2px", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "0.6rem"
                      }}>
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          {selectedAction ? (
            <Card title="Selected Action" accent={C.gold}>
              <div style={{ fontFamily: mono, fontSize: "1rem", color: C.gold, marginBottom: "0.5rem" }}>
                {selectedAction.icon} {selectedAction.label}
              </div>
              <div style={{ fontFamily: mono, fontSize: "0.72rem", color: "#8a9bb0", lineHeight: 1.7, marginBottom: "1rem" }}>
                {selectedAction.desc}
              </div>

              {selectedAction.requiresTarget && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.12em", color: C.dim, marginBottom: "0.5rem" }}>SELECT TARGET COUNTRY</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {selectedAction.targets.map(t => {
                      const rel = getRelationLabel(state.relations[t]);
                      return (
                        <button key={t} onClick={() => setSelectedTarget(t)} style={{
                          background: selectedTarget === t ? `${COUNTRIES[t].color}22` : "rgba(0,0,0,0.2)",
                          border: `1px solid ${selectedTarget === t ? COUNTRIES[t].color : C.border}`,
                          color: C.text, fontFamily: mono, fontSize: "0.72rem",
                          padding: "0.5rem 0.8rem", cursor: "pointer", textAlign: "left",
                          borderRadius: "2px", display: "flex", justifyContent: "space-between"
                        }}>
                          <span>{COUNTRIES[t].flag} {COUNTRIES[t].name}</span>
                          <span style={{ color: rel.color, fontSize: "0.62rem" }}>{rel.label} ({state.relations[t] > 0 ? "+" : ""}{state.relations[t]})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => {
                if (canConfirm) {
                  onAction(selectedAction, selectedTarget);
                  setSelectedAction(null);
                  setSelectedTarget(null);
                }
              }} disabled={!canConfirm}
                style={{
                  background: canConfirm ? C.gold : "transparent",
                  border: `1px solid ${canConfirm ? C.gold : C.dim}`,
                  color: canConfirm ? "#080f18" : C.dim,
                  fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.1em",
                  padding: "0.6rem 1.5rem", cursor: canConfirm ? "pointer" : "not-allowed",
                  borderRadius: "2px", fontWeight: 700, width: "100%", marginBottom: "0.5rem"
                }}>
                EXECUTE ACTION ▸
              </button>
            </Card>
          ) : (
            <Card title="Action Details" accent={C.dim}>
              <div style={{ fontFamily: mono, fontSize: "0.72rem", color: C.dim, lineHeight: 1.7 }}>
                Select a policy action from the left to see its economic effects and model basis.
              </div>
            </Card>
          )}

          {/* Action log for this turn */}
          {state.log.filter(l => l.turn === state.turn).length > 0 && (
            <Card title="This Turn" accent="#7fe87f" style={{ marginTop: "1rem" }}>
              {state.log.filter(l => l.turn === state.turn).map((l, i) => (
                <div key={i} style={{ fontFamily: mono, fontSize: "0.68rem", color: "#8a9bb0", marginBottom: "0.4rem", lineHeight: 1.6 }}>{l.text}</div>
              ))}
            </Card>
          )}

          <button onClick={onEndTurn} style={{
            background: "none", border: `1px solid ${C.blue}`, color: C.blue,
            fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.1em",
            padding: "0.7rem", cursor: "pointer", borderRadius: "2px",
            width: "100%", marginTop: "1rem", textTransform: "uppercase"
          }}>
            END TURN — ADVANCE TO {2024 + state.turn + 1} ▸
          </button>
        </div>
      </div>
      <div style={{ padding: "0 0 1.5rem 0" }}>
        <EconomicDashboard state={state} />
      </div>
    </div>
  );
}

function GameOverScreen({ state, onRestart }) {
  const rating = getWelfareRating(state.home.welfare);
  const welfareChange = state.home.welfare - 100;
  const topAlly = Object.entries(state.relations).sort((a, b) => b[1] - a[1])[0];
  const topRival = Object.entries(state.relations).sort((a, b) => a[1] - b[1])[0];

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.2em", color: C.dim, marginBottom: "1rem" }}>SIMULATION COMPLETE — YEAR {2024 + TOTAL_TURNS}</div>
      <div style={{ fontSize: "2rem", color: rating.color, fontFamily: mono, fontWeight: 300, marginBottom: "0.5rem" }}>{rating.label.toUpperCase()}</div>
      <div style={{ fontFamily: mono, fontSize: "0.75rem", color: C.dim, marginBottom: "2rem" }}>
        Final Welfare Index: <span style={{ color: rating.color, fontWeight: 700 }}>{state.home.welfare}</span>
        <span style={{ marginLeft: "1rem", color: welfareChange >= 0 ? "#7fe87f" : "#e87f7f" }}>
          ({welfareChange >= 0 ? "+" : ""}{welfareChange} from baseline)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem", maxWidth: 640, width: "100%" }}>
        <Card title="Economy" accent={C.gold}>
          <StatRow label="GDP" value={state.home.gdp} />
          <StatRow label="Productivity" value={state.home.productivity.toFixed(2)} />
          <StatRow label="K/L Ratio" value={(state.home.K / state.home.L).toFixed(2)} />
          <StatRow label="Varieties" value={state.home.varieties} />
        </Card>
        <Card title="Trade" accent={C.blue}>
          <StatRow label="Terms of Trade" value={state.home.ToT.toFixed(2)} />
          <StatRow label="Export Share" value={`${(state.home.exportShare * 100).toFixed(0)}%`} />
          <StatRow label="Top Ally" value={COUNTRIES[topAlly[0]].name} color={COUNTRIES[topAlly[0]].color} />
          <StatRow label="Top Rival" value={COUNTRIES[topRival[0]].name} color="#e87f7f" />
        </Card>
        <Card title="Score" accent={rating.color}>
          <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
            <div style={{ fontFamily: mono, fontSize: "2rem", color: rating.color, fontWeight: 700 }}>{state.home.welfare}</div>
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.dim, marginTop: "0.3rem" }}>welfare index</div>
            <div style={{ fontFamily: mono, fontSize: "0.9rem", color: rating.color, marginTop: "0.8rem" }}>{rating.label}</div>
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 600, width: "100%", marginBottom: "2rem" }}>
        <Card title="Event Log" accent={C.dim}>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {state.log.map((l, i) => (
              <div key={i} style={{ fontFamily: mono, fontSize: "0.65rem", color: "#5a7a9a", marginBottom: "0.3rem", lineHeight: 1.6 }}>
                <span style={{ color: C.dim }}>Y{2024 + l.turn} </span>{l.text}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <button onClick={onRestart} style={{
        background: "none", border: `1px solid ${C.gold}`, color: C.gold,
        fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.1em",
        padding: "0.7rem 2rem", cursor: "pointer", borderRadius: "2px",
      }}>
        PLAY AGAIN ▸
      </button>
    </div>
  );
}

// ─── MAIN GAME ───────────────────────────────────────────────────────────────

export default function EconomicStatecraft() {
  const [screen, setScreen] = useState("intro"); // intro | game | gameover
  const [state, setState] = useState(() => {
    let s = deepClone(INITIAL_STATE);
    const shock = rollShock();
    s.shock = shock;
    s = shock.effect(s);
    return s;
  });

  // Fix: initialize properly
  const initGame = () => {
    let s = deepClone(INITIAL_STATE);
    const shock = rollShock();
    s.shock = shock;
    s = shock.effect(s);
    setState(s);
    setScreen("game");
  };

  const handleAction = (action, target) => {
    if (state.actionsLeft <= 0) return;
    let s = action.effect(deepClone(state), target);
    s.actionsLeft = s.actionsLeft - 1;
    setState(s);
  };

  const handleEndTurn = () => {
    let s = deepClone(state);
    // Record history snapshot before advancing
    s.history = [...s.history, {
      turn: s.turn,
      welfare: s.home.welfare,
      ToT: s.home.ToT,
      varieties: s.home.varieties,
      kl: s.home.K / s.home.L,
      exportShare: s.home.exportShare,
      gdp: s.home.gdp,
    }];
    // Apply AI turns
    s = applyAITurns(s);
    // Advance turn
    s.turn = s.turn + 1;
    if (s.turn > TOTAL_TURNS) {
      setState(s);
      setScreen("gameover");
      return;
    }
    // New shock
    const shock = rollShock();
    s.shock = shock;
    s = shock.effect(s);
    s.actionsLeft = 2;
    s.phase = "brief";
    setState(s);
  };

  if (screen === "intro") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: #2a3a4a; }`}</style>
        <IntroScreen onStart={initGame} />
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
        <GameOverScreen state={state} onRestart={initGame} />
      </div>
    );
  }

  // Game screen — alternates between briefing and action
  const isBriefing = state.phase === "brief";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Turn header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0.7rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim, letterSpacing: "0.1em" }}>YEAR {2024 + state.turn}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {Array.from({ length: TOTAL_TURNS }).map((_, i) => (
              <div key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i < state.turn - 1 ? C.gold : i === state.turn - 1 ? C.blue : "#1a2a3a" }} />
            ))}
          </div>
          <span style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim }}>Turn {state.turn}/{TOTAL_TURNS}</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontSize: "0.7rem", color: getWelfareRating(state.home.welfare).color }}>
            ◆ Welfare: {state.home.welfare}
          </span>
          <span style={{ fontFamily: mono, fontSize: "0.7rem", color: C.dim }}>
            GDP: {state.home.gdp}
          </span>
        </div>
      </div>

      {isBriefing
        ? <BriefingScreen state={state} onContinue={() => setState(s => ({ ...s, phase: "action" }))} />
        : <ActionScreen state={state} onAction={handleAction} onEndTurn={handleEndTurn} />
      }
    </div>
  );
}
