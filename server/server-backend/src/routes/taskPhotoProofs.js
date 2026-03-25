const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole, getDbPool } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const uploadDir = path.resolve(__dirname, '../../uploads/task-photo-proofs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    cb(null, `task-proof-${timestamp}-${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

async function ensureTaskPhotoProofsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS task_photo_proofs (
      id SERIAL PRIMARY KEY,
      task_id UUID NOT NULL,
      employee_id UUID NOT NULL,
      photo_url TEXT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL,
      latitude NUMERIC(10, 8),
      longitude NUMERIC(11, 8),
      address TEXT,
      work_type TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_task_photo_proofs_task ON task_photo_proofs(task_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_task_photo_proofs_employee ON task_photo_proofs(employee_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_task_photo_proofs_captured ON task_photo_proofs(captured_at DESC);`);
}

async function resolveEmployeeId(req, db) {
  // For registry-based JWTs, req.user.id is the registry id, not org users.user_id.
  // Prefer matching by org users table (user_id or email_id).
  const userId = req.user?.id;
  const email = (req.user?.email || '').trim().toLowerCase();

  if (userId) {
    try {
      const r = await db.query('SELECT user_id FROM users WHERE user_id = $1 LIMIT 1', [userId]);
      if (r.rows[0]?.user_id) return r.rows[0].user_id;
    } catch {
      // ignore
    }
  }

  if (email) {
    const r = await db.query('SELECT user_id FROM users WHERE LOWER(email_id) = $1 LIMIT 1', [email]);
    if (r.rows[0]?.user_id) return r.rows[0].user_id;
  }

  return userId;
}

// POST /api/task-photo-proofs/upload
router.post('/upload', upload.single('photo'), async (req, res) => {
  const db = getDbPool(req);
  try {
    await ensureTaskPhotoProofsTable(db);

    const { taskId, timestamp, latitude, longitude, address, workType } = req.body;
    const file = req.file;
    const userId = req.user?.id;

    if (!taskId) {
      if (file?.path) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'taskId is required' });
    }
    // Validate UUID input early so we don't crash with 22P02
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(String(taskId))) {
      if (file?.path) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'taskId must be a valid UUID' });
    }
    if (!timestamp) {
      if (file?.path) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'timestamp is required' });
    }
    if (!file) {
      return res.status(400).json({ error: 'photo file is required' });
    }

    const employeeId = await resolveEmployeeId(req, db);
    if (!employeeId) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unable to resolve employeeId for current user' });
    }

    const photoUrl = `/uploads/task-photo-proofs/${file.filename}`;
    const capturedAt = new Date(timestamp);

    console.log(
      `[task-photo-proofs/upload] userId=${userId} employeeId=${employeeId} taskId=${taskId} capturedAt=${capturedAt.toISOString()} file=${file.filename}`
    );

    const insert = await db.query(
      `INSERT INTO task_photo_proofs
        (task_id, employee_id, photo_url, captured_at, latitude, longitude, address, work_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, task_id, employee_id, photo_url, captured_at, latitude, longitude, address, work_type, created_at`,
      [
        taskId,
        employeeId,
        photoUrl,
        capturedAt,
        latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null,
        longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null,
        address || null,
        workType || null,
      ]
    );

    console.log(`[task-photo-proofs/upload] inserted id=${insert.rows[0]?.id}`);
    res.status(201).json({ success: true, proof: insert.rows[0] });
  } catch (error) {
    console.error('Error uploading task photo proof:', error);
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
    }
    res.status(500).json({ error: 'Failed to upload task photo proof', message: error.message });
  }
});

// GET /api/task-photo-proofs/task/:taskId
router.get('/task/:taskId', async (req, res) => {
  const db = getDbPool(req);
  try {
    await ensureTaskPhotoProofsTable(db);
    const { taskId } = req.params;
    const { limit = 100 } = req.query;

    const result = await db.query(
      `SELECT p.id, p.task_id, p.employee_id, p.photo_url, p.captured_at, p.latitude, p.longitude, p.address, p.work_type, p.created_at,
              COALESCE(u.first_name,'') as first_name, COALESCE(u.last_name,'') as last_name
       FROM task_photo_proofs p
       LEFT JOIN users u ON p.employee_id = u.user_id
       WHERE p.task_id = $1
       ORDER BY p.captured_at DESC
       LIMIT $2`,
      [taskId, parseInt(limit)]
    );

    res.json({ success: true, proofs: result.rows || [] });
  } catch (error) {
    console.error('Error fetching task photo proofs:', error);
    res.json({ success: true, proofs: [] });
  }
});

// GET /api/task-photo-proofs/recent (admin)
router.get('/recent', requireRole(['admin']), async (req, res) => {
  const db = getDbPool(req);
  try {
    await ensureTaskPhotoProofsTable(db);
    const { limit = 10 } = req.query;

    const result = await db.query(
      `SELECT p.id, p.task_id, p.employee_id, p.photo_url, p.captured_at, p.latitude, p.longitude, p.address, p.work_type, p.created_at,
              COALESCE(u.first_name,'') as first_name, COALESCE(u.last_name,'') as last_name,
              COALESCE(t.task_name,'') as task_title,
              COALESCE(pr.project_name,'') as project_name,
              pr.project_id as project_id
       FROM task_photo_proofs p
       LEFT JOIN users u ON p.employee_id = u.user_id
       LEFT JOIN tasks t ON p.task_id = t.task_id
       LEFT JOIN projects pr ON t.project_id = pr.project_id
       ORDER BY p.captured_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({ success: true, proofs: result.rows || [] });
  } catch (error) {
    console.error('Error fetching recent task photo proofs:', error);
    res.json({ success: true, proofs: [] });
  }
});

// GET /api/task-photo-proofs/me (current employee)
router.get('/me', authenticateToken, async (req, res) => {
  const db = getDbPool(req);
  try {
    await ensureTaskPhotoProofsTable(db);
    const employeeId = await resolveEmployeeId(req, db);
    const { limit = 50 } = req.query;

    if (!employeeId) {
      return res.json({ success: true, proofs: [] });
    }

    const result = await db.query(
      `SELECT
        p.id,
        p.task_id,
        p.employee_id,
        p.photo_url,
        p.captured_at,
        p.latitude,
        p.longitude,
        p.address,
        p.work_type,
        p.created_at,
        COALESCE(t.task_name,'') AS task_name,
        COALESCE(pr.project_name,'') AS project_name,
        COALESCE(c.client_name,'') AS client_name
      FROM task_photo_proofs p
      LEFT JOIN tasks t ON p.task_id = t.task_id
      LEFT JOIN projects pr ON t.project_id = pr.project_id
      LEFT JOIN clients c ON pr.client_id = c.client_id
      WHERE p.employee_id = $1
      ORDER BY p.captured_at DESC
      LIMIT $2`,
      [employeeId, parseInt(limit)]
    );

    res.json({ success: true, proofs: result.rows || [] });
  } catch (error) {
    console.error('Error fetching my task photo proofs:', error);
    res.json({ success: true, proofs: [] });
  }
});

module.exports = router;

