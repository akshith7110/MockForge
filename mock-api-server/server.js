// server.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const adminRouter        = require('./routes/admin');
const { router: mockRouter, requestLog } = require('./routes/mock');
const importExportRouter = require('./routes/importExport');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ───────────────────────────────────────────────────────────────
const adminCors = cors({
  origin: process.env.ADMIN_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

const mockCors = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Mock-Delay', 'X-Mock-Status'],
  optionsSuccessStatus: 204,   // ← ADD THIS
});

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors());                                      // ← ADD THIS (catches all preflight early)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/admin', adminCors, adminRouter);
app.use('/admin', adminCors, importExportRouter);

app.get('/admin/logs', adminCors, (req, res) => {
  res.json({ success: true, count: requestLog.length, data: requestLog });
});

app.options(/.*/, mockCors);                          // ← your fix, keep this
app.use('/mock', mockCors, mockRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  MockForge running at http://localhost:${PORT}`);
  console.log(`    Dashboard   →  http://localhost:${PORT}/`);
  console.log(`    Admin API   →  http://localhost:${PORT}/admin/endpoints`);
  console.log(`    Export      →  http://localhost:${PORT}/admin/export`);
  console.log(`    Import      →  POST http://localhost:${PORT}/admin/import`);
  console.log(`    Mock URLs   →  http://localhost:${PORT}/mock/<path>\n`);
});

module.exports = app;