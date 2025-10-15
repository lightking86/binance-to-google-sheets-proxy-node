import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Cho phép mọi domain truy cập (để Google Sheets gọi được)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ✅ Proxy toàn bộ request /api/v3/... đến Binance
app.get("/api/v3/*", async (req, res) => {
  try {
    const path = req.originalUrl.replace("/api", ""); // giữ nguyên phần sau /api
    const response = await fetch("https://api.binance.com" + path);
    const data = await response.text();
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route mặc định (kiểm tra nhanh)
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy is running and ready for Google Sheets.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
