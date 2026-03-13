const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { primary: registryPool, createOrgPool } = require('../config/databases');

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/pending-registrations - List pending registrations for admin's organization
router.get('/', async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const status = req.query.status || 'pending';

    const result = await registryPool.query(
      `SELECT id, email, phone, first_name, last_name, salutation,
              date_of_birth, designation_id, address, country_id, state_id, city, zip_code,
              aadhaar_number, joining_date, employment_type, salary_type, salary_amount, overtime_rate,
              status, created_at, reviewed_at, reject_reason
       FROM pending_registrations
       WHERE organization_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      [orgId, status]
    );

    res.json({ registrations: result.rows });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ error: 'Failed to fetch pending registrations' });
  }
});

// GET /api/pending-registrations/count - Get count of pending registrations
router.get('/count', async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) {
      return res.json({ count: 0 });
    }

    const result = await registryPool.query(
      'SELECT COUNT(*) as count FROM pending_registrations WHERE organization_id = $1 AND status = $2',
      [orgId, 'pending']
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// POST /api/pending-registrations/:id/approve - Approve a registration with additional details
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization_id;
    
    // Admin can provide additional details during approval
    const {
      salutation,
      dateOfBirth,
      designationId,
      address,
      countryId,
      stateId,
      aadhaarNumber,
      joiningDate,
      employmentType,
      salaryType,
      salaryAmount,
      overtimeRate,
    } = req.body;

    // Get the pending registration
    const pending = await registryPool.query(
      'SELECT * FROM pending_registrations WHERE id = $1 AND organization_id = $2 AND status = $3',
      [id, orgId, 'pending']
    );

    if (pending.rows.length === 0) {
      return res.status(404).json({ error: 'Pending registration not found' });
    }

    const reg = pending.rows[0];
    
    // Merge admin-provided data with existing registration data
    const finalData = {
      salutation: salutation || reg.salutation,
      dateOfBirth: dateOfBirth || reg.date_of_birth,
      designationId: designationId || reg.designation_id,
      address: address || reg.address,
      countryId: countryId || reg.country_id,
      stateId: stateId || reg.state_id,
      aadhaarNumber: aadhaarNumber || reg.aadhaar_number,
      joiningDate: joiningDate || reg.joining_date,
      employmentType: employmentType || reg.employment_type,
      salaryType: salaryType || reg.salary_type,
      salaryAmount: salaryAmount !== undefined ? salaryAmount : reg.salary_amount,
      overtimeRate: overtimeRate !== undefined ? overtimeRate : reg.overtime_rate,
    };
    
    const fullName = `${reg.first_name} ${reg.last_name}`.trim();

    // Create the employee in both databases (original registration logic)
    const orgPool = createOrgPool(reg.database_name);
    const orgClient = await orgPool.connect();

    try {
      // Check for duplicates again
      const existingOrgUser = await orgClient.query(
        'SELECT user_id FROM users WHERE email_id = $1',
        [reg.email]
      );
      if (existingOrgUser.rows.length > 0) {
        await registryPool.query(
          "UPDATE pending_registrations SET status = 'rejected', reject_reason = 'Email already exists', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2",
          [req.user.email, id]
        );
        return res.status(409).json({ error: 'Email already exists in this organization' });
      }

      await orgClient.query('BEGIN');

      // Insert into org users table with merged data
      const userResult = await orgClient.query(
        `INSERT INTO users (email_id, phone_number, password_hash, first_name, last_name, role,
          salutation, date_of_birth, joining_date, employee_type, aadhaar_number,
          address, country_id, state_id, designation_id,
          pay_calculation, amount, overtime_rate, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true)
         RETURNING user_id as id, email_id as email, first_name, last_name, role`,
        [reg.email, reg.phone, reg.password_hash, reg.first_name, reg.last_name, reg.role,
         finalData.salutation, finalData.dateOfBirth, finalData.joiningDate, finalData.employmentType, finalData.aadhaarNumber,
         finalData.address, finalData.countryId, finalData.stateId, finalData.designationId,
         finalData.salaryType, finalData.salaryAmount, finalData.overtimeRate]
      );
      const localUser = userResult.rows[0];

      // Create salary record
      if (finalData.salaryAmount && finalData.salaryType) {
        try {
          await orgClient.query(
            `INSERT INTO salaries (employee_id, salary_type, salary_amount, effective_date, is_current, notes)
             VALUES ($1, $2, $3, CURRENT_DATE, true, 'Initial salary on registration approval')`,
            [localUser.id, finalData.salaryType, finalData.salaryAmount]
          );
        } catch (salaryErr) {
          console.error('Salary record creation failed (non-blocking):', salaryErr.message);
        }
      }

      // Insert into employees_registry
      await registryPool.query(
        `INSERT INTO employees_registry (organization_id, organization_name, employee_email, employee_phone, employee_name, password_hash, role, database_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [reg.organization_id, reg.organization_name, reg.email, reg.phone, fullName, reg.password_hash, reg.role, reg.database_name]
      );

      await orgClient.query('COMMIT');

      // Mark as approved
      await registryPool.query(
        "UPDATE pending_registrations SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2",
        [req.user.email, id]
      );

      console.log(`✅ Admin approved registration for "${reg.email}" → org "${reg.organization_name}"`);

      res.json({
        message: 'Employee approved and created successfully',
        employee: {
          id: localUser.id,
          email: localUser.email,
          first_name: localUser.first_name,
          last_name: localUser.last_name,
        },
      });
    } catch (orgErr) {
      await orgClient.query('ROLLBACK');
      throw orgErr;
    } finally {
      orgClient.release();
      await orgPool.end();
    }
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// POST /api/pending-registrations/:id/reject - Reject a registration
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.organization_id;
    const { reason } = req.body;

    const result = await registryPool.query(
      "UPDATE pending_registrations SET status = 'rejected', reject_reason = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW() WHERE id = $3 AND organization_id = $4 AND status = 'pending' RETURNING id",
      [reason || 'Rejected by admin', req.user.email, id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending registration not found' });
    }

    console.log(`❌ Admin rejected registration #${id}`);
    res.json({ message: 'Registration request rejected' });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

module.exports = router;
