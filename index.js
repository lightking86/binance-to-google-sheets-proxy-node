import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Binance Proxy is running!" });
});

app.get("/api/ticker/price", async (req, res) => {
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/price");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
