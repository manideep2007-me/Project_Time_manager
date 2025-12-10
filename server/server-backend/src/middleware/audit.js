const pool = require('../config/database');

async function createAuditTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        path TEXT NOT NULL,
        user_id TEXT,
        ip VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Create audit table failed:', err.message);
  }
}

async function auditLog(req, res, next) {
  res.on('finish', () => {
    // fire-and-forget; do not await
    pool.query(
      'INSERT INTO audit_logs (method, path, user_id, ip) VALUES ($1, $2, $3, $4)',
      [req.method, req.originalUrl || req.url, req.user?.id || null, req.ip || null]
    ).catch(() => {});
  });
  next();
}

module.exports = { auditLog, createAuditTable };

