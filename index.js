import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ✅ Proxy tất cả request /api/v3/... đến Binance thật
app.get("/api/v3/*", async (req, res) => {
  try {
    const path = req.originalUrl.replace("/api", ""); // giữ nguyên phần /v3/time, /v3/ticker/price,...
    const response = await fetch("https://api.binance.com" + path);
    const data = await response.text();
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route mặc định để test
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy is running and ready for Google Sheets.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
