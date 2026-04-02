// routes/admin.js — CRUD API to manage mock endpoints
const express = require('express');
const router = express.Router();
const store = require('../store');

// ─── Validation Helper ───────────────────────────────────────────────────────

function validateEndpoint(data) {
  const errors = [];
  const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  if (!data.method) {
    errors.push('method is required');
  } else if (!VALID_METHODS.includes(data.method.toUpperCase())) {
    errors.push(`method must be one of: ${VALID_METHODS.join(', ')}`);
  }

  if (!data.path) {
    errors.push('path is required');
  } else if (!data.path.startsWith('/')) {
    errors.push('path must start with /');
  }

  if (data.statusCode !== undefined) {
    const code = parseInt(data.statusCode);
    if (isNaN(code) || code < 100 || code > 599) {
      errors.push('statusCode must be a valid HTTP status code (100–599)');
    }
  }

  if (data.delay !== undefined) {
    const delay = parseInt(data.delay);
    if (isNaN(delay) || delay < 0 || delay > 30000) {
      errors.push('delay must be a number between 0 and 30000 (ms)');
    }
  }

  if (data.body !== undefined && typeof data.body !== 'object') {
    errors.push('body must be a valid JSON object or array');
  }

  return errors;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /admin/endpoints — list all registered mocks
router.get('/endpoints', (req, res) => {
  const endpoints = store.getAll();
  res.json({
    success: true,
    count: endpoints.length,
    data: endpoints,
  });
});

// GET /admin/endpoints/:id — get single mock
router.get('/endpoints/:id', (req, res) => {
  const endpoint = store.getById(req.params.id);
  if (!endpoint) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.json({ success: true, data: endpoint });
});

// POST /admin/endpoints — register a new mock
router.post('/endpoints', (req, res) => {
  const errors = validateEndpoint(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Check for duplicate method+path
  const existing = store.findByKey(req.body.method, req.body.path);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `A mock already exists for ${req.body.method.toUpperCase()} ${req.body.path}`,
      existing,
    });
  }

  const endpoint = store.add(req.body);
  res.status(201).json({ success: true, data: endpoint });
});

// PUT /admin/endpoints/:id — update an existing mock
router.put('/endpoints/:id', (req, res) => {
  const endpoint = store.getById(req.params.id);
  if (!endpoint) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }

  const errors = validateEndpoint({ ...endpoint, ...req.body });
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const updated = store.update(req.params.id, req.body);
  res.json({ success: true, data: updated });
});

// DELETE /admin/endpoints/:id — remove a mock
router.delete('/endpoints/:id', (req, res) => {
  const endpoint = store.getById(req.params.id);
  if (!endpoint) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }

  store.delete(req.params.id);
  res.json({ success: true, message: `Mock "${endpoint.key}" deleted successfully` });
});

// DELETE /admin/endpoints — clear all mocks
router.delete('/endpoints', (req, res) => {
  const count = store.getAll().length;
  store.clear();
  res.json({ success: true, message: `Cleared ${count} mock endpoint(s)` });
});

// POST /admin/validate-json — validate a JSON string
router.post('/validate-json', (req, res) => {
  const { json } = req.body;
  if (!json) {
    return res.status(400).json({ success: false, error: 'json field is required' });
  }

  try {
    const parsed = JSON.parse(typeof json === 'string' ? json : JSON.stringify(json));
    res.json({ success: true, valid: true, parsed });
  } catch (err) {
    res.json({ success: false, valid: false, error: err.message });
  }
});

module.exports = router;
