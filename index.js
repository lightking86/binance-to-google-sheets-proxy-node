const express = require('express');
const fetch = require('node-fetch');

const app = express();

// ----------------- Config -----------------
const CACHE_TTL = 60 * 1000; // 60 giây
const cache = {}; // simple in-memory cache

// ----------------- Helper -----------------
function getCache(key) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < CACHE_TTL)) {
    return cache[key].data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// ----------------- Proxy function -----------------
async function fetchFromBinance(path, target) {
  const cached = getCache(path);
  if (cached) return cached;

  const url = target + path;
  const headers = {};
  if (process.env.BINANCE_API_KEY) {
    headers['X-MBX-APIKEY'] = process.env.BINANCE_API_KEY;
  }

  const resp = await fetch(url, { headers, timeout: 10000 });
  const data = await resp.json();
  setCache(path, data);
  return data;
}

// ----------------- Routes -----------------
function makeProxy(pathPrefix, target) {
  app.use(pathPrefix, async (req, res) => {
    try {
      const path = req.originalUrl.replace(pathPrefix, '');
      const data = await fetchFromBinance(path, target);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Spot API
makeProxy('/api/spot', 'https://api.binance.com');

// Futures (USDT-margined) API
makeProxy('/api/futures', 'https://fapi.binance.com');

// Delivery (Coin-margined) API
makeProxy('/api/delivery', 'https://dapi.binance.com');

// Margin API (optional)
makeProxy('/api/margin', 'https://api1.binance.com');

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.send('Binance Proxy (Node) is running with 60s cache!');
});

// ----------------- Start Server -----------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
