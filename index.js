import express from "express";
import fetch from "node-fetch";
import NodeCache from "node-cache";

const DEBUG = false; // đặt true nếu muốn log ra console
const app = express();
const cache = new NodeCache({ stdTTL: 60 }); // cache 60 giây
const PORT = process.env.PORT || 3000;

// ==============================
// API endpoint chính
// ==============================
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy is running and ready for Google Sheets.");
});

// ==============================
// Hàm helper lấy dữ liệu từ Binance
// ==============================
async function fetchFromBinance(url) {
  // kiểm tra cache
  const cached = cache.get(url);
  if (cached) {
    if (DEBUG) console.log("cache hit:", url);
    return cached;
  }

  if (DEBUG) console.log("fetching:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

// ==============================
// 1️⃣ Route tổng hợp: /api/prices
// Lấy toàn bộ giá Spot, Futures, Delivery
// ==============================
app.get("/api/prices", async (req, res) => {
  try {
    const [spot, futures, delivery] = await Promise.all([
      fetchFromBinance("https://api.binance.com/api/v3/ticker/price"),
      fetchFromBinance("https://fapi.binance.com/fapi/v1/ticker/price"),
      fetchFromBinance("https://dapi.binance.com/dapi/v1/ticker/price"),
    ]);

    const merged = [
      ...spot.map((x) => ({ ...x, market: "spot" })),
      ...futures.map((x) => ({ ...x, market: "futures" })),
      ...delivery.map((x) => ({ ...x, market: "delivery" })),
    ];

    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// 2️⃣ Proxy linh hoạt cho từng endpoint
// Ví dụ: /api/spot/api/v3/time
// ==============================
app.get("/api/:market/*", async (req, res) => {
  try {
    const { market } = req.params;
    const path = req.params[0];
    let baseUrl;

    switch (market) {
      case "spot":
        baseUrl = "https://api.binance.com/api/";
        break;
      case "futures":
        baseUrl = "https://fapi.binance.com/fapi/";
        break;
      case "delivery":
        baseUrl = "https://dapi.binance.com/dapi/";
        break;
      default:
        return res.status(400).json({ error: "Invalid market. Use spot, futures, or delivery." });
    }

    const url = baseUrl + path + (req.url.includes("?") ? req.url.split("?")[1] : "");
    const data = await fetchFromBinance(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// Chạy server
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Proxy server is running on port ${PORT}`);
});
