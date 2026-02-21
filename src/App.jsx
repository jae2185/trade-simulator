import { useState } from "react";

// ─── Shared UI Components ────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 0.01, onChange, unit = "", desc }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#8a9bb0", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", color: "#e2c97e", fontWeight: 600 }}>
          {typeof value === "number" ? (step >= 1 ? value.toFixed(0) : value.toFixed(2)) : value}{unit}
        </span>
      </div>
      {desc && <div style={{ fontSize: "0.65rem", color: "#5a6a7a", marginBottom: "0.3rem", fontStyle: "italic" }}>{desc}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
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
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.62rem", color: "#5a6a7a", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>LOAD REAL-WORLD PRESET</div>
      <select onChange={e => { if (e.target.value) onSelect(e.target.value); e.target.value = ""; }}
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.1)", color: "#c8d8e8", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", padding: "0.4rem 0.6rem", borderRadius: "2px", width: "100%", cursor: "pointer" }}>
        <option value="">— select preset —</option>
        {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
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
    <svg width={width} height={height} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
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
  );
}

// ─── 1. RICARDIAN MODEL ──────────────────────────────────────────────────────

const RICARDIAN_PRESETS = [
  { id: "us_china", label: "US vs China (tech/manufacturing)", params: { aLC: 1, aLW: 3, aLCs: 2, aLWs: 1, L: 200, Ls: 300 } },
  { id: "uk_portugal", label: "UK vs Portugal (Ricardo's original)", params: { aLC: 1, aLW: 1.2, aLCs: 0.9, aLWs: 1.5, L: 100, Ls: 100 } },
  { id: "germany_greece", label: "Germany vs Greece (EU asymmetry)", params: { aLC: 0.8, aLW: 1.5, aLCs: 2, aLWs: 1.2, L: 150, Ls: 80 } },
];

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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a" }}>
            {tradeExists ? `Trade is mutually beneficial. Home specializes in ${homeCA}, Foreign in ${forCA}.` : "Both countries have identical relative productivities — no gains from trade."}
          </div>
        </Panel>
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

  // Autarky income (at autarky prices, normalized so P_Y=1, P_X=autarky slope=1)
  const autarkyIncome = autX * 1.0 + autY;
  // Trade income at trade prices (P_X = ToT, P_Y = 1)
  const tradeIncome = prodX * p.ToT + prodY;

  // Production gain: extra income from reallocation at trade prices vs autarky production
  // = value of trade production - value of autarky production, both at trade prices
  const autarkyAtTradePrices = autX * p.ToT + autY;
  const prodGain = Math.max(0, tradeIncome - autarkyAtTradePrices);

  // Consumption: on the trade budget line. Assume Cobb-Douglas preferences (equal shares)
  // With C-D: spend half income on each good
  const consX = (tradeIncome / 2) / p.ToT;
  const consY = tradeIncome / 2;
  const exports_ = Math.max(0, prodX - consX);
  const imports_ = Math.max(0, consY - prodY);

  // Exchange gain: the triangle area between the trade budget line and autarky budget line
  // at the consumption point. ≈ 0.5 * exports * (ToT - autarkyToT) in price space
  // Simpler economically correct version: gain in utility from exchange
  // Use: exchange gain = 0.5 * |ΔP| * exports, where ΔP = ToT - 1
  const exchGain = Math.max(0, 0.5 * Math.abs(p.ToT - 1.0) * exports_);

  // Total welfare gain as % of autarky income
  const totalGain = prodGain + exchGain;
  const welfareGainPct = ((totalGain / autarkyAtTradePrices) * 100);

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
            <Stat label="Exchange gain (price Δ)" value={exchGain.toFixed(2)} />
            <Stat label="Total gain" value={totalGain.toFixed(2)} highlight />
            <Stat label="% of autarky income" value={`${welfareGainPct.toFixed(1)}%`} highlight />
          </div>
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a", marginTop: "0.6rem" }}>
            {p.ToT > 1.8 ? "Highly favorable ToT: large production reallocation gain and exchange gain." : p.ToT < 0.6 ? "Adverse ToT: export prices are low. Production gain may offset exchange loss — welfare gain is small." : "Moderate ToT: positive gains from both specialization and exchange."}
          </div>
        </Panel>
      </div>
      <div>
        <Panel title="PPF, Price Line & Welfare Triangles">
          <AxesChart width={310} height={300} xMax={sMax} yMax={sMax} xLabel="Good X (exports)" yLabel="Good Y (imports)">
            {({ sx, sy, H }) => {
              const ppfPts = ppfPoints.map(pt => `${sx(pt.x)},${sy(pt.y)}`).join(" ");
              const blY0 = prodY + prodX * p.ToT;
              const blX1 = Math.min(blY0 / p.ToT, sMax);
              const blY1 = Math.max(0, blY0 - blX1 * p.ToT);

              // Production gain triangle: autarky point, production point, and the
              // corner that shows the income difference at trade prices
              // Triangle: (autX, autY), (prodX, prodY), (autX, autY + prodGain)
              // Simpler visual: right triangle between aut and prod points with corner at (prodX, autY)
              const triProd = [
                `${sx(autX)},${sy(autY)}`,
                `${sx(prodX)},${sy(autY)}`,
                `${sx(prodX)},${sy(prodY)}`
              ].join(" ");

              // Exchange gain triangle: between prod and cons points
              const triExch = [
                `${sx(prodX)},${sy(prodY)}`,
                `${sx(consX)},${sy(prodY)}`,
                `${sx(consX)},${sy(consY)}`
              ].join(" ");

              // Autarky budget line (slope = -1 through autarky point)
              const autBlY0 = Math.min(autY + autX * 1.0, sMax);
              const autBlX1 = Math.min(autBlY0, sMax);
              return (
                <>
                  <polygon points={triProd} fill="rgba(226,201,126,0.15)" stroke="#e2c97e" strokeWidth={1} strokeDasharray="3,2" />
                  <polygon points={triExch} fill="rgba(127,232,127,0.12)" stroke="#7fe87f" strokeWidth={1} strokeDasharray="3,2" />
                  <polyline points={ppfPts} fill="none" stroke="#4a9fe8" strokeWidth={2.5} />
                  {/* Autarky budget line (slope=-1) */}
                  {showAutarky && (
                    <line x1={sx(0)} y1={sy(Math.min(autY + autX, sMax))} x2={sx(Math.min(autX + autY, sMax))} y2={sy(0)}
                      stroke="#5a6a7a" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                  )}
                  {/* Trade budget line */}
                  <line x1={sx(0)} y1={sy(Math.min(blY0, sMax))} x2={sx(blX1)} y2={sy(blY1)} stroke="#e2c97e" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.8} />
                  {showAutarky && (
                    <>
                      <circle cx={sx(autX)} cy={sy(autY)} r={5} fill="#5a6a7a" stroke="#8a9bb0" strokeWidth={1} />
                      <text x={sx(autX) + 6} y={sy(autY) - 6} fill="#8a9bb0" fontSize={8}>Autarky</text>
                    </>
                  )}
                  <circle cx={sx(prodX)} cy={sy(prodY)} r={6} fill="#e2c97e" />
                  <text x={sx(prodX) + 8} y={sy(prodY) + 4} fill="#e2c97e" fontSize={8}>Prod.</text>
                  <circle cx={sx(consX)} cy={sy(consY)} r={6} fill="#7fe87f" />
                  <text x={sx(consX) + 6} y={sy(consY) - 6} fill="#7fe87f" fontSize={8}>Cons.</text>
                  <line x1={sx(consX)} y1={sy(consY)} x2={sx(prodX)} y2={sy(consY)} stroke="#e87f7f" strokeWidth={1.5} opacity={0.7} />
                  <line x1={sx(prodX)} y1={sy(consY)} x2={sx(prodX)} y2={sy(prodY)} stroke="#e87f7f" strokeWidth={1.5} opacity={0.7} />
                  {prodGain > 0.5 && (
                    <text x={sx((autX + prodX) / 2)} y={sy(Math.max(autY, prodY)) - 5} fill="#e2c97e" fontSize={7} textAnchor="middle" opacity={0.8}>Prod. gain</text>
                  )}
                  {exchGain > 0.5 && (
                    <text x={sx((prodX + consX) / 2)} y={sy((prodY + consY) / 2)} fill="#7fe87f" fontSize={7} textAnchor="middle" opacity={0.8}>Exch. gain</text>
                  )}
                </>
              );
            }}
          </AxesChart>
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
            {[["#4a9fe8", "PPF"], ["#e2c97e", "Trade price line"], ["#5a6a7a", "Autarky price line"], ["#7fe87f", "Consumption"], ["#e87f7f", "Trade Δ"], ["rgba(226,201,126,0.5)", "Prod. gain"], ["rgba(127,232,127,0.4)", "Exch. gain"]].map(([c, l]) => (
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
        </Panel>
      </div>
    </div>
  );
}

// ─── 5. MELITZ MODEL ─────────────────────────────────────────────────────────

const MELITZ_PRESETS = [
  { id: "high_trade_costs", label: "High trade costs (pre-WTO era)", params: { tau: 2.2, fE: 8, fX: 6, theta: 3.5, L: 100 } },
  { id: "low_trade_costs", label: "Low trade costs (post-WTO)", params: { tau: 1.3, fE: 8, fX: 6, theta: 3.5, L: 100 } },
  { id: "high_dispersion", label: "High firm heterogeneity", params: { tau: 1.6, fE: 8, fX: 4, theta: 2, L: 100 } },
  { id: "low_dispersion", label: "Low firm heterogeneity", params: { tau: 1.6, fE: 8, fX: 4, theta: 6, L: 100 } },
];

function MelitzModel() {
  const [p, setP] = useState({ tau: 1.6, fE: 8, fX: 4, theta: 3.5, L: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const fD = 1;
  const phiRatio = p.tau * Math.pow(p.fX / fD, 1 / p.theta);
  const exportShare = Math.pow(1 / phiRatio, p.theta);
  const avgProdDomestic = p.theta / (p.theta - 1);
  const avgProdExporter = avgProdDomestic * phiRatio;
  const sigma = p.theta + 1;
  const markupDomestic = sigma / (sigma - 1);
  const welfareGain = Math.pow(exportShare, -1 / p.theta) * (1 / p.tau);

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
        </Panel>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const MODELS = [
  { id: "ricardian", label: "Ricardian", subtitle: "Comparative Advantage", Component: RicardianModel },
  { id: "ho", label: "Heckscher-Ohlin", subtitle: "Factor Endowments", Component: HOModel },
  { id: "standard", label: "Standard Trade", subtitle: "Terms of Trade & PPF", Component: StandardModel },
  { id: "krugman", label: "New Trade Theory", subtitle: "Krugman 1980", Component: KrugmanModel },
  { id: "melitz", label: "Melitz", subtitle: "Firm Heterogeneity", Component: MelitzModel },
];

export default function TradeSimulator() {
  const [active, setActive] = useState("ricardian");
  const model = MODELS.find(m => m.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#0d1520", color: "#c8d8e8", fontFamily: "'IBM Plex Sans', 'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;1,300&display=swap');
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; background: #1e2e3e; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #e2c97e; cursor: pointer; border: 2px solid #0d1520; }
        select option { background: #0d1520; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #2a3a4a; }
      `}</style>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.2rem 2rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 300, letterSpacing: "0.05em", color: "#e2c97e" }}>International Trade</div>
        <div style={{ fontSize: "0.65rem", color: "#3a5a7a", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>Interactive Model Simulator</div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 2rem", overflowX: "auto" }}>
        {MODELS.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${active === m.id ? "#e2c97e" : "transparent"}`,
            padding: "0.9rem 1.4rem", cursor: "pointer",
            color: active === m.id ? "#e2c97e" : "#3a5a7a",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem",
            letterSpacing: "0.04em", transition: "color 0.15s", whiteSpace: "nowrap"
          }}>
            <div>{m.label}</div>
            <div style={{ fontSize: "0.58rem", color: active === m.id ? "#a09060" : "#2a3a4a", marginTop: "0.1rem" }}>{m.subtitle}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: "1.5rem 2rem", maxWidth: "980px", margin: "0 auto" }}>
        <model.Component />
      </div>
    </div>
  );
}
