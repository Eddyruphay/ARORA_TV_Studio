const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Create a catch-all proxy middleware
// This will proxy any request made to this server
const proxy = createProxyMiddleware({
  // The target option is not strictly needed here because we are creating a forward proxy,
  // but the middleware requires a target. We'll dynamically set the target for each request
  // using a custom router function.
  target: 'http://example.com', // Placeholder target
  router: (req) => {
    // The router function determines the actual target for each incoming request.
    // For a forward proxy, the target is simply the URL of the request.
    return req.url;
  },
  changeOrigin: true, // Important for virtual hosted sites
  ws: true, // Enable WebSocket proxying
  logLevel: 'info', // Log requests for debugging
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.writeHead(502, {
      'Content-Type': 'text/plain',
    });
    res.end('Proxy Error: Could not connect to the target service.');
  },
});

// Use the proxy middleware for all routes
app.use('*', proxy);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ARORA TV Forward Proxy server running on port ${PORT}`);
});
