import { useState, useCallback } from "react";

// ─── Utility ────────────────────────────────────────────────────────────────

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function Slider({ label, value, min, max, step = 0.01, onChange, unit = "", desc }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#8a9bb0", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", color: "#e2c97e", fontWeight: 600 }}>
          {typeof value === "number" ? (Number.isInteger(step) ? value.toFixed(0) : value.toFixed(2)) : value}{unit}
        </span>
      </div>
      {desc && <div style={{ fontSize: "0.65rem", color: "#5a6a7a", marginBottom: "0.3rem", fontStyle: "italic" }}>{desc}</div>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#e2c97e", cursor: "pointer" }}
      />
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "2px",
      padding: "1.2rem",
      marginBottom: "1rem"
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        color: "#4a7fa5",
        textTransform: "uppercase",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid rgba(74,127,165,0.2)"
      }}>{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight = false, small = false }) {
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ fontSize: "0.62rem", color: "#5a6a7a", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", marginBottom: "0.1rem" }}>{label}</div>
      <div style={{
        fontSize: small ? "0.8rem" : "1rem",
        fontFamily: "'IBM Plex Mono', monospace",
        color: highlight ? "#e2c97e" : "#c8d8e8",
        fontWeight: highlight ? 700 : 400
      }}>{value}</div>
    </div>
  );
}

// ─── SVG Chart helpers ───────────────────────────────────────────────────────

function AxesChart({ width = 280, height = 220, xLabel = "Good X", yLabel = "Good Y", xMax, yMax, children }) {
  const pad = { top: 14, right: 14, bottom: 36, left: 44 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const sx = v => (v / xMax) * W;
  const sy = v => H - (v / yMax) * H;
  return (
    <svg width={width} height={height} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {/* grid */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={0} y1={sy(f * yMax)} x2={W} y2={sy(f * yMax)} stroke="rgba(255,255,255,0.04)" />
            <line x1={sx(f * xMax)} y1={0} x2={sx(f * xMax)} y2={H} stroke="rgba(255,255,255,0.04)" />
          </g>
        ))}
        {/* axes */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#2a3a4a" strokeWidth={1.5} />
        <line x1={0} y1={0} x2={0} y2={H} stroke="#2a3a4a" strokeWidth={1.5} />
        {/* axis labels */}
        <text x={W / 2} y={H + 28} textAnchor="middle" fill="#5a6a7a" fontSize={9}>{xLabel}</text>
        <text x={-H / 2} y={-32} textAnchor="middle" fill="#5a6a7a" fontSize={9} transform="rotate(-90)">{yLabel}</text>
        {/* tick labels */}
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

function RicardianModel() {
  const [p, setP] = useState({ aLC: 1, aLW: 2, aLCs: 3, aLWs: 1, L: 100, Ls: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  // Comparative advantage: Home has CA in Cloth if (aLC/aLW) < (aLCs/aLWs)
  const homeRatio = p.aLC / p.aLW;
  const forRatio = p.aLCs / p.aLWs;
  const homeCA = homeRatio < forRatio ? "Cloth" : "Wheat";
  const forCA = homeRatio < forRatio ? "Wheat" : "Cloth";

  // PPF endpoints
  const hCloth = p.L / p.aLC;   // max cloth home
  const hWheat = p.L / p.aLW;   // max wheat home
  const fCloth = p.Ls / p.aLCs;
  const fWheat = p.Ls / p.aLWs;

  // Relative wage bounds: w*/w must be between (aLC/aLCs) and (aLW/aLWs) for trade
  const wLo = Math.min(p.aLC / p.aLCs, p.aLW / p.aLWs);
  const wHi = Math.max(p.aLC / p.aLCs, p.aLW / p.aLWs);
  const tradeExists = wLo !== wHi;

  const xMax = Math.max(hCloth, fCloth) * 1.1;
  const yMax = Math.max(hWheat, fWheat) * 1.1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Panel title="Parameters">
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
                  {/* Home PPF */}
                  <line x1={sx(hCloth)} y1={sy(0)} x2={sx(0)} y2={sy(hWheat)}
                    stroke="#4a9fe8" strokeWidth={2} />
                  <text x={sx(hCloth) - 2} y={sy(0) - 6} fill="#4a9fe8" fontSize={8}>Home</text>
                  {/* Foreign PPF */}
                  <line x1={sx(fCloth)} y1={sy(0)} x2={sx(0)} y2={sy(fWheat)}
                    stroke="#a57fa5" strokeWidth={2} strokeDasharray="4,3" />
                  <text x={sx(fCloth) - 2} y={sy(0) - 6} fill="#a57fa5" fontSize={8}>Foreign</text>
                  {/* CA label */}
                  <text x={sx(hCloth * 0.5)} y={sy(hWheat * 0.5) - 8} fill="#e2c97e" fontSize={7.5} textAnchor="middle">
                    slope: -{homeRatio.toFixed(2)}
                  </text>
                </>
              )}
            </AxesChart>
          </div>
          <div style={{
            fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic",
            background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a"
          }}>
            {tradeExists
              ? `Trade is mutually beneficial. Home specializes in ${homeCA}, Foreign in ${forCA}.`
              : "Both countries have identical relative productivities — no gains from trade."}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── 2. HECKSCHER-OHLIN MODEL ────────────────────────────────────────────────

function HOModel() {
  const [p, setP] = useState({ KH: 120, LH: 80, KF: 60, LF: 120, aKX: 0.7, aKY: 0.3 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  const kH = p.KH / p.LH;  // home K/L ratio
  const kF = p.KF / p.LF;  // foreign K/L ratio
  // X is capital-intensive if aKX > aKY
  const xCapInt = p.aKX > p.aKY;
  const homeKAbundant = kH > kF;

  // H-O theorem: capital-abundant country exports capital-intensive good
  const homeExports = homeKAbundant
    ? (xCapInt ? "Good X (capital-intensive)" : "Good Y (labor-intensive)")
    : (xCapInt ? "Good Y (labor-intensive)" : "Good X (capital-intensive)");
  const forExports = homeKAbundant
    ? (xCapInt ? "Good Y (labor-intensive)" : "Good X (capital-intensive)")
    : (xCapInt ? "Good X (capital-intensive)" : "Good Y (labor-intensive)");

  // Stolper-Samuelson: opening trade raises return to abundant factor
  const homeWinner = homeKAbundant ? "Capital owners (r ↑)" : "Workers (w ↑)";
  const homeLoser = homeKAbundant ? "Workers (w ↓)" : "Capital owners (r ↓)";

  // Factor intensity box
  const maxK = Math.max(p.KH, p.KF) * 1.15;
  const maxL = Math.max(p.LH, p.LF) * 1.15;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Panel title="Factor Endowments">
          <div style={{ fontSize: "0.68rem", color: "#4a7fa5", marginBottom: "0.8rem" }}>Home Country</div>
          <Slider label="K_Home (capital)" value={p.KH} min={10} max={300} step={5} onChange={set("KH")} />
          <Slider label="L_Home (labor)" value={p.LH} min={10} max={300} step={5} onChange={set("LH")} />
          <div style={{ fontSize: "0.68rem", color: "#a57fa5", marginBottom: "0.8rem", marginTop: "0.5rem" }}>Foreign Country</div>
          <Slider label="K_Foreign" value={p.KF} min={10} max={300} step={5} onChange={set("KF")} />
          <Slider label="L_Foreign" value={p.LF} min={10} max={300} step={5} onChange={set("LF")} />
        </Panel>
        <Panel title="Factor Intensities">
          <Slider label="θ_KX (capital share in X)" value={p.aKX} min={0.1} max={0.9} step={0.05} onChange={set("aKX")}
            desc="Fraction of costs that are capital in Good X" />
          <Slider label="θ_KY (capital share in Y)" value={p.aKY} min={0.1} max={0.9} step={0.05} onChange={set("aKY")}
            desc="Fraction of costs that are capital in Good Y" />
          <div style={{ fontSize: "0.72rem", color: "#e2c97e", marginTop: "0.5rem" }}>
            Good X is <strong>{xCapInt ? "capital" : "labor"}</strong>-intensive
          </div>
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
                {/* rays showing K/L ratios */}
                <line x1={sx(0)} y1={sy(0)} x2={sx(maxL)} y2={sy(kH * maxL > maxK ? maxK : kH * maxL)}
                  stroke="#4a9fe8" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
                <line x1={sx(0)} y1={sy(0)} x2={sx(maxL)} y2={sy(kF * maxL > maxK ? maxK : kF * maxL)}
                  stroke="#a57fa5" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
                {/* Home endowment point */}
                <circle cx={sx(p.LH)} cy={sy(p.KH)} r={6} fill="#4a9fe8" opacity={0.9} />
                <text x={sx(p.LH) + 8} y={sy(p.KH) + 4} fill="#4a9fe8" fontSize={8}>Home</text>
                {/* Foreign endowment point */}
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

// ─── 3. STANDARD TRADE MODEL ─────────────────────────────────────────────────

function StandardModel() {
  const [p, setP] = useState({ curvature: 2, ToT: 1.0, size: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  // PPF: Q_y = size * (1 - (Q_x/size)^curvature)^(1/curvature)
  const ppf = x => {
    if (x <= 0) return p.size;
    if (x >= p.size) return 0;
    return p.size * Math.pow(Math.max(0, 1 - Math.pow(x / p.size, p.curvature)), 1 / p.curvature);
  };

  // Production point: where slope of PPF = -ToT
  // slope of PPF: dy/dx = -(x^(c-1)) / (size^c - x^c)^((c-1)/c)
  // Numerically find x where |slope| = ToT
  let prodX = p.size / 2;
  for (let i = 0; i < 50; i++) {
    const x = prodX;
    const c = p.curvature;
    const denom = Math.pow(Math.max(1e-9, Math.pow(p.size, c) - Math.pow(x, c)), (c - 1) / c);
    const slope = Math.pow(x, c - 1) / denom;
    if (slope < p.ToT) prodX = Math.min(prodX + p.size * 0.02, p.size - 1);
    else prodX = Math.max(prodX - p.size * 0.02, 1);
  }
  const prodY = ppf(prodX);

  // Budget line through production point with slope -ToT
  // Consumption: on budget line intersecting a CES indifference curve tangent
  // Simplified: assume balanced trade for illustration, consumption = production shifted
  const consX = prodX * 0.7;
  const consY = prodY + (prodX - consX) * p.ToT;

  // Export = prodX - consX, Import = consY - prodY
  const exports_ = Math.max(0, prodX - consX);
  const imports_ = Math.max(0, consY - prodY);

  const nPts = 60;
  const ppfPoints = Array.from({ length: nPts + 1 }, (_, i) => {
    const x = (i / nPts) * p.size;
    return { x, y: ppf(x) };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Panel title="Parameters">
          <Slider label="PPF Curvature" value={p.curvature} min={1.2} max={5} step={0.1} onChange={set("curvature")}
            desc="1 = linear (Ricardian), higher = more bowed out (increasing opportunity cost)" />
          <Slider label="Terms of Trade (P_X/P_Y)" value={p.ToT} min={0.2} max={4} step={0.05} onChange={set("ToT")}
            desc="Relative price of exports. Higher = better ToT for Home." />
          <Slider label="Economy Size" value={p.size} min={50} max={200} step={10} onChange={set("size")} />
        </Panel>
        <Panel title="Equilibrium">
          <Stat label="Production (Q_X, Q_Y)" value={`(${prodX.toFixed(1)}, ${prodY.toFixed(1)})`} highlight />
          <Stat label="Consumption (C_X, C_Y)" value={`(${consX.toFixed(1)}, ${consY.toFixed(1)})`} />
          <Stat label="Exports (Good X)" value={exports_.toFixed(1)} />
          <Stat label="Imports (Good Y)" value={imports_.toFixed(1)} />
          <div style={{ height: "0.5rem" }} />
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a" }}>
            {p.ToT > 1.5
              ? "Favorable ToT: Home consumes well above PPF — large gains from trade."
              : p.ToT < 0.6
              ? "Adverse ToT: Limited gains. Home may approach autarky consumption."
              : "Moderate ToT: Gains from trade present but modest."}
          </div>
        </Panel>
      </div>
      <div>
        <Panel title="Production Possibility Frontier">
          <AxesChart width={300} height={280} xMax={p.size * 1.1} yMax={p.size * 1.1} xLabel="Good X (exports)" yLabel="Good Y (imports)">
            {({ sx, sy, W, H }) => {
              // PPF curve
              const pts = ppfPoints.map(pt => `${sx(pt.x)},${sy(pt.y)}`).join(" ");
              // Budget/price line
              const blX0 = 0;
              const blY0 = prodY + prodX * p.ToT;
              const blX1 = blY0 / p.ToT;
              const clampedX1 = Math.min(blX1, p.size * 1.08);
              return (
                <>
                  {/* PPF */}
                  <polyline points={pts} fill="none" stroke="#4a9fe8" strokeWidth={2} />
                  {/* Price line (budget line) */}
                  <line
                    x1={sx(0)} y1={sy(Math.min(blY0, p.size * 1.08))}
                    x2={sx(clampedX1)} y2={sy(Math.max(0, blY0 - clampedX1 * p.ToT))}
                    stroke="#e2c97e" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.8}
                  />
                  {/* Production point */}
                  <circle cx={sx(prodX)} cy={sy(prodY)} r={5} fill="#e2c97e" />
                  <text x={sx(prodX) + 7} y={sy(prodY) - 3} fill="#e2c97e" fontSize={8}>Prod.</text>
                  {/* Consumption point */}
                  <circle cx={sx(consX)} cy={sy(consY)} r={5} fill="#7fe87f" />
                  <text x={sx(consX) - 28} y={sy(consY) - 5} fill="#7fe87f" fontSize={8}>Cons.</text>
                  {/* Trade triangle */}
                  <line x1={sx(consX)} y1={sy(consY)} x2={sx(prodX)} y2={sy(consY)} stroke="#e87f7f" strokeWidth={1} opacity={0.6} />
                  <line x1={sx(prodX)} y1={sy(consY)} x2={sx(prodX)} y2={sy(prodY)} stroke="#e87f7f" strokeWidth={1} opacity={0.6} />
                </>
              );
            }}
          </AxesChart>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
            {[["#4a9fe8", "PPF"], ["#e2c97e", "Price line (ToT)"], ["#e2c97e", "Production"], ["#7fe87f", "Consumption"], ["#e87f7f", "Trade Δ"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.62rem", color: "#5a6a7a" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── 4. KRUGMAN NEW TRADE MODEL ───────────────────────────────────────────────

function KrugmanModel() {
  const [p, setP] = useState({ L: 200, F: 10, c: 0.5, b: 1, Ls: 100 });
  const set = k => v => setP(prev => ({ ...prev, [k]: v }));

  // Krugman 1980: 
  // Equilibrium number of firms (varieties): n = L / (F + c * q), where q = output per firm
  // Under monopolistic competition: p - c = 1/(b*n) (markup)
  // Zero profit: (p - c)*q = F => q = F/(p-c) = F*b*n
  // Combined: n = L / (F + c*F*b*n) => n(1 + c*b*F*n/F) ... 
  // Simpler form: equilibrium n = L/(b*F + c*L) ?? Let's use standard derivation:
  // p = c + 1/(b*n), zero profit: (p-c)*L/n = F => (1/(b*n))*(L/n) = F
  // => L/(b*n^2) = F => n = sqrt(L/(b*F))
  
  const nHome = Math.sqrt(p.L / (p.b * p.F));
  const nFor = Math.sqrt(p.Ls / (p.b * p.F));
  const nWorld = Math.sqrt((p.L + p.Ls) / (p.b * p.F));

  // Price in autarky vs trade
  const pAut = p.c + 1 / (p.b * nHome);
  const pTrade = p.c + 1 / (p.b * nWorld);

  // Output per firm
  const qHome = p.L / nHome;
  const qTrade = (p.L + p.Ls) / nWorld;

  // Home market effect: larger country exports more varieties of differentiated good
  const homeShare = p.L / (p.L + p.Ls);
  const homeVarShare = nHome / nWorld;  // home varieties as fraction of world under trade
  // After integration, home has more than proportional share
  const hmeEffect = homeVarShare > homeShare;

  // chart: n vs L
  const nCurve = Array.from({ length: 40 }, (_, i) => {
    const L = 10 + i * 15;
    return { L, n: Math.sqrt(L / (p.b * p.F)) };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <div>
        <Panel title="Parameters">
          <div style={{ fontSize: "0.68rem", color: "#4a7fa5", marginBottom: "0.8rem" }}>Home Country</div>
          <Slider label="L (market size)" value={p.L} min={20} max={500} step={10} onChange={set("L")}
            desc="Larger markets support more varieties" />
          <div style={{ fontSize: "0.68rem", color: "#a57fa5", marginBottom: "0.8rem", marginTop: "0.4rem" }}>Foreign Country</div>
          <Slider label="L* (foreign market size)" value={p.Ls} min={20} max={500} step={10} onChange={set("Ls")} />
          <div style={{ fontSize: "0.68rem", color: "#7fa57f", marginBottom: "0.8rem", marginTop: "0.4rem" }}>Technology</div>
          <Slider label="F (fixed cost)" value={p.F} min={1} max={40} step={0.5} onChange={set("F")}
            desc="Higher fixed costs → fewer varieties in equilibrium" />
          <Slider label="c (marginal cost)" value={p.c} min={0.1} max={2} step={0.05} onChange={set("c")} />
          <Slider label="b (love of variety / demand elasticity)" value={p.b} min={0.1} max={3} step={0.1} onChange={set("b")}
            desc="Higher b = more elastic demand = lower markup" />
        </Panel>
      </div>
      <div>
        <Panel title="Equilibrium">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <Stat label="Varieties (Home autarky)" value={nHome.toFixed(1)} />
            <Stat label="Varieties (Foreign autarky)" value={nFor.toFixed(1)} />
            <Stat label="Varieties (World w/ trade)" value={nWorld.toFixed(1)} highlight />
            <Stat label="Variety gain from trade" value={`+${((nWorld / nHome - 1) * 100).toFixed(0)}%`} highlight />
            <Stat label="Price (Home autarky)" value={pAut.toFixed(3)} />
            <Stat label="Price (w/ trade)" value={pTrade.toFixed(3)} />
            <Stat label="Output/firm (autarky)" value={qHome.toFixed(1)} />
            <Stat label="Output/firm (trade)" value={qTrade.toFixed(1)} />
          </div>
          <div style={{ height: "0.6rem" }} />
          <div style={{ fontSize: "0.65rem", color: "#4a7fa5", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>HOME MARKET EFFECT</div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.62rem", color: "#5a6a7a", marginBottom: "0.2rem" }}>Population share</div>
              <div style={{ height: "6px", background: "#1a2a3a", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${homeShare * 100}%`, background: "#4a9fe8", borderRadius: "2px" }} />
              </div>
              <div style={{ fontSize: "0.62rem", color: "#4a9fe8", marginTop: "0.2rem" }}>{(homeShare * 100).toFixed(0)}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.62rem", color: "#5a6a7a", marginBottom: "0.2rem" }}>Variety share</div>
              <div style={{ height: "6px", background: "#1a2a3a", borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${homeVarShare * 100}%`, background: "#e2c97e", borderRadius: "2px" }} />
              </div>
              <div style={{ fontSize: "0.62rem", color: "#e2c97e", marginTop: "0.2rem" }}>{(homeVarShare * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#5a7a5a", fontStyle: "italic", background: "rgba(90,160,90,0.06)", padding: "0.6rem", borderLeft: "2px solid #3a7a3a" }}>
            {p.L > p.Ls
              ? `Home is larger. It produces a disproportionate share of differentiated varieties — this is the Home Market Effect.`
              : p.L < p.Ls
              ? `Foreign is larger. It concentrates differentiated production, illustrating the HME in reverse.`
              : `Equal-sized countries: symmetric trade, no HME.`}
          </div>
        </Panel>
        <Panel title="n* = √(L / b·F)">
          <AxesChart width={280} height={160} xMax={510} yMax={Math.sqrt(510 / (p.b * p.F)) * 1.2} xLabel="Market Size (L)" yLabel="Varieties (n)">
            {({ sx, sy }) => {
              const pts = nCurve.map(pt => `${sx(pt.L)},${sy(Math.sqrt(pt.L / (p.b * p.F)))}`).join(" ");
              return (
                <>
                  <polyline points={pts} fill="none" stroke="#4a9fe8" strokeWidth={2} />
                  <circle cx={sx(p.L)} cy={sy(nHome)} r={5} fill="#e2c97e" />
                  <circle cx={sx(p.Ls)} cy={sy(nFor)} r={5} fill="#a57fa5" />
                  <circle cx={sx(p.L + p.Ls)} cy={sy(nWorld)} r={5} fill="#7fe87f" />
                  <text x={sx(p.L) + 6} y={sy(nHome) - 3} fill="#e2c97e" fontSize={7}>Home</text>
                  <text x={sx(p.Ls) + 6} y={sy(nFor) + 10} fill="#a57fa5" fontSize={7}>Foreign</text>
                  <text x={sx(p.L + p.Ls) + 6} y={sy(nWorld) - 3} fill="#7fe87f" fontSize={7}>World</text>
                </>
              );
            }}
          </AxesChart>
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
];

export default function TradeSimulator() {
  const [active, setActive] = useState("ricardian");
  const model = MODELS.find(m => m.id === active);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1520",
      color: "#c8d8e8",
      fontFamily: "'IBM Plex Sans', 'IBM Plex Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;1,300&display=swap');
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; background: #1e2e3e; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #e2c97e; cursor: pointer; border: 2px solid #0d1520; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #2a3a4a; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "1.2rem 2rem",
        display: "flex",
        alignItems: "baseline",
        gap: "1.5rem"
      }}>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 300, letterSpacing: "0.05em", color: "#e2c97e" }}>
            International Trade
          </div>
          <div style={{ fontSize: "0.65rem", color: "#3a5a7a", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>
            Interactive Model Simulator
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 2rem",
        gap: "0",
        overflowX: "auto"
      }}>
        {MODELS.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} style={{
            background: "none",
            border: "none",
            borderBottom: `2px solid ${active === m.id ? "#e2c97e" : "transparent"}`,
            padding: "0.9rem 1.4rem",
            cursor: "pointer",
            color: active === m.id ? "#e2c97e" : "#3a5a7a",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            transition: "color 0.15s",
            whiteSpace: "nowrap"
          }}>
            <div>{m.label}</div>
            <div style={{ fontSize: "0.58rem", color: active === m.id ? "#a09060" : "#2a3a4a", marginTop: "0.1rem" }}>{m.subtitle}</div>
          </button>
        ))}
      </div>

      {/* Model content */}
      <div style={{ padding: "1.5rem 2rem", maxWidth: "960px", margin: "0 auto" }}>
        <model.Component />
      </div>
    </div>
  );
}
