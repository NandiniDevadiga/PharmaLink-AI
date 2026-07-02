const BASE_URL = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  searchMedicine: (drugName, lat, lon, radius = 15) =>
    request(`/locator/search?drug_name=${encodeURIComponent(drugName)}&user_lat=${lat}&user_lon=${lon}&max_distance_km=${radius}`),

  getAdvice: (condition) =>
    request(`/aidoc/advice`, { method: "POST", body: JSON.stringify({ condition }) }),

  getConditionsList: () => request(`/aidoc/conditions`),

  getDashboardSummary: () => request(`/dashboard/summary`),
  getSalesTrend: (granularity = "monthly") => request(`/dashboard/sales-trend?granularity=${granularity}`),
  getCategoryBreakdown: () => request(`/dashboard/category-breakdown`),
  getTopDrugs: (limit = 8) => request(`/dashboard/top-drugs?limit=${limit}`),
  getBranchPerformance: () => request(`/dashboard/branch-performance`),
  getLowStock: (threshold = 20) => request(`/dashboard/low-stock?threshold=${threshold}`),
  getOtcVsRx: () => request(`/dashboard/otc-vs-rx`),
};
