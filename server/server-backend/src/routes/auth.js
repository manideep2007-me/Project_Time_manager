const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/database');
const { secondary: registryPool, createOrgPool } = require('../config/databases');
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
], handleValidation, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone = '', organizationCode, role = 'employee' } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();
    
    // If organizationCode is provided, register employee in BOTH:
    // 1. employees_registry (project_registry database) - for authentication
    // 2. users table (organization's specific database) - for actual usage
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
      const orgName = org.name;
      const orgDatabaseName = org.database_name;
      
      // Check if email already exists for this organization in employees_registry
      const existingUser = await registryPool.query(
        'SELECT id FROM employees_registry WHERE employee_email = $1 AND organization_id = $2',
        [email, org.organization_id]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered for this organization' });
      }
      
      // Create a connection to the organization's specific database
      const orgPool = createOrgPool(orgDatabaseName);
      const orgClient = await orgPool.connect();
      
      try {
        // Check if email already exists in organization's users table
        const existingOrgUser = await orgClient.query(
          'SELECT user_id FROM users WHERE email_id = $1',
          [email]
        );
        
        if (existingOrgUser.rows.length > 0) {
          return res.status(409).json({ error: 'Email already exists in this organization' });
        }
        
        await orgClient.query('BEGIN');
        
        // Step 1: Insert into the organization's users table
        const userResult = await orgClient.query(
          `INSERT INTO users (email_id, phone_number, password_hash, first_name, last_name, role) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING user_id as id, email_id as email, phone_number, first_name, last_name, role`,
          [email, phone, hash, firstName, lastName, role]
        );
        const localUser = userResult.rows[0];
        
        // Step 2: Insert into employees_registry (project_registry database)
        const empResult = await registryPool.query(
          `INSERT INTO employees_registry (organization_id, organization_name, employee_email, employee_phone, employee_name, password_hash, role, database_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           RETURNING id, employee_email as email, employee_name, role, organization_id, organization_name`,
          [org.organization_id, orgName, email, phone, fullName, hash, role, orgDatabaseName]
        );
        
        const employee = empResult.rows[0];
        
        await orgClient.query('COMMIT');
        
        // Generate JWT token with both user IDs
        const token = jwt.sign({ 
          userId: localUser.id,  // user_id from organization's users table for API operations
          registryId: employee.id,  // id from employees_registry for auth
          organizationId: employee.organization_id,
          databaseName: orgDatabaseName,
          role: employee.role,
          source: 'registry'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        console.log(`✅ Employee "${email}" registered to organization "${orgName}" in database "${orgDatabaseName}" (users table ID: ${localUser.id})`);
        
        return res.json({ 
          message: 'Registered successfully', 
          user: {
            id: localUser.id,  // Return the users table ID for API compatibility
            email: localUser.email,
            first_name: firstName,
            last_name: lastName,
            role: employee.role,
            organization_id: employee.organization_id,
            organization_name: employee.organization_name
          }, 
          token 
        });
      } catch (orgErr) {
        await orgClient.query('ROLLBACK');
        throw orgErr;
      } finally {
        orgClient.release();
        await orgPool.end(); // Close the dynamic pool connection
      }
    }
    
    // Fallback: Register in local/default users table only (for demo/development without organization)
    const client = await pool.connect();
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
    
    // Demo accounts (for development) - these are in users table
    // Check users table FIRST for demo accounts (admin@company.com, rajesh@company.com, etc.)
    // Note: Using email_id and user_id column names to match actual database schema
    const demoResult = await pool.query('SELECT user_id as id, email_id as email, password_hash, first_name, last_name, role FROM users WHERE email_id = $1', [email]);
    
    if (demoResult.rows.length > 0) {
      const row = demoResult.rows[0];
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      
      // Demo accounts use 'local' source - they see demo data
      const token = jwt.sign({ userId: row.id, source: 'local' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...user } = row;
      console.log(`✅ Demo user logged in: ${email} (${row.role})`);
      return res.json({ message: 'Logged in', user, token });
    }
    
    // Real organization users - check employees_registry in project_registry database
    if (registryPool) {
      try {
        const registryResult = await registryPool.query(
          `SELECT er.id, er.employee_email as email, er.password_hash, er.employee_name, er.role, er.organization_id, er.organization_name
           FROM employees_registry er
           WHERE er.employee_email = $1 AND er.is_active = true`,
          [email]
        );
        
        if (registryResult.rows.length > 0) {
          const row = registryResult.rows[0];
          
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
            organization_name: row.organization_name
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
          `SELECT id, employee_email as email, employee_name, role, organization_id, organization_name
           FROM employees_registry WHERE id = $1`,
          [decoded.userId]
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          const nameParts = (row.employee_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return res.json({ 
            user: {
              id: row.id,
              email: row.email,
              first_name: firstName,
              last_name: lastName,
              role: row.role,
              organization_id: row.organization_id,
              organization_name: row.organization_name
            }
          });
        }
      } catch (registryErr) {
        console.log('Registry profile lookup failed:', registryErr.message);
      }
    }
    
    // Fallback: check users table (using email_id and user_id column names)
    const result = await pool.query('SELECT user_id as id, email_id as email, first_name, last_name, role FROM users WHERE user_id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;

