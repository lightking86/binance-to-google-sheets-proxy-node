const express = require('express');
const fetch = require('node-fetch');

const app = express();

// ----------------- Config -----------------
const CACHE_TTL = 60 * 1000; // 60 giây
const cache = {}; // in-memory cache

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

async function fetchFromBinance(path, target) {
  const cached = getCache(path);
  if (cached) return cached;

  const url = target + path;
  const headers = {};
  if (process.env.BINANCE_API_KEY) headers['X-MBX-APIKEY'] = process.env.BINANCE_API_KEY;

  const resp = await fetch(url, { headers, timeout: 10000 });
  const data = await resp.json();
  setCache(path, data);
  return data;
}

// ----------------- Proxy function -----------------
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

// ----------------- Spot/Futures/Delivery -----------------
makeProxy('/api/spot', 'https://api.binance.com');       // Spot API
makeProxy('/api/futures', 'https://fapi.binance.com');   // Futures USDT
makeProxy('/api/delivery', 'https://dapi.binance.com');  // Delivery Coin-margined

// ----------------- Custom route /api/prices -----------------
app.get('/api/prices', async (req, res) => {
  try {
    const data = await fetchFromBinance('/api/v3/ticker/price', 'https://api.binance.com');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Health Check -----------------
app.get('/', (req, res) => {
  res.send('Binance Proxy Node.js is running with 60s cache!');
});

// ----------------- Start Server -----------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Binance Proxy listening on port ${port}`);
});
