# Transfer & Convertibility Risk Prediction Framework

**Goldman Sachs Capstone | Columbia SIPA | February 2026**

A machine learning framework for predicting sovereign transfer and convertibility (T&C) risk across 140 countries, combining macroeconomic fundamentals, dual trade/financial network analysis, and geopolitical overlay with SHAP-based explainability.

🔗 **[Live Dashboard](https://capstone2026.streamlit.app)** · 📄 **[Methodology Report](docs/TC_Risk_Dashboard_Methodology.docx)** · 📊 **[Excel Scorecard](docs/TC_Risk_Scorecard_Goldman_Sachs.xlsx)**

---

## Key Results

| Metric | Value |
|--------|-------|
| Current-Year AUC (Temporal CV) | 0.982 |
| 12-Month Forecast AUC | 0.921 |
| External Validation AUC (Laeven & Valencia) | 0.842 |
| Country Coverage | 140 |
| Time Span | 1980–2024 |
| Features | 27 (macro + network) |

---

## What is T&C Risk?

Transfer and convertibility risk is the danger that a sovereign government restricts the ability of borrowers to convert local currency into foreign currency or transfer funds abroad. When triggered, even creditworthy borrowers may be unable to service foreign-currency obligations. This framework provides Goldman Sachs analysts with a systematic, quantitative monitoring tool for T&C risk across 140 sovereign exposures.

---

## Framework Architecture

The system uses a three-layer risk assessment:

**1. Fundamental Score** — Random Forest model trained on 27 macro and network features with SHAP decomposition for per-country explainability.

**2. Geopolitical Overlay** — Five-tier expert classification incorporating OFAC sanctions exposure (SDN entity counts), SWIFT exclusion status, and capital control regime type. Sanctions floors: Tier 1 (75%), Tier 2 (50%).

**3. 12-Month Forecast** — Forward-looking early warning system using year *t* features to predict year *t+1* crisis status, breaking label circularity inherent in the current-year model.

---

## Data Sources

| Source | Coverage | Features |
|--------|----------|----------|
| **World Bank WDI** | 140 countries, 1980–2024 | GDP, reserves, debt service, current account, inflation, FX rates |
| **IMF WEO** | 140 countries, 1980–2024 | Fiscal balances, growth forecasts, external debt |
| **FRED** | Global, 1980–2024 | US interest rates, VIX, global risk appetite |
| **UN Comtrade** | 140 countries, bilateral | Trade flows, network centrality (PageRank, betweenness) |
| **BIS CBS** | 30+ reporters | Cross-border banking claims, financial network topology |
| **OFAC SDN** | Point-in-time snapshot | 18,629 sanctioned entities mapped to country-level counts |

---

## Methodology

### Crisis Label Construction

Binary T&C crisis indicator based on threshold breaches in observable macroeconomic variables: reserves < 3 months import cover, debt service > 30% of exports, current account deficit > 10% of GDP, or FX depreciation > 30% annually. See the **Transparency Note** below.

### Model

- **Algorithm:** Random Forest (500 trees, max_depth=15)
- **Validation:** Expanding-window temporal cross-validation (2005–2023, 19 folds)
- **Explainability:** SHAP values decompose every country score into individual feature contributions

### Top Risk Drivers (SHAP Importance)

1. Debt Service Ratio (22.1%)
2. Reserve Adequacy (18.1%)
3. FX Depreciation (14.2%)
4. Current Account Balance (9.9%)
5. Inflation Rate (7.9%)

These top 3 independently reproduce the Frankel & Saravelos (2012) meta-analysis of 80+ early warning studies.

### Sensitivity Analysis (6 Dimensions)

| Test | Result |
|------|--------|
| Alternative Algorithms | GB: 0.997, LR: 0.899 |
| Feature Ablation | Macro only: 0.992 |
| Threshold Sensitivity | F1 > 93% across 0.30–0.80 |
| Leave-One-Out | Top 3 match literature |
| Temporal Stability | AUC 0.997–1.000 across decades |
| Random Seed | σ = 0.0003 |

### External Validation

Model achieves **0.842 AUC** against independently-coded Laeven & Valencia currency crisis dates, confirming genuine detection of crisis conditions beyond label artifacts. The circularity premium is 0.143 (0.985 → 0.842).

---

## ⚠️ Transparency Note

**Label circularity:** 98.3% of crisis labels are explained by threshold breaches in the same variables used as model features. The current-year AUC (0.982) reflects this overlap — the model's value is as a composite scoring framework that synthesizes 27 indicators into a single actionable score with SHAP decomposition, not as an independent prediction engine.

The **forecast model (0.921 AUC)** breaks this circularity by predicting year *t+1* from year *t* features — this is the genuine early warning contribution.

---

## Repository Structure

```
Capstone_2026/
├── dashboard/
│   ├── app_final.py                 # Streamlit dashboard (6 views, 1100+ lines)
│   ├── contagion_widget.py          # Contagion simulation component
│   └── systemic_importance_widget.py
├── data/
│   ├── extractors/                  # API connectors (WB, IMF, Comtrade)
│   ├── raw/                         # Raw extracted data
│   ├── processed/                   # Model-ready features
│   │   ├── tc_crisis_44countries.parquet
│   │   ├── tc_risk_geopolitical_overlay.csv
│   │   └── trade_network_44countries_REAL.parquet
│   ├── bis/                         # BIS cross-border banking data
│   └── comtrade/                    # UN Comtrade bilateral trade
├── models/
│   └── risk_prediction/
│       ├── tc_crisis_44countries.pkl        # Main model + metrics
│       ├── tc_crisis_dual_network.pkl       # Dual network model
│       └── tc_forecast_model.pkl            # 12-month forecast
├── scripts/
│   ├── build_full_scorecard.py      # Excel scorecard generation
│   ├── build_geopolitical_overlay.py # 5-tier geo classification
│   ├── external_validation.py       # Laeven & Valencia validation
│   ├── expand_countries.py          # 44 → 140 country expansion
│   └── ...                          # Feature engineering, network scripts
├── docs/
│   ├── TC_Risk_Dashboard_Methodology.docx
│   └── TC_Risk_Scorecard_Goldman_Sachs.xlsx
├── notebooks/
│   ├── interactive_dual_network_map.html
│   └── generate_dual_network_map.py
├── config/
│   └── settings.py
├── temporal_cv.py                   # Temporal cross-validation
└── requirements.txt
```

---

## Quick Start

### Local Development

```bash
git clone https://github.com/<your-username>/Capstone_2026.git
cd Capstone_2026
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run dashboard locally
streamlit run dashboard/app_final.py
```

### Key Scripts

```bash
# Rebuild Excel scorecard
python scripts/build_full_scorecard.py

# Run temporal cross-validation
python temporal_cv.py

# External validation against Laeven & Valencia
python scripts/external_validation.py

# Regenerate geopolitical overlay
python scripts/build_geopolitical_overlay.py
```

---

## Dashboard Views

1. **Risk Scorecard** — 140-country ranking with crisis probability, data quality, contagion scores
2. **Country Deep Dive** — Per-country analysis with SHAP decomposition, geo tier, forecast
3. **Historical Analysis** — Time series of risk evolution and feature contributions
4. **Network Analysis** — Interactive trade/financial network visualization with centrality rankings
5. **Geopolitical Overlay** — SHAP decomposition by sanctions tier, fundamental vs. structural breakdown
6. **About** — Methodology summary, model performance, data sources

---

## References

- Frankel, J. and Saravelos, G. (2012). "Can Leading Indicators Assess Country Vulnerability?" *Journal of International Economics*, 87(2): 216–231.
- Kaminsky, G., Lizondo, S. and Reinhart, C. (1998). "Leading Indicators of Currency Crises." *IMF Staff Papers*, 45(1): 1–48.
- Laeven, L. and Valencia, F. (2020). "Systemic Banking Crises Database II." *IMF Economic Review*, 68(2).
- Liu, X., Li, Y., Guo, Q. and Xu, W. (2022). "Machine Learning Approaches for Predicting Currency Crises." *Journal of Financial Stability*, 63: 101074.
- Jarmulska, B. (2020). "Random Forest Versus Logit Models." *ECB Working Paper No. 2408*.

---

**Author:** Jonathan Epstein | Columbia SIPA, International Finance & Economic Policy

**Advisor:** Goldman Sachs Global Markets Division
