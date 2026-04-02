// routes/mock.js — Dynamic wildcard handler for all registered mock endpoints
const express = require('express');
const router = express.Router();
const store = require('../store');

// Request logger (in-memory, last 100 entries)
const requestLog = [];
const MAX_LOG = 100;

function logRequest({ method, path, matchedId, statusCode, delay, ip }) {
  requestLog.unshift({
    id: Date.now(),
    method,
    path,
    matchedId: matchedId || null,
    statusCode,
    delay,
    ip,
    timestamp: new Date().toISOString(),
  });
  if (requestLog.length > MAX_LOG) requestLog.pop();
}

// ─── GET /admin/logs — expose request log via admin ──────────────────────────
// (attached to this router for convenience, mounted at /admin/logs in server.js)
router.get('/logs', (req, res) => {   // no change needed here
  res.json({
    success: true,
    count: requestLog.length,
    data: requestLog,
  });
});

// ─── Wildcard Mock Handler ────────────────────────────────────────────────────
// Matches ALL methods on ALL paths under /mock/*

router.all('/{*path}', (req, res) => {
  // Strip the /mock prefix to get the registered path
  const mockPath = req.path === '/' ? '/' : req.path;
  const method = req.method;

  const endpoint = store.findByKey(method, mockPath);

  if (!endpoint) {
    logRequest({ method, path: mockPath, statusCode: 404, delay: 0, ip: req.ip });
    return res.status(404).json({
      success: false,
      error: 'No mock endpoint registered for this route',
      hint: `Register it via POST /admin/endpoints with method "${method}" and path "${mockPath}"`,
    });
  }

  // Increment hit counter
  store.incrementHit(endpoint.id);

  // Log the request
  logRequest({
    method,
    path: mockPath,
    matchedId: endpoint.id,
    statusCode: endpoint.statusCode,
    delay: endpoint.delay,
    ip: req.ip,
  });

  // Simulate latency then respond
  setTimeout(() => {
    res
      .status(endpoint.statusCode)
      .json(endpoint.body);
  }, endpoint.delay);
});

module.exports = { router, requestLog };
