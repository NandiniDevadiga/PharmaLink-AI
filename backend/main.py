"""
Pharmalink AI - Backend (FastAPI)
===================================
Three endpoint groups:
1. /locator/*  -> Med Locator: search medicine across pharmacies near a location
2. /aidoc/*    -> AI Doc: lifestyle/food/activity advice (rule-based, NO medicine names)
3. /dashboard/*-> Pharmacy Dashboard: aggregated analytics for PowerBI-style charts

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import math
import os

app = FastAPI(title="Pharmalink AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten CORS in production
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

df_pharmacies = pd.read_csv(os.path.join(DATA_DIR, "pharmacies.csv"))
df_stock = pd.read_csv(os.path.join(DATA_DIR, "stock.csv"))
df_sales = pd.read_csv(os.path.join(DATA_DIR, "sales_transactions.csv"))
df_sales["date"] = pd.to_datetime(df_sales["date"])


# =============================================================================
# 1. MED LOCATOR
# =============================================================================
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@app.get("/locator/search")
def search_medicine(
    drug_name: str = Query(..., description="Medicine name to search, partial match ok"),
    user_lat: float = Query(..., description="User's latitude"),
    user_lon: float = Query(..., description="User's longitude"),
    max_distance_km: float = Query(15.0, description="Search radius in km"),
):
    """Find pharmacies near the user that stock the given medicine."""
    matches = df_stock[df_stock["drug_name"].str.contains(drug_name, case=False, na=False)]
    if matches.empty:
        return {"query": drug_name, "results": [], "message": "No medicine found matching that name."}

    merged = matches.merge(df_pharmacies, on=["pharmacy_id", "pharmacy_name"])
    merged["distance_km"] = merged.apply(
        lambda r: round(haversine_km(user_lat, user_lon, r["latitude"], r["longitude"]), 2), axis=1
    )
    nearby = merged[merged["distance_km"] <= max_distance_km]
    nearby = nearby[nearby["stock_qty"] > 0].sort_values("distance_km")

    results = nearby[[
        "pharmacy_name", "area", "address", "distance_km", "drug_name",
        "unit_price_inr", "stock_qty", "pharmacist_name", "contact_number",
        "open_time", "close_time", "otc_or_rx"
    ]].to_dict(orient="records")

    return {"query": drug_name, "count": len(results), "results": results}


# =============================================================================
# 2. AI DOC - lifestyle recommendations only, NEVER medicine names
# =============================================================================
class SymptomInput(BaseModel):
    condition: str            # e.g. "diabetes", "cold", "high blood pressure", "acidity"
    age: Optional[int] = None
    activity_level: Optional[str] = "moderate"  # low / moderate / high


# Rule-based knowledge base: lifestyle only. Free, offline, no API cost.
LIFESTYLE_RULES = {
    "diabetes": {
        "do_food": ["High-fiber whole grains (oats, brown rice)", "Leafy greens and non-starchy vegetables",
                     "Lean protein (dal, fish, eggs)", "Small frequent meals to keep sugar stable"],
        "dont_food": ["Sugary drinks and desserts", "White rice/refined flour in excess", "Fried snacks"],
        "do_activity": ["30 min brisk walk daily", "Light strength training 2-3x/week", "Post-meal short walks"],
        "dont_activity": ["Long sedentary periods", "Skipping meals then overeating"],
    },
    "high blood pressure": {
        "do_food": ["Low-sodium meals", "Bananas, leafy greens (potassium-rich)", "Whole grains"],
        "dont_food": ["Excess salt/pickles/papad", "Processed & packaged foods", "Excess caffeine"],
        "do_activity": ["Daily 30-40 min moderate cardio", "Yoga/breathing exercises for stress"],
        "dont_activity": ["Heavy isometric exertion (e.g. very heavy lifting) without guidance", "High stress without breaks"],
    },
    "cold": {
        "do_food": ["Warm fluids (soups, herbal tea)", "Vitamin C fruits (orange, amla)", "Ginger-honey warm water"],
        "dont_food": ["Cold drinks/ice cream", "Excess dairy if causing congestion"],
        "do_activity": ["Adequate rest/sleep", "Steam inhalation", "Light stretching if energy allows"],
        "dont_activity": ["Intense workouts until recovered", "Exposure to cold/AC drafts"],
    },
    "acidity": {
        "do_food": ["Smaller, frequent meals", "Bananas, melons, oats", "Coconut water"],
        "dont_food": ["Spicy/oily food", "Citrus on empty stomach", "Late-night heavy meals"],
        "do_activity": ["Walk after meals (don't lie down immediately)", "Stress-reduction practices"],
        "dont_activity": ["Lying down right after eating", "Skipping meals then bingeing"],
    },
    "obesity": {
        "do_food": ["Portion-controlled balanced meals", "High-protein, high-fiber foods", "Plenty of water before meals"],
        "dont_food": ["Sugary beverages", "Deep-fried and high-calorie snacks", "Late-night eating"],
        "do_activity": ["150+ min/week moderate cardio", "Strength training 2x/week", "Daily step goal (8-10k steps)"],
        "dont_activity": ["Prolonged sitting", "Crash dieting"],
    },
}

GENERIC_ADVICE = {
    "do_food": ["Balanced diet with vegetables, fruits, whole grains", "Stay hydrated (8+ glasses water/day)"],
    "dont_food": ["Excess processed/ultra-sugary food", "Skipping meals regularly"],
    "do_activity": ["At least 30 min of daily movement", "Adequate 7-8 hr sleep"],
    "dont_activity": ["Prolonged inactivity", "Irregular sleep schedule"],
}


@app.post("/aidoc/advice")
def get_lifestyle_advice(payload: SymptomInput):
    """
    Returns lifestyle dos/don'ts for food & activity based on condition.
    IMPORTANT: This endpoint never returns medicine names or dosages by design.
    """
    key = payload.condition.strip().lower()
    rules = LIFESTYLE_RULES.get(key, GENERIC_ADVICE)

    disclaimer = (
        "This is general lifestyle guidance only, not a medical diagnosis or treatment. "
        "Please consult a licensed doctor for any medicine or treatment decisions."
    )

    return {
        "condition": payload.condition,
        "disclaimer": disclaimer,
        "food_dos": rules["do_food"],
        "food_donts": rules["dont_food"],
        "activity_dos": rules["do_activity"],
        "activity_donts": rules["dont_activity"],
    }


@app.get("/aidoc/conditions")
def list_supported_conditions():
    """List conditions with curated lifestyle advice (others get generic advice)."""
    return {"supported_conditions": list(LIFESTYLE_RULES.keys())}


# =============================================================================
# 3. PHARMACY DASHBOARD - analytics endpoints
# =============================================================================
@app.get("/dashboard/summary")
def dashboard_summary():
    total_revenue = float(df_sales["total_inr"].sum())
    total_transactions = int(len(df_sales))
    avg_order_value = float(df_sales["total_inr"].mean())
    total_units_sold = int(df_sales["quantity"].sum())
    low_stock_count = int((df_stock["stock_qty"] < 20).sum())

    return {
        "total_revenue_inr": round(total_revenue, 2),
        "total_transactions": total_transactions,
        "avg_order_value_inr": round(avg_order_value, 2),
        "total_units_sold": total_units_sold,
        "low_stock_alerts": low_stock_count,
        "active_pharmacies": int(df_pharmacies.shape[0]),
    }


@app.get("/dashboard/sales-trend")
def sales_trend(granularity: str = Query("monthly", enum=["daily", "monthly"])):
    df = df_sales.copy()
    if granularity == "monthly":
        df["period"] = df["date"].dt.strftime("%Y-%m")
    else:
        df["period"] = df["date"].dt.strftime("%Y-%m-%d")
    trend = df.groupby("period")["total_inr"].sum().reset_index()
    trend.columns = ["period", "revenue_inr"]
    return trend.to_dict(orient="records")


@app.get("/dashboard/category-breakdown")
def category_breakdown():
    cat = df_sales.groupby("category").agg(
        revenue_inr=("total_inr", "sum"),
        units_sold=("quantity", "sum"),
        transactions=("transaction_id", "count"),
    ).reset_index().sort_values("revenue_inr", ascending=False)
    return cat.to_dict(orient="records")


@app.get("/dashboard/top-drugs")
def top_drugs(limit: int = 10):
    top = df_sales.groupby("drug_name").agg(
        revenue_inr=("total_inr", "sum"),
        units_sold=("quantity", "sum"),
    ).reset_index().sort_values("revenue_inr", ascending=False).head(limit)
    return top.to_dict(orient="records")


@app.get("/dashboard/branch-performance")
def branch_performance():
    perf = df_sales.groupby(["pharmacy_name", "area"]).agg(
        revenue_inr=("total_inr", "sum"),
        transactions=("transaction_id", "count"),
    ).reset_index().sort_values("revenue_inr", ascending=False)
    return perf.to_dict(orient="records")


@app.get("/dashboard/low-stock")
def low_stock(threshold: int = 20):
    low = df_stock[df_stock["stock_qty"] < threshold][[
        "pharmacy_name", "drug_name", "category", "stock_qty", "unit_price_inr"
    ]].sort_values("stock_qty")
    return low.to_dict(orient="records")


@app.get("/dashboard/otc-vs-rx")
def otc_vs_rx():
    split = df_sales.groupby("otc_or_rx").agg(
        revenue_inr=("total_inr", "sum"),
        transactions=("transaction_id", "count"),
    ).reset_index()
    return split.to_dict(orient="records")


@app.get("/")
def root():
    return {"message": "Pharmalink AI API is running.", "docs": "/docs"}
