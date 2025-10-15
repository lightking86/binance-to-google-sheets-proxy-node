// ---------- Binance Proxy Server (Railway Edition) ----------
// Tác giả: ChatGPT + liki
// Mục đích: Làm proxy trung gian giữa Google Sheets và Binance API

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// ------------------- Cấu hình -------------------
const MARKETS = {
  spot: "https://api.binance.com/",
  futures: "https://fapi.binance.com/",
  delivery: "https://dapi.binance.com/",
};

// ------------------- Hàm fetch dữ liệu -------------------
async function fetchFromBinance(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Binance error: ${response.status} - ${errText}`);
  }
  return await response.json();
}

// ------------------- Route kiểm tra hoạt động -------------------
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy is running and ready for Google Sheets.");
});

// ------------------- Proxy cho từng thị trường -------------------
// Cú pháp: /api/:market/*
// Ví dụ:   /api/spot/api/v3/time
//           /api/futures/fapi/v1/premiumIndex
app.get("/api/:market/*", async (req, res) => {
  try {
    const { market } = req.params;
    const path = req.params[0];
    const baseUrl = MARKETS[market];

    if (!baseUrl) return res.status(400).json({ error: "Invalid market" });

    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const url = baseUrl + path + query;

    const data = await fetchFromBinance(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Khởi chạy -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
