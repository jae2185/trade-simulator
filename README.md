# International Trade Model Simulator

An interactive implementation of the five canonical models of international trade theory, built to support graduate coursework in international economics. All equations are implemented from scratch — no charting libraries, no external data APIs.

**Live:** [trade-simulator-weld.vercel.app](https://trade-simulator-weld.vercel.app)

---

## Models

### 1. Ricardian Model (Ricardo, 1817)
Comparative advantage from differences in labor productivity across countries.

- Interactive PPF with slope = opportunity cost
- Wage ratio calculator — valid trade range [w/w\*\_lo, w/w\*\_hi] with draggable slider
- Real wages table (autarky vs. trade, for both countries)
- World relative supply curve with endogenous equilibrium price P\* from Cobb-Douglas demand
- Many-good Ricardian chain — rank goods by a\_H/a\_F, shift cut-point with w/w\* slider
- Trade volume calculator — exports, imports, export value, trade balance check
- Quiz mode — predict CA, factor effects, wage outcomes before revealing answers

### 2. Heckscher-Ohlin Model (Heckscher 1919, Ohlin 1933)
Trade patterns from differences in factor endowments (K/L ratios).

- H-O theorem — predicts export direction from factor abundance and good intensity
- Stolper-Samuelson — identifies winners and losers from trade opening
- Rybczynski visualizer — ΔK/ΔL sliders showing how production point moves at constant prices; confirms magnification effect
- Factor Price Equalization — bar chart showing autarky vs. trade factor prices (w, r) for both countries; cone of diversification check
- Quiz mode

### 3. Standard Trade Model (Krugman & Obstfeld)
Generalizes Ricardo and H-O with a bowed-out PPF and terms of trade.

- Concave PPF with adjustable curvature (linear → strongly bowed)
- Production point (P) tangent to ToT price line
- Consumption point (C) on budget line, beyond PPF
- Two indifference curves: U₀ (autarky) and U₁ (trade) — welfare improvement visible
- Labeled trade triangle with export/import arrows
- Welfare decomposition: production gain + exchange gain with shaded triangles
- Trade volume calculator with trade balance verification

### 4. New Trade Theory (Krugman, 1980)
Intra-industry trade from economies of scale and love of variety (CES preferences).

- Number of varieties n = √(L / bF) in equilibrium
- Home market effect — larger country attracts disproportionate share of varieties
- Price index and markup over marginal cost
- Welfare gain from trade: more varieties at lower prices

### 5. Melitz Model (2003)
Firm heterogeneity — only productive firms survive; only the most productive export.

- Productivity cutoff φ\* (survive) and φ\_x\* (export) from Pareto distribution
- Selection effect: trade raises average productivity by forcing out low-φ firms
- Export share responds to fixed export cost f\_x and foreign market size

---

## Economic Statecraft

A turn-based trade policy simulation. You play as Minister of Trade for Cascadia — a mid-sized open economy — over 8 turns against four AI-controlled nations with distinct behavioral profiles.

### AI Personalities
| Country | Archetype | Behavior |
|---|---|---|
| Americana 🦅 | Hegemon | Low tariffs, high FTA-poaching, proportional retaliation, fast forgiveness |
| Sinica 🐉 | Rising Power | High tariff aggression (40%), escalates above t\*, holds grudges |
| Eurozone ⚜ | Diplomatic Bloc | Rarely tariffs, but leads sanctions coalitions (45% prob) |
| Meridian 🌴 | Volatile Market | High currency war rate (22%), easily bought off with diplomacy |

### Economic Mechanics
- **Optimal tariff theory** — AI tariffs calculated at t\* = 1/(ε−1) per country elasticity
- **Viner trade diversion** — rival FTAs divert your trade with third-party allies
- **Stolper-Samuelson retaliation** — tariffs trigger multi-turn hostility counters
- **Currency war** — counter-depreciation restores ToT but strains multilateral relations
- **Sanctions coalitions** — sanctioned countries' allies may join against you; EU leads

### Win Conditions
| Objective | Condition |
|---|---|
| Economic Dominance | Finish with GDP higher than all rival nations |
| Welfare Threshold | Reach welfare index ≥ 130 |
| Survive 8 Turns | Keep welfare above collapse threshold of 70 |

**Tiers:** 3/3 = Grand Master 🏆 · 2/3 = Strategist ⭐ · 1/3 = Diplomat 🕊 · Welfare < 70 = Defeat 💀

**Difficulty:** Diplomat (0.5× AI aggression, +20 relations, 3 actions/turn) · Strategist (standard) · Hardliner (1.8× AI aggression, −15 relations, 1.5× shock severity)

---

## Stack

- **React** + **Vite** — component architecture, hot reload
- **React Router** — `/` (models), `/game` (statecraft), `/about`
- **Custom SVG** — all charts hand-rolled (no Recharts, no D3)
- **Vercel** — auto-deploy from GitHub main

No external data APIs. All model outputs are computed analytically from slider parameters.

---

## Structure

```
src/
  App.jsx              # All five trade models + routing + Nav
  EconomicStatecraft.jsx  # Statecraft game (AI, crises, dashboard)
  main.jsx             # Entry point (BrowserRouter wrapper)
```

---

## Running Locally

```bash
git clone https://github.com/jae2185/trade-simulator.git
cd trade-simulator
npm install
npm run dev
```

---

## Course Context

Built for **IFEP IA7200 · International Trade** at Columbia University's School of International and Public Affairs, Spring 2026. The simulator was used to verify problem set answers across Ricardian and H-O models and to build intuition for the Standard Trade and New Trade Theory frameworks.

---

*Jon Epstein · Columbia SIPA · International Finance & Economic Policy · Spring 2026*
