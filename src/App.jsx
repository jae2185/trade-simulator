import { useState, useEffect } from "react";
import EconomicStatecraft from "./EconomicStatecraft";

// ─── Shared UI Components ────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 0.01, onChange, unit = "", desc }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const fmt = v => typeof v === "number" ? (step >= 1 ? v.toFixed(0) : v.toFixed(2)) : v;

  const commitDraft = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onChange(parsed);
    setEditing(false);
  };

  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#8a9bb0", letterSpacing: "0.04em" }}>{label}</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            value={draft}
            step={step}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={e => { if (e.key === "Enter") commitDraft(); if (e.key === "Escape") setEditing(false); }}
            style={{
              background: "#0d1520", border: "1px solid #e2c97e", borderRadius: "2px",
              color: "#e2c97e", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem",
              fontWeight: 600, width: 80, textAlign: "right", padding: "0.1rem 0.3rem",
              outline: "none",
            }}
          />
        ) : (
          <span
            onClick={() => { setDraft(fmt(value)); setEditing(true); }}
            title="Click to type a custom value"
            style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", color: "#e2c97e",
              fontWeight: 600, cursor: "text", borderBottom: "1px dashed #5a5030",
              paddingBottom: "1px",
            }}
          >
            {fmt(value)}{unit}
          </span>
        )}
      </div>
      {desc && <div style={{ fontSize: "0.65rem", color: "#5a6a7a", marginBottom: "0.3rem", fontStyle: "italic" }}>{desc}</div>}
      <input type="range" min={min} max={Math.max(max, value)} step={step} value={Math.min(value, Math.max(max, value))}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#e2c97e", cursor: "pointer" }} />
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px", padding: "1.2rem", marginBottom: "1rem" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#4a7fa5", textTransform: "uppercase", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(74,127,165,0.2)" }}>{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight = false, small = false }) {
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ fontSize: "0.62rem", color: "#5a6a7a", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", marginBottom: "0.1rem" }}>{label}</div>
      <div style={{ fontSize: small ? "0.8rem" : "1rem", fontFamily: "'IBM Plex Mono', monospace", color: highlight ? "#e2c97e" : "#c8d8e8", fontWeight: highlight ? 700 : 400 }}>{value}</div>
    </div>
  );
}

function Explainer({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "none", border: "1px solid rgba(74,127,165,0.3)", borderRadius: "2px",
        color: "#4a7fa5", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem",
        letterSpacing: "0.08em", padding: "0.4rem 0.8rem", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "0.4rem"
      }}>
        <span>{open ? "▾" : "▸"}</span> {open ? "HIDE EXPLAINER" : "WHAT IS THIS MODEL?"}
      </button>
      {open && (
        <div style={{ marginTop: "0.6rem", padding: "1rem", background: "rgba(74,127,165,0.05)", borderLeft: "2px solid rgba(74,127,165,0.4)", fontSize: "0.78rem", color: "#8a9bb0", lineHeight: "1.7" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function PresetDropdown({ presets, onSelect }) {
  const [selected, setSelected] = useState("");
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.62rem", color: "#5a6a7a", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>LOAD REAL-WORLD PRESET</div>
      <select
        value={selected}
        onChange={e => {
          if (e.target.value) {
            setSelected(e.target.value);
            onSelect(e.target.value);
          }
        }}
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)", color: "#c8d8e8", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", padding: "0.4rem 0.6rem", borderRadius: "2px", width: "100%", cursor: "pointer" }}>
        <option value="">— select preset —</option>
        {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  );
}


function Collapsible({ title, accent = "#4a7fa5", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: "0.8rem" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "none", border: "none", borderBottom: `1px solid ${accent}33`,
        color: accent, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem",
        letterSpacing: "0.12em", padding: "0.3rem 0", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "0.4rem", width: "100%",
        textAlign: "left", textTransform: "uppercase", marginBottom: open ? "0.6rem" : 0,
      }}>
        <span style={{ fontSize: "0.7rem" }}>{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && children}
    </div>
  );
}

// ─── SVG Chart helper ────────────────────────────────────────────────────────

function AxesChart({ width = 280, height = 220, xLabel = "Good X", yLabel = "Good Y", xMax, yMax, children }) {
  const pad = { top: 14, right: 14, bottom: 36, left: 44 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const sx = v => (v / xMax) * W;
  const sy = v => H - (v / yMax) * H;
  return (
    <div className="svg-scroll" style={{ width: "100%" }}>
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ fontFamily: "'IBM Plex Mono', monospace", display: "block" }}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={0} y1={sy(f * yMax)} x2={W} y2={sy(f * yMax)} stroke="rgba(255,255,255,0.04)" />
            <line x1={sx(f * xMax)} y1={0} x2={sx(f * xMax)} y2={H} stroke="rgba(255,255,255,0.04)" />
          </g>
        ))}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#2a3a4a" strokeWidth={1.5} />
        <line x1={0} y1={0} x2={0} y2={H} stroke="#2a3a4a" strokeWidth={1.5} />
        <text x={W / 2} y={H + 28} textAnchor="middle" fill="#5a6a7a" fontSize={9}>{xLabel}</text>
        <text x={-H / 2} y={-32} textAnchor="middle" fill="#5a6a7a" fontSize={9} transform="rotate(-90)">{yLabel}</text>
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <text x={sx(f * xMax)} y={H + 12} textAnchor="middle" fill="#3a4a5a" fontSize={7.5}>{(f * xMax).toFixed(0)}</text>
            {f > 0 && <text x={-6} y={sy(f * yMax) + 3} textAnchor="end" fill="#3a4a5a" fontSize={7.5}>{(f * yMax).toFixed(0)}</text>}
          </g>
        ))}
        {children({ sx, sy, W, H })}
      </g>
    </svg>
    </div>
  );
}


// ─── QUIZ MODE ───────────────────────────────────────────────────────────────

function QuizMode({ model, answers }) {
  // answers = { ca: "Cloth"|"Wheat", trade: "Home exports X", winner: "Capital owners", loser: "Workers", fpe: true|null }
  const [revealed, setRevealed] = useState(false);
  const [guesses, setGuesses] = useState({});
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";
  const blue = "#4a9fe8";

  // Reset when answers change (params changed)
  const answerKey = JSON.stringify(answers);
  const [lastKey, setLastKey] = useState(answerKey);
  if (answerKey !== lastKey) {
    setLastKey(answerKey);
    setRevealed(false);
    setGuesses({});
  }

  const questions = model === "ricardian" ? [
    { id: "homeCA", label: "Home has comparative advantage in:", options: ["Cloth", "Wheat"] },
    { id: "forCA",  label: "Foreign has comparative advantage in:", options: ["Cloth", "Wheat"] },
    { id: "wages",  label: "After trade opens, real wages:", options: ["Rise in both countries", "Fall in both countries", "Rise in one, fall in other", "Unchanged"] },
  ] : model === "ho" ? [
    { id: "homeAbundant", label: "Home is:", options: ["Capital-abundant", "Labor-abundant"] },
    { id: "homeExports",  label: "Home exports:", options: ["Good X (capital-intensive)", "Good Y (labor-intensive)"] },
    { id: "winner",       label: "Stolper-Samuelson — Home gains:", options: ["Capital owners (r ↑)", "Workers (w ↑)"] },
    { id: "loser",        label: "Stolper-Samuelson — Home loses:", options: ["Capital owners (r ↓)", "Workers (w ↓)"] },
  ] : model === "krugman" ? [
    { id: "nEffect",   label: "When markets integrate, the number of available varieties:", options: ["Increases", "Decreases", "Stays the same"] },
    { id: "pEffect",   label: "Trade integration causes prices to:", options: ["Rise (less competition)", "Fall (more competition)", "Unchanged"] },
    { id: "hme",       label: "The Home Market Effect predicts the larger country:", options: ["Exports the differentiated good", "Imports the differentiated good", "Neither — trade is balanced"] },
    { id: "welfare",   label: "Both countries gain from trade even if:", options: ["They have identical technologies", "One is larger", "One has no comparative advantage", "All of the above"] },
  ] : model === "melitz" ? [
    { id: "exporter",  label: "Which firms select into exporting?", options: ["Low-productivity firms", "High-productivity firms", "Randomly selected firms"] },
    { id: "phiX",      label: "Lowering trade costs (τ) causes φ_x* to:", options: ["Rise (harder to export)", "Fall (easier to export)", "Stay the same"] },
    { id: "reallocate", label: "Trade liberalization raises aggregate productivity via:", options: ["Within-firm learning", "Between-firm reallocation (low-φ firms exit)", "Government subsidy"] },
    { id: "exporterSize", label: "Empirically, exporters are __ non-exporters:", options: ["Smaller than", "The same size as", "Larger and more productive than"] },
  ] : model === "standard" ? [
    { id: "exports",    label: "At the current ToT, the country exports:", options: ["Good X", "Good Y", "Neither (autarky)"] },
    { id: "totWelfare", label: "A rise in ToT (P_X↑) causes national welfare to:", options: ["Rise", "Fall", "Unchanged — only distribution changes"] },
    { id: "prodShift",  label: "When ToT rises, the production point shifts toward:", options: ["More X, less Y", "More Y, less X", "No change — PPF is fixed"] },
    { id: "gainDecomp", label: "The Standard Model decomposes gains from trade into:", options: ["Production gain + exchange gain", "Factor gain + variety gain", "Absolute advantage + comparative advantage"] },
    { id: "ppfShape",   label: "A bowed-out PPF (vs. linear) implies:", options: ["Increasing opportunity costs", "Constant opportunity costs", "Decreasing opportunity costs"] },
  ] : [];

  const score = revealed ? questions.filter(q => guesses[q.id] === answers[q.id]).length : 0;

  return (
    <div style={{ background: "rgba(226,201,126,0.04)", border: "1px solid rgba(226,201,126,0.15)", borderRadius: "3px", padding: "0.8rem", marginTop: "0.8rem" }}>
      <div style={{ fontFamily: mono, fontSize: "0.62rem", color: gold, letterSpacing: "0.1em", marginBottom: "0.7rem" }}>
        ⬡ QUIZ MODE — predict before revealing
      </div>

      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: "0.8rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.65rem", color: "#8a9bb0", marginBottom: "0.4rem" }}>{q.label}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {q.options.map(opt => {
              const selected = guesses[q.id] === opt;
              const correct = answers[q.id] === opt;
              let border = "1px solid #2a3a4a";
              let bg = "rgba(255,255,255,0.02)";
              let color = "#5a6a7a";
              if (selected && !revealed) { border = `1px solid ${gold}`; bg = "rgba(226,201,126,0.1)"; color = gold; }
              if (revealed && correct)   { border = `1px solid ${green}`; bg = "rgba(127,232,127,0.1)"; color = green; }
              if (revealed && selected && !correct) { border = `1px solid ${red}`; bg = "rgba(232,127,127,0.1)"; color = red; }
              return (
                <button key={opt} disabled={revealed}
                  onClick={() => setGuesses(g => ({ ...g, [q.id]: opt }))}
                  style={{ fontFamily: mono, fontSize: "0.62rem", padding: "0.3rem 0.6rem",
                    background: bg, border, color, borderRadius: "2px", cursor: revealed ? "default" : "pointer",
                    transition: "all 0.15s" }}>
                  {revealed && correct && "✓ "}
                  {revealed && selected && !correct && "✗ "}
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.4rem" }}>
        <button
          onClick={() => setRevealed(true)}
          disabled={revealed || Object.keys(guesses).length < questions.length}
          style={{ fontFamily: mono, fontSize: "0.65rem", padding: "0.4rem 1rem",
            background: revealed ? "rgba(127,232,127,0.08)" : "rgba(226,201,126,0.1)",
            border: `1px solid ${revealed ? green : gold}`,
            color: revealed ? green : gold, borderRadius: "2px", cursor: "pointer",
            opacity: (!revealed && Object.keys(guesses).length < questions.length) ? 0.4 : 1 }}>
          {revealed ? `Score: ${score}/${questions.length}` : "Reveal Answers"}
        </button>
        {revealed && (
          <button onClick={() => { setRevealed(false); setGuesses({}); }}
            style={{ fontFamily: mono, fontSize: "0.62rem", padding: "0.4rem 0.8rem",
              background: "none", border: "1px solid #2a3a4a", color: dim,
              borderRadius: "2px", cursor: "pointer" }}>
            Reset
          </button>
        )}
        {!revealed && Object.keys(guesses).length < questions.length && (
          <span style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>
            Answer all {questions.length} questions to reveal
          </span>
        )}
      </div>
    </div>
  );
}

// ─── STATIC EXPLAIN PANEL ─────────────────────────────────────────────────────

function ExplainButton({ model, params, results }) {
  const [open, setOpen] = useState(false);
  const mono = "'IBM Plex Mono', monospace";
  const blue = "#4a9fe8";
  const dim = "#3a5a7a";

  const explain = () => {
    if (model === "ricardian") {
      const { homeCA, forCA, tradeExists, wageLo, wageHi } = results;
      if (!tradeExists) return "Both countries have identical relative productivities — there is no comparative advantage difference and therefore no incentive to trade. Try adjusting the labor coefficients so that the ratio a_LC/a_LW differs between Home and Foreign.";
      return `Home has a comparative advantage in ${homeCA} because its opportunity cost of producing ${homeCA} is lower than Foreign's — not necessarily because it is more productive in absolute terms. This means both countries gain from specialization even if one is more efficient at everything. The valid range for the wage ratio w/w* is [${wageLo}, ${wageHi}]: any wage ratio within this range supports a trade equilibrium where Home specializes in ${homeCA} and Foreign in ${forCA}. If you narrow this range by making productivities more similar, the gains from trade shrink; if you widen it, the gains are larger and specialization is more complete.`;
    }

    if (model === "ho") {
      const { homeExports, homeWinner, homeLoser, homeKL, foreignKL } = results;
      const abundant = parseFloat(homeKL) > parseFloat(foreignKL) ? "capital" : "labor";
      return `Home's K/L ratio (${homeKL}) is ${parseFloat(homeKL) > parseFloat(foreignKL) ? "higher" : "lower"} than Foreign's (${foreignKL}), making Home ${abundant}-abundant. The H-O theorem predicts Home exports ${homeExports} — the good that uses ${abundant} intensively. Opening to trade raises the real return to the abundant factor: ${homeWinner}. The scarce factor loses: ${homeLoser}. This is the Stolper-Samuelson theorem — trade liberalization has sharp distributional consequences even when aggregate welfare rises. Try increasing the K/L gap between countries to see specialization become more extreme.`;
    }

    if (model === "standard") {
      const { prodX, prodY, exports: exp, prodGain, exchGain, welfareGainPct } = results;
      const tot = params.ToT;
      if (tot === 1.0 || parseFloat(exp) < 0.5) return "At ToT = 1 (autarky prices), there is no incentive to trade — the world price equals the domestic opportunity cost. Raise the Terms of Trade slider above 1 to make Good X more valuable internationally, shifting the production point toward X and creating an exchange gain.";
      const dominant = parseFloat(prodGain) > parseFloat(exchGain) ? "production" : "exchange";
      return `With ToT = ${tot.toFixed(2)}, Home produces at (${prodX}, ${prodY}) — shifted toward Good X relative to autarky — and trades to consume beyond the PPF. The welfare gain of ${welfareGainPct} decomposes into a production gain (${prodGain}: reallocating toward the now-more-valuable export good) and an exchange gain (${exchGain}: buying imports cheaply relative to export revenues). The ${dominant} gain dominates here. A ${tot > 2 ? "further ToT increase would amplify both gains, but also increase exposure to a terms-of-trade reversal" : "higher ToT would increase both gains as production reallocates further toward X"}.`;
    }

    if (model === "krugman") {
      const { nHome, nFor, nWorld, pTrade, varietyGain } = results;
      const larger = parseFloat(nHome) > parseFloat(nFor) ? "Home" : "Foreign";
      return `In the Krugman model, market size drives variety: Home autarky supports ${nHome} varieties, Foreign ${nFor}, but integrated world trade supports ${nWorld} — a gain of ${varietyGain} varieties that neither country could sustain alone. The trade price ${pTrade} is lower than the autarky price because each firm spreads fixed costs over a larger market. ${larger} is the larger economy and exports the differentiated good in net terms (the Home Market Effect). Consumers in both countries gain access to all ${nWorld} varieties. Lowering the fixed cost F would increase variety even further; raising it concentrates production.`;
    }

    if (model === "melitz") {
      const { exportShare, phiXCutoff, avgProdExporter, welfareGain } = results;
      return `Only the most productive firms export: the export productivity cutoff φ_x* = ${phiXCutoff} means a firm must be ${phiXCutoff}× more productive than the minimum survivor to profitably pay the fixed export cost. This selects ${exportShare} of firms into exporting. Exporters average ${avgProdExporter}× the minimum productivity — this is why empirically, exporters are larger and more productive than non-exporters. When trade costs τ fall, φ_x* drops, more firms enter export markets, low-productivity domestic firms are crowded out, and aggregate productivity rises through reallocation. The welfare index here is ${welfareGain}: try lowering τ to see how liberalization raises this through the selection effect.`;
    }

    return "";
  };

  const text = explain();
  if (!text) return null;

  return (
    <div style={{ marginTop: "0.8rem" }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          fontFamily: mono, fontSize: "0.65rem", padding: "0.45rem 1rem",
          background: "rgba(74,159,232,0.06)", border: `1px solid ${blue}44`,
          color: blue, borderRadius: "2px", cursor: "pointer", letterSpacing: "0.06em",
          width: "100%", textAlign: "left",
        }}>
          ⬡ EXPLAIN THIS RESULT
        </button>
      ) : (
        <div style={{ background: "rgba(74,159,232,0.04)", border: `1px solid ${blue}2a`,
          borderLeft: `2px solid ${blue}`, borderRadius: "2px", padding: "0.8rem 0.9rem" }}>
          <div style={{ fontFamily: mono, fontSize: "0.58rem", color: blue, letterSpacing: "0.1em", marginBottom: "0.6rem" }}>
            ⬡ EXPLANATION
          </div>
          <p style={{ fontFamily: mono, fontSize: "0.68rem", color: "#8a9bb0", lineHeight: 1.9, margin: "0 0 0.6rem" }}>
            {text}
          </p>
          <button onClick={() => setOpen(false)} style={{
            fontFamily: mono, fontSize: "0.58rem", color: dim, background: "none",
            border: "none", cursor: "pointer", padding: 0, letterSpacing: "0.06em",
          }}>▲ collapse</button>
        </div>
      )}
    </div>
  );
}

// ─── TRADE VOLUME CALCULATOR ──────────────────────────────────────────────────

function TradeVolume({ exports_, imports_, prodX, prodY, consX, consY, ToT, label = "Good X" }) {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";
  const blue = "#4a9fe8";

  // Trade balance check: exports * ToT = imports (in value terms)
  const exportValue = exports_ * ToT;
  const importValue = imports_ * 1; // import good price = 1 (numeraire)
  const tradeBalance = exportValue - importValue;
  const balanced = Math.abs(tradeBalance) < 0.5;

  const W = 400; const H = 60;
  const pad = { left: 10, right: 10, top: 8, bottom: 8 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const totalFlow = exports_ + imports_;
  const hasFlow = totalFlow > 0.1;
  const expW = hasFlow ? Math.max(4, (exports_ / totalFlow) * cW) : cW / 2;
  const impW = hasFlow ? Math.max(4, (imports_ / totalFlow) * cW) : cW / 2;

  return (
    <div style={{ marginTop: "0.3rem" }}>
      <div style={{ fontFamily: mono, fontSize: "0.62rem", color: dim, marginBottom: "0.5rem", fontStyle: "italic" }}>
        Trade flow: production point vs consumption point
      </div>

      {!hasFlow ? (
        <div style={{ fontFamily: mono, fontSize: "0.65rem", color: dim, padding: "0.5rem 0.7rem",
          background: "rgba(255,255,255,0.02)", border: "1px solid #2a3a4a", borderRadius: "2px",
          marginBottom: "0.5rem" }}>
          No trade at current ToT (production = consumption). Adjust ToT away from autarky price to generate trade flows.
        </div>
      ) : (
        <div className="svg-scroll">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: mono, display: "block", marginBottom: "0.5rem" }}>
          <g transform={`translate(${pad.left},${pad.top})`}>
            <rect x={0} y={4} width={expW} height={cH-8} fill="rgba(74,159,232,0.25)" stroke={blue} strokeWidth={1.5} rx={2} />
            {expW > 40 && <text x={expW/2} y={cH/2+3} textAnchor="middle" fill={blue} fontSize={8} fontWeight={600}>
              Exports {exports_.toFixed(1)}
            </text>}
            <rect x={expW} y={4} width={impW} height={cH-8} fill="rgba(127,232,127,0.25)" stroke={green} strokeWidth={1.5} rx={2} />
            {impW > 40 && <text x={expW + impW/2} y={cH/2+3} textAnchor="middle" fill={green} fontSize={8} fontWeight={600}>
              Imports {imports_.toFixed(1)}
            </text>}
          </g>
        </svg>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
        {[
          { label: `Prod. ${label}`, value: prodX.toFixed(1), color: gold },
          { label: `Cons. ${label}`, value: consX.toFixed(1), color: gold },
          { label: "Exports", value: exports_.toFixed(1), color: blue },
          { label: "Export value", value: exportValue.toFixed(1), color: blue },
          { label: "Prod. Good Y", value: prodY.toFixed(1), color: "#a57fa5" },
          { label: "Cons. Good Y", value: consY.toFixed(1), color: "#a57fa5" },
          { label: "Imports", value: imports_.toFixed(1), color: green },
          { label: "Trade balance", value: tradeBalance > 0.5 ? `+${tradeBalance.toFixed(1)}` : tradeBalance < -0.5 ? tradeBalance.toFixed(1) : "≈ 0 ✓", color: balanced ? green : red },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "0.3rem 0.5rem", borderRadius: "2px" }}>
            <div style={{ fontFamily: mono, fontSize: "0.55rem", color: dim }}>{s.label}</div>
            <div style={{ fontFamily: mono, fontSize: "0.68rem", color: s.color, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 1. RICARDIAN MODEL ──────────────────────────────────────────────────────

const RICARDIAN_PRESETS = [
  { id: "us_china", label: "US vs China (tech/manufacturing)", params: { aLC: 1, aLW: 3, aLCs: 2, aLWs: 1, L: 200, Ls: 300 } },
  { id: "uk_portugal", label: "UK vs Portugal (Ricardo's original)", params: { aLC: 1, aLW: 1.2, aLCs: 0.9, aLWs: 1.5, L: 100, Ls: 100 } },
  { id: "germany_greece", label: "Germany vs Greece (EU asymmetry)", params: { aLC: 0.8, aLW: 1.5, aLCs: 2, aLWs: 1.2, L: 150, Ls: 80 } },
];


// ─── WORLD RELATIVE SUPPLY CURVE ─────────────────────────────────────────────

function RSCurve({ p, homeCA, hCloth, hWheat, fCloth, fWheat, homeRatio, forRatio, tradeExists }) {
  const [rdShare, setRdShare] = useState(0.5);
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const purple = "#a57fa5";
  const dim = "#3a5a7a";
  const green = "#7fe87f";
  const red = "#e87f7f";

  if (!tradeExists) return null;

  // Identify which country has CA in cloth
  const homeCACloth = homeCA === "Cloth";

  // autarky relative prices: pLo = cloth-CA country's price, pHi = wheat-CA country's
  const pLo = Math.min(homeRatio, forRatio);
  const pHi = Math.max(homeRatio, forRatio);

  // Assign cloth-CA and wheat-CA country outputs clearly
  const clothCA_cloth = homeCACloth ? hCloth : fCloth;   // cloth output of cloth-CA country
  const clothCA_wheat = homeCACloth ? hWheat : fWheat;   // wheat output of cloth-CA country
  const wheatCA_cloth = homeCACloth ? fCloth : hCloth;   // cloth output of wheat-CA country
  const wheatCA_wheat = homeCACloth ? fWheat : hWheat;   // wheat output of wheat-CA country

  // ── Three RS segments ──
  // Segment 1 (P < pLo): wheat-CA country fully specializes in wheat (its CA good).
  //   Cloth-CA country is indifferent below pLo so produces some cloth — we show the
  //   minimum end: only the wheat-CA country's cloth capacity is zero, but cloth-CA
  //   may produce anything from 0 to clothCA_cloth. Conventionally show it rising
  //   from 0 to rs_mid as a vertical segment at pLo (the cloth-CA country becomes
  //   willing to specialize at exactly pLo).
  //
  // Segment 2 (pLo < P < pHi): cloth-CA fully in cloth, wheat-CA fully in wheat
  //   RS = clothCA_cloth / wheatCA_wheat  (flat)
  //
  // Segment 3 (P > pHi): both countries produce cloth — wheat-CA country switches.
  //   RS = (clothCA_cloth + wheatCA_cloth) / (small amount of wheat) → effectively ∞
  //   Conventionally shown as vertical at pHi going up.

  const rs_mid = clothCA_cloth / wheatCA_wheat;  // flat segment — the key quantity

  // Chart dimensions
  const W = 560; const H = 210;
  const pad = { top: 20, right: 24, bottom: 48, left: 52 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  // Axis ranges: leave room above rs_mid for the RD curve
  const pMax = Math.max(pHi * 1.6, 4);
  const rsMax = rs_mid * 2.5;

  const sx = v => Math.max(0, Math.min(cW, (v / pMax) * cW));
  const sy = v => Math.max(0, Math.min(cH, cH - (v / rsMax) * cH));

  const x1 = sx(pLo);
  const x2 = sx(pHi);

  // RD curve: P = (θ/(1-θ)) × (Q_w/Q_c)  ↔  Q_c/Q_w = (θ/(1-θ)) / P
  // Equilibrium: on flat segment Q_c/Q_w = rs_mid, so P* = θ/((1-θ)×rs_mid)
  const pEqVal = rdShare / ((1 - rdShare) * rs_mid);
  const inFlatRange = pEqVal >= pLo && pEqVal <= pHi;
  const inLowRange  = pEqVal < pLo;   // eq on rising segment — P pinned at pLo
  const inHighRange = pEqVal > pHi;   // eq on vertical segment — P pinned at pHi

  // RD curve points
  const rdPts = [];
  for (let i = 1; i <= 100; i++) {
    const qRel = (i / 100) * rsMax * 1.5;
    const pRel = rdShare / ((1 - rdShare) * qRel);
    if (pRel > 0 && pRel <= pMax * 1.05) {
      rdPts.push(`${sx(pRel).toFixed(1)},${sy(qRel).toFixed(1)}`);
    }
  }

  // Cloth-CA country label
  const clothCALabel = homeCACloth ? "Home" : "Foreign";
  const wheatCALabel = homeCACloth ? "Foreign" : "Home";

  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#4a7fa5", letterSpacing: "0.08em", marginBottom: "0.4rem", fontFamily: mono }}>
        WORLD RELATIVE SUPPLY &amp; DEMAND
      </div>
      <div style={{ fontSize: "0.6rem", color: "#3a5a7a", marginBottom: "0.5rem", fontStyle: "italic", fontFamily: mono }}>
        x-axis: P_cloth / P_wheat &nbsp;|&nbsp; y-axis: (Q_cloth / Q_wheat)_world
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: mono, fontSize: "0.62rem", color: dim, whiteSpace: "nowrap" }}>RD share (θ):</span>
        <input type="range" min={0.1} max={0.9} step={0.01} value={rdShare}
          onChange={e => setRdShare(parseFloat(e.target.value))}
          style={{ accentColor: green, flex: 1, minWidth: 80, cursor: "pointer" }} />
        <span style={{ fontFamily: mono, fontSize: "0.72rem", color: green, fontWeight: 600, minWidth: 36 }}>
          {rdShare.toFixed(2)}
        </span>
        <span className="rd-formula" style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>
          {`→ P*=${pEqVal.toFixed(2)}`}
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: W }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: mono, display: "block" }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={0} y1={sy(f * rsMax)} x2={cW} y2={sy(f * rsMax)} stroke="rgba(255,255,255,0.03)" />
          ))}
          {/* Axes */}
          <line x1={0} y1={cH} x2={cW} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
          <line x1={0} y1={0} x2={0} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
          {/* Axis labels */}
          <text x={cW / 2} y={cH + 38} textAnchor="middle" fill={dim} fontSize={8.5}>
            Relative Price (P_cloth / P_wheat)
          </text>
          <text x={-cH / 2} y={-38} textAnchor="middle" fill={dim} fontSize={8.5} transform="rotate(-90)">
            Relative Quantity (Q_cloth / Q_wheat)
          </text>

          {/* X-axis ticks — offset labels to avoid overlap when pLo and P* are close */}
          {[{ v: pLo, label: pLo.toFixed(2), sub: `${clothCALabel} autarky`, col: blue, anchor: "middle" },
            { v: pHi, label: pHi.toFixed(2), sub: `${wheatCALabel} autarky`, col: purple, anchor: "middle" }
          ].map(({ v, label, sub, col, anchor }, i) => (
            <g key={i}>
              <line x1={sx(v)} y1={cH} x2={sx(v)} y2={cH + 5} stroke={col} strokeWidth={1} />
              <text x={sx(v)} y={cH + 15} textAnchor={anchor} fill={col} fontSize={8.5}>{label}</text>
              <text x={sx(v)} y={cH + 26} textAnchor={anchor} fill={col} fontSize={7}>{sub}</text>
            </g>
          ))}

          {/* Y-axis tick at rs_mid */}
          <line x1={0} y1={sy(rs_mid)} x2={-5} y2={sy(rs_mid)} stroke={gold} />
          <text x={-8} y={sy(rs_mid) + 3} textAnchor="end" fill={gold} fontSize={8}>{rs_mid.toFixed(2)}</text>

          {/* ── RS CURVE ── */}
          {/* Segment 1: vertical at pLo from bottom up to rs_mid */}
          <line x1={x1} y1={sy(0)} x2={x1} y2={sy(rs_mid)} stroke={gold} strokeWidth={2.5} />
          {/* Segment 2: flat at rs_mid from pLo to pHi */}
          <line x1={x1} y1={sy(rs_mid)} x2={x2} y2={sy(rs_mid)} stroke={gold} strokeWidth={2.5} />
          {/* Segment 3: vertical at pHi going up */}
          <line x1={x2} y1={sy(rs_mid)} x2={x2} y2={sy(0)} stroke={gold} strokeWidth={2.5} />

          {/* RS = value label — above the flat segment, centered */}
          {x2 - x1 > 20 && (
            <text x={(x1 + x2) / 2} y={sy(rs_mid) - 10} textAnchor="middle" fill={gold} fontSize={8} fontWeight={600}>
              RS = {rs_mid.toFixed(2)}
            </text>
          )}

          {/* Dashed vertical guides */}
          <line x1={x1} y1={0} x2={x1} y2={cH} stroke={blue}   strokeWidth={1} strokeDasharray="3,3" opacity={0.25} />
          <line x1={x2} y1={0} x2={x2} y2={cH} stroke={purple} strokeWidth={1} strokeDasharray="3,3" opacity={0.25} />

          {/* Region annotations — placed in upper part of chart away from curves */}
          {x1 > 40 && (
            <text x={x1 / 2} y={14} textAnchor="middle" fill={blue} fontSize={7} opacity={0.8}>
              {clothCALabel} not yet
            </text>
          )}
          {x1 > 40 && (
            <text x={x1 / 2} y={23} textAnchor="middle" fill={blue} fontSize={7} opacity={0.8}>
              specializing
            </text>
          )}
          {x2 - x1 > 30 && (
            <text x={(x1 + x2) / 2} y={14} textAnchor="middle" fill={gold} fontSize={7} opacity={0.8}>
              Both fully specialize
            </text>
          )}
          {cW - x2 > 40 && (
            <text x={Math.min(x2 + (cW - x2) / 2, cW - 4)} y={14} textAnchor="middle" fill={purple} fontSize={7} opacity={0.8}>
              {wheatCALabel} switches
            </text>
          )}
          {cW - x2 > 40 && (
            <text x={Math.min(x2 + (cW - x2) / 2, cW - 4)} y={23} textAnchor="middle" fill={purple} fontSize={7} opacity={0.8}>
              to cloth
            </text>
          )}

          {/* Corner dots */}
          {[[x1, sy(rs_mid)], [x2, sy(rs_mid)]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={3.5} fill={gold} />
          ))}

          {/* ── RELATIVE DEMAND CURVE ── */}
          <polyline points={rdPts.join(" ")} fill="none" stroke={green} strokeWidth={2} opacity={0.85} strokeDasharray="5,3" />
          {/* RD label — place at top-right where curve enters chart */}
          <text x={cW - 4} y={sy(rsMax * 0.97)} textAnchor="end" fill={green} fontSize={7.5}>RD</text>

          {/* Equilibrium — drop-line only if P* is meaningfully different from pLo/pHi */}
          {inFlatRange && (() => {
            const ex = sx(pEqVal);
            const ey = sy(rs_mid);
            // Offset P* label upward if it would collide with x-axis autarky labels
            const tooCloseToPLo = Math.abs(pEqVal - pLo) / pMax * cW < 22;
            const tooCloseToPHi = Math.abs(pEqVal - pHi) / pMax * cW < 22;
            return (
              <>
                <circle cx={ex} cy={ey} r={5} fill={green} opacity={0.9} />
                <line x1={ex} y1={ey} x2={ex} y2={cH} stroke={green} strokeWidth={1} strokeDasharray="3,2" opacity={0.4} />
                {/* P* label: above the flat line if too close to autarky ticks below */}
                <text x={ex} y={tooCloseToPLo || tooCloseToPHi ? ey - 14 : cH + 15}
                  textAnchor="middle" fill={green} fontSize={8.5} fontWeight="bold">
                  P*={pEqVal.toFixed(2)}
                </text>
              </>
            );
          })()}
          {inLowRange && (
            <>
              <circle cx={x1} cy={sy(Math.min(rdShare / ((1 - rdShare) * pLo), rsMax * 0.95))} r={5} fill={green} opacity={0.9} />
              <text x={x1 + 6} y={sy(Math.min(rdShare / ((1 - rdShare) * pLo), rsMax * 0.95)) - 6} fill={green} fontSize={7}>
                P*=pLo
              </text>
            </>
          )}
          {inHighRange && (
            <>
              <circle cx={x2} cy={sy(Math.min(rdShare / ((1 - rdShare) * pHi), rsMax * 0.95))} r={5} fill={green} opacity={0.9} />
              <text x={x2 - 6} y={sy(Math.min(rdShare / ((1 - rdShare) * pHi), rsMax * 0.95)) - 6} textAnchor="end" fill={green} fontSize={7}>
                P*=pHi
              </text>
            </>
          )}
        </g>
      </svg>
      </div>

      {/* Key values table */}
      <div className="stat-grid-3" style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }}>
        {[
          { label: `${clothCALabel} autarky P`, value: pLo.toFixed(3), color: blue },
          { label: "Equilibrium range [pLo, pHi]", value: `[${pLo.toFixed(2)}, ${pHi.toFixed(2)}]`, color: gold },
          { label: `${wheatCALabel} autarky P`, value: pHi.toFixed(3), color: purple },
          { label: `${clothCALabel} max cloth`, value: clothCA_cloth.toFixed(1), color: blue },
          { label: "RS (flat segment)", value: rs_mid.toFixed(3), color: gold },
          { label: `${wheatCALabel} max wheat`, value: wheatCA_wheat.toFixed(1), color: purple },
          { label: "RD share (θ)", value: rdShare.toFixed(2), color: green },
          { label: "Eq. price P*", value: inFlatRange ? pEqVal.toFixed(3) : inLowRange ? `${pLo.toFixed(2)} (pLo)` : `${pHi.toFixed(2)} (pHi)`, color: green },
          { label: "Specialization", value: inFlatRange ? "Complete" : "Incomplete", color: inFlatRange ? green : gold },
        ].map((r, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.4rem 0.6rem", borderRadius: "2px" }}>
            <div style={{ fontSize: "0.58rem", color: dim, fontFamily: mono, marginBottom: "0.2rem" }}>{r.label}</div>
            <div style={{ fontSize: "0.72rem", color: r.color, fontFamily: mono, fontWeight: 600 }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── WAGE RATIO CALCULATOR ────────────────────────────────────────────────────

function WageRatioCalc({ p, homeRatio, forRatio, wLo, wHi, tradeExists }) {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const purple = "#a57fa5";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";

  // Given P* from RD (user can set), compute w/w*
  // w/w* = P_cloth/P_wheat * (a*_LC/a_LC) if home produces cloth
  // More generally: w/w* lies in [wLo, wHi]
  // At P*: if Home specializes in cloth => w = P_c/a_LC, w* = P_w/a*_LW
  //   => w/w* = (P_c/P_w) * (a*_LW/a_LC) ... but this requires P*
  // Let user set w/w* directly and show which goods each country produces

  const [wRatio, setWRatio] = useState(() => (wLo + wHi) / 2);
  const validWRatio = Math.max(0.01, wRatio);

  // For each good, Home produces if a_Li/a*_Li < w/w* (Home relatively cheaper)
  // Home produces cloth if a_LC/a*_LC < w/w*
  // Home produces wheat if a_LW/a*_LW < w/w*
  const homeProducesCloth = (p.aLC / p.aLCs) < validWRatio;
  const homeProducesWheat = (p.aLW / p.aLWs) < validWRatio;

  // Real wages at this w/w*
  // If home specializes in cloth: w = P_c / a_LC
  // Use w/w* and the autarky price to back out P*
  // Actually show wages in terms of purchasing power of each good
  // w in terms of cloth = 1/a_LC (if home produces cloth)
  // w in terms of wheat = P_c/(P_w * a_LC) = homeRatio/a_LC ... 

  const W = 480; const H = 60;
  const pad = { left: 20, right: 20, top: 10, bottom: 10 };
  const cW = W - pad.left - pad.right;

  // Scale: wRatio axis from 0 to wHi*1.5
  const axMax = Math.max(wHi * 1.6, validWRatio * 1.2);
  const sx = v => (v / axMax) * cW;

  return (
    <div style={{ marginTop: "0.8rem" }}>
      <div style={{ fontSize: "0.65rem", color: blue, letterSpacing: "0.08em", marginBottom: "0.5rem", fontFamily: mono }}>
        WAGE RATIO CALCULATOR (w / w*)
      </div>

      {/* Slider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
        <span style={{ fontFamily: mono, fontSize: "0.62rem", color: dim, whiteSpace: "nowrap" }}>w/w* =</span>
        <input type="range" min={0.01} max={axMax} step={0.01} value={validWRatio}
          onChange={e => setWRatio(parseFloat(e.target.value))}
          style={{ accentColor: gold, flex: 1, cursor: "pointer" }} />
        <span style={{ fontFamily: mono, fontSize: "0.78rem", color: gold, fontWeight: 700, minWidth: 40 }}>
          {validWRatio.toFixed(2)}
        </span>
      </div>

      {/* Number line SVG */}
      <div className="svg-scroll">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: mono, display: "block", marginBottom: "0.6rem" }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Base line */}
          <line x1={0} y1={30} x2={cW} y2={30} stroke="#2a3a4a" strokeWidth={2} />

          {/* Valid trade range */}
          <rect x={sx(wLo)} y={22} width={sx(wHi) - sx(wLo)} height={16}
            fill="rgba(226,201,126,0.12)" stroke={gold} strokeWidth={1} rx={2} />
          <text x={(sx(wLo) + sx(wHi)) / 2} y={19} textAnchor="middle" fill={gold} fontSize={7}>
            trade range
          </text>

          {/* wLo tick */}
          <line x1={sx(wLo)} y1={24} x2={sx(wLo)} y2={36} stroke={blue} strokeWidth={1.5} />
          <text x={sx(wLo)} y={48} textAnchor="middle" fill={blue} fontSize={7}>{wLo.toFixed(2)}</text>
          <text x={sx(wLo)} y={56} textAnchor="middle" fill={blue} fontSize={6}>a_LC/a*_LC</text>

          {/* wHi tick */}
          <line x1={sx(wHi)} y1={24} x2={sx(wHi)} y2={36} stroke={purple} strokeWidth={1.5} />
          <text x={sx(wHi)} y={48} textAnchor="middle" fill={purple} fontSize={7}>{wHi.toFixed(2)}</text>
          <text x={sx(wHi)} y={56} textAnchor="middle" fill={purple} fontSize={6}>a_LW/a*_LW</text>

          {/* Current w/w* */}
          <line x1={sx(validWRatio)} y1={16} x2={sx(validWRatio)} y2={44} stroke={gold} strokeWidth={2.5} />
          <circle cx={sx(validWRatio)} cy={30} r={5} fill={gold} />
        </g>
      </svg>
      </div>

      {/* Production pattern */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
        {[
          { label: "HOME produces", cloth: homeProducesCloth, wheat: homeProducesWheat, color: blue },
          { label: "FOREIGN produces", cloth: !homeProducesCloth, wheat: !homeProducesWheat, color: purple },
        ].map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${c.color}33`, padding: "0.6rem", borderRadius: "2px" }}>
            <div style={{ fontSize: "0.58rem", color: c.color, fontFamily: mono, marginBottom: "0.4rem" }}>{c.label}</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span style={{ fontFamily: mono, fontSize: "0.72rem", color: c.cloth ? green : red }}>
                {c.cloth ? "✓" : "✗"} Cloth
              </span>
              <span style={{ fontFamily: mono, fontSize: "0.72rem", color: c.wheat ? green : red }}>
                {c.wheat ? "✓" : "✗"} Wheat
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div style={{ fontFamily: mono, fontSize: "0.65rem", color: dim, lineHeight: 1.7,
        background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.7rem", borderRadius: "2px",
        borderLeft: `2px solid ${gold}` }}>
        {!tradeExists ? "No comparative advantage difference — no gains from trade." :
         validWRatio < wLo ? `w/w* < ${wLo.toFixed(2)}: Home wages too low — Home would produce both goods. Below trade equilibrium.` :
         validWRatio > wHi ? `w/w* > ${wHi.toFixed(2)}: Home wages too high — Foreign produces both goods. Above trade equilibrium.` :
         `w/w* = ${validWRatio.toFixed(2)} is within [${wLo.toFixed(2)}, ${wHi.toFixed(2)}]. 
Home specializes in ${homeProducesCloth && !homeProducesWheat ? "Cloth" : homeProducesWheat && !homeProducesCloth ? "Wheat" : "both (incomplete specialization)"}, 
Foreign in ${!homeProducesCloth ? "Cloth" : "Wheat"}. Both gain from trade.`}
      </div>
    </div>
  );
}

// ─── MANY-GOOD RICARDIAN CHAIN ────────────────────────────────────────────────

const DEFAULT_MANY_GOODS = [
  { name: "Semiconductors", aH: 1, aF: 8 },
  { name: "Machinery",      aH: 2, aF: 10 },
  { name: "Cloth",          aH: 2, aF: 4 },
  { name: "Wheat",          aH: 1, aF: 2 },
  { name: "Steel",          aH: 3, aF: 5 },
  { name: "Textiles",       aH: 4, aF: 5 },
];

function ManyGoodChain() {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const purple = "#a57fa5";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";

  const [goods, setGoods] = useState(DEFAULT_MANY_GOODS);
  const [wRatio, setWRatio] = useState(0.4);
  const [newGood, setNewGood] = useState({ name: "", aH: 1, aF: 2 });

  // Sort by a_Hi/a_Fi (Home relative unit labor req) ascending = Home CA first
  const sorted = [...goods]
    .map(g => ({ ...g, ratio: g.aH / g.aF }))
    .sort((a, b) => a.ratio - b.ratio);

  // Home produces good i if a_Hi/a_Fi < w/w*
  // i.e. ratio < wRatio
  const axMax = Math.max(...sorted.map(g => g.ratio)) * 1.3;

  const addGood = () => {
    if (newGood.name.trim() && newGood.aH > 0 && newGood.aF > 0) {
      setGoods(prev => [...prev, { ...newGood, aH: Math.max(0.01, newGood.aH), aF: Math.max(0.01, newGood.aF) }]);
      setNewGood({ name: "", aH: 1, aF: 2 });
    }
  };

  const removeGood = name => setGoods(prev => prev.filter(g => g.name !== name));

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ fontSize: "0.65rem", color: blue, letterSpacing: "0.08em", marginBottom: "0.5rem", fontFamily: mono }}>
        MANY-GOOD RICARDIAN CHAIN
      </div>
      <div style={{ fontSize: "0.62rem", color: dim, fontStyle: "italic", marginBottom: "0.7rem", fontFamily: mono }}>
        Goods ranked by Home's relative unit labor cost (a_H/a_F). Home produces all goods to the left of the wage ratio cut-point.
      </div>

      {/* w/w* slider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.8rem" }}>
        <span style={{ fontFamily: mono, fontSize: "0.62rem", color: dim, whiteSpace: "nowrap" }}>w/w* =</span>
        <input type="range" min={0.01} max={axMax} step={0.01} value={wRatio}
          onChange={e => setWRatio(parseFloat(e.target.value))}
          style={{ accentColor: gold, flex: 1, cursor: "pointer" }} />
        <span style={{ fontFamily: mono, fontSize: "0.78rem", color: gold, fontWeight: 700, minWidth: 40 }}>
          {wRatio.toFixed(2)}
        </span>
      </div>

      {/* Chain visualization */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.8rem", alignItems: "center" }}>
        {sorted.map((g, i) => {
          const homeProduces = g.ratio < wRatio;
          const isCutPoint = i < sorted.length - 1 &&
            sorted[i].ratio < wRatio && sorted[i + 1].ratio >= wRatio;
          return (
            <div key={g.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{
                background: homeProduces ? "rgba(74,159,232,0.12)" : "rgba(165,127,165,0.12)",
                border: `1px solid ${homeProduces ? blue : purple}`,
                borderRadius: "2px", padding: "0.35rem 0.6rem",
                fontFamily: mono, fontSize: "0.65rem", position: "relative",
              }}>
                <div style={{ color: homeProduces ? blue : purple, fontWeight: 600 }}>{g.name}</div>
                <div style={{ color: dim, fontSize: "0.58rem" }}>
                  {g.ratio.toFixed(2)} {homeProduces ? "← Home" : "← Foreign"}
                </div>
                <button onClick={() => removeGood(g.name)} style={{
                  position: "absolute", top: 2, right: 3, background: "none", border: "none",
                  color: dim, cursor: "pointer", fontSize: "0.6rem", lineHeight: 1, padding: 0,
                }}>✕</button>
              </div>
              {isCutPoint && (
                <div style={{ fontFamily: mono, fontSize: "1rem", color: gold, fontWeight: 700 }}>│</div>
              )}
              {!isCutPoint && i < sorted.length - 1 && (
                <div style={{ color: dim, fontSize: "0.7rem" }}>→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.8rem" }}>
        <div style={{ background: "rgba(74,127,165,0.07)", border: `1px solid ${blue}33`, padding: "0.6rem", borderRadius: "2px" }}>
          <div style={{ fontFamily: mono, fontSize: "0.58rem", color: blue, marginBottom: "0.3rem" }}>HOME PRODUCES</div>
          {sorted.filter(g => g.ratio < wRatio).length === 0
            ? <div style={{ fontFamily: mono, fontSize: "0.65rem", color: red }}>Nothing (w/w* too low)</div>
            : sorted.filter(g => g.ratio < wRatio).map(g => (
              <div key={g.name} style={{ fontFamily: mono, fontSize: "0.65rem", color: green }}>✓ {g.name} (a_H/a_F={g.ratio.toFixed(2)})</div>
            ))}
        </div>
        <div style={{ background: "rgba(165,127,165,0.07)", border: `1px solid ${purple}33`, padding: "0.6rem", borderRadius: "2px" }}>
          <div style={{ fontFamily: mono, fontSize: "0.58rem", color: purple, marginBottom: "0.3rem" }}>FOREIGN PRODUCES</div>
          {sorted.filter(g => g.ratio >= wRatio).length === 0
            ? <div style={{ fontFamily: mono, fontSize: "0.65rem", color: red }}>Nothing (w/w* too high)</div>
            : sorted.filter(g => g.ratio >= wRatio).map(g => (
              <div key={g.name} style={{ fontFamily: mono, fontSize: "0.65rem", color: purple }}>✓ {g.name} (a_H/a_F={g.ratio.toFixed(2)})</div>
            ))}
        </div>
      </div>

      {/* Add good */}
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>Add good:</span>
        <input value={newGood.name} onChange={e => setNewGood(g => ({ ...g, name: e.target.value }))}
          placeholder="Name" style={{
            background: "#0d1520", border: "1px solid #2a3a4a", color: "#c8d8e8",
            fontFamily: mono, fontSize: "0.65rem", padding: "0.25rem 0.4rem",
            borderRadius: "2px", width: 90,
          }} />
        <span style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>a_H:</span>
        <input type="number" value={newGood.aH} min={0.1} step={0.1}
          onChange={e => setNewGood(g => ({ ...g, aH: parseFloat(e.target.value) || 1 }))}
          style={{
            background: "#0d1520", border: "1px solid #2a3a4a", color: blue,
            fontFamily: mono, fontSize: "0.65rem", padding: "0.25rem 0.4rem",
            borderRadius: "2px", width: 50,
          }} />
        <span style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>a_F:</span>
        <input type="number" value={newGood.aF} min={0.1} step={0.1}
          onChange={e => setNewGood(g => ({ ...g, aF: parseFloat(e.target.value) || 1 }))}
          style={{
            background: "#0d1520", border: "1px solid #2a3a4a", color: purple,
            fontFamily: mono, fontSize: "0.65rem", padding: "0.25rem 0.4rem",
            borderRadius: "2px", width: 50,
          }} />
        <button onClick={addGood} style={{
          background: "none", border: `1px solid ${gold}`, color: gold,
          fontFamily: mono, fontSize: "0.62rem", padding: "0.25rem 0.6rem",
          cursor: "pointer", borderRadius: "2px",
        }}>+ Add</button>
      </div>
    </div>
  );
}

function RicardianModel() {
  const [p, setP] = useState({ aLC: 1, aLW: 2, aLCs: 3, aLWs: 1, L: 100, Ls: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const homeRatio = p.aLC / p.aLW;
  const forRatio = p.aLCs / p.aLWs;
  const homeCA = homeRatio < forRatio ? "Cloth" : "Wheat";
  const forCA = homeRatio < forRatio ? "Wheat" : "Cloth";
  const hCloth = p.L / p.aLC;
  const hWheat = p.L / p.aLW;
  const fCloth = p.Ls / p.aLCs;
  const fWheat = p.Ls / p.aLWs;
  const wLo = Math.min(p.aLC / p.aLCs, p.aLW / p.aLWs);
  const wHi = Math.max(p.aLC / p.aLCs, p.aLW / p.aLWs);
  const tradeExists = Math.abs(wLo - wHi) > 0.001;
  const xMax = Math.max(hCloth, fCloth) * 1.1;
  const yMax = Math.max(hWheat, fWheat) * 1.1;

  return (
    <div className="sim-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Explainer>
          <strong style={{ color: "#c8d8e8" }}>The Ricardian Model</strong> (Ricardo, 1817) shows that trade is driven by <em>comparative</em> advantage, not absolute advantage. Even if one country is more productive at everything, both gain by specializing where their relative productivity advantage is greatest.
          <br /><br />
          Home has CA in Cloth if its opportunity cost (a_LC/a_LW) is lower than Foreign's (a*_LC/a*_LW). The relative wage must fall within [a_LC/a*_LC, a_LW/a*_LW] for mutually beneficial trade to occur.
        </Explainer>
        <Panel title="Parameters">
          <PresetDropdown presets={RICARDIAN_PRESETS} onSelect={id => {
            const preset = RICARDIAN_PRESETS.find(p => p.id === id);
            if (preset) setP(preset.params);
          }} />
          <div style={{ fontSize: "0.68rem", color: "#4a7fa5", marginBottom: "0.8rem" }}>Home Country</div>
          <Slider label="a_LC (labor/cloth)" value={p.aLC} min={0.5} max={5} step={0.1} onChange={set("aLC")} desc="Labor hrs to produce 1 unit cloth" />
          <Slider label="a_LW (labor/wheat)" value={p.aLW} min={0.5} max={5} step={0.1} onChange={set("aLW")} desc="Labor hrs to produce 1 unit wheat" />
          <Slider label="L (labor endowment)" value={p.L} min={50} max={300} step={10} onChange={set("L")} />
          <div style={{ fontSize: "0.68rem", color: "#a57fa5", marginBottom: "0.8rem", marginTop: "0.5rem" }}>Foreign Country</div>
          <Slider label="a*_LC" value={p.aLCs} min={0.5} max={5} step={0.1} onChange={set("aLCs")} />
          <Slider label="a*_LW" value={p.aLWs} min={0.5} max={5} step={0.1} onChange={set("aLWs")} />
          <Slider label="L* (labor endowment)" value={p.Ls} min={50} max={300} step={10} onChange={set("Ls")} />
        </Panel>
      </div>
      <div>
        <Panel title="Results">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
            <Stat label="Home CA in" value={homeCA} highlight />
            <Stat label="Foreign CA in" value={forCA} highlight />
            <Stat label="Home opp. cost of cloth" value={`${homeRatio.toFixed(2)} wheat`} />
            <Stat label="Foreign opp. cost of cloth" value={`${forRatio.toFixed(2)} wheat`} />
            <Stat label="Relative wage bounds" value={tradeExists ? `[${wLo.toFixed(2)}, ${wHi.toFixed(2)}]` : "No trade"} small />
          </div>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <AxesChart xMax={xMax} yMax={yMax} xLabel="Cloth" yLabel="Wheat">
              {({ sx, sy }) => (
                <>
                  <line x1={sx(hCloth)} y1={sy(0)} x2={sx(0)} y2={sy(hWheat)} stroke="#4a9fe8" strokeWidth={2} />
                  <text x={sx(hCloth) - 2} y={sy(0) - 6} fill="#4a9fe8" fontSize={8}>Home</text>
                  <line x1={sx(fCloth)} y1={sy(0)} x2={sx(0)} y2={sy(fWheat)} stroke="#a57fa5" strokeWidth={2} strokeDasharray="4,3" />
                  <text x={sx(fCloth) - 2} y={sy(0) - 6} fill="#a57fa5" fontSize={8}>Foreign</text>
                  <text x={sx(hCloth * 0.5)} y={sy(hWheat * 0.5) - 8} fill="#e2c97e" fontSize={7.5} textAnchor="middle">slope: -{homeRatio.toFixed(2)}</text>
                </>
              )}
            </AxesChart>
          </div>
          <Collapsible title="Real Wages (units of good per hour of labor)" accent="#4a7fa5" defaultOpen={true}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
            <div style={{ background: "rgba(74,127,165,0.07)", border: "1px solid rgba(74,127,165,0.15)", borderRadius: "2px", padding: "0.7rem" }}>
              <div style={{ fontSize: "0.6rem", color: "#4a7fa5", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>HOME — AUTARKY vs TRADE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.3rem", fontSize: "0.62rem", fontFamily: "'IBM Plex Mono', monospace" }}>
                <div style={{ color: "#3a5a7a" }}></div>
                <div style={{ color: "#3a5a7a", textAlign: "right" }}>Cloth</div>
                <div style={{ color: "#3a5a7a", textAlign: "right" }}>Wheat</div>
                <div style={{ color: "#8a9bb0" }}>Autarky</div>
                <div style={{ color: "#c8d8e8", textAlign: "right" }}>{(1/p.aLC).toFixed(3)}</div>
                <div style={{ color: "#c8d8e8", textAlign: "right" }}>{(1/p.aLW).toFixed(3)}</div>
                <div style={{ color: "#e2c97e" }}>Trade</div>
                <div style={{ color: homeCA === "Cloth" ? "#7fe87f" : "#c8d8e8", textAlign: "right", fontWeight: homeCA === "Cloth" ? 700 : 400 }}>
                  {homeCA === "Cloth" ? (1/p.aLC).toFixed(3) : `≥${(1/p.aLC).toFixed(3)}`}
                </div>
                <div style={{ color: homeCA === "Wheat" ? "#7fe87f" : "#c8d8e8", textAlign: "right", fontWeight: homeCA === "Wheat" ? 700 : 400 }}>
                  {homeCA === "Wheat" ? (1/p.aLW).toFixed(3) : `≥${(1/p.aLW).toFixed(3)}`}
                </div>
              </div>
              <div style={{ fontSize: "0.6rem", color: "#5a7a5a", marginTop: "0.4rem", fontStyle: "italic" }}>
                Specializes in {homeCA} — real wage in {homeCA} unchanged, real wage in {homeCA === "Cloth" ? "Wheat" : "Cloth"} rises via trade.
              </div>
            </div>
            <div style={{ background: "rgba(165,127,165,0.07)", border: "1px solid rgba(165,127,165,0.15)", borderRadius: "2px", padding: "0.7rem" }}>
              <div style={{ fontSize: "0.6rem", color: "#a57fa5", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>FOREIGN — AUTARKY vs TRADE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.3rem", fontSize: "0.62rem", fontFamily: "'IBM Plex Mono', monospace" }}>
                <div style={{ color: "#3a5a7a" }}></div>
                <div style={{ color: "#3a5a7a", textAlign: "right" }}>Cloth</div>
                <div style={{ color: "#3a5a7a", textAlign: "right" }}>Wheat</div>
                <div style={{ color: "#8a9bb0" }}>Autarky</div>
                <div style={{ color: "#c8d8e8", textAlign: "right" }}>{(1/p.aLCs).toFixed(3)}</div>
                <div style={{ color: "#c8d8e8", textAlign: "right" }}>{(1/p.aLWs).toFixed(3)}</div>
                <div style={{ color: "#e2c97e" }}>Trade</div>
                <div style={{ color: forCA === "Cloth" ? "#7fe87f" : "#c8d8e8", textAlign: "right", fontWeight: forCA === "Cloth" ? 700 : 400 }}>
                  {forCA === "Cloth" ? (1/p.aLCs).toFixed(3) : `≥${(1/p.aLCs).toFixed(3)}`}
                </div>
                <div style={{ color: forCA === "Wheat" ? "#7fe87f" : "#c8d8e8", textAlign: "right", fontWeight: forCA === "Wheat" ? 700 : 400 }}>
                  {forCA === "Wheat" ? (1/p.aLWs).toFixed(3) : `≥${(1/p.aLWs).toFixed(3)}`}
                </div>
              </div>
              <div style={{ fontSize: "0.6rem", color: "#5a7a5a", marginTop: "0.4rem", fontStyle: "italic" }}>
                Specializes in {forCA} — real wage in {forCA} unchanged, real wage in {forCA === "Cloth" ? "Wheat" : "Cloth"} rises via trade.
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a" }}>
            {tradeExists ? `Trade is mutually beneficial. Home specializes in ${homeCA}, Foreign in ${forCA}.` : "Both countries have identical relative productivities — no gains from trade."}
          </div>
          </Collapsible>
          <Collapsible title="World Relative Supply & Demand" accent="#e2c97e" defaultOpen={false}>
          <RSCurve p={p} homeCA={homeCA} hCloth={hCloth} hWheat={hWheat} fCloth={fCloth} fWheat={fWheat} homeRatio={homeRatio} forRatio={forRatio} tradeExists={tradeExists} />
          </Collapsible>
          <Collapsible title="Wage Ratio Calculator (w / w*)" accent="#4a9fe8" defaultOpen={false}>
          <WageRatioCalc p={p} homeRatio={homeRatio} forRatio={forRatio} wLo={wLo} wHi={wHi} tradeExists={tradeExists} />
          </Collapsible>
          <Collapsible title="Many-Good Ricardian Chain" accent="#a57fa5" defaultOpen={false}>
          <ManyGoodChain />
          </Collapsible>
          <Collapsible title="Trade Volume Calculator" accent="#4a9fe8" defaultOpen={false}>
            <TradeVolume
              exports_={homeCA === "Cloth" ? hCloth * 0.35 : hWheat * 0.35}
              imports_={homeCA === "Cloth" ? hWheat * 0.35 : hCloth * 0.35}
              prodX={homeCA === "Cloth" ? hCloth : 0}
              prodY={homeCA === "Cloth" ? 0 : hWheat}
              consX={homeCA === "Cloth" ? hCloth * 0.65 : hCloth * 0.35}
              consY={homeCA === "Cloth" ? hWheat * 0.35 : hWheat * 0.65}
              ToT={(wLo + wHi) / 2}
              label={homeCA === "Cloth" ? "Cloth" : "Wheat"}
            />
          </Collapsible>
          <Collapsible title="Quiz Mode" accent="#e2c97e" defaultOpen={false}>
            <QuizMode model="ricardian" answers={{
              homeCA: homeCA,
              forCA: forCA,
              wages: tradeExists ? "Rise in both countries" : "Unchanged",
            }} />
          </Collapsible>
          <ExplainButton model="ricardian" params={p}
            results={{ homeCA, forCA, wageLo: wLo.toFixed(2), wageHi: wHi.toFixed(2), tradeExists }} />
        </Panel>
      </div>
    </div>
  );
}


// ─── RYBCZYNSKI VISUALIZER ────────────────────────────────────────────────────

function RybczynskiViz({ p }) {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const purple = "#a57fa5";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";

  const [dK, setDK] = useState(0);
  const [dL, setDL] = useState(0);

  // H-O production point approximation using factor market clearing
  // At given factor prices (w, r), firms choose K/L ratios for each good
  // Capital intensity: X uses theta_KX fraction of costs as capital
  // Labor intensity: X uses (1-theta_KX) fraction as labor
  // In a 2x2 model with full employment:
  //   K: aKX * Qx + aKY * Qy = K  (capital market clearing)
  //   L: aLX * Qx + aLY * Qy = L  (labor market clearing)
  // We use theta as proxies for factor requirements
  // aKX = theta_KX (capital req per unit X), aLX = (1-theta_KX)
  // aKY = theta_KY, aLY = (1-theta_KY)

  const tKX = p.aKX; const tLX = 1 - p.aKX;
  const tKY = p.aKY; const tLY = 1 - p.aKY;

  // Solve 2x2 system: [tKX, tKY; tLX, tLY] * [Qx; Qy] = [K; L]
  const solveProduction = (K, L) => {
    const det = tKX * tLY - tKY * tLX;
    if (Math.abs(det) < 1e-9) return { Qx: 0, Qy: 0 };
    const Qx = (tLY * K - tKY * L) / det;
    const Qy = (tKX * L - tLX * K) / det;
    return { Qx: Math.max(0, Qx), Qy: Math.max(0, Qy) };
  };

  const base = solveProduction(p.KH, p.LH);
  const shock = solveProduction(p.KH + dK, p.LH + dL);

  const maxQ = Math.max(base.Qx, base.Qy, shock.Qx, shock.Qy) * 1.3;

  // Rybczynski line: for capital shock, line through base and shock in (Qx, Qy) space
  // Direction vector
  const ryb = { dx: shock.Qx - base.Qx, dy: shock.Qy - base.Qy };

  const W = 280; const H = 220;
  const pad = { top: 14, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const sx = v => (v / maxQ) * cW;
  const sy = v => cH - (v / maxQ) * cH;

  // Rybczynski theorem: which sector expands?
  const capitalShock = dK !== 0;
  const laborShock = dL !== 0;
  const xExpands = shock.Qx > base.Qx;
  const yExpands = shock.Qy > base.Qy;

  const xCapInt = p.aKX > p.aKY;
  const shockDesc = dK > 0 ? "K↑" : dK < 0 ? "K↓" : dL > 0 ? "L↑" : dL < 0 ? "L↓" : "no shock";

  return (
    <div>
      <div style={{ fontSize: "0.62rem", color: dim, fontStyle: "italic", marginBottom: "0.7rem", fontFamily: mono, lineHeight: 1.6 }}>
        At constant goods prices, a factor endowment increase expands the sector that uses it intensively and <em>contracts</em> the other (magnification effect).
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: "0.6rem", color: dim, marginBottom: "0.3rem" }}>ΔK (capital shock)</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="range" min={-p.KH * 0.5} max={p.KH * 0.8} step={1} value={dK}
              onChange={e => setDK(parseFloat(e.target.value))}
              style={{ accentColor: gold, flex: 1 }} />
            <span style={{ fontFamily: mono, fontSize: "0.72rem", color: dK > 0 ? green : dK < 0 ? red : dim, minWidth: 40 }}>
              {dK > 0 ? "+" : ""}{dK.toFixed(0)}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: mono, fontSize: "0.6rem", color: dim, marginBottom: "0.3rem" }}>ΔL (labor shock)</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="range" min={-p.LH * 0.5} max={p.LH * 0.8} step={1} value={dL}
              onChange={e => setDL(parseFloat(e.target.value))}
              style={{ accentColor: gold, flex: 1 }} />
            <span style={{ fontFamily: mono, fontSize: "0.72rem", color: dL > 0 ? green : dL < 0 ? red : dim, minWidth: 40 }}>
              {dL > 0 ? "+" : ""}{dL.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="svg-scroll" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        {/* Chart */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: mono, flexShrink: 0, minWidth: 180, maxWidth: W }}>
          <g transform={`translate(${pad.left},${pad.top})`}>
            {[0.25,0.5,0.75,1].map(f => (
              <g key={f}>
                <line x1={0} y1={sy(f*maxQ)} x2={cW} y2={sy(f*maxQ)} stroke="rgba(255,255,255,0.03)" />
                <line x1={sx(f*maxQ)} y1={0} x2={sx(f*maxQ)} y2={cH} stroke="rgba(255,255,255,0.03)" />
              </g>
            ))}
            <line x1={0} y1={cH} x2={cW} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
            <text x={cW/2} y={cH+28} textAnchor="middle" fill={dim} fontSize={9}>Good X ({xCapInt ? "capital" : "labor"}-intensive)</text>
            <text x={-cH/2} y={-32} textAnchor="middle" fill={dim} fontSize={9} transform="rotate(-90)">Good Y ({xCapInt ? "labor" : "capital"}-intensive)</text>
            {[0,0.5,1].map(f => (
              <g key={f}>
                <text x={sx(f*maxQ)} y={cH+12} textAnchor="middle" fill="#3a4a5a" fontSize={7.5}>{(f*maxQ).toFixed(0)}</text>
                {f > 0 && <text x={-6} y={sy(f*maxQ)+3} textAnchor="end" fill="#3a4a5a" fontSize={7.5}>{(f*maxQ).toFixed(0)}</text>}
              </g>
            ))}

            {/* Rybczynski line (extended through both points) */}
            {(dK !== 0 || dL !== 0) && (() => {
              const len = Math.sqrt(ryb.dx**2 + ryb.dy**2);
              if (len < 0.01) return null;
              const ext = maxQ * 2;
              const x1 = base.Qx - (ryb.dx/len)*ext; const y1 = base.Qy - (ryb.dy/len)*ext;
              const x2 = base.Qx + (ryb.dx/len)*ext; const y2 = base.Qy + (ryb.dy/len)*ext;
              return <line x1={sx(x1)} y1={sy(y1)} x2={sx(x2)} y2={sy(y2)}
                stroke={gold} strokeWidth={1} strokeDasharray="4,3" opacity={0.4} />;
            })()}

            {/* Arrow from base to shock */}
            {(dK !== 0 || dL !== 0) && (
              <line x1={sx(base.Qx)} y1={sy(base.Qy)} x2={sx(shock.Qx)} y2={sy(shock.Qy)}
                stroke={gold} strokeWidth={2} markerEnd="url(#arrow)" />
            )}

            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={gold} />
              </marker>
            </defs>

            {/* Base point */}
            <circle cx={sx(base.Qx)} cy={sy(base.Qy)} r={5} fill={blue} />
            <text x={sx(base.Qx)+7} y={sy(base.Qy)-4} fill={blue} fontSize={7.5}>Base</text>
            <text x={sx(base.Qx)+7} y={sy(base.Qy)+6} fill={dim} fontSize={6.5}>({base.Qx.toFixed(1)}, {base.Qy.toFixed(1)})</text>

            {/* Shock point */}
            {(dK !== 0 || dL !== 0) && (
              <>
                <circle cx={sx(shock.Qx)} cy={sy(shock.Qy)} r={5} fill={green} />
                <text x={sx(shock.Qx)+7} y={sy(shock.Qy)-4} fill={green} fontSize={7.5}>New</text>
                <text x={sx(shock.Qx)+7} y={sy(shock.Qy)+6} fill={dim} fontSize={6.5}>({shock.Qx.toFixed(1)}, {shock.Qy.toFixed(1)})</text>
              </>
            )}
          </g>
        </svg>

        {/* Stats */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.6rem" }}>
            {[
              { label: "X (base)", value: base.Qx.toFixed(1), color: blue },
              { label: "Y (base)", value: base.Qy.toFixed(1), color: blue },
              { label: "X (new)", value: shock.Qx.toFixed(1), color: xExpands ? green : red },
              { label: "Y (new)", value: shock.Qy.toFixed(1), color: yExpands ? green : red },
              { label: "ΔX", value: `${(shock.Qx-base.Qx)>=0?"+":""}${(shock.Qx-base.Qx).toFixed(1)}`, color: xExpands ? green : red },
              { label: "ΔY", value: `${(shock.Qy-base.Qy)>=0?"+":""}${(shock.Qy-base.Qy).toFixed(1)}`, color: yExpands ? green : red },
            ].map((s,i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.35rem 0.5rem", borderRadius: "2px" }}>
                <div style={{ fontFamily: mono, fontSize: "0.55rem", color: dim }}>{s.label}</div>
                <div style={{ fontFamily: mono, fontSize: "0.72rem", color: s.color, fontWeight: 600 }}>{s.value}</div>
              </div>
            ))}
          </div>
          {(dK !== 0 || dL !== 0) && (
            <div style={{ fontFamily: mono, fontSize: "0.65rem", color: dim, lineHeight: 1.7,
              background: "rgba(255,255,255,0.02)", padding: "0.5rem 0.6rem",
              borderRadius: "2px", borderLeft: `2px solid ${gold}` }}>
              {(() => {
                const capGood = xCapInt ? "X" : "Y";
                const labGood = xCapInt ? "Y" : "X";
                if (dK > 0) return `K↑ → ${capGood} expands (capital-intensive), ${labGood} contracts. Rybczynski theorem confirmed.`;
                if (dK < 0) return `K↓ → ${capGood} contracts (capital-intensive), ${labGood} expands.`;
                if (dL > 0) return `L↑ → ${labGood} expands (labor-intensive), ${capGood} contracts. Rybczynski theorem confirmed.`;
                if (dL < 0) return `L↓ → ${labGood} contracts (labor-intensive), ${capGood} expands.`;
                return null;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FACTOR PRICE EQUALIZATION ────────────────────────────────────────────────

function FPEViz({ p }) {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const purple = "#a57fa5";
  const green = "#7fe87f";
  const red = "#e87f7f";
  const dim = "#3a5a7a";

  // Factor prices from zero-profit conditions:
  // P_X = w*aLX + r*aKX  =>  w*(1-tKX) + r*tKX = P_X
  // P_Y = w*aLY + r*aKY  =>  w*(1-tKY) + r*tKY = P_Y
  // Given prices P_X=1, P_Y=1 (normalized), solve for w and r:
  // [1-tKX, tKX; 1-tKY, tKY] * [w; r] = [1; 1]

  const tKX = p.aKX; const tLX = 1 - p.aKX;
  const tKY = p.aKY; const tLY = 1 - p.aKY;

  // Autarky: factor prices reflect domestic factor abundance
  // Home (capital-abundant): higher r_autarky relative to w vs Foreign
  // We proxy autarky factor prices using K/L ratios
  const kH = p.KH / p.LH;
  const kF = p.KF / p.LF;

  // Solve for trade factor prices (same for both countries under FPE)
  const det = tLX * tKY - tKX * tLY;
  let w_trade = 0, r_trade = 0;
  if (Math.abs(det) > 1e-9) {
    w_trade = (tKY - tKX) / det;  // simplified with P_X=P_Y=1
    r_trade = (tLX - tLY) / det;
    w_trade = Math.max(0.01, w_trade);
    r_trade = Math.max(0.01, r_trade);
  }

  // Autarky factor prices: proportional to factor scarcity
  // Home autarky: w_H proportional to L scarcity, r_H to K abundance
  const w_H_aut = 1 / kH;   // lower wage when capital-abundant (K/L high)
  const r_H_aut = kH;       // higher r when capital-abundant
  const w_F_aut = 1 / kF;
  const r_F_aut = kF;

  // Normalize so trade values = 1 for comparison
  const norm = w_trade + r_trade;
  const wT = w_trade / norm; const rT = r_trade / norm;
  const wHA = w_H_aut / (w_H_aut + r_H_aut);
  const rHA = r_H_aut / (w_H_aut + r_H_aut);
  const wFA = w_F_aut / (w_F_aut + r_F_aut);
  const rFA = r_F_aut / (w_F_aut + r_F_aut);

  // Check if countries are in cone of diversification
  // FPE holds if both countries have same factor price equalization
  // Proxy: endowment ratios not too different
  const ratio = kH / kF;
  const inCone = ratio < 4 && ratio > 0.25;

  // Bar chart data
  const bars = [
    { label: "w Home\n(autarky)", value: wHA, color: blue, opacity: 0.5 },
    { label: "w Foreign\n(autarky)", value: wFA, color: purple, opacity: 0.5 },
    { label: "w Home\n(trade)", value: wT, color: blue, opacity: 1 },
    { label: "w Foreign\n(trade)", value: wT, color: purple, opacity: 1 },
    { label: "r Home\n(autarky)", value: rHA, color: blue, opacity: 0.5 },
    { label: "r Foreign\n(autarky)", value: rFA, color: purple, opacity: 0.5 },
    { label: "r Home\n(trade)", value: rT, color: blue, opacity: 1 },
    { label: "r Foreign\n(trade)", value: rT, color: purple, opacity: 1 },
  ];

  const W = 520; const H = 140;
  const pad = { top: 10, right: 10, bottom: 40, left: 30 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const barW = cW / bars.length - 4;

  return (
    <div>
      <div style={{ fontSize: "0.62rem", color: dim, fontStyle: "italic", marginBottom: "0.7rem", fontFamily: mono, lineHeight: 1.6 }}>
        Trade equalizes factor prices across countries even without factor mobility — provided both countries remain in the <em>cone of diversification</em> (producing both goods).
      </div>

      {!inCone && (
        <div style={{ background: "rgba(232,127,127,0.08)", border: "1px solid #e87f7f44", borderLeft: "3px solid #e87f7f",
          padding: "0.5rem 0.8rem", marginBottom: "0.7rem", borderRadius: "2px",
          fontFamily: mono, fontSize: "0.65rem", color: red }}>
          ⚠ K/L ratio difference ({ratio.toFixed(2)}×) is large — countries may be outside the cone of diversification. FPE may not hold.
        </div>
      )}

      <div className="svg-scroll">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: mono, display: "block", marginBottom: "0.6rem" }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          <line x1={0} y1={cH} x2={cW} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
          <line x1={0} y1={0} x2={0} y2={cH} stroke="#2a3a4a" strokeWidth={1.5} />
          {[0.5, 1].map(f => (
            <g key={f}>
              <line x1={0} y1={cH*(1-f)} x2={cW} y2={cH*(1-f)} stroke="rgba(255,255,255,0.04)" />
              <text x={-4} y={cH*(1-f)+3} textAnchor="end" fill={dim} fontSize={7}>{f.toFixed(1)}</text>
            </g>
          ))}
          {bars.map((b, i) => {
            const x = i * (barW + 4);
            const bh = b.value * cH;
            const isWage = i < 4;
            const label1 = b.label.split("\n")[0];
            const label2 = b.label.split("\n")[1];
            return (
              <g key={i}>
                {i === 4 && <line x1={x-2} y1={0} x2={x-2} y2={cH} stroke="#2a3a4a" strokeWidth={1} strokeDasharray="2,2" />}
                <rect x={x} y={cH-bh} width={barW} height={bh} fill={b.color} opacity={b.opacity} rx={1} />
                {/* FPE: draw equality line between trade bars */}
                {(i === 2 || i === 6) && inCone && (
                  <line x1={x+barW} y1={cH-bh} x2={x+barW+4} y2={cH-bh} stroke={green} strokeWidth={1.5} strokeDasharray="2,2" />
                )}
                <text x={x+barW/2} y={cH+12} textAnchor="middle" fill={b.color} fontSize={6} opacity={b.opacity+0.2}>{label1}</text>
                <text x={x+barW/2} y={cH+22} textAnchor="middle" fill={dim} fontSize={5.5}>{label2}</text>
              </g>
            );
          })}
          {/* Section labels */}
          <text x={cW*0.22} y={-3} textAnchor="middle" fill={dim} fontSize={7}>— WAGES (w) —</text>
          <text x={cW*0.75} y={-3} textAnchor="middle" fill={dim} fontSize={7}>— RETURNS TO CAPITAL (r) —</text>
        </g>
      </svg>
      </div>

      <div className="stat-grid-4" style={{ display: "grid", gap: "0.4rem" }}>
        {[
          { label: "w Home autarky", value: wHA.toFixed(3), color: blue },
          { label: "w Foreign autarky", value: wFA.toFixed(3), color: purple },
          { label: "w* (trade, both)", value: inCone ? wT.toFixed(3) : "N/A", color: green },
          { label: "Cone of diversif.", value: inCone ? "✓ Yes" : "✗ No", color: inCone ? green : red },
          { label: "r Home autarky", value: rHA.toFixed(3), color: blue },
          { label: "r Foreign autarky", value: rFA.toFixed(3), color: purple },
          { label: "r* (trade, both)", value: inCone ? rT.toFixed(3) : "N/A", color: green },
          { label: "K/L ratio gap", value: `${ratio.toFixed(2)}×`, color: inCone ? dim : red },
        ].map((s,i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.35rem 0.5rem", borderRadius: "2px" }}>
            <div style={{ fontFamily: mono, fontSize: "0.55rem", color: dim }}>{s.label}</div>
            <div style={{ fontFamily: mono, fontSize: "0.68rem", color: s.color, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. HECKSCHER-OHLIN MODEL ────────────────────────────────────────────────

const HO_PRESETS = [
  { id: "us_bangladesh", label: "US vs Bangladesh (capital/labor)", params: { KH: 200, LH: 80, KF: 30, LF: 180, aKX: 0.7, aKY: 0.3 } },
  { id: "germany_vietnam", label: "Germany vs Vietnam (machinery/textiles)", params: { KH: 180, LH: 100, KF: 50, LF: 200, aKX: 0.75, aKY: 0.25 } },
  { id: "canada_mexico", label: "Canada vs Mexico (CUSMA/USMCA)", params: { KH: 150, LH: 100, KF: 80, LF: 160, aKX: 0.65, aKY: 0.35 } },
];

function HOModel() {
  const [p, setP] = useState({ KH: 120, LH: 80, KF: 60, LF: 120, aKX: 0.7, aKY: 0.3 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const kH = p.KH / p.LH;
  const kF = p.KF / p.LF;
  const xCapInt = p.aKX > p.aKY;
  const homeKAbundant = kH > kF;
  const homeExports = homeKAbundant ? (xCapInt ? "Good X (capital-intensive)" : "Good Y (labor-intensive)") : (xCapInt ? "Good Y (labor-intensive)" : "Good X (capital-intensive)");
  const forExports = homeKAbundant ? (xCapInt ? "Good Y (labor-intensive)" : "Good X (capital-intensive)") : (xCapInt ? "Good X (capital-intensive)" : "Good Y (labor-intensive)");
  const homeWinner = homeKAbundant ? "Capital owners (r ↑)" : "Workers (w ↑)";
  const homeLoser = homeKAbundant ? "Workers (w ↓)" : "Capital owners (r ↓)";
  const maxK = Math.max(p.KH, p.KF) * 1.15;
  const maxL = Math.max(p.LH, p.LF) * 1.15;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Explainer>
          <strong style={{ color: "#c8d8e8" }}>The Heckscher-Ohlin Model</strong> (Heckscher 1919, Ohlin 1933) explains trade patterns through differences in factor endowments. Countries export goods that intensively use their abundant factor.
          <br /><br />
          Three key theorems: <em>H-O theorem</em> (trade pattern prediction), <em>Stolper-Samuelson</em> (trade raises real return to the abundant factor and lowers it for the scarce factor), and <em>Rybczynski</em> (factor accumulation expands the abundant-factor-intensive sector at the expense of the other).
        </Explainer>
        <Panel title="Factor Endowments">
          <PresetDropdown presets={HO_PRESETS} onSelect={id => {
            const preset = HO_PRESETS.find(p => p.id === id);
            if (preset) setP(preset.params);
          }} />
          <div style={{ fontSize: "0.68rem", color: "#4a7fa5", marginBottom: "0.8rem" }}>Home Country</div>
          <Slider label="K_Home (capital)" value={p.KH} min={10} max={300} step={5} onChange={set("KH")} />
          <Slider label="L_Home (labor)" value={p.LH} min={10} max={300} step={5} onChange={set("LH")} />
          <div style={{ fontSize: "0.68rem", color: "#a57fa5", marginBottom: "0.8rem", marginTop: "0.5rem" }}>Foreign Country</div>
          <Slider label="K_Foreign" value={p.KF} min={10} max={300} step={5} onChange={set("KF")} />
          <Slider label="L_Foreign" value={p.LF} min={10} max={300} step={5} onChange={set("LF")} />
        </Panel>
        <Panel title="Factor Intensities">
          <Slider label="θ_KX (capital share in X)" value={p.aKX} min={0.1} max={0.9} step={0.05} onChange={set("aKX")} desc="Fraction of costs that are capital in Good X" />
          <Slider label="θ_KY (capital share in Y)" value={p.aKY} min={0.1} max={0.9} step={0.05} onChange={set("aKY")} desc="Fraction of costs that are capital in Good Y" />
          <div style={{ fontSize: "0.72rem", color: "#e2c97e", marginTop: "0.5rem" }}>Good X is <strong>{xCapInt ? "capital" : "labor"}</strong>-intensive</div>
        </Panel>
      </div>
      <div>
        <Panel title="Results">
          <Stat label="Home K/L ratio" value={kH.toFixed(2)} />
          <Stat label="Foreign K/L ratio" value={kF.toFixed(2)} />
          <Stat label="Home is" value={homeKAbundant ? "Capital-abundant" : "Labor-abundant"} highlight />
          <div style={{ height: "0.8rem" }} />
          <Stat label="Home exports" value={homeExports} highlight />
          <Stat label="Foreign exports" value={forExports} />
          <div style={{ height: "0.8rem" }} />
          <div style={{ fontSize: "0.65rem", color: "#4a7fa5", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>STOLPER-SAMUELSON (trade opening)</div>
          <Stat label="Home gains" value={homeWinner} />
          <Stat label="Home loses" value={homeLoser} />
        </Panel>
        <Panel title="Endowment Space">
          <AxesChart width={280} height={200} xMax={maxL} yMax={maxK} xLabel="Labor (L)" yLabel="Capital (K)">
            {({ sx, sy }) => (
              <>
                <line x1={sx(0)} y1={sy(0)} x2={sx(maxL)} y2={sy(Math.min(kH * maxL, maxK))} stroke="#4a9fe8" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
                <line x1={sx(0)} y1={sy(0)} x2={sx(maxL)} y2={sy(Math.min(kF * maxL, maxK))} stroke="#a57fa5" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
                <circle cx={sx(p.LH)} cy={sy(p.KH)} r={6} fill="#4a9fe8" opacity={0.9} />
                <text x={sx(p.LH) + 8} y={sy(p.KH) + 4} fill="#4a9fe8" fontSize={8}>Home</text>
                <circle cx={sx(p.LF)} cy={sy(p.KF)} r={6} fill="#a57fa5" opacity={0.9} />
                <text x={sx(p.LF) + 8} y={sy(p.KF) + 4} fill="#a57fa5" fontSize={8}>Foreign</text>
              </>
            )}
          </AxesChart>
          <Collapsible title="Rybczynski Theorem" accent="#e2c97e" defaultOpen={false}>
            <RybczynskiViz p={p} />
          </Collapsible>
          <Collapsible title="Factor Price Equalization" accent="#7fe87f" defaultOpen={false}>
            <FPEViz p={p} />
          </Collapsible>
          <Collapsible title="Quiz Mode" accent="#e2c97e" defaultOpen={false}>
            <QuizMode model="ho" answers={{
              homeAbundant: homeKAbundant ? "Capital-abundant" : "Labor-abundant",
              homeExports: homeExports,
              winner: homeWinner,
              loser: homeLoser,
            }} />
          </Collapsible>
          <ExplainButton model="ho" params={p}
            results={{ homeKL: kH.toFixed(2), foreignKL: kF.toFixed(2), homeExports, homeWinner, homeLoser }} />
        </Panel>
      </div>
    </div>
  );
}

// ─── 3. STANDARD TRADE MODEL (with welfare triangles) ───────────────────────

const STANDARD_PRESETS = [
  { id: "oil_boom", label: "Oil boom (favorable ToT)", params: { curvature: 2, ToT: 2.8, size: 100 } },
  { id: "commodity_bust", label: "Commodity bust (adverse ToT)", params: { curvature: 2, ToT: 0.4, size: 100 } },
  { id: "linear_ppf", label: "Linear PPF (Ricardian case)", params: { curvature: 1.05, ToT: 1.2, size: 100 } },
  { id: "high_curvature", label: "Strong increasing opportunity cost", params: { curvature: 4, ToT: 1.5, size: 100 } },
];

function StandardModel() {
  const [p, setP] = useState({ curvature: 2, ToT: 1.0, size: 100 });
  const [showAutarky, setShowAutarky] = useState(true);
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const ppf = x => {
    if (x <= 0) return p.size;
    if (x >= p.size) return 0;
    return p.size * Math.pow(Math.max(0, 1 - Math.pow(x / p.size, p.curvature)), 1 / p.curvature);
  };

  const findTangent = (targetSlope) => {
    let x = p.size / 2;
    for (let i = 0; i < 80; i++) {
      const xc = Math.max(1, Math.min(x, p.size - 1));
      const c = p.curvature;
      const denom = Math.pow(Math.max(1e-9, Math.pow(p.size, c) - Math.pow(xc, c)), (c - 1) / c);
      const slope = Math.pow(xc, c - 1) / denom;
      if (slope < targetSlope) x = Math.min(x + p.size * 0.012, p.size - 1);
      else x = Math.max(x - p.size * 0.012, 1);
    }
    return x;
  };

  const prodX = findTangent(p.ToT);
  const prodY = ppf(prodX);
  const autX = findTangent(1.0);
  const autY = ppf(autX);

  // Income at trade prices (value of production at world prices)
  const tradeIncome = prodX * p.ToT + prodY;
  // Income the autarky point would earn at trade prices
  const autarkyAtTradePrices = autX * p.ToT + autY;
  // Production gain: extra income from reallocating to export good at trade prices
  const prodGain = Math.max(0, tradeIncome - autarkyAtTradePrices);

  // Consumption: Cobb-Douglas utility U = CX^0.5 * CY^0.5
  // Tangency condition: CX/CY = PY/PX = 1/ToT
  // Budget: CX*ToT + CY = tradeIncome
  // Solving: CX = tradeIncome / (2*ToT), CY = tradeIncome / 2
  const consX = Math.max(0, tradeIncome / (2 * p.ToT));
  const consY = Math.min(tradeIncome / 2, p.size * 1.15);

  const exports_ = Math.max(0, prodX - consX);
  const imports_ = Math.max(0, consY - prodY);

  // Welfare: Cobb-Douglas utility U = sqrt(CX * CY)
  // Autarky utility: U_aut = sqrt(autX * autY)
  // Trade utility: U_trade = sqrt(consX * consY)
  const U_aut   = Math.sqrt(autX * autY);
  const U_trade = Math.sqrt(consX * consY);

  // Production gain: utility if consuming at autarky bundle scaled to trade income
  // i.e., what utility would the autarky point give at trade-income scale?
  // = utility of (autarkyAtTradePrices/(2*ToT), autarkyAtTradePrices/2)
  const U_prod = Math.sqrt((autarkyAtTradePrices / (2 * p.ToT)) * (autarkyAtTradePrices / 2));
  const prodGainU  = Math.max(0, U_prod  - U_aut);
  const exchGainU  = Math.max(0, U_trade - U_prod);
  const totalGainU = U_trade - U_aut;

  // Express as % utility gain relative to autarky
  const welfareGainPct = U_aut > 0 ? ((U_trade - U_aut) / U_aut) * 100 : 0;
  // For the stats panel, show income-equivalent gains (easier to interpret)
  const prodGain = Math.max(0, autarkyAtTradePrices - (autX * p.ToT + autY));
  const exchGain = Math.max(0, tradeIncome - autarkyAtTradePrices);
  const totalGain = exchGain + prodGain;

  const nPts = 80;
  const ppfPoints = Array.from({ length: nPts + 1 }, (_, i) => ({ x: (i / nPts) * p.size, y: ppf((i / nPts) * p.size) }));
  const sMax = p.size * 1.15;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Explainer>
          <strong style={{ color: "#c8d8e8" }}>The Standard Trade Model</strong> generalizes Ricardo and H-O into one framework. Countries produce on a bowed-out PPF (increasing opportunity costs) and trade at the world terms of trade (ToT = P_X/P_Y). Production occurs where the PPF slope equals the ToT; consumption occurs on the budget line beyond the PPF.
          <br /><br />
          Gains from trade decompose into a <em>production gain</em> (reallocation along the PPF toward the export good) and an <em>exchange gain</em> (consuming beyond the PPF via trade). Both are shown as shaded triangles on the chart.
        </Explainer>
        <Panel title="Parameters">
          <PresetDropdown presets={STANDARD_PRESETS} onSelect={id => {
            const preset = STANDARD_PRESETS.find(pr => pr.id === id);
            if (preset) setP(preset.params);
          }} />
          <Slider label="PPF Curvature" value={p.curvature} min={1.05} max={5} step={0.05} onChange={set("curvature")} desc="1 = linear (Ricardian), higher = more bowed out" />
          <Slider label="Terms of Trade (P_X / P_Y)" value={p.ToT} min={0.2} max={4} step={0.05} onChange={set("ToT")} desc="Relative price of exports. Higher = better terms of trade." />
          <Slider label="Economy Size" value={p.size} min={50} max={200} step={10} onChange={set("size")} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", color: "#8a9bb0", cursor: "pointer", marginTop: "0.5rem" }}>
            <input type="checkbox" checked={showAutarky} onChange={e => setShowAutarky(e.target.checked)} style={{ accentColor: "#e2c97e" }} />
            Show autarky point
          </label>
        </Panel>
        <Panel title="Equilibrium & Welfare">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <Stat label="Production (Q_X, Q_Y)" value={`(${prodX.toFixed(1)}, ${prodY.toFixed(1)})`} highlight />
            <Stat label="Consumption (C_X, C_Y)" value={`(${consX.toFixed(1)}, ${consY.toFixed(1)})`} />
            <Stat label="Exports (Good X)" value={exports_.toFixed(1)} />
            <Stat label="Imports (Good Y)" value={imports_.toFixed(1)} />
          </div>
          <div style={{ height: "0.6rem" }} />
          <div style={{ fontSize: "0.65rem", color: "#4a7fa5", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>WELFARE DECOMPOSITION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <Stat label="Production gain (income Δ)" value={prodGain.toFixed(2)} />
            <Stat label="Exchange gain (income Δ)" value={exchGain.toFixed(2)} />
            <Stat label="Total income gain" value={totalGain.toFixed(2)} highlight />
            <Stat label="Utility gain vs autarky" value={`${welfareGainPct.toFixed(1)}%`} highlight />
          </div>
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a", marginTop: "0.6rem" }}>
            {p.ToT > 1.8 ? "Highly favorable ToT: large production reallocation gain and exchange gain." : p.ToT < 0.6 ? "Adverse ToT: export prices are low. Production gain may offset exchange loss — welfare gain is small." : "Moderate ToT: positive gains from both specialization and exchange."}
          </div>
          <Collapsible title="Trade Volume Calculator" accent="#4a9fe8" defaultOpen={false}>
            <TradeVolume
              exports_={exports_}
              imports_={imports_}
              prodX={prodX} prodY={prodY}
              consX={consX} consY={consY}
              ToT={p.ToT}
              label="Good X"
            />
          </Collapsible>
          <Collapsible title="Quiz Mode" accent="#e2c97e" defaultOpen={false}>
            <QuizMode model="standard" answers={{
              exports: exports_ > 0.5 ? "Good X" : "Neither (autarky)",
              totWelfare: "Rise",
              prodShift: "More X, less Y",
              gainDecomp: "Production gain + exchange gain",
              ppfShape: p.curvature > 1.1 ? "Increasing opportunity costs" : "Constant opportunity costs",
            }} />
          </Collapsible>
          <ExplainButton model="standard" params={p}
            results={{ prodX: prodX.toFixed(1), prodY: prodY.toFixed(1), exports: exports_.toFixed(1), imports: imports_.toFixed(1), prodGain: prodGain.toFixed(2), exchGain: exchGain.toFixed(2), welfareGainPct: welfareGainPct.toFixed(1) + "%" }} />
        </Panel>
      </div>
      <div>
        <Panel title="PPF, Price Line & Welfare Triangles">
          <AxesChart width={340} height={320} xMax={sMax} yMax={sMax} xLabel="Good X (exports)" yLabel="Good Y (imports)">
            {({ sx, sy, W: cW, H: cH }) => {
              const ppfPts = ppfPoints.map(pt => `${sx(pt.x)},${sy(pt.y)}`).join(" ");
              const blY0 = prodY + prodX * p.ToT;
              const blX1 = Math.min(blY0 / p.ToT, sMax);
              const blY1 = Math.max(0, blY0 - blX1 * p.ToT);

              // Production gain triangle: autarky → prod point (rectangular triangle)
              const triProd = [
                `${sx(autX)},${sy(autY)}`,
                `${sx(prodX)},${sy(autY)}`,
                `${sx(prodX)},${sy(prodY)}`
              ].join(" ");

              // Exchange gain triangle: prod → consumption point (rectangular triangle)
              const triExch = [
                `${sx(prodX)},${sy(prodY)}`,
                `${sx(consX)},${sy(prodY)}`,
                `${sx(consX)},${sy(consY)}`
              ].join(" ");

              // Indifference curve through consumption point (Cobb-Douglas: U = CX^0.5 * CY^0.5)
              // IC: CY = (U_trade)^2 / CX  where U_trade = sqrt(consX * consY)
              const U2 = consX * consY;
              const icPts = [];
              for (let xi = 0.5; xi <= sMax; xi += sMax/120) {
                const yi = U2 / xi;
                if (yi >= 0 && yi <= sMax * 1.15) icPts.push(`${sx(xi)},${sy(yi)}`);
              }

              // Autarky IC
              const U2_aut = autX * autY;
              const icAutPts = [];
              for (let xi = 0.5; xi <= sMax; xi += sMax/120) {
                const yi = U2_aut / xi;
                if (yi >= 0 && yi <= sMax * 1.15) icAutPts.push(`${sx(xi)},${sy(yi)}`);
              }

              // Arrow helper
              const arrow = (x1, y1, x2, y2, color, label, labelSide = "mid") => {
                const dx = x2 - x1; const dy = y2 - y1;
                const len = Math.sqrt(dx*dx + dy*dy);
                if (len < 4) return null;
                const ux = dx/len; const uy = dy/len;
                const ax = x2 - ux*8; const ay = y2 - uy*8;
                const px = -uy*4; const py = ux*4;
                const lx = labelSide === "mid" ? (x1+x2)/2 : x2;
                const ly = labelSide === "mid" ? (y1+y2)/2 : y2;
                return (
                  <g>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} opacity={0.9} />
                    <polygon points={`${ax+px},${ay+py} ${ax-px},${ay-py} ${x2},${y2}`} fill={color} opacity={0.9} />
                    {label && <text x={lx+5} y={ly-4} fill={color} fontSize={7.5} fontWeight={600}>{label}</text>}
                  </g>
                );
              };

              return (
                <>
                  {/* Indifference curves */}
                  {showAutarky && icAutPts.length > 1 && (
                    <polyline points={icAutPts.join(" ")} fill="none" stroke="#5a6a7a" strokeWidth={1.2} strokeDasharray="3,3" opacity={0.5} />
                  )}
                  {icPts.length > 1 && (
                    <polyline points={icPts.join(" ")} fill="none" stroke="#7fe87f" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
                  )}

                  {/* Welfare triangles */}
                  <polygon points={triProd} fill="rgba(226,201,126,0.13)" stroke="#e2c97e" strokeWidth={1} strokeDasharray="3,2" />
                  <polygon points={triExch} fill="rgba(127,232,127,0.10)" stroke="#7fe87f" strokeWidth={1} strokeDasharray="3,2" />

                  {/* PPF */}
                  <polyline points={ppfPts} fill="none" stroke="#4a9fe8" strokeWidth={2.5} />

                  {/* Autarky price line */}
                  {showAutarky && (
                    <line x1={sx(0)} y1={sy(Math.min(autY + autX, sMax))} x2={sx(Math.min(autX + autY, sMax))} y2={sy(0)}
                      stroke="#5a6a7a" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                  )}

                  {/* Trade budget line */}
                  <line x1={sx(0)} y1={sy(Math.min(blY0, sMax))} x2={sx(blX1)} y2={sy(blY1)}
                    stroke="#e2c97e" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.8} />

                  {/* Trade triangle with labeled arrows */}
                  {exports_ > 1 && arrow(sx(prodX), sy(prodY), sx(consX), sy(prodY), "#e87f7f", `Exports: ${exports_.toFixed(1)}`, "mid")}
                  {imports_ > 1 && arrow(sx(consX), sy(prodY), sx(consX), sy(consY), "#e87f7f", `Imports: ${imports_.toFixed(1)}`, "mid")}

                  {/* Trade triangle hypotenuse (dashed) */}
                  {exports_ > 1 && imports_ > 1 && (
                    <line x1={sx(prodX)} y1={sy(prodY)} x2={sx(consX)} y2={sy(consY)}
                      stroke="#e87f7f" strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />
                  )}

                  {/* Welfare triangle labels */}
                  {prodGain > 1 && (
                    <text x={sx((autX + prodX) / 2)} y={sy(Math.max(autY, prodY) + (Math.abs(prodY-autY)*0.5))} fill="#e2c97e" fontSize={7} textAnchor="middle" opacity={0.9}>prod. gain</text>
                  )}
                  {exchGain > 1 && (
                    <text x={sx((prodX + consX) / 2) - 10} y={sy((prodY + consY) / 2)} fill="#7fe87f" fontSize={7} textAnchor="middle" opacity={0.9}>exch. gain</text>
                  )}

                  {/* Points */}
                  {showAutarky && (
                    <>
                      <circle cx={sx(autX)} cy={sy(autY)} r={5} fill="#5a6a7a" stroke="#8a9bb0" strokeWidth={1} />
                      <text x={sx(autX) - 6} y={sy(autY) - 8} fill="#8a9bb0" fontSize={8} textAnchor="middle">A</text>
                    </>
                  )}
                  <circle cx={sx(prodX)} cy={sy(prodY)} r={6} fill="#e2c97e" />
                  <text x={sx(prodX) + 8} y={sy(prodY) + 4} fill="#e2c97e" fontSize={8} fontWeight={600}>P</text>
                  <circle cx={sx(consX)} cy={sy(consY)} r={6} fill="#7fe87f" />
                  <text x={sx(consX) + 8} y={sy(consY) + 4} fill="#7fe87f" fontSize={8} fontWeight={600}>C</text>

                  {/* IC label */}
                  {icPts.length > 1 && (
                    <text x={sx(sMax * 0.08)} y={sy(U2 / (sMax * 0.08)) - 6} fill="#7fe87f" fontSize={7} opacity={0.8}>U₁ (trade)</text>
                  )}
                  {showAutarky && icAutPts.length > 1 && (
                    <text x={sx(sMax * 0.06)} y={sy(U2_aut / (sMax * 0.06)) - 6} fill="#5a6a7a" fontSize={7} opacity={0.7}>U₀ (autarky)</text>
                  )}
                </>
              );
            }}
          </AxesChart>
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
            {[
              ["#4a9fe8", "PPF"],
              ["#e2c97e", "Trade price line / P"],
              ["#7fe87f", "U₁ (trade IC) / C"],
              ["#5a6a7a", "U₀ (autarky IC) / A"],
              ["#e87f7f", "Trade triangle (exports/imports)"],
              ["rgba(226,201,126,0.5)", "Production gain"],
              ["rgba(127,232,127,0.4)", "Exchange gain"]
            ].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", color: "#5a6a7a" }}>
                <div style={{ width: 8, height: 8, borderRadius: "1px", background: c, border: "1px solid rgba(255,255,255,0.1)" }} />{l}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── 4. KRUGMAN NEW TRADE MODEL ───────────────────────────────────────────────

const KRUGMAN_PRESETS = [
  { id: "us_eu", label: "US vs EU (similar large markets)", params: { L: 330, F: 12, c: 0.5, b: 1, Ls: 300 } },
  { id: "us_luxembourg", label: "US vs Luxembourg (HME extreme)", params: { L: 330, F: 10, c: 0.5, b: 1, Ls: 20 } },
  { id: "high_fixed", label: "High fixed costs (aerospace)", params: { L: 200, F: 35, c: 0.8, b: 0.5, Ls: 150 } },
  { id: "low_fixed", label: "Low fixed costs (textiles)", params: { L: 200, F: 3, c: 0.3, b: 2, Ls: 150 } },
];

function KrugmanModel() {
  const [p, setP] = useState({ L: 200, F: 10, c: 0.5, b: 1, Ls: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const nHome = Math.sqrt(p.L / (p.b * p.F));
  const nFor = Math.sqrt(p.Ls / (p.b * p.F));
  const nWorld = Math.sqrt((p.L + p.Ls) / (p.b * p.F));
  const pAut = p.c + 1 / (p.b * nHome);
  const pTrade = p.c + 1 / (p.b * nWorld);
  const qHome = p.L / nHome;
  const qTrade = (p.L + p.Ls) / nWorld;
  const homeShare = p.L / (p.L + p.Ls);
  const homeVarShare = nHome / nWorld;
  const nCurve = Array.from({ length: 40 }, (_, i) => { const L = 10 + i * 15; return { L, n: Math.sqrt(L / (p.b * p.F)) }; });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Explainer>
          <strong style={{ color: "#c8d8e8" }}>Krugman's New Trade Theory</strong> (1980) explains intra-industry trade between similar countries — something H-O cannot. Under monopolistic competition and increasing returns, identical countries trade differentiated varieties of the same good.
          <br /><br />
          Key results: trade expands variety (welfare gain even without comparative advantage) and enables scale economies (lower prices). The <em>Home Market Effect</em>: larger countries attract a disproportionate share of IRS industries and become net exporters of differentiated goods. Equilibrium varieties: n* = √(L / b·F).
        </Explainer>
        <Panel title="Parameters">
          <PresetDropdown presets={KRUGMAN_PRESETS} onSelect={id => {
            const preset = KRUGMAN_PRESETS.find(p => p.id === id);
            if (preset) setP(preset.params);
          }} />
          <div style={{ fontSize: "0.68rem", color: "#4a7fa5", marginBottom: "0.8rem" }}>Home Country</div>
          <Slider label="L (market size)" value={p.L} min={20} max={500} step={10} onChange={set("L")} desc="Larger markets support more varieties" />
          <div style={{ fontSize: "0.68rem", color: "#a57fa5", marginBottom: "0.8rem", marginTop: "0.4rem" }}>Foreign Country</div>
          <Slider label="L* (foreign market size)" value={p.Ls} min={20} max={500} step={10} onChange={set("Ls")} />
          <div style={{ fontSize: "0.68rem", color: "#7fa57f", marginBottom: "0.8rem", marginTop: "0.4rem" }}>Technology</div>
          <Slider label="F (fixed cost)" value={p.F} min={1} max={40} step={0.5} onChange={set("F")} desc="Higher fixed costs → fewer varieties" />
          <Slider label="c (marginal cost)" value={p.c} min={0.1} max={2} step={0.05} onChange={set("c")} />
          <Slider label="b (love of variety)" value={p.b} min={0.1} max={3} step={0.1} onChange={set("b")} desc="Higher b = more elastic demand = lower markup" />
        </Panel>
      </div>
      <div>
        <Panel title="Equilibrium">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <Stat label="Varieties (Home autarky)" value={nHome.toFixed(1)} />
            <Stat label="Varieties (Foreign autarky)" value={nFor.toFixed(1)} />
            <Stat label="Varieties (World w/ trade)" value={nWorld.toFixed(1)} highlight />
            <Stat label="Variety gain" value={`+${((nWorld / nHome - 1) * 100).toFixed(0)}%`} highlight />
            <Stat label="Price (autarky)" value={pAut.toFixed(3)} />
            <Stat label="Price (w/ trade)" value={pTrade.toFixed(3)} />
            <Stat label="Price reduction" value={`-${(((pAut - pTrade) / pAut) * 100).toFixed(1)}%`} />
            <Stat label="Output/firm (trade)" value={qTrade.toFixed(1)} />
          </div>
          <div style={{ height: "0.6rem" }} />
          <div style={{ fontSize: "0.65rem", color: "#4a7fa5", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>HOME MARKET EFFECT</div>
          {[["Population share", homeShare, "#4a9fe8"], ["Variety share (autarky)", homeVarShare, "#e2c97e"]].map(([label, val, color]) => (
            <div key={label} style={{ marginBottom: "0.6rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#5a6a7a", marginBottom: "0.2rem" }}>{label}</div>
              <div style={{ height: "6px", background: "#1a2a3a", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${Math.min(val * 100, 100)}%`, background: color, borderRadius: "2px", transition: "width 0.2s" }} />
              </div>
              <div style={{ fontSize: "0.62rem", color, marginTop: "0.2rem" }}>{(val * 100).toFixed(0)}%</div>
            </div>
          ))}
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a" }}>
            {p.L > p.Ls ? "Home is larger — classic Home Market Effect in operation." : p.L < p.Ls ? "Foreign is larger. HME operates in Foreign's favor." : "Equal-sized countries: symmetric trade, no HME."}
          </div>
        </Panel>
        <Panel title="n* = √(L / b·F)">
          <AxesChart width={280} height={160} xMax={510} yMax={Math.max(nHome, nFor, nWorld) * 1.4 + 1} xLabel="Market Size (L)" yLabel="Varieties (n)">
            {({ sx, sy }) => {
              const pts = nCurve.map(pt => `${sx(pt.L)},${sy(Math.sqrt(pt.L / (p.b * p.F)))}`).join(" ");
              return (
                <>
                  <polyline points={pts} fill="none" stroke="#4a9fe8" strokeWidth={2} />
                  <circle cx={sx(p.L)} cy={sy(nHome)} r={5} fill="#e2c97e" />
                  <circle cx={sx(p.Ls)} cy={sy(nFor)} r={5} fill="#a57fa5" />
                  <circle cx={sx(Math.min(p.L + p.Ls, 500))} cy={sy(nWorld)} r={5} fill="#7fe87f" />
                  <text x={sx(p.L) + 6} y={sy(nHome) - 3} fill="#e2c97e" fontSize={7}>Home</text>
                  <text x={sx(p.Ls) + 6} y={sy(nFor) + 10} fill="#a57fa5" fontSize={7}>Foreign</text>
                  <text x={sx(Math.min(p.L + p.Ls, 500)) - 30} y={sy(nWorld) - 5} fill="#7fe87f" fontSize={7}>World</text>
                </>
              );
            }}
          </AxesChart>
          <Collapsible title="Quiz Mode" accent="#e2c97e" defaultOpen={false}>
            <QuizMode model="krugman" answers={{
              nEffect: "Increases",
              pEffect: "Fall (more competition)",
              hme: "Exports the differentiated good",
              welfare: "All of the above",
            }} />
          </Collapsible>
          <ExplainButton model="krugman" params={p}
            results={{ nHome: nHome.toFixed(1), nFor: nFor.toFixed(1), nWorld: nWorld.toFixed(1), pTrade: pTrade.toFixed(3), varietyGain: (nWorld - Math.max(nHome, nFor)).toFixed(1) }} />
        </Panel>
      </div>
    </div>
  );
}

// ─── 5. MELITZ MODEL ─────────────────────────────────────────────────────────

const MELITZ_PRESETS = [
  { id: "high_trade_costs", label: "High trade costs (pre-WTO era)", params: { tau: 2.2, fE: 8, fX: 6, theta: 3.5, sigma: 4, L: 100 } },
  { id: "low_trade_costs", label: "Low trade costs (post-WTO)", params: { tau: 1.3, fE: 8, fX: 6, theta: 3.5, sigma: 4, L: 100 } },
  { id: "high_dispersion", label: "High firm heterogeneity", params: { tau: 1.6, fE: 8, fX: 4, theta: 2, sigma: 4, L: 100 } },
  { id: "low_dispersion", label: "Low firm heterogeneity", params: { tau: 1.6, fE: 8, fX: 4, theta: 6, sigma: 4, L: 100 } },
];

function MelitzModel() {
  const [p, setP] = useState({ tau: 1.6, fE: 8, fX: 4, theta: 3.5, sigma: 4, L: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const fD = 1;
  // Export cutoff ratio: phi_x*/phi* = tau * (fX/fD)^(1/(sigma-1))
  // In Melitz 2003: phi_x*/phi* = tau * (fX/fD)^(1/(sigma-1))
  // theta is Pareto shape (governs productivity dispersion)
  // sigma is elasticity of substitution (governs markup and selection)
  const phiRatio = p.tau * Math.pow(p.fX / fD, 1 / (p.sigma - 1));
  // Share of firms that export = (phi*/phi_x*)^theta = (1/phiRatio)^theta
  const exportShare = Math.min(1, Math.pow(1 / phiRatio, p.theta));
  // Average productivity of all active firms (Pareto mean above cutoff)
  const avgProdDomestic = p.theta > 1 ? p.theta / (p.theta - 1) : Infinity;
  // Average productivity of exporters = avgProdDomestic * phiRatio
  const avgProdExporter = avgProdDomestic * phiRatio;
  // Markup from CES: sigma/(sigma-1) — independent of theta
  const markupDomestic = p.sigma / (p.sigma - 1);
  // Welfare index (relative to autarky): lambda^(-1/theta) / tau
  const welfareGain = Math.pow(Math.max(exportShare, 1e-9), -1 / p.theta) * (1 / p.tau);

  const phiMax = 6;
  const nBins = 60;
  const phiCutoff = 1;
  const phiXCutoff = phiRatio;
  const paretoPDF = phi => phi >= phiCutoff ? p.theta * Math.pow(phiCutoff, p.theta) / Math.pow(phi, p.theta + 1) : 0;
  const bars = Array.from({ length: nBins }, (_, i) => {
    const phi = phiCutoff + (i / nBins) * (phiMax - phiCutoff);
    return { phi, density: paretoPDF(phi) };
  });
  const maxDensity = paretoPDF(phiCutoff + 0.01) * 1.1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Explainer>
          <strong style={{ color: "#c8d8e8" }}>Melitz (2003)</strong> extends Krugman by introducing firm heterogeneity. Firms draw productivity φ from a Pareto distribution. Only productive enough firms survive (φ ≥ φ*); only the most productive pay the fixed export cost and serve foreign markets (φ ≥ φ_x*).
          <br /><br />
          Trade liberalization (lower τ or f_X) lowers φ_x*, expanding the exporter margin. Low-productivity firms exit, resources shift to high-productivity exporters — aggregate productivity rises through <em>between-firm reallocation</em>, even with no within-firm change.
          <br /><br />
          This model explains why exporters are systematically larger and more productive than non-exporters — a robust empirical finding.
        </Explainer>
        <Panel title="Parameters">
          <PresetDropdown presets={MELITZ_PRESETS} onSelect={id => {
            const preset = MELITZ_PRESETS.find(p => p.id === id);
            if (preset) setP(preset.params);
          }} />
          <Slider label="τ (iceberg trade cost)" value={p.tau} min={1.01} max={3} step={0.05} onChange={set("tau")} desc="τ=1 is free trade. τ=2 means shipping 2 units to deliver 1." />
          <Slider label="σ (elasticity of substitution)" value={p.sigma} min={2} max={10} step={0.5} onChange={set("sigma")} desc="Higher σ = more substitutable varieties, lower markup" />
          <Slider label="f_X (fixed export cost)" value={p.fX} min={1} max={20} step={0.5} onChange={set("fX")} desc="Fixed overhead to serve the foreign market" />
          <Slider label="f_E (entry cost)" value={p.fE} min={1} max={20} step={0.5} onChange={set("fE")} desc="Sunk cost of entering the domestic market" />
          <Slider label="θ (Pareto shape parameter)" value={p.theta} min={1.5} max={8} step={0.1} onChange={set("theta")} desc="Higher θ = less productivity dispersion across firms" />
          <Slider label="L (market size)" value={p.L} min={20} max={300} step={10} onChange={set("L")} />
        </Panel>
      </div>
      <div>
        <Panel title="Results">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <Stat label="φ_x* / φ* (export threshold)" value={phiRatio.toFixed(2)} highlight />
            <Stat label="Share of firms exporting" value={`${(exportShare * 100).toFixed(1)}%`} highlight />
            <Stat label="Avg productivity, all firms" value={avgProdDomestic.toFixed(2)} />
            <Stat label="Avg productivity, exporters" value={avgProdExporter.toFixed(2)} />
            <Stat label="Exporter productivity premium" value={`+${(((avgProdExporter / avgProdDomestic) - 1) * 100).toFixed(0)}%`} />
            <Stat label="Markup (σ / σ-1)" value={markupDomestic.toFixed(2)} />
          </div>
          <div style={{ height: "0.4rem" }} />
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a", marginBottom: "0.8rem" }}>
            {phiRatio > 3
              ? "Very high export threshold — only elite firms export. Liberalization would have large extensive-margin effects."
              : phiRatio < 1.5
              ? "Low export threshold — most surviving firms also export. Highly integrated market."
              : "Moderate selection: a distinct but substantial export margin. Typical of mid-openness economies."}
          </div>
        </Panel>
        <Panel title="Productivity Distribution (Pareto)">
          <AxesChart width={310} height={210} xMax={phiMax} yMax={maxDensity} xLabel="Productivity (φ)" yLabel="Density">
            {({ sx, sy, H }) => (
              <>
                {bars.map(({ phi, density }, i) => {
                  const barW = (phiMax - phiCutoff) / nBins;
                  const isExporter = phi >= phiXCutoff;
                  return (
                    <rect key={i} x={sx(phi)} y={sy(density)} width={Math.max(sx(barW) - sx(0), 1)}
                      height={Math.max(H - sy(density), 0)} fill={isExporter ? "#7fe87f" : "#4a9fe8"} opacity={0.65} />
                  );
                })}
                <line x1={sx(phiCutoff)} y1={0} x2={sx(phiCutoff)} y2={H} stroke="#e87f7f" strokeWidth={1.5} strokeDasharray="3,2" />
                <text x={sx(phiCutoff) + 3} y={12} fill="#e87f7f" fontSize={7.5}>φ* (survive)</text>
                {phiXCutoff <= phiMax && (
                  <>
                    <line x1={sx(phiXCutoff)} y1={0} x2={sx(phiXCutoff)} y2={H} stroke="#e2c97e" strokeWidth={1.5} strokeDasharray="3,2" />
                    <text x={sx(phiXCutoff) + 3} y={24} fill="#e2c97e" fontSize={7.5}>φ_x* (export)</text>
                  </>
                )}
                {phiXCutoff > phiMax && (
                  <text x={sx(phiMax) - 4} y={20} fill="#e2c97e" fontSize={7} textAnchor="end">φ_x* off-chart →</text>
                )}
              </>
            )}
          </AxesChart>
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
            {[["#4a9fe8", "Domestic-only firms"], ["#7fe87f", "Exporters"], ["#e87f7f", "φ* (survival cutoff)"], ["#e2c97e", "φ_x* (export cutoff)"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", color: "#5a6a7a" }}>
                <div style={{ width: 8, height: 8, borderRadius: "1px", background: c }} />{l}
              </div>
            ))}
          </div>
          <Collapsible title="Quiz Mode" accent="#e2c97e" defaultOpen={false}>
            <QuizMode model="melitz" answers={{
              exporter: "High-productivity firms",
              phiX: "Fall (easier to export)",
              reallocate: "Between-firm reallocation (low-φ firms exit)",
              exporterSize: "Larger and more productive than",
            }} />
          </Collapsible>
          <ExplainButton model="melitz" params={p}
            results={{ exportShare: (exportShare * 100).toFixed(1) + "%", phiXCutoff: phiXCutoff.toFixed(2), avgProdExporter: avgProdExporter.toFixed(2), welfareGain: welfareGain.toFixed(3) }} />
        </Panel>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

const MODELS = [
  { id: "ricardian", label: "Ricardian", subtitle: "Comparative Advantage", Component: RicardianModel },
  { id: "ho", label: "Heckscher-Ohlin", subtitle: "Factor Endowments", Component: HOModel },
  { id: "standard", label: "Standard Trade", subtitle: "Terms of Trade & PPF", Component: StandardModel },
  { id: "krugman", label: "New Trade Theory", subtitle: "Krugman 1980", Component: KrugmanModel },
  { id: "melitz", label: "Melitz", subtitle: "Firm Heterogeneity", Component: MelitzModel },
];


function AboutPage() {
  const mono = "'IBM Plex Mono', monospace";
  const gold = "#e2c97e";
  const blue = "#4a9fe8";
  const dim = "#3a5a7a";
  const text = "#c8d8e8";
  const border = "rgba(255,255,255,0.07)";

  const models = [
    { name: "Ricardian Model", year: "1817", desc: "Comparative advantage from differences in labor productivity. Derives the wage ratio bounds for mutually beneficial trade, real wages, and the many-good chain of specialization.", icon: "⚖" },
    { name: "Heckscher-Ohlin", year: "1919–33", desc: "Trade patterns from factor endowment differences. Includes Stolper-Samuelson (who wins/loses from trade opening), Rybczynski (factor accumulation effects), and Factor Price Equalization.", icon: "🔩" },
    { name: "Standard Trade Model", year: "Krugman & Obstfeld", desc: "Generalizes Ricardo and H-O with a bowed-out PPF and terms of trade. Shows production and consumption points, indifference curves, and decomposes welfare gains into production gain and exchange gain.", icon: "📈" },
    { name: "New Trade Theory", year: "Krugman 1980", desc: "Intra-industry trade from economies of scale and love of variety (CES preferences). Models the home market effect: larger countries attract disproportionately more varieties.", icon: "🌐" },
    { name: "Melitz Model", year: "2003", desc: "Firm heterogeneity in trade. Only firms above the productivity cutoff φ* survive; only the most productive pay the fixed export cost. Predicts trade liberalization raises aggregate productivity through selection.", icon: "🏭" },
  ];

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3.5rem" }}>
        <div style={{ fontFamily: mono, fontSize: "0.62rem", letterSpacing: "0.2em", color: dim, marginBottom: "0.8rem" }}>
          COLUMBIA SIPA · INTERNATIONAL FINANCE & ECONOMIC POLICY
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 300, color: gold, letterSpacing: "0.04em", margin: "0 0 0.8rem", lineHeight: 1.2 }}>
          International Trade<br />Model Simulator
        </h1>
        <p style={{ fontFamily: mono, fontSize: "0.82rem", color: "#8a9bb0", lineHeight: 1.9, maxWidth: 600, margin: "0 0 1.5rem" }}>
          An interactive implementation of the five canonical models of international trade theory — from Ricardo's 1817 comparative advantage framework through Melitz's 2003 heterogeneous-firms model. Built to support graduate coursework in international economics and to make abstract theory visually tractable.
        </p>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <a href="/models" style={{
            fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.08em",
            padding: "0.6rem 1.4rem", background: "none",
            border: `1px solid ${gold}`, color: gold, borderRadius: "2px", textDecoration: "none",
            transition: "all 0.15s",
          }}>EXPLORE MODELS ▸</a>
          <a href="/game" style={{
            fontFamily: mono, fontSize: "0.72rem", letterSpacing: "0.08em",
            padding: "0.6rem 1.4rem", background: "none",
            border: `1px solid ${blue}`, color: blue, borderRadius: "2px", textDecoration: "none",
          }}>PLAY STATECRAFT ▸</a>
        </div>
      </div>

      {/* Models */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.18em", color: dim, marginBottom: "1.2rem" }}>IMPLEMENTED MODELS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {models.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "1.2rem", padding: "1rem 1.2rem", background: "rgba(255,255,255,0.02)", border: `1px solid ${border}`, borderRadius: "2px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: "0.1rem" }}>{m.icon}</div>
              <div>
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "baseline", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: mono, fontSize: "0.78rem", color: text, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontFamily: mono, fontSize: "0.6rem", color: dim }}>{m.year}</span>
                </div>
                <p style={{ fontFamily: mono, fontSize: "0.68rem", color: "#5a7a9a", lineHeight: 1.7, margin: 0 }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statecraft */}
      <div style={{ marginBottom: "3rem", padding: "1.5rem", background: "rgba(226,201,126,0.04)", border: `1px solid rgba(226,201,126,0.15)`, borderRadius: "2px" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.18em", color: dim, marginBottom: "0.8rem" }}>ECONOMIC STATECRAFT — STRATEGY SIMULATION</div>
        <p style={{ fontFamily: mono, fontSize: "0.75rem", color: "#8a9bb0", lineHeight: 1.8, margin: "0 0 1rem" }}>
          A turn-based trade policy simulation in which you play as Minister of Trade for Cascadia, a mid-sized open economy navigating a multipolar world. Each AI country has a distinct behavioral personality (Hegemon, Rising Power, Diplomatic Bloc, Volatile Market) derived from the structural features of the economies they represent.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontFamily: mono, fontSize: "0.65rem" }}>
          {[
            "Optimal tariff theory (t* = 1/(ε−1))",
            "Viner trade diversion",
            "Stolper-Samuelson retaliation",
            "Currency war & counter-depreciation",
            "Sanctions coalition dynamics",
            "Krugman variety effects from FTAs",
          ].map((f, i) => (
            <div key={i} style={{ color: dim, padding: "0.3rem 0", borderLeft: `2px solid rgba(226,201,126,0.25)`, paddingLeft: "0.6rem" }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Technical */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.18em", color: dim, marginBottom: "0.8rem" }}>TECHNICAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {[
            ["Stack", "React · Vite · Vercel"],
            ["Charts", "Custom SVG (no charting library)"],
            ["Models", "All equations implemented from scratch"],
            ["Data", "No external APIs — fully parametric"],
          ].map(([k, v], i) => (
            <div key={i} style={{ fontFamily: mono, fontSize: "0.68rem", padding: "0.5rem 0.8rem", background: "rgba(255,255,255,0.02)", border: `1px solid ${border}`, borderRadius: "2px" }}>
              <span style={{ color: dim }}>{k}: </span>
              <span style={{ color: text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: "1.5rem", fontFamily: mono, fontSize: "0.6rem", color: dim, lineHeight: 1.8 }}>
        <div style={{ color: text, marginBottom: "0.3rem" }}>Created by <span style={{ color: gold }}>Jon Epstein</span></div>
        <div>IFEP IA7200 · International Trade · Columbia SIPA · Spring 2026</div>
        <div style={{ marginTop: "0.3rem" }}>
          <a href="https://github.com/jae2185/trade-simulator" target="_blank" rel="noreferrer" style={{ color: blue, textDecoration: "none" }}>github.com/jae2185/trade-simulator</a>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const linkStyle = (path) => ({
    borderBottom: `2px solid ${loc.pathname === path ? "#e2c97e" : "transparent"}`,
    color: loc.pathname === path ? "#e2c97e" : "#3a5a7a",
    padding: "1.2rem 1rem",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
  });
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 1.5rem", display: "flex", alignItems: "stretch", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ padding: "1rem 1.5rem 1rem 0", marginRight: "0.5rem", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 300, letterSpacing: "0.05em", color: "#e2c97e", lineHeight: 1.2 }}>International Trade</div>
          <div style={{ fontSize: "0.58rem", color: "#3a5a7a", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>Economic Simulator</div>
        </div>
        <div className="nav-links" style={{ display: "flex", alignItems: "stretch" }}>
          <Link to="/models" style={linkStyle("/models")}>MODELS</Link>
          <Link to="/game" style={linkStyle("/game")}>STATECRAFT ▸</Link>
          <Link to="/" style={linkStyle("/")}>ABOUT</Link>
        </div>
      </div>
      {/* Mobile hamburger */}
      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} style={{
        display: "none", background: "none", border: "none", color: "#e2c97e",
        fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", cursor: "pointer", padding: "0 0.5rem",
      }}>☰</button>
      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{
          position: "absolute", top: "60px", left: 0, right: 0, zIndex: 100,
          background: "#0d1520", borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column", padding: "0.5rem 1.5rem 1rem",
        }}>
          {[["/" , "ABOUT"], ["/models", "MODELS"], ["/game", "STATECRAFT ▸"]].map(([path, label]) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: loc.pathname === path ? "#e2c97e" : "#5a7a9a",
              padding: "0.7rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none",
            }}>{label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SimulatorPage() {
  const getInitialModel = () => {
    const hash = window.location.hash.replace("#", "");
    return MODELS.find(m => m.id === hash) ? hash : "ricardian";
  };
  const [active, setActive] = useState(getInitialModel);

  const switchModel = (id) => {
    setActive(id);
    window.history.replaceState(null, "", `/#${id}`);
  };

  // Sync on back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (MODELS.find(m => m.id === hash)) setActive(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const model = MODELS.find(m => m.id === active);
  return (
    <>
      <div className="model-tab-bar" style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {MODELS.map(m => (
          <button key={m.id} onClick={() => switchModel(m.id)} className="model-tab-btn" style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${active === m.id ? "#e2c97e" : "transparent"}`,
            cursor: "pointer",
            color: active === m.id ? "#e2c97e" : "#3a5a7a",
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.04em", transition: "color 0.15s", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            <div>{m.label}</div>
            <div className="model-tab-subtitle" style={{ fontSize: "0.58rem", color: active === m.id ? "#a09060" : "#2a3a4a", marginTop: "0.1rem" }}>{m.subtitle}</div>
          </button>
        ))}
      </div>
      <div className="sim-page-pad" style={{ maxWidth: "980px", margin: "0 auto" }}>
        <model.Component />
      </div>
    </>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d1520", color: "#c8d8e8", fontFamily: "'IBM Plex Sans', 'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;1,300&display=swap');
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; background: #1e2e3e; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #e2c97e; cursor: pointer; border: 2px solid #0d1520; }
        select option { background: #0d1520; }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #2a3a4a; }

        /* Desktop defaults */
        .nav-links { display: flex !important; }
        .nav-hamburger { display: none !important; }
        .sim-grid { grid-template-columns: 1fr 1fr; }
        .stat-grid-2 { grid-template-columns: 1fr 1fr; }
        .stat-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .stat-grid-4 { grid-template-columns: repeat(4, 1fr); }
        .sim-page-pad { padding: 1.5rem 2rem; }
        .model-tab-bar { padding: 0 2rem; }
        .model-tab-btn { padding: 0.9rem 1.4rem; font-size: 0.72rem; }
        .model-tab-subtitle { display: block; }

        /* SVG scroll wrapper — lets fixed-width SVGs scroll on mobile */
        .svg-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; }
        .svg-scroll svg { display: block; }
        /* Game header */
        .game-header { padding: 0.7rem 2rem; flex-wrap: nowrap; gap: 1.5rem; }
        .game-header-left { gap: 1.5rem; }
        .game-header-right { gap: 1.5rem; }
        .game-header-gdp { display: inline; }

        @media (max-width: 700px) {
          .nav-links { display: none !important; }
          .nav-hamburger { display: flex !important; }

          /* Single-column layouts */
          .sim-grid { grid-template-columns: 1fr !important; }
          .about-tech-grid { grid-template-columns: 1fr !important; }

          /* Tighter page padding */
          .sim-page-pad { padding: 0.8rem 0.75rem !important; }

          /* Stat grids — collapse to 2-col or 1-col */
          .stat-grid-2 { grid-template-columns: 1fr 1fr !important; }
          .stat-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .stat-grid-4 { grid-template-columns: 1fr 1fr !important; }

          /* Model tab bar — horizontal scroll, tighter buttons */
          .model-tab-bar { padding: 0 0.5rem !important; }
          .model-tab-btn { padding: 0.75rem 0.75rem !important; font-size: 0.65rem !important; }
          .model-tab-subtitle { display: none !important; }

          /* Game header — stack vertically, trim GDP label */
          .game-header { padding: 0.6rem 0.75rem !important; flex-wrap: wrap !important; gap: 0.5rem !important; }
          .game-header-left { gap: 0.6rem !important; flex-wrap: wrap !important; }
          .game-header-right { gap: 0.6rem !important; flex-wrap: wrap !important; }
          .game-header-gdp { display: none !important; }

          /* Panels — tighter internal padding */
          .panel-inner { padding: 0.8rem 0.75rem !important; }

          /* Turn progress bar pips — smaller */
          .turn-pip { width: 18px !important; }

          /* Hide verbose formula annotation on mobile */
          .rd-formula { display: none !important; }

          /* Quiz buttons — full width on very narrow screens */
          .quiz-opt-btn { font-size: 0.6rem !important; padding: 0.3rem 0.5rem !important; }
        }

        @media (max-width: 420px) {
          .stat-grid-2 { grid-template-columns: 1fr !important; }
          .model-tab-btn { padding: 0.6rem 0.55rem !important; font-size: 0.6rem !important; }
        }
      `}</style>
      <Nav />
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/models" element={<SimulatorPage />} />
        <Route path="/game" element={<EconomicStatecraft />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
