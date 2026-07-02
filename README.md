# Pharmalink AI

A two-phase pharmacy-tech project:

1. **Customer Phase** — Med Locator (find medicine near you, with price/stock/pharmacist
   contact) + AI Doc (lifestyle/food/activity guidance, never medicine recommendations).
2. **Pharmacy Dashboard** — PowerBI-style analytics dashboard for pharmacy network performance.

Built fully with free/open tools: React (Vite) + FastAPI + Recharts. No paid services,
no API keys, no Power BI Embedded subscription required.

---

## Project structure

```
pharmalink/
├── data/
│   ├── generate_dataset.py     # Generates the synthetic dataset (see "Dataset" below)
│   ├── pharmacies.csv          # 12 pharmacy branches with location, contact, hours
│   ├── stock.csv               # Per-branch medicine stock & pricing
│   └── sales_transactions.csv  # ~12,800 transactions over 12 months (for dashboard)
├── backend/
│   ├── main.py                 # FastAPI app: locator, aidoc, dashboard endpoints
│   └── requirements.txt
└── frontend/                   # React app (Vite)
    └── src/
        ├── pages/MedLocator.jsx
        ├── pages/AiDoc.jsx
        ├── pages/Dashboard.jsx
        ├── components/NavBar.jsx
        └── api/client.js
```

---

## Dataset — where it came from

Your mentor asked you to base your dataset on something real, even partially.
This dataset is built that way:

- **Real-world structure reference:** [Pharma Sales Data (Kaggle)](https://www.kaggle.com/datasets/milanzdravkovic/pharma-sales-data) —
  6 years of real drug sales data classified into 8 ATC (Anatomical Therapeutic
  Chemical) drug categories. We used this to inform the category structure and
  seasonal sales patterns (e.g. respiratory medicine spikes in monsoon months).
- **Real-world structure reference:** [Inventory data for Pharmacy Website (Kaggle)](https://www.kaggle.com/datasets/pritipoddar/inventory-data-for-pharmacy-website-in-json-format) —
  real drug names, manufacturers, categories, and price ranges used as the seed
  vocabulary for our drug catalog.
- **Synthetically generated on top of that:** 12 pharmacy branches across Mumbai
  (with lat/long for the locator), per-branch stock levels, pharmacist contact
  info (via Faker), and ~12,800 daily sales transactions across 12 months with
  realistic seasonal demand patterns.

**For your report**, you can honestly describe this as: *"Drug names, categories
and price structures are grounded in real public pharmacy datasets (Kaggle); the
location, stock, and transactional data was synthetically generated to fit our
specific use case, since no public dataset combined all three dimensions we
needed."* This is a completely standard and defensible approach for a course project.

To regenerate the dataset yourself (e.g. with different randomness/scale):
```bash
cd data
pip install pandas numpy faker
python3 generate_dataset.py
```

---

## Running the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs (auto-generated, browsable) will be at: **http://127.0.0.1:8000/docs**

Endpoints:
| Endpoint | Purpose |
|---|---|
| `GET /locator/search` | Search medicine near a lat/lon |
| `POST /aidoc/advice` | Get lifestyle dos/don'ts for a condition |
| `GET /dashboard/summary` | KPI summary cards |
| `GET /dashboard/sales-trend` | Revenue trend over time |
| `GET /dashboard/category-breakdown` | Revenue by drug category |
| `GET /dashboard/top-drugs` | Best-selling drugs |
| `GET /dashboard/branch-performance` | Revenue by pharmacy branch |
| `GET /dashboard/low-stock` | Items running low |
| `GET /dashboard/otc-vs-rx` | OTC vs prescription split |

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Make sure the backend is running on port 8000 first
(the frontend calls `http://127.0.0.1:8000` directly — see `src/api/client.js`).

---

## About the Power BI question

True Power BI embedding into a website requires **Power BI Embedded**, which needs
an Azure subscription — not free, and not realistic in a one-week student project.
Instead, this project builds the dashboard **natively in React using Recharts**
(a free charting library), so it's fully interactive and lives directly on your
website with zero hosting cost.

If you still want a Power BI artifact for your report/demo (many mentors like
seeing the actual .pbix file even if it's not embedded):
1. Open Power BI Desktop (free download).
2. Import `data/sales_transactions.csv`, `data/stock.csv`, and `data/pharmacies.csv`.
3. Build a few visuals (revenue trend, category pie, branch bar chart) mirroring
   what's already in the React dashboard.
4. Save as `.pbix` and include it as a supplementary file in your submission —
   you don't need to embed it anywhere.

---

## Important note on AI Doc

By design, the `/aidoc/advice` endpoint **never returns medicine names, dosages,
or treatment instructions** — only lifestyle, food, and activity guidance, with
a disclaimer to consult a licensed doctor. This was intentional based on your
project spec ("No meds recommends anywhere") and is also the safer, more
defensible design choice for a health-adjacent student project.

---

## One-week build checklist

- [x] Dataset generated (grounded in real public data + synthetic extension)
- [x] Backend API (FastAPI) — locator, AI doc, dashboard analytics
- [x] Med Locator frontend page
- [x] AI Doc frontend page
- [x] Pharmacy Dashboard frontend page (charts: trend, category, top drugs,
      branch performance, OTC/Rx split, low-stock table)
- [ ] Optional: build matching Power BI (.pbix) file for report appendix
- [ ] Polish pass, deploy or record demo, write report
