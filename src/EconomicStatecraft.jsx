import { useState, useEffect } from "react";

// ─── GAME CONSTANTS ──────────────────────────────────────────────────────────

// ─── AI PERSONALITIES ─────────────────────────────────────────────────────────
const AI_PERSONALITIES = {
  usa: {
    name: "Americana",
    archetype: "Hegemon",
    tariffProb:    0.10, // low — prefers multilateral rules
    currWarProb:   0.05,
    ftaPoachProb:  0.30, // high — signs FTAs everywhere
    coalitionProb: 0.25,
    retaliationMult: 1.0, // proportional
    forgiveRate:   0.97, // relations drift fast toward neutral
    tooltip: "Prefers rules-based order. Low direct aggression but aggressively builds trade blocs.",
  },
  china: {
    name: "Sinica",
    archetype: "Rising Power",
    tariffProb:    0.40, // very high aggression
    currWarProb:   0.08,
    ftaPoachProb:  0.20,
    coalitionProb: 0.15,
    retaliationMult: 1.5, // escalates beyond tit-for-tat
    forgiveRate:   0.90, // holds grudges
    tooltip: "Highly aggressive on tariffs. Never backs down. Holds long grudges.",
  },
  eu: {
    name: "Eurozone",
    archetype: "Diplomatic Bloc",
    tariffProb:    0.08, // very low
    currWarProb:   0.04,
    ftaPoachProb:  0.15,
    coalitionProb: 0.45, // very high — punishes sanctions with coalitions
    retaliationMult: 0.7, // de-escalates
    forgiveRate:   0.98, // fast forgiveness
    tooltip: "Rarely aggressive but leads coalitions against sanctioners. Rewards diplomacy.",
  },
  em: {
    name: "Meridian",
    archetype: "Volatile Market",
    tariffProb:    0.20,
    currWarProb:   0.22, // high — currency instability
    ftaPoachProb:  0.12,
    coalitionProb: 0.10,
    retaliationMult: 0.8,
    forgiveRate:   0.99, // easily bought off
    tooltip: "Volatile currency policies. Easy to pacify with diplomacy or investment.",
  },
};

// ─── DIFFICULTY SETTINGS ─────────────────────────────────────────────────────
const DIFFICULTIES = {
  diplomat: {
    label: "DIPLOMAT",
    desc: "Reduced AI aggression, bonus starting relations, 3 actions/turn.",
    color: "#7fe87f",
    actionsPerTurn: 3,
    relationsBonus: 20,
    shockMult: 0.7,
    aiAggrMult: 0.5,
  },
  strategist: {
    label: "STRATEGIST",
    desc: "Standard conditions. 2 actions/turn.",
    color: "#e2c97e",
    actionsPerTurn: 2,
    relationsBonus: 0,
    shockMult: 1.0,
    aiAggrMult: 1.0,
  },
  hardliner: {
    label: "HARDLINER",
    desc: "AI is more aggressive. Shocks are severe. Relations start cold.",
    color: "#e87f7f",
    actionsPerTurn: 2,
    relationsBonus: -15,
    shockMult: 1.5,
    aiAggrMult: 1.8,
  },
};


const TOTAL_TURNS = 8;

// Export supply elasticities per country (for optimal tariff calc t* = 1/(ε-1))
const ELASTICITIES = {
  usa:  2.5, // large, diversified — moderate elasticity
  china:1.8, // highly competitive exports — low elasticity (market power)
  eu:   2.2,
  em:   3.5, // small economy — high elasticity
};

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
  history: [],
  crises: [], // pending AI-initiated events requiring player response
  ftaPartners: [], // countries with active FTAs

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
    usa:  { K: 250, L: 150, welfare: 100, gdp: 200, ToT: 1.2, relations_to_home: 20 },
    china:{ K: 180, L: 300, welfare: 100, gdp: 170, ToT: 0.9, relations_to_home: 10 },
    eu:   { K: 200, L: 160, welfare: 100, gdp: 185, ToT: 1.1, relations_to_home: 40 },
    em:   { K: 60,  L: 200, welfare: 100, gdp:  80, ToT: 0.7, relations_to_home: 30 },
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
      s.home.varieties = Math.max(3, Math.round(s.home.varieties * 1.15));
      s.home.welfare = Math.round(s.home.welfare * 1.04);
      s.home.gdp = Math.round(s.home.gdp * 1.05);
      s.home.ToT = Math.min(3, s.home.ToT * 1.05);
      s.ftaPartners = [...(s.ftaPartners || []), target];
      if (!s.stability) s.stability = {};
      s.stability[target] = 3; // stability bonus for 3 turns
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
      if (!s.hostility) s.hostility = {};
      s.hostility[target] = Math.max(s.hostility[target] || 0, 2); // linger 2 turns
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
      if (!s.sanctionHistory) s.sanctionHistory = [];
      if (!s.sanctionHistory.includes(target)) s.sanctionHistory.push(target); // persists
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
      s.home.gdp = Math.round(s.home.gdp * 1.07);
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
      s.home.gdp = Math.round(s.home.gdp * 1.08);
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
      s.home.varieties = Math.max(3, Math.round(s.home.varieties * 1.25));
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
      s.home.varieties = Math.max(3, Math.round(s.home.varieties * 1.2));
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
  { id: "pandemic", text: "🦠 Pandemic disrupts global supply chains. Trade costs rise.", effect: s => { Object.keys(s.trade).forEach(c => { s.trade[c] = Math.round(s.trade[c] * 0.7); }); s.home.varieties = Math.max(3, Math.round(s.home.varieties * 0.85)); return s; } },
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
  const newCrises = [];
  const diff = DIFFICULTIES[s.difficulty || "strategist"];
  const aggrMult = diff.aiAggrMult;

  // Decay multi-turn hostility counters
  if (!s.hostility) s.hostility = {};
  if (!s.stability) s.stability = {};
  if (!s.sanctionHistory) s.sanctionHistory = [];
  Object.keys(s.hostility).forEach(c => { s.hostility[c] = Math.max(0, s.hostility[c] - 1); });
  Object.keys(s.stability).forEach(c => { s.stability[c] = Math.max(0, s.stability[c] - 1); });

  Object.keys(s.countries).forEach(c => {
    const p = AI_PERSONALITIES[c];
    // AI growth
    s.countries[c].gdp = Math.round(s.countries[c].gdp * (1 + Math.random() * 0.015));
    s.countries[c].welfare = Math.round(s.countries[c].welfare * (1 + (Math.random() - 0.3) * 0.02));
    s.relations[c] = Math.round(s.relations[c] * p.forgiveRate); // drift per personality

    const rel = s.relations[c];
    // Multi-turn hostility boost: lingering anger from past tariffs/sanctions
    const hostilityBoost = (s.hostility[c] || 0) * 0.12;
    // Stability dampener: active FTA reduces crisis probability
    const stabilityDamp = s.stability[c] ? 0.4 : 1.0;

    // ── AI TARIFF (personality-weighted) ──
    const tariffCount = (s.log || []).filter(l => l.text.includes(`${COUNTRIES[c].name} imposed tariffs`)).length;
    const tariffProb = (p.tariffProb + hostilityBoost) * aggrMult * stabilityDamp;
    if (rel < -10 && Math.random() < tariffProb && tariffCount < 4) {
      const eps = ELASTICITIES[c];
      const optTariff = 1 / (eps - 1);
      // Sinica escalates above t*, others use t*
      const effectiveTariff = p.retaliationMult > 1.2 ? optTariff * p.retaliationMult : optTariff;
      newCrises.push({
        id: `tariff_${c}_${s.turn}`,
        type: "ai_tariff",
        country: c,
        epsilon: eps,
        optimalTariff: optTariff,
        personality: p.archetype,
        text: `${COUNTRIES[c].flag} ${COUNTRIES[c].name} [${p.archetype}] has imposed a tariff on Cascadian exports. ε=${eps.toFixed(1)}, t*=${(optTariff*100).toFixed(0)}%.${p.retaliationMult > 1.2 ? " ⚠ They are escalating ABOVE the optimal rate." : ""}`,
        resolved: false,
      });
      s.home.welfare = Math.round(s.home.welfare * 0.97);
      s.home.ToT = Math.max(0.2, s.home.ToT * 0.95);
      s.hostility[c] = Math.max(s.hostility[c] || 0, 2); // linger 2 turns
      s.log.push({ turn: s.turn, type: "event", text: `⚠️ ${COUNTRIES[c].name} [${p.archetype}] imposed tariffs on Cascadia. Welfare -3%.` });
    }

    // ── CURRENCY WAR (personality-weighted) ──
    const currProb = p.currWarProb * aggrMult * stabilityDamp;
    if (!s.ftaPartners?.includes(c) && Math.random() < currProb && rel < 0) {
      s.countries[c].ToT = Math.min(3, s.countries[c].ToT * 1.1);
      s.home.ToT = Math.max(0.2, s.home.ToT * 0.94);
      s.home.welfare = Math.round(s.home.welfare * 0.98);
      newCrises.push({
        id: `currwar_${c}_${s.turn}`,
        type: "currency_war",
        country: c,
        personality: p.archetype,
        text: `${COUNTRIES[c].flag} ${COUNTRIES[c].name} [${p.archetype}] has depreciated their currency. Your ToT fell. ${c === "em" ? "Meridian's volatile FX policy strikes again." : ""}`,
        resolved: false,
      });
      s.log.push({ turn: s.turn, type: "event", text: `💱 ${COUNTRIES[c].name} currency war. Welfare -2%.` });
    }

    // ── FTA POACHING (personality-weighted, Americana speciality) ──
    const poachProb = p.ftaPoachProb * aggrMult;
    if (Math.random() < poachProb && rel < 20) {
      const allies = Object.keys(s.relations).filter(x => x !== c && s.relations[x] > 40);
      if (allies.length > 0) {
        const ally = allies[Math.floor(Math.random() * allies.length)];
        const tradeLost = Math.round(s.trade[ally] * 0.15);
        s.trade[ally] = Math.max(0, s.trade[ally] - tradeLost);
        s.home.welfare = Math.round(s.home.welfare * 0.985);
        s.log.push({ turn: s.turn, type: "event", text: `📉 Trade diversion: ${COUNTRIES[c].name} signed FTA with ${COUNTRIES[ally].name}. Viner diversion cost: -${tradeLost} trade units.` });
      }
    }
  });

  // ── SANCTIONS COALITION (Eurozone leads, personality-weighted) ──
  const sanctioned = [...new Set([
    ...Object.keys(s.trade).filter(c => s.trade[c] === 0),
    ...s.sanctionHistory
  ])];
  if (sanctioned.length > 0) {
    Object.keys(s.relations).forEach(c => {
      const p = AI_PERSONALITIES[c];
      const coalProb = p.coalitionProb * aggrMult;
      const alreadyCoalesced = (s.log || []).filter(l => l.text.includes(`${COUNTRIES[c].name} joined a sanctions coalition`) && l.turn >= s.turn - 1).length > 0;
      if (!sanctioned.includes(c) && s.relations[c] < -10 && Math.random() < coalProb && !alreadyCoalesced) {
        s.home.welfare = Math.round(s.home.welfare * 0.96);
        s.home.gdp = Math.round(s.home.gdp * 0.97);
        s.log.push({ turn: s.turn, type: "event", text: `🔗 ${COUNTRIES[c].name} [${AI_PERSONALITIES[c].archetype}] joined sanctions coalition. Welfare -4%, GDP -3%.` });
        newCrises.push({
          id: `coalition_${c}_${s.turn}`,
          type: "sanctions_coalition",
          country: c,
          personality: AI_PERSONALITIES[c].archetype,
          text: `${COUNTRIES[c].flag} ${COUNTRIES[c].name} [${AI_PERSONALITIES[c].archetype}] joined a sanctions coalition. ${c === "eu" ? "The Eurozone is mobilizing its full diplomatic weight." : ""}`,
          resolved: false,
        });
      }
    });
  }

  s.crises = [...(s.crises || []).filter(cr => cr.resolved), ...newCrises];
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
  const [difficulty, setDifficulty] = useState("strategist");
  const diff = DIFFICULTIES[difficulty];
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontSize: "0.65rem", letterSpacing: "0.2em", color: C.dim, marginBottom: "1rem" }}>CLASSIFIED — ECONOMIC INTELLIGENCE DIVISION</div>
      <div style={{ fontSize: "2.5rem", fontWeight: 300, color: C.gold, letterSpacing: "0.08em", marginBottom: "0.5rem", fontFamily: mono }}>STATECRAFT</div>
      <div style={{ fontFamily: mono, fontSize: "0.75rem", color: C.dim, marginBottom: "2rem", letterSpacing: "0.1em" }}>ECONOMIC STRATEGY SIMULATION // v1.0</div>
      <div style={{ maxWidth: 520, fontSize: "0.82rem", color: "#8a9bb0", lineHeight: 1.8, marginBottom: "2rem", fontFamily: mono }}>
        You are the Minister of Trade for <span style={{ color: C.gold }}>Cascadia</span> — a mid-sized open economy navigating a multipolar world. Over 8 turns, make trade and industrial policy decisions grounded in real economic models. Each action has model-derived consequences. Your goal: maximize national welfare.
        <br /><br />
        <span style={{ color: "#5a7a9a" }}>Powered by Ricardian, H-O, Standard Trade, Krugman & Melitz models.</span>
      </div>

      {/* Country roster */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", marginBottom: "2rem", maxWidth: 560 }}>
        {Object.entries(AI_PERSONALITIES).map(([k, p]) => (
          <div key={k} style={{ background: C.panel, border: `1px solid ${COUNTRIES[k].color}44`, padding: "0.7rem 0.5rem", borderRadius: "2px", fontFamily: mono }}>
            <div style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{COUNTRIES[k].flag}</div>
            <div style={{ fontSize: "0.62rem", color: COUNTRIES[k].color, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: "0.55rem", color: C.dim, marginTop: "0.2rem" }}>{p.archetype}</div>
            <div style={{ fontSize: "0.55rem", color: "#3a5a6a", marginTop: "0.3rem", lineHeight: 1.4 }}>{p.tooltip}</div>
          </div>
        ))}
      </div>

      {/* Difficulty selector */}
      <div style={{ fontFamily: mono, fontSize: "0.6rem", color: C.dim, letterSpacing: "0.1em", marginBottom: "0.7rem" }}>SELECT DIFFICULTY</div>
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "0.6rem" }}>
        {Object.entries(DIFFICULTIES).map(([k, d]) => (
          <button key={k} onClick={() => setDifficulty(k)} style={{
            fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.08em",
            padding: "0.5rem 1.2rem", borderRadius: "2px", cursor: "pointer",
            background: difficulty === k ? `${d.color}22` : "none",
            border: `1px solid ${difficulty === k ? d.color : C.border}`,
            color: difficulty === k ? d.color : C.dim,
            transition: "all 0.15s",
          }}>{d.label}</button>
        ))}
      </div>
      <div style={{ fontFamily: mono, fontSize: "0.65rem", color: diff.color, marginBottom: "0.4rem" }}>{diff.desc}</div>
      <div style={{ fontFamily: mono, fontSize: "0.6rem", color: C.dim, marginBottom: "2rem" }}>
        {diff.actionsPerTurn} actions/turn · Relations {diff.relationsBonus >= 0 ? "+" : ""}{diff.relationsBonus} · Shock ×{diff.shockMult} · AI ×{diff.aiAggrMult}
      </div>

      {/* Win/Lose rules */}
      <div style={{ fontFamily: mono, fontSize: "0.6rem", color: C.dim, letterSpacing: "0.1em", marginBottom: "0.6rem" }}>OBJECTIVES</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem", maxWidth: 560 }}>
        {[
          { icon: "📈", label: "Economic Dominance", desc: "Finish with higher GDP than all rival nations" },
          { icon: "📊", label: "Welfare Threshold", desc: "Reach a welfare index of 130 or above" },
          { icon: "🛡", label: "Survive 8 Turns", desc: "Keep welfare above the collapse threshold of 70" },
        ].map((obj, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, padding: "0.6rem 0.7rem", borderRadius: "2px", textAlign: "left" }}>
            <div style={{ fontSize: "1rem", marginBottom: "0.3rem" }}>{obj.icon}</div>
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.text, fontWeight: 600, marginBottom: "0.2rem" }}>{obj.label}</div>
            <div style={{ fontFamily: mono, fontSize: "0.58rem", color: C.dim, lineHeight: 1.5 }}>{obj.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: mono, fontSize: "0.6rem", color: "#3a5a7a", marginBottom: "1.5rem" }}>
        3/3 = GRAND MASTER 🏆 · 2/3 = STRATEGIST ⭐ · 1/3 = DIPLOMAT 🕊 · Welfare &lt; 70 = DEFEAT 💀
      </div>

      <button onClick={() => onStart(difficulty)} style={{
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
  const autarky = INITIAL_STATE.home.varieties; // baseline = 5
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


// ─── CRISIS RESPONSE SCREEN ───────────────────────────────────────────────────

function CrisisScreen({ crisis, state, onRespond }) {
  const country = COUNTRIES[crisis.country];

  if (crisis.type === "ai_tariff") {
    const eps = crisis.epsilon;
    const tOpt = crisis.optimalTariff;
    const tAgg = tOpt * 1.4;
    const highMarketPower = eps < 2;
    const options = [
      {
        id: "absorb",
        label: "Absorb the loss",
        icon: "🕊",
        desc: `Accept the welfare hit. Relations with ${country.name} stabilize. No escalation.`,
        welfareEffect: -1,
        relationEffect: +10,
        color: "#7fe87f",
      },
      {
        id: "optimal",
        label: `Retaliate at t*=${( tOpt*100).toFixed(0)}%`,
        icon: "⚖",
        desc: `Optimal tariff: maximizes your terms-of-trade gain given ε=${eps.toFixed(1)}. ${country.name} may escalate further.`,
        welfareEffect: +2,
        relationEffect: -15,
        color: C.gold,
      },
      {
        id: "aggressive",
        label: `Aggressive retaliation at ${(tAgg*100).toFixed(0)}%`,
        icon: "⚔",
        desc: `Above t* — signals resolve but risks welfare loss if they counter-retaliate. Trade war likely.`,
        welfareEffect: -3,
        relationEffect: -30,
        color: "#e87f7f",
      },
    ];

    return (
      <div style={{ padding: "2rem", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.16em", color: "#e87f7f", marginBottom: "0.5rem" }}>⚡ CRISIS — TARIFF IMPOSED</div>
        <div style={{ fontSize: "1.2rem", color: C.gold, fontFamily: mono, fontWeight: 300, marginBottom: "1rem" }}>Respond to {country.name}</div>

        <Card title="Situation" accent="#e87f7f" style={{ marginBottom: "1rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.78rem", color: "#c8b8b8", lineHeight: 1.8 }}>{crisis.text}</div>
        </Card>

        <Card title="Optimal Tariff Theory" accent={C.blue} style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.72rem", color: "#8a9bb0", lineHeight: 1.8 }}>
            <span style={{ color: C.gold }}>t* = 1/(ε − 1) = 1/({eps.toFixed(1)} − 1) = {(tOpt*100).toFixed(0)}%</span>
            <br />
            At t*, you maximize the terms-of-trade gain from restricting their exports. Above t*, you over-restrict and your own consumers lose more than you gain. Below t*, you leave welfare on the table. The Nash tariff equilibrium (mutual retaliation) leaves both countries worse off than free trade.
          </div>
        </Card>

        {highMarketPower && (
          <div style={{ background: "rgba(232,127,127,0.08)", border: "1px solid #e87f7f44", borderLeft: "3px solid #e87f7f", padding: "0.7rem 1rem", marginBottom: "0.8rem", borderRadius: "2px" }}>
            <span style={{ fontFamily: mono, fontSize: "0.68rem", color: "#e87f7f" }}>
              ⚠ ε={eps.toFixed(1)} &lt; 2: Extreme market power. t*={( tOpt*100).toFixed(0)}% is a very high tariff — retaliation at this rate is likely to trigger an immediate trade war. Consider absorbing or negotiating instead.
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => onRespond(crisis, opt.id, opt)} style={{
              background: "rgba(255,255,255,0.02)", border: `1px solid ${opt.color}`,
              borderLeft: `4px solid ${opt.color}`, color: C.text,
              fontFamily: mono, padding: "0.9rem 1.2rem", cursor: "pointer",
              textAlign: "left", borderRadius: "2px", transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.82rem", color: opt.color }}>{opt.icon} {opt.label}</span>
                <span style={{ fontSize: "0.65rem", color: opt.welfareEffect >= 0 ? "#7fe87f" : "#e87f7f" }}>
                  Welfare {opt.welfareEffect >= 0 ? "+" : ""}{opt.welfareEffect}% | Relations {opt.relationEffect >= 0 ? "+" : ""}{opt.relationEffect}
                </span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#5a7a9a" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (crisis.type === "currency_war") {
    const options = [
      {
        id: "absorb",
        label: "Absorb the ToT loss",
        icon: "🕊",
        desc: "Accept the competitive disadvantage this turn. Signals restraint — may reduce further currency aggression.",
        welfareEffect: 0,
        relationEffect: +5,
        color: "#7fe87f",
      },
      {
        id: "counter_depreciate",
        label: "Counter-depreciate",
        icon: "💱",
        desc: "Match their depreciation. Restores your ToT but damages all bilateral relations and risks inflationary pressure.",
        welfareEffect: +1,
        relationEffect: -10,
        color: C.gold,
      },
      {
        id: "fta_offer",
        label: "Offer an FTA to stabilize",
        icon: "🤝",
        desc: "Propose a Free Trade Agreement — locks in stable exchange terms, removes currency war incentive. Requires good-faith acceptance.",
        welfareEffect: +3,
        relationEffect: +20,
        color: C.blue,
      },
    ];

    return (
      <div style={{ padding: "2rem", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.16em", color: "#e2c97e", marginBottom: "0.5rem" }}>⚡ CRISIS — CURRENCY WAR</div>
        <div style={{ fontSize: "1.2rem", color: C.gold, fontFamily: mono, fontWeight: 300, marginBottom: "1rem" }}>Currency aggression from {country.name}</div>
        <Card title="Situation" accent="#e2c97e" style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.78rem", color: "#c8c8b8", lineHeight: 1.8 }}>{crisis.text}</div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => onRespond(crisis, opt.id, opt)} style={{
              background: "rgba(255,255,255,0.02)", border: `1px solid ${opt.color}`,
              borderLeft: `4px solid ${opt.color}`, color: C.text,
              fontFamily: mono, padding: "0.9rem 1.2rem", cursor: "pointer",
              textAlign: "left", borderRadius: "2px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.82rem", color: opt.color }}>{opt.icon} {opt.label}</span>
                <span style={{ fontSize: "0.65rem", color: opt.welfareEffect >= 0 ? "#7fe87f" : "#e87f7f" }}>
                  Welfare {opt.welfareEffect >= 0 ? "+" : ""}{opt.welfareEffect}% | Relations {opt.relationEffect >= 0 ? "+" : ""}{opt.relationEffect}
                </span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#5a7a9a" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (crisis.type === "sanctions_coalition") {
    const options = [
      {
        id: "diplomacy",
        label: "Offer diplomatic concessions",
        icon: "🕊",
        desc: "Negotiate with the coalition. Costly in credibility but breaks the coalition and restores some trade.",
        welfareEffect: +2,
        relationEffect: +25,
        color: "#7fe87f",
      },
      {
        id: "retaliate",
        label: "Counter-sanction the coalition",
        icon: "🔒",
        desc: "Escalate — sanction all coalition members. Signals resolve but deepens the trade war.",
        welfareEffect: -4,
        relationEffect: -40,
        color: "#e87f7f",
      },
      {
        id: "third_party",
        label: "Appeal to a neutral third party",
        icon: "⚖",
        desc: "Engage Meridian or another neutral to mediate. Slower but preserves all relationships.",
        welfareEffect: +1,
        relationEffect: +10,
        color: C.blue,
      },
    ];

    return (
      <div style={{ padding: "2rem", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.16em", color: "#e87f7f", marginBottom: "0.5rem" }}>⚡ CRISIS — SANCTIONS COALITION</div>
        <div style={{ fontSize: "1.2rem", color: C.gold, fontFamily: mono, fontWeight: 300, marginBottom: "1rem" }}>Coalition forming against Cascadia</div>
        <Card title="Situation" accent="#e87f7f" style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.78rem", color: "#c8b8b8", lineHeight: 1.8 }}>{crisis.text}</div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => onRespond(crisis, opt.id, opt)} style={{
              background: "rgba(255,255,255,0.02)", border: `1px solid ${opt.color}`,
              borderLeft: `4px solid ${opt.color}`, color: C.text,
              fontFamily: mono, padding: "0.9rem 1.2rem", cursor: "pointer",
              textAlign: "left", borderRadius: "2px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.82rem", color: opt.color }}>{opt.icon} {opt.label}</span>
                <span style={{ fontSize: "0.65rem", color: opt.welfareEffect >= 0 ? "#7fe87f" : "#e87f7f" }}>
                  Welfare {opt.welfareEffect >= 0 ? "+" : ""}{opt.welfareEffect}% | Relations {opt.relationEffect >= 0 ? "+" : ""}{opt.relationEffect}
                </span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#5a7a9a" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}


function OpponentStats({ state }) {
  const [open, setOpen] = useState(false);
  const allGdps = Object.values(state.countries).map(c => c.gdp);
  const maxGdp = Math.max(...allGdps, state.home.gdp);
  return (
    <div style={{ marginTop: "1.2rem", border: `1px solid ${C.border}`, borderRadius: "2px" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", background: "none", border: "none", borderBottom: open ? `1px solid ${C.border}` : "none",
        color: C.dim, fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.12em",
        padding: "0.5rem 0.8rem", cursor: "pointer", display: "flex", justifyContent: "space-between",
        alignItems: "center", textAlign: "left",
      }}>
        <span>WORLD STANDINGS</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div style={{ padding: "0.6rem 0.8rem" }}>
          {/* Cascadia row */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "0.62rem", marginBottom: "0.2rem" }}>
              <span style={{ color: C.gold }}>🏔 Cascadia (You)</span>
              <span style={{ color: C.gold }}>GDP {state.home.gdp} · W {state.home.welfare}</span>
            </div>
            <div style={{ background: "#1a2a3a", borderRadius: "1px", height: 5 }}>
              <div style={{ width: `${(state.home.gdp / maxGdp) * 100}%`, height: "100%", background: C.gold, borderRadius: "1px", transition: "width 0.3s" }} />
            </div>
          </div>
          {/* AI rows */}
          {Object.entries(state.countries).map(([k, c]) => {
            const rel = state.relations[k];
            const relColor = rel > 30 ? "#7fe87f" : rel < -10 ? "#e87f7f" : C.dim;
            const ahead = c.gdp > state.home.gdp;
            return (
              <div key={k} style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: "0.62rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: COUNTRIES[k].color }}>{COUNTRIES[k].flag} {COUNTRIES[k].name}</span>
                  <span>
                    <span style={{ color: ahead ? "#e87f7f" : "#7fe87f" }}>GDP {c.gdp}</span>
                    <span style={{ color: C.dim }}> · W {c.welfare}</span>
                    <span style={{ color: relColor, marginLeft: "0.5rem" }}>({rel > 0 ? "+" : ""}{rel})</span>
                  </span>
                </div>
                <div style={{ background: "#1a2a3a", borderRadius: "1px", height: 5 }}>
                  <div style={{ width: `${(c.gdp / maxGdp) * 100}%`, height: "100%", background: COUNTRIES[k].color, borderRadius: "1px", opacity: 0.7, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontFamily: mono, fontSize: "0.58rem", color: "#2a4a6a", marginTop: "0.4rem", borderTop: `1px solid ${C.border}`, paddingTop: "0.4rem" }}>
            Red GDP = rival ahead of you · Green = you're leading · Relation score in ()
          </div>
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
      <OpponentStats state={state} />
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
          <OpponentStats state={state} />
        </div>
      </div>
      <div style={{ padding: "0 0 1.5rem 0" }}>
        <EconomicDashboard state={state} />
      </div>
    </div>
  );
}

function GameOverScreen({ state, onRestart }) {
  const outcome = evaluateOutcome({ ...state, turn: TOTAL_TURNS + 1 });
  const welfareChange = state.home.welfare - 100;
  const topAlly = Object.entries(state.relations).sort((a, b) => b[1] - a[1])[0];
  const topRival = Object.entries(state.relations).sort((a, b) => a[1] - b[1])[0];
  const allGDPs = Object.values(state.countries).map(c => c.gdp);
  const maxAIGdp = Math.max(...allGDPs);
  const isDefeat = outcome?.result === "defeat" || state.home.welfare < 70;
  const tierColor = isDefeat ? "#e87f7f" : (outcome?.color || C.gold);
  const tierIcon = isDefeat ? "💀" : (outcome?.icon || "📋");
  const tierLabel = isDefeat ? "DEFEAT" : outcome?.tier;

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.2em", color: C.dim, marginBottom: "1rem" }}>
        {isDefeat ? "ECONOMIC CRISIS — SIMULATION TERMINATED" : `SIMULATION COMPLETE — YEAR ${2024 + TOTAL_TURNS}`}
      </div>
      <div style={{ fontSize: "3rem", marginBottom: "0.4rem" }}>{tierIcon}</div>
      <div style={{ fontSize: "2rem", color: tierColor, fontFamily: mono, fontWeight: 300, marginBottom: "0.3rem", letterSpacing: "0.08em" }}>{tierLabel}</div>
      <div style={{ fontFamily: mono, fontSize: "0.75rem", color: C.dim, marginBottom: "1.5rem" }}>
        Final Welfare: <span style={{ color: tierColor, fontWeight: 700 }}>{state.home.welfare}</span>
        <span style={{ marginLeft: "1rem", color: welfareChange >= 0 ? "#7fe87f" : "#e87f7f" }}>
          ({welfareChange >= 0 ? "+" : ""}{welfareChange} from baseline)
        </span>
      </div>

      {/* Objectives checklist */}
      {!isDefeat && outcome?.conditions && (
        <div style={{ maxWidth: 500, width: "100%", marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.6rem", color: C.dim, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>OBJECTIVES</div>
          {outcome.conditions.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: "0.7rem",
              fontFamily: mono, fontSize: "0.68rem", marginBottom: "0.4rem",
              padding: "0.5rem 0.8rem", borderRadius: "2px",
              background: c.met ? "rgba(127,232,127,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${c.met ? "#7fe87f44" : "#2a3a4a"}`,
            }}>
              <span style={{ color: c.met ? "#7fe87f" : "#3a5a7a", fontSize: "0.9rem" }}>{c.met ? "✓" : "✗"}</span>
              <div>
                <div style={{ color: c.met ? "#7fe87f" : "#3a5a7a", fontWeight: 600 }}>{c.label}</div>
                <div style={{ color: "#3a5a7a", fontSize: "0.62rem", marginTop: "0.1rem" }}>{c.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ fontFamily: mono, fontSize: "0.6rem", color: "#2a4a6a", marginTop: "0.4rem", textAlign: "center" }}>
            3/3 = GRAND MASTER 🏆 · 2/3 = STRATEGIST ⭐ · 1/3 = DIPLOMAT 🕊 · 0/3 = SURVIVED 📋
          </div>
        </div>
      )}
      {isDefeat && (
        <div style={{ maxWidth: 500, width: "100%", marginBottom: "1.2rem", padding: "0.8rem 1rem",
          background: "rgba(232,127,127,0.06)", border: "1px solid #e87f7f44", borderRadius: "2px",
          fontFamily: mono, fontSize: "0.7rem", color: "#e87f7f", textAlign: "center" }}>
          Cascadia's welfare fell below 70 — economic collapse triggered. Keep welfare above 70 to survive.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem", maxWidth: 640, width: "100%" }}>
        <Card title="Economy" accent={C.gold}>
          <StatRow label="GDP" value={state.home.gdp} color={state.home.gdp > maxAIGdp ? "#7fe87f" : C.text} />
          <StatRow label="Max AI GDP" value={maxAIGdp} />
          <StatRow label="Varieties" value={state.home.varieties} />
          <StatRow label="K/L Ratio" value={(state.home.K / state.home.L).toFixed(2)} />
        </Card>
        <Card title="Trade" accent={C.blue}>
          <StatRow label="Terms of Trade" value={state.home.ToT.toFixed(2)} />
          <StatRow label="Export Share" value={`${(state.home.exportShare * 100).toFixed(0)}%`} />
          <StatRow label="Top Ally" value={COUNTRIES[topAlly[0]].name} color={COUNTRIES[topAlly[0]].color} />
          <StatRow label="Top Rival" value={COUNTRIES[topRival[0]].name} color="#e87f7f" />
        </Card>
        <Card title="Result" accent={tierColor}>
          <div style={{ textAlign: "center", paddingTop: "0.3rem" }}>
            <div style={{ fontSize: "2.5rem" }}>{tierIcon}</div>
            <div style={{ fontFamily: mono, fontSize: "1rem", color: tierColor, fontWeight: 700, marginTop: "0.3rem" }}>{tierLabel}</div>
            <div style={{ fontFamily: mono, fontSize: "0.62rem", color: C.dim, marginTop: "0.2rem" }}>
              {isDefeat ? "welfare collapsed" : `${outcome?.conditions?.filter(c => c.met).length}/${outcome?.conditions?.length} objectives`}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 600, width: "100%", marginBottom: "1.5rem" }}>
        <Card title="Event Log" accent={C.dim}>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {state.log.map((l, i) => (
              <div key={i} style={{ fontFamily: mono, fontSize: "0.65rem", color: "#5a7a9a", marginBottom: "0.3rem", lineHeight: 1.6 }}>
                <span style={{ color: C.dim }}>Y{2024 + l.turn} </span>{l.text}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <button onClick={onRestart} style={{
        background: "none", border: `1px solid ${tierColor}`, color: tierColor,
        fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.1em",
        padding: "0.7rem 2rem", cursor: "pointer", borderRadius: "2px",
      }}>
        PLAY AGAIN ▸
      </button>
    </div>
  );
}


function evaluateOutcome(state) {
  const { home, countries } = state;
  if (home.welfare < 70) {
    return { result: "defeat", icon: "💀", color: "#e87f7f" };
  }
  const maxAIGdp = Math.max(...Object.values(countries).map(c => c.gdp));
  const conditions = [
    { met: home.gdp > maxAIGdp, label: "Economic Dominance", desc: `GDP ${home.gdp} vs rival max ${maxAIGdp}` },
    { met: home.welfare >= 130,  label: "Welfare Threshold",  desc: `Welfare ${home.welfare} ≥ 130` },
    { met: home.welfare >= 70,   label: "Survived 8 Turns",   desc: "Welfare never collapsed below 70" },
  ];
  const met = conditions.filter(c => c.met).length;
  const tiers = [
    { n: 3, tier: "GRAND MASTER", icon: "🏆", color: "#e2c97e" },
    { n: 2, tier: "STRATEGIST",   icon: "⭐", color: "#4a9fe8" },
    { n: 1, tier: "DIPLOMAT",     icon: "🕊",  color: "#7fe87f" },
    { n: 0, tier: "SURVIVED",     icon: "📋", color: "#8a9bb0" },
  ];
  const t = tiers.find(x => x.n <= met);
  return { result: "victory", ...t, conditions };
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
  const initGame = (difficulty = "strategist") => {
    let s = deepClone(INITIAL_STATE);
    const diff = DIFFICULTIES[difficulty] || DIFFICULTIES["strategist"];
    s.difficulty = difficulty;
    s.actionsLeft = diff.actionsPerTurn;
    s.hostility = {};
    s.stability = {};
    s.sanctionHistory = [];
    Object.keys(s.relations).forEach(c => {
      s.relations[c] = Math.max(-100, Math.min(100, s.relations[c] + diff.relationsBonus));
    });
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
    s.actionsLeft = DIFFICULTIES[s.difficulty || 'strategist'].actionsPerTurn;
    s.phase = "brief";
    setState(s);
  };

  if (screen === "intro") {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: #2a3a4a; }`}</style>
        <IntroScreen onStart={(diff) => initGame(diff)} />
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

  const handleCrisisResponse = (crisis, responseId, option) => {
    let s = deepClone(state);
    // Apply welfare and relation effects
    s.home.welfare = Math.round(s.home.welfare * (1 + option.welfareEffect / 100));
    s.relations[crisis.country] = Math.max(-100, Math.min(100, s.relations[crisis.country] + option.relationEffect));

    // Special effects per response
    if (crisis.type === "ai_tariff" && responseId === "optimal") {
      s.home.ToT = Math.min(3, s.home.ToT * 1.05);
      s.log.push({ turn: s.turn, type: "policy", text: `⚖ Optimal retaliation against ${COUNTRIES[crisis.country].name} at t*=${(crisis.optimalTariff*100).toFixed(0)}%. ToT improved, welfare +2%.` });
    } else if (crisis.type === "ai_tariff" && responseId === "aggressive") {
      s.home.ToT = Math.min(3, s.home.ToT * 1.02);
      s.log.push({ turn: s.turn, type: "policy", text: `⚔ Aggressive retaliation against ${COUNTRIES[crisis.country].name}. Escalation risk high. Relations severely damaged.` });
    } else if (crisis.type === "ai_tariff" && responseId === "absorb") {
      s.log.push({ turn: s.turn, type: "policy", text: `🕊 Absorbed tariff from ${COUNTRIES[crisis.country].name}. Welfare hit accepted, relations stabilized.` });
    } else if (crisis.type === "currency_war" && responseId === "counter_depreciate") {
      s.home.ToT = Math.min(3, s.home.ToT * 1.08);
      s.log.push({ turn: s.turn, type: "policy", text: `💱 Counter-depreciated against ${COUNTRIES[crisis.country].name}. ToT restored, but multilateral relations strained.` });
      Object.keys(s.relations).forEach(c => { if (c !== crisis.country) s.relations[c] = Math.max(-100, s.relations[c] - 5); });
    } else if (crisis.type === "currency_war" && responseId === "fta_offer") {
      s.ftaPartners = [...(s.ftaPartners || []), crisis.country];
      s.home.varieties = Math.max(3, Math.round(s.home.varieties * 1.1));
      s.log.push({ turn: s.turn, type: "policy", text: `🤝 FTA offered and accepted by ${COUNTRIES[crisis.country].name} to end currency war. Varieties +10%.` });
    } else if (crisis.type === "sanctions_coalition" && responseId === "diplomacy") {
      s.trade[crisis.country] = Math.round((s.trade[crisis.country] || 0) + 10);
      s.log.push({ turn: s.turn, type: "policy", text: `🕊 Diplomatic concessions broke the coalition. Trade with ${COUNTRIES[crisis.country].name} partially restored.` });
    } else if (crisis.type === "sanctions_coalition" && responseId === "retaliate") {
      s.trade[crisis.country] = 0;
      s.log.push({ turn: s.turn, type: "policy", text: `🔒 Counter-sanctioned ${COUNTRIES[crisis.country].name}. Trade war deepens.` });
    } else {
      s.log.push({ turn: s.turn, type: "policy", text: `⚖ Third-party mediation engaged for ${COUNTRIES[crisis.country].name} crisis.` });
    }

    // Mark crisis resolved
    s.crises = s.crises.map(cr => cr.id === crisis.id ? { ...cr, resolved: true } : cr);
    setState(s);
  };

  // Game screen — check for pending crises first
  const pendingCrisis = (state.crises || []).find(cr => !cr.resolved);
  const isBriefing = state.phase === "brief";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Turn header */}
      <div className="game-header" style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="game-header-left" style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim, letterSpacing: "0.1em" }}>YEAR {2024 + state.turn}</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {Array.from({ length: TOTAL_TURNS }).map((_, i) => (
              <div key={i} className="turn-pip" style={{ width: 24, height: 4, borderRadius: 2, background: i < state.turn - 1 ? C.gold : i === state.turn - 1 ? C.blue : "#1a2a3a" }} />
            ))}
          </div>
          <span style={{ fontFamily: mono, fontSize: "0.65rem", color: C.dim }}>Turn {state.turn}/{TOTAL_TURNS}</span>
        </div>
        <div className="game-header-right" style={{ display: "flex", alignItems: "center" }}>
          {pendingCrisis && <span style={{ fontFamily: mono, fontSize: "0.65rem", color: "#e87f7f", animation: "pulse 1s infinite" }}>⚡ CRISIS</span>}
          <span style={{ fontFamily: mono, fontSize: "0.7rem", color: getWelfareRating(state.home.welfare).color }}>
            ◆ Welfare: {state.home.welfare}
          </span>
          <span className="game-header-gdp" style={{ fontFamily: mono, fontSize: "0.7rem", color: C.dim }}>
            GDP: {state.home.gdp}
          </span>
        </div>
      </div>

      {pendingCrisis
        ? <CrisisScreen crisis={pendingCrisis} state={state} onRespond={handleCrisisResponse} />
        : isBriefing
          ? <BriefingScreen state={state} onContinue={() => setState(s => ({ ...s, phase: "action" }))} />
          : <ActionScreen state={state} onAction={handleAction} onEndTurn={handleEndTurn} />
      }
    </div>
  );
}
