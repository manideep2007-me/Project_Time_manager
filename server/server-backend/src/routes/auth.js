const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/database');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('organizationCode').optional().isString().trim(),
  body('role').optional().isIn(['admin', 'manager', 'employee']),
], handleValidation, async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, firstName, lastName, organizationCode, role = 'employee' } = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    await client.query('BEGIN');
    
    // Create user
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, hash, firstName, lastName, role]
    );
    const user = userResult.rows[0];
    
    // If organizationCode is provided, link user to organization
    if (organizationCode) {
      // Find organization by join code
      let org = null;
      try {
        const orgResult = await client.query(
          'SELECT id FROM organizations WHERE join_code = $1',
          [organizationCode]
        );
        if (orgResult.rows.length > 0) {
          org = orgResult.rows[0];
        }
      } catch (orgErr) {
        console.log('Error finding organization:', orgErr.message);
      }
      
      // If organization found, create employee and link to organization
      if (org) {
        // Create employee record
        const empResult = await client.query(
          `INSERT INTO employees (employee_id, first_name, last_name, email, salary_type, salary_amount, is_active)
           VALUES (uuid_generate_v4()::text, $1, $2, $3, 'monthly', 0, true)
           RETURNING id`,
          [firstName, lastName, email]
        );
        const employeeId = empResult.rows[0].id;
        
        // Link employee to organization
        await client.query(
          `INSERT INTO organization_memberships (organization_id, employee_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (organization_id, employee_id) DO UPDATE SET role = EXCLUDED.role`,
          [org.id, employeeId, role]
        );
      }
    }
    
    await client.query('COMMIT');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registered', user, token });
  } catch (err) {
    await client.query('ROLLBACK');
    if (String(err.message || '').includes('duplicate')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  } finally {
    client.release();
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').isString(),
], handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: row.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...user } = row;
    res.json({ message: 'Logged in', user, token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;

