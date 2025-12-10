const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/database');
const { handleValidation } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function generateJoinCode(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateUniqueId() {
  // Generate unique company ID: ORG-YYYYMMDD-XXXXX
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORG-${date}-${random}`;
}

// POST /api/organizations/register - Register a new organization (public endpoint)
router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 2 }).withMessage('Company name is required'),
    body('address').isString().trim().isLength({ min: 5 }).withMessage('Company address is required'),
    body('licence_key').isString().trim().notEmpty().withMessage('Licence key is required'),
    body('licence_number').optional({ checkFalsy: true }).isString().trim().withMessage('Licence number must be a string'),
    body('max_employees').isInt({ min: 1 }).withMessage('Max employees must be at least 1'),
    body('licence_type').isString().trim().notEmpty().withMessage('Licence type is required'),
    body('admin_email').isEmail().normalizeEmail().withMessage('Valid admin email is required'),
    body('admin_phone').isString().trim().notEmpty().withMessage('Admin phone is required'),
    body('admin_password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  handleValidation,
  async (req, res) => {
    const bcrypt = require('bcrypt');
    try {
      const { name, address, licence_key, licence_number, max_employees, licence_type, admin_email, admin_phone, admin_password } = req.body;
      
      // Use licence_key as licence_number if licence_number is empty (for trial plans)
      const finalLicenceNumber = licence_number && licence_number.trim() ? licence_number.trim() : licence_key;
      
      // Check if email already exists
      const existingEmail = await pool.query('SELECT 1 FROM organizations WHERE admin_email = $1', [admin_email]);
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(admin_password, 10);

      // Generate unique join code
      let code;
      for (let i = 0; i < 5; i++) {
        code = generateJoinCode();
        const exists = await pool.query('SELECT 1 FROM organizations WHERE join_code = $1', [code]);
        if (exists.rows.length === 0) break;
      }
      if (!code) return res.status(500).json({ error: 'Failed to generate join code' });

      // Generate unique organization ID
      let organizationId;
      for (let i = 0; i < 5; i++) {
        organizationId = generateUniqueId();
        const exists = await pool.query('SELECT 1 FROM organizations_registry WHERE organization_id = $1', [organizationId]);
        if (exists.rows.length === 0) break;
      }
      if (!organizationId) return res.status(500).json({ error: 'Failed to generate unique ID' });

      const ins = await pool.query(
        `INSERT INTO organizations_registry (organization_id, name, address, licence_key, licence_number, max_employees, licence_type, admin_email, admin_phone, admin_password, join_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, organization_id, name, address, licence_key, licence_number, max_employees, licence_type, admin_email, admin_phone, join_code, created_at`,
        [organizationId, name, address, licence_key, finalLicenceNumber, max_employees, licence_type, admin_email, admin_phone, hashedPassword, code]
      );
      res.json({ organization: ins.rows[0] });
    } catch (err) {
      console.error('Error registering organization:', err);
      res.status(500).json({ error: 'Failed to register organization' });
    }
  }
);

// GET /api/organizations/resolve/:code - Resolve an organization by join code (public)
router.get('/resolve/:code', async (req, res) => {
  try {
    const { code } = req.params;
    let org = null;
    
    // Try organizations table first (where dummy org was created)
    try {
      org = await pool.query(
        'SELECT id, name, admin_email, admin_phone, join_code FROM organizations WHERE join_code = $1',
        [code]
      );
    } catch (orgErr) {
      console.log('organizations table query failed, trying organizations_registry:', orgErr.message);
    }
    
    // If not found, try organizations_registry
    if (!org || org.rows.length === 0) {
      try {
        org = await pool.query(
          `SELECT id, 
            COALESCE(name, organization_name) as name, 
            admin_email, 
            admin_phone, 
            join_code 
           FROM organizations_registry 
           WHERE join_code = $1`,
          [code]
        );
      } catch (registryErr) {
        console.log('organizations_registry table query also failed:', registryErr.message);
      }
    }
    
    if (!org || org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ organization: org.rows[0] });
  } catch (err) {
    console.error('Error resolving organization:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to resolve organization', details: err.message });
  }
});

// GET /api/organizations/my-organization - Get admin's organization join code (authenticated, admin only)
router.get('/my-organization', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminEmail = req.user.email;
    let org = null;
    
    // Try organizations_registry first (where register endpoint inserts)
    try {
      org = await pool.query(
        `SELECT id, 
          COALESCE(name, organization_name) as name, 
          join_code, 
          COALESCE(organization_id, unique_id) as unique_id 
         FROM organizations_registry 
         WHERE admin_email = $1`,
        [adminEmail]
      );
    } catch (registryErr) {
      // If organizations_registry doesn't exist or has wrong structure, try organizations
      console.log('organizations_registry query failed, trying organizations table:', registryErr.message);
    }
    
    // If not found or error, try organizations table
    if (!org || org.rows.length === 0) {
      try {
        org = await pool.query(
          'SELECT id, name, join_code, unique_id FROM organizations WHERE admin_email = $1',
          [adminEmail]
        );
      } catch (orgErr) {
        console.error('organizations table query also failed:', orgErr.message);
        throw orgErr;
      }
    }
    
    if (!org || org.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found for this admin. Please register an organization first.' });
    }
    
    // Ensure we have the required fields
    const orgData = org.rows[0];
    if (!orgData.join_code) {
      return res.status(500).json({ error: 'Organization found but missing join_code. Please contact support.' });
    }
    
    res.json({ 
      organization: {
        id: orgData.id,
        name: orgData.name,
        join_code: orgData.join_code,
        unique_id: orgData.unique_id || orgData.organization_id
      }
    });
  } catch (err) {
    console.error('Error fetching admin organization:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to fetch organization', details: err.message });
  }
});

// POST /api/organizations/join - Join an organization via code (public)
router.post(
  '/join',
  [
    body('code').isString().trim().notEmpty(),
    body('first_name').isString().trim().isLength({ min: 1 }),
    body('last_name').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('department').optional().isString().trim(),
  ],
  handleValidation,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { code, first_name, last_name = '', email = null, phone = null, department = null } = req.body;
      const org = await client.query('SELECT id FROM organizations WHERE join_code = $1', [code]);
      if (org.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid organization code' });
      }
      const orgId = org.rows[0].id;

      await client.query('BEGIN');
      const emp = await client.query(
        `INSERT INTO employees (employee_id, first_name, last_name, email, phone, department, salary_type, salary_amount, is_active)
         VALUES (uuid_generate_v4()::text, $1, $2, $3, $4, $5, 'monthly', 0, true)
         RETURNING id, first_name, last_name, email` ,
        [first_name, last_name, email, phone, department]
      );
      const employeeId = emp.rows[0].id;
      await client.query(
        `INSERT INTO organization_memberships (organization_id, employee_id) VALUES ($1, $2)
         ON CONFLICT (organization_id, employee_id) DO NOTHING`,
        [orgId, employeeId]
      );
      await client.query('COMMIT');
      res.json({ success: true, employee: emp.rows[0], organization_id: orgId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error joining organization:', err);
      res.status(500).json({ error: 'Failed to join organization' });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
