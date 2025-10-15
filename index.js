import express from "express";
import fetch from "node-fetch";
import NodeCache from "node-cache";

const app = express();
const cache = new NodeCache({ stdTTL: 60 }); // cache 60 giây
const PORT = process.env.PORT || 3000;

// Root check
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy is running and ready for Google Sheets.");
});

// Lấy dữ liệu có cache
async function fetchFromBinance(url) {
  const cached = cache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance error: ${response.status}`);
  const data = await response.json();
  cache.set(url, data);
  return data;
}

// Route chính /api/prices
app.get("/api/prices", async (req, res) => {
  try {
    const [spot, futures, delivery] = await Promise.all([
      fetchFromBinance("https://api.binance.com/api/v3/ticker/price"),
      fetchFromBinance("https://fapi.binance.com/fapi/v1/ticker/price"),
      fetchFromBinance("https://dapi.binance.com/dapi/v1/ticker/price"),
    ]);
    const merged = [
      ...spot.map(x => ({ ...x, market: "spot" })),
      ...futures.map(x => ({ ...x, market: "futures" })),
      ...delivery.map(x => ({ ...x, market: "delivery" })),
    ];
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route động /api/:market/*
app.get("/api/:market/*", async (req, res) => {
  try {
    const { market } = req.params;
    const path = req.params[0];
    let baseUrl = "";

    if (market === "spot") baseUrl = "https://api.binance.com/api/";
    else if (market === "futures") baseUrl = "https://fapi.binance.com/fapi/";
    else if (market === "delivery") baseUrl = "https://dapi.binance.com/dapi/";
    else return res.status(400).json({ error: "Invalid market" });

    const url = baseUrl + path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
    const data = await fetchFromBinance(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lắng nghe
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
