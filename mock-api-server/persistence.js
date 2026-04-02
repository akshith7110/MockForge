// persistence.js — File-based persistence using plain JSON (no extra deps needed)
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure data directory exists
function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Load persisted endpoints from disk → returns array or []
function load() {
  ensureDir();
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.endpoints) ? parsed.endpoints : [];
  } catch (e) {
    console.warn('[Persistence] Failed to load db.json:', e.message);
    return [];
  }
}

// Save all endpoints to disk
function save(endpoints) {
  ensureDir();
  try {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      endpoints: Array.from(endpoints.values()),
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Persistence] Failed to save db.json:', e.message);
  }
}

// Export endpoints as a portable JSON config string
function exportConfig(endpoints) {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      endpoints: Array.from(endpoints.values()).map(ep => ({
        method: ep.method,
        path: ep.path,
        statusCode: ep.statusCode,
        body: ep.body,
        delay: ep.delay,
        description: ep.description,
      })),
    },
    null,
    2
  );
}

// Validate imported config shape
function validateImport(data) {
  const errors = [];
  if (!data || typeof data !== 'object') { errors.push('Invalid JSON object'); return errors; }
  if (!Array.isArray(data.endpoints)) { errors.push('Missing "endpoints" array'); return errors; }

  const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  data.endpoints.forEach((ep, i) => {
    if (!ep.method || !VALID_METHODS.includes(ep.method.toUpperCase()))
      errors.push(`[${i}] Invalid or missing method`);
    if (!ep.path || !ep.path.startsWith('/'))
      errors.push(`[${i}] Path must start with /`);
    if (ep.statusCode && (ep.statusCode < 100 || ep.statusCode > 599))
      errors.push(`[${i}] statusCode out of range`);
  });
  return errors;
}

module.exports = { load, save, exportConfig, validateImport };
