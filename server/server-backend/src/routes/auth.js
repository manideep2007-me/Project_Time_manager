const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/database');
const { primary: registryPool, secondary, createOrgPool } = require('../config/databases');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('phone').optional().isString().trim(),
  body('organizationCode').optional().isString().trim(),
  body('role').optional().isIn(['admin', 'manager', 'employee']),
  body('salutation').optional().isString().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('designationId').optional().isUUID(),
  body('address').optional().isString().trim(),
  body('countryId').optional().isUUID(),
  body('stateId').optional().isUUID(),
  body('city').optional().isString().trim(),
  body('zipCode').optional().isString().trim(),
  body('aadhaarNumber').optional().isString().trim(),
  body('joiningDate').optional().isISO8601(),
  body('employmentType').optional().isIn(['Full Time', 'Temporary', 'Contract']),
  body('salaryType').optional().isIn(['hourly', 'daily', 'monthly']),
  body('salaryAmount').optional().isNumeric(),
  body('overtimeRate').optional().isNumeric(),
  body('gender').optional().isString().trim(),
  body('age').optional().isInt({ min: 1, max: 150 }),
], handleValidation, async (req, res) => {
  try {
    const { 
      email, password, firstName, lastName, phone = '', organizationCode, role = 'employee',
      salutation, dateOfBirth, designationId, address, countryId, stateId, city, zipCode,
      aadhaarNumber, joiningDate, employmentType, salaryType, salaryAmount, overtimeRate,
      gender, age
    } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();
    
    // If organizationCode is provided, create a PENDING registration request
    // The admin must approve before the employee account is created
    if (organizationCode && registryPool) {
      // Find organization by join code in organizations_registry
      const orgResult = await registryPool.query(
        'SELECT organization_id, name, database_name FROM organizations_registry WHERE join_code = $1',
        [organizationCode]
      );
      
      if (orgResult.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid organization code or organization not found' });
      }
      
      const org = orgResult.rows[0];

      // Check if email already exists for this organization in employees_registry
      const existingUser = await registryPool.query(
        'SELECT id FROM employees_registry WHERE employee_email = $1 AND organization_id = $2',
        [email, org.organization_id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered for this organization' });
      }

      // Check if there's already a pending request
      const existingPending = await registryPool.query(
        'SELECT id FROM pending_registrations WHERE email = $1 AND organization_id = $2 AND status = $3',
        [email, org.organization_id, 'pending']
      );
      if (existingPending.rows.length > 0) {
        return res.status(409).json({ error: 'A registration request is already pending for this email' });
      }

      // Store registration as pending
      await registryPool.query(
        `INSERT INTO pending_registrations
          (organization_id, organization_name, database_name, email, phone, first_name, last_name, password_hash, role,
           salutation, date_of_birth, designation_id, address, country_id, state_id, city, zip_code,
           aadhaar_number, joining_date, employment_type, salary_type, salary_amount, overtime_rate, gender, age, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,'pending')`,
        [org.organization_id, org.name, org.database_name, email, phone, firstName, lastName, hash, role,
         salutation || null, dateOfBirth || null, designationId || null, address || null,
         countryId || null, stateId || null, city || null, zipCode || null,
         aadhaarNumber || null, joiningDate || null, employmentType || null,
         salaryType || null, salaryAmount || null, overtimeRate || null, gender || null, age || null]
      );

      console.log(`📋 Pending registration created for "${email}" → org "${org.name}"`);

      return res.json({
        message: 'Registration request submitted successfully. Waiting for admin approval.',
        pending: true,
        organizationName: org.name,
      });
    }
    
    // Fallback: Register in local/default users table only (for demo/development without organization)
    // Use secondary database (project_time_manager) for demo users
    if (!secondary) {
      return res.status(400).json({ error: 'Organization registration required. Secondary database not configured.' });
    }
    
    const client = await secondary.connect();
    try {
      await client.query('BEGIN');
      
      // Create user in local users table - using email_id and user_id to match actual database schema
      const userResult = await client.query(
        'INSERT INTO users (email_id, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id as id, email_id as email, first_name, last_name, role',
        [email, hash, firstName, lastName, role]
      );
      const user = userResult.rows[0];
      
      await client.query('COMMIT');
      const token = jwt.sign({ userId: user.id, source: 'local' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      console.log(`✅ Local user "${email}" registered (no organization)`);
      res.json({ message: 'Registered', user, token });
    } catch (localErr) {
      await client.query('ROLLBACK');
      throw localErr;
    } finally {
      client.release();
    }
  } catch (err) {
    if (String(err.message || '').includes('duplicate')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').isString(),
], handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Demo accounts (for development) - these are in users table in secondary database (project_time_manager)
    // Check users table FIRST for demo accounts (admin@company.com, rajesh@company.com, etc.)
    // Note: Using email_id and user_id column names to match actual database schema
    // Use secondary pool (project_time_manager) for demo accounts
    let demoResult = { rows: [] };
    if (secondary) {
      try {
        demoResult = await secondary.query('SELECT user_id as id, email_id as email, password_hash, first_name, last_name, role, photograph, is_active FROM users WHERE email_id = $1', [email]);
      } catch (err) {
        console.log('Demo account check failed:', err.message);
      }
    }
    
    if (demoResult.rows.length > 0) {
      const row = demoResult.rows[0];
      if (row.is_active === false) {
        return res.status(403).json({ error: 'Your account has been marked inactive by admin. Please contact your administrator.' });
      }
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      
      // Demo accounts use 'local' source - they see demo data
      const token = jwt.sign({ userId: row.id, source: 'local' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, photograph, ...userWithoutSensitive } = row;
      // Build photo_url from photograph path
      const photo_url = photograph ? `${req.protocol}://${req.get('host')}/uploads/employee-photos/${require('path').basename(photograph)}` : null;
      const user = { ...userWithoutSensitive, photo_url };
      console.log(`✅ Demo user logged in: ${email} (${row.role})`);
      return res.json({ message: 'Logged in', user, token });
    }
    
    // Real organization users - check employees_registry in project_registry database
    if (registryPool) {
      try {
        const registryResult = await registryPool.query(
          `SELECT er.id, er.employee_email as email, er.password_hash, er.employee_name, er.role,
                  er.organization_id, er.organization_name, er.photograph, er.database_name, er.is_active
           FROM employees_registry er
           WHERE er.employee_email = $1`,
          [email]
        );
        
        if (registryResult.rows.length > 0) {
          const row = registryResult.rows[0];

          if (row.is_active === false) {
            return res.status(403).json({ error: 'Your account has been marked inactive by admin. Please contact your administrator.' });
          }

          // If org admin deactivated the account in organization users table,
          // block login even if registry row is still active.
          if (row.database_name) {
            try {
              const orgPool = createOrgPool(row.database_name);
              const orgUser = await orgPool.query(
                'SELECT is_active FROM users WHERE LOWER(email_id) = LOWER($1) LIMIT 1',
                [email]
              );
              if (orgUser.rows.length > 0 && orgUser.rows[0].is_active === false) {
                return res.status(403).json({ error: 'Your account has been marked inactive by admin. Please contact your administrator.' });
              }
            } catch (orgErr) {
              console.log('Organization user status check failed:', orgErr.message);
            }
          }
          
          // Check if password_hash exists
          if (!row.password_hash) {
            return res.status(401).json({ error: 'Password not set. Please contact your organization admin.' });
          }
          
          const ok = await bcrypt.compare(password, row.password_hash);
          if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
          
          // Parse name into first and last name
          const nameParts = (row.employee_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Build photo_url from photograph path
          const photo_url = row.photograph ? `${req.protocol}://${req.get('host')}/uploads/employee-photos/${require('path').basename(row.photograph)}` : null;
          
          // Real organization users use 'registry' source - they see their organization's data
          const token = jwt.sign({ 
            userId: row.id, 
            organizationId: row.organization_id,
            role: row.role,
            source: 'registry'
          }, process.env.JWT_SECRET, { expiresIn: '7d' });
          
          const user = {
            id: row.id,
            email: row.email,
            first_name: firstName,
            last_name: lastName,
            role: row.role,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            photo_url
          };
          
          console.log(`✅ Organization user logged in: ${email} (${row.role}) - Org: ${row.organization_name}`);
          return res.json({ message: 'Logged in', user, token });
        }
      } catch (registryErr) {
        console.log('employees_registry lookup failed:', registryErr.message);
      }
    }
    
    // No user found in either table
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If user is from employees_registry (organization admin/employee)
    if (decoded.source === 'registry' && registryPool) {
      try {
        const result = await registryPool.query(
          `SELECT id, employee_email as email, employee_name, role, organization_id, organization_name, photograph
           FROM employees_registry WHERE id = $1`,
          [decoded.userId]
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const nameParts = (row.employee_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Build photo_url from photograph path
          const photo_url = row.photograph ? `${req.protocol}://${req.get('host')}/uploads/employee-photos/${require('path').basename(row.photograph)}` : null;
          
          return res.json({ 
            user: {
              id: row.id,
              email: row.email,
              first_name: firstName,
              last_name: lastName,
              role: row.role,
              organization_id: row.organization_id,
              organization_name: row.organization_name,
              photo_url
            }
          });
        }
      } catch (registryErr) {
        console.log('Registry profile lookup failed:', registryErr.message);
      }
    }
    
    // Fallback: check users table in secondary database (using email_id and user_id column names)
    if (secondary) {
      const result = await secondary.query('SELECT user_id as id, email_id as email, first_name, last_name, role, photograph FROM users WHERE user_id = $1', [decoded.userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const row = result.rows[0];
      // Build photo_url from photograph path
      const photo_url = row.photograph ? `${req.protocol}://${req.get('host')}/uploads/employee-photos/${require('path').basename(row.photograph)}` : null;
      return res.json({ user: { ...row, photo_url } });
    }
    
    return res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ========== Public registration helper endpoints ==========
// These endpoints allow the RegisterScreen to fetch dropdown data
// using the organization's join code (from QR scan) instead of a JWT token.

// Helper: resolve org database pool from orgCode query param
async function getOrgPoolFromCode(orgCode) {
  if (!orgCode || !registryPool) return null;
  const result = await registryPool.query(
    'SELECT database_name FROM organizations_registry WHERE join_code = $1',
    [orgCode]
  );
  if (result.rows.length === 0) return null;
  return createOrgPool(result.rows[0].database_name);
}

// GET /api/auth/registration-data/countries?orgCode=xxx
router.get('/registration-data/countries', async (req, res) => {
  try {
    const orgPool = await getOrgPoolFromCode(req.query.orgCode);
    if (!orgPool) return res.status(400).json({ error: 'Valid organization code required' });
    try {
      const result = await orgPool.query(
        `SELECT country_id, name, code, is_active, created_at, updated_at
         FROM countries WHERE is_active = true ORDER BY name ASC`
      );
      res.json({ countries: result.rows });
    } finally {
      await orgPool.end();
    }
  } catch (error) {
    console.error('Error fetching countries for registration:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/auth/registration-data/countries/:id/states?orgCode=xxx
router.get('/registration-data/countries/:id/states', async (req, res) => {
  try {
    const orgPool = await getOrgPoolFromCode(req.query.orgCode);
    if (!orgPool) return res.status(400).json({ error: 'Valid organization code required' });
    try {
      const { id } = req.params;
      const result = await orgPool.query(
        `SELECT state_id, name, code, country_id, is_active, created_at, updated_at
         FROM states WHERE country_id = $1 AND is_active = true ORDER BY name ASC`,
        [id]
      );
      res.json({ states: result.rows });
    } finally {
      await orgPool.end();
    }
  } catch (error) {
    console.error('Error fetching states for registration:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// GET /api/auth/registration-data/designations?orgCode=xxx
router.get('/registration-data/designations', async (req, res) => {
  try {
    const orgPool = await getOrgPoolFromCode(req.query.orgCode);
    if (!orgPool) return res.status(400).json({ error: 'Valid organization code required' });
    try {
      const result = await orgPool.query(
        `SELECT designation_id, name, description, department_id, is_active, created_at, updated_at
         FROM designations WHERE is_active = true ORDER BY name ASC`
      );
      res.json({ designations: result.rows });
    } finally {
      await orgPool.end();
    }
  } catch (error) {
    console.error('Error fetching designations for registration:', error);
    res.status(500).json({ error: 'Failed to fetch designations' });
  }
});

module.exports = router;

