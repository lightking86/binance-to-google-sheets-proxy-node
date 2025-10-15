const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Base proxy configs
function makeProxy(pathPrefix, target) {
  // route /api/spot/* → target/*
  app.use(pathPrefix, createProxyMiddleware({
    target: target,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // pathPrefix = "/api/spot", path = "/api/spot/v3/ticker/price"
      // nên rewrite thành "/v3/ticker/price"
      return path.replace(pathPrefix, '');
    },
    onProxyReq: (proxyReq, req, res) => {
      // Bạn có thể thêm headers nếu Binance cần APIKEY
      const apiKey = process.env.BINANCE_API_KEY;
      if (apiKey) {
        proxyReq.setHeader('X-MBX-APIKEY', apiKey);
      }
    },
    timeout: 10000,
    proxyTimeout: 10000,
  }));
}

// định nghĩa các route proxy
makeProxy('/api/spot', 'https://api.binance.com');
makeProxy('/api/margin', 'https://api1.binance.com');     // nếu margin dùng api1
makeProxy('/api/futures', 'https://fapi.binance.com');
makeProxy('/api/delivery', 'https://dapi.binance.com');

// health check
app.get('/', (req, res) => {
  res.send('Binance Proxy (Node) is running.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
