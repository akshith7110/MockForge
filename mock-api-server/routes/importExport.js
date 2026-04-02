// routes/importExport.js — Import & Export mock configs
const express = require('express');
const router = express.Router();
const store = require('../store');
const { exportConfig, validateImport } = require('../persistence');

// ── GET /admin/export — download all mocks as JSON file ─────────────────────
router.get('/export', (req, res) => {
  const json = exportConfig(store.endpoints);
  const filename = `mockforge-export-${Date.now()}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(json);
});

// ── POST /admin/import — upload a mock config JSON ──────────────────────────
// Body: { config: {...}, mode: 'merge' | 'replace' }
router.post('/import', (req, res) => {
  const { config, mode = 'merge' } = req.body;

  if (!config) {
    return res.status(400).json({ success: false, error: '"config" field is required' });
  }

  // Parse if string
  let parsed;
  try {
    parsed = typeof config === 'string' ? JSON.parse(config) : config;
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Invalid JSON in config' });
  }

  // Validate shape
  const errors = validateImport(parsed);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  if (!['merge', 'replace'].includes(mode)) {
    return res.status(400).json({ success: false, error: 'mode must be "merge" or "replace"' });
  }

  const { added, skipped } = store.bulkImport(parsed.endpoints, mode);

  res.json({
    success: true,
    message: `Import complete: ${added.length} added, ${skipped.length} skipped`,
    added: added.map(e => e.key),
    skipped,
  });
});

// ── GET /admin/export/preview — preview what would be exported ──────────────
router.get('/export/preview', (req, res) => {
  const all = store.getAll();
  res.json({
    success: true,
    count: all.length,
    preview: all.map(ep => ({
      method: ep.method,
      path: ep.path,
      statusCode: ep.statusCode,
      delay: ep.delay,
      description: ep.description,
    })),
  });
});

module.exports = router;
