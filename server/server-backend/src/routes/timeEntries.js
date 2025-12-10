const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(authenticateToken);

// GET /api/time-entries - List all time entries with filters
router.get('/', async (req, res) => {
  try {
    const { taskId, employeeId, projectId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const offset = (pageNum - 1) * limitNum;
    let where = 'WHERE te.is_active = true';
    const params = [];
    
    if (taskId) { 
      params.push(taskId); 
      where += ` AND te.task_id = $${params.length}`; 
    }
    if (employeeId) { 
      params.push(employeeId); 
      where += ` AND te.employee_id = $${params.length}`; 
    }
    if (projectId) {
      params.push(projectId);
      where += ` AND t.project_id = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      where += ` AND te.start_time >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      where += ` AND te.start_time <= $${params.length}`;
    }
    
    // Always use JOINs in main query since we need task and project info
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;
    
    const list = await pool.query(
      `SELECT te.id, te.task_id, te.employee_id, te.work_date, te.start_time, te.end_time, te.duration_minutes, te.cost, te.description, te.created_at, te.updated_at,
              t.title as task_title, t.status as task_status,
              p.name as project_name, p.status as project_status,
              e.first_name, e.last_name, e.employee_id as emp_id
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees e ON te.employee_id = e.id
       ${where}
       ORDER BY te.work_date DESC, te.start_time DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, limitNum, offset]
    );
    
    // Build count query - always use same WHERE conditions and JOINs as main query
    const count = await pool.query(
      `SELECT COUNT(*) as count 
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees e ON te.employee_id = e.id
       ${where}`,
      params
    );
    res.json({ 
      timeEntries: list.rows, 
      pagination: { 
        total: parseInt(count.rows[0].count) || 0, 
        page: pageNum, 
        limit: limitNum 
      } 
    });
  } catch (err) {
    console.error('Error fetching time entries:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      query: req.query
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  }
});

// GET /api/time-entries/:id - Get specific time entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT te.id, te.task_id, te.employee_id, te.work_date, te.start_time, te.end_time, te.duration_minutes, te.cost, te.description, te.created_at, te.updated_at,
              t.title as task_title, t.status as task_status,
              p.name as project_name, p.status as project_status,
              e.first_name, e.last_name, e.employee_id as emp_id
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.id
       JOIN projects p ON t.project_id = p.id
       JOIN employees e ON te.employee_id = e.id
       WHERE te.id = $1 AND te.is_active = true`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.json({ timeEntry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/time-entries - Create new time entry
// Employees can create their own time entries, admins/managers can create for any employee
router.post('/', [
  body('taskId').isUUID().withMessage('Valid task ID is required'),
  body('employeeId').optional().isUUID().withMessage('Valid employee ID is required'),
  body('workDate').custom((value) => {
    // Accept both ISO8601 dates and YYYY-MM-DD format
    if (!value) {
      throw new Error('Work date is required');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Valid work date is required');
    }
    return true;
  }),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('description').optional().isString(),
], handleValidation, async (req, res) => {
  try {
    const { taskId, employeeId, workDate, startTime, endTime, description = '' } = req.body;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify task exists
    const taskExists = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Determine the employee ID to use
    let finalEmployeeId = employeeId;
    
    // If employee role, they can only create entries for themselves
    if (userRole === 'employee') {
      // Find employee by email (users table email -> employees table email)
      if (userEmail) {
        const empByEmail = await pool.query('SELECT id FROM employees WHERE email = $1 AND is_active = true', [userEmail]);
        if (empByEmail.rows.length > 0) {
          finalEmployeeId = empByEmail.rows[0].id;
          // If employeeId was provided, verify it matches the logged-in employee
          if (employeeId && employeeId !== finalEmployeeId) {
            return res.status(403).json({ error: 'Employees can only create time entries for themselves' });
          }
        } else {
          return res.status(404).json({ error: 'Employee record not found for your account' });
        }
      } else {
        return res.status(400).json({ error: 'Employee ID is required' });
      }
    } else if (userRole === 'admin' || userRole === 'manager') {
      // Admins and managers can create entries for any employee
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }
      finalEmployeeId = employeeId;
    } else {
      return res.status(403).json({ error: 'Unauthorized to create time entries' });
    }
    
    // Ensure finalEmployeeId is set
    if (!finalEmployeeId) {
      return res.status(400).json({ error: 'Employee ID could not be determined' });
    }
    
    // Verify employee exists and get hourly rate
    const employeeExists = await pool.query('SELECT id, hourly_rate FROM employees WHERE id = $1 AND is_active = true', [finalEmployeeId]);
    if (employeeExists.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found or inactive' });
    }
    
    const employee = employeeExists.rows[0];
    const hourlyRate = parseFloat(employee.hourly_rate) || 0;
    
    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (durationMs <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Ensure minimum duration of 1 minute
    if (durationMinutes < 1) {
      return res.status(400).json({ error: 'Time entry must be at least 1 minute long' });
    }
    
    // Calculate billed minutes: minimum 30 minutes, otherwise use actual duration
    const billedMinutes = durationMinutes < 30 ? 30 : durationMinutes;
    
    // Calculate cost based on hourly rate
    // Cost = (billed_minutes / 60) * hourly_rate
    const cost = (billedMinutes / 60) * hourlyRate;
    
    // Validate all required fields are present
    if (!taskId || !finalEmployeeId || !workDate || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          taskId: !!taskId,
          employeeId: !!finalEmployeeId,
          workDate: !!workDate,
          startTime: !!startTime,
          endTime: !!endTime
        }
      });
    }
    
    // Ensure workDate is in the correct format for PostgreSQL DATE type
    // Handle both YYYY-MM-DD and ISO8601 formats
    let formattedWorkDate = workDate;
    if (workDate.includes('T')) {
      formattedWorkDate = workDate.split('T')[0]; // Extract just the date part if it's a full ISO string
    } else if (workDate.includes(' ')) {
      formattedWorkDate = workDate.split(' ')[0]; // Extract date if it has time with space separator
    }
    
    // Insert time entry - PostgreSQL will automatically convert the string formats to the correct types
    let result;
    try {
      result = await pool.query(
        `INSERT INTO time_entries (task_id, employee_id, work_date, start_time, end_time, duration_minutes, cost, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [taskId, finalEmployeeId, formattedWorkDate, startTime, endTime, durationMinutes, cost, description || '']
      );
      
      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error('Failed to create time entry - no data returned from database');
      }
    } catch (dbErr) {
      console.error('Database error inserting time entry:', dbErr);
      // Re-throw with more context
      throw new Error(`Database error: ${dbErr.message}`);
    }
    
    // Create activity log
    try {
      const taskInfo = await pool.query(
        `SELECT t.title, t.project_id, p.name as project_name
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE t.id = $1`,
        [taskId]
      );
      const employeeInfo = await pool.query(
        `SELECT first_name, last_name FROM employees WHERE id = $1`,
        [finalEmployeeId]
      );
      
      if (taskInfo.rows.length > 0 && employeeInfo.rows.length > 0) {
        const task = taskInfo.rows[0];
        const employee = employeeInfo.rows[0];
        const employeeName = `${employee.first_name} ${employee.last_name}`;
        const hours = (durationMinutes / 60).toFixed(1);
        
        await pool.query(
          `INSERT INTO activity_logs (type, employee_id, employee_name, project_id, project_name, task_id, task_title, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'time_logged',
            finalEmployeeId,
            employeeName,
            task.project_id,
            task.project_name,
            taskId,
            task.title,
            `${employeeName} logged ${hours} hours on ${task.title}`
          ]
        );
      }
    } catch (logErr) {
      console.error('Error creating activity log:', logErr);
      // Continue even if activity log fails
    }
    
    // Return the time entry in the format expected by the frontend
    res.status(201).json({ timeEntry: result.rows[0] });
  } catch (err) {
    console.error('Error creating time entry:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      user: req.user
    });
    // Always include error message for debugging
    res.status(500).json({ 
      error: 'Internal server error',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        code: err.code,
        constraint: err.constraint,
        table: err.table,
        column: err.column
      } : undefined
    });
  }
});

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', [
  body('projectId').optional().isUUID().withMessage('Valid project ID required'),
  body('employeeId').optional().isUUID().withMessage('Valid employee ID required'),
  body('startTime').optional().isISO8601().withMessage('Valid start time required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time required'),
  body('description').optional().isString(),
], handleValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId, employeeId, startTime, endTime, description } = req.body;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    // Check if time entry exists
    const exists = await pool.query('SELECT * FROM time_entries WHERE id = $1 AND is_active = true', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    const timeEntry = exists.rows[0];
    
    // Permission check: Employees can only edit their own time entries
    if (userRole === 'employee') {
      // Find employee by email
      if (userEmail) {
        const empByEmail = await pool.query('SELECT id FROM employees WHERE email = $1 AND is_active = true', [userEmail]);
        if (empByEmail.rows.length === 0) {
          return res.status(403).json({ error: 'Employee record not found for your account' });
        }
        const currentEmployeeId = empByEmail.rows[0].id;
        
        // Check if the time entry belongs to this employee
        if (timeEntry.employee_id !== currentEmployeeId) {
          return res.status(403).json({ error: 'You can only edit your own time entries' });
        }
        
        // Employees cannot change the employee_id of their time entries
        if (employeeId && employeeId !== currentEmployeeId) {
          return res.status(403).json({ error: 'You cannot change the employee for your time entries' });
        }
      } else {
        return res.status(403).json({ error: 'Employee ID is required' });
      }
    } else if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Verify project exists if being updated
    if (projectId) {
      const projectExists = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
      if (projectExists.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }
    
    // Verify employee exists if being updated (only for admins/managers)
    if (employeeId && userRole !== 'employee') {
      const employeeExists = await pool.query('SELECT id, hourly_rate FROM employees WHERE id = $1 AND is_active = true', [employeeId]);
      if (employeeExists.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found or inactive' });
      }
    }
    
    // Get current values for calculation
    const currentEntry = timeEntry;
    
    const finalStartTime = startTime || currentEntry.start_time;
    const finalEndTime = endTime || currentEntry.end_time;
    // For employees, always use their own employee_id
    let finalEmployeeId;
    if (userRole === 'employee') {
      const empByEmail = await pool.query('SELECT id FROM employees WHERE email = $1 AND is_active = true', [userEmail]);
      finalEmployeeId = empByEmail.rows[0].id;
    } else {
      finalEmployeeId = employeeId || currentEntry.employee_id;
    }
    
    // Calculate new duration and cost
    const start = new Date(finalStartTime);
    const end = new Date(finalEndTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));
    
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Get employee hourly rate for cost calculation
    const employee = await pool.query('SELECT hourly_rate FROM employees WHERE id = $1', [finalEmployeeId]);
    const hourlyRate = employee.rows[0].hourly_rate || 0;
    const cost = (durationMinutes / 60) * hourlyRate;
    
    const result = await pool.query(
      'UPDATE time_entries SET project_id = COALESCE($1, project_id), employee_id = COALESCE($2, employee_id), start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time), duration_minutes = $5, cost = $6, description = COALESCE($7, description), updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [projectId, employeeId, startTime, endTime, durationMinutes, cost, description, id]
    );
    res.json({ timeEntry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/time-entries/:id - Soft delete time entry
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('UPDATE time_entries SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    res.json({ message: 'Time entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/time-entries/summary - Get time tracking summary
router.get('/summary/overview', async (req, res) => {
  try {
    const { startDate, endDate, projectId, employeeId } = req.query;
    
    let where = 'WHERE te.is_active = true';
    const params = [];
    
    if (startDate) {
      params.push(startDate);
      where += ` AND te.start_time >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      where += ` AND te.start_time <= $${params.length}`;
    }
    if (projectId) {
      params.push(projectId);
      where += ` AND te.project_id = $${params.length}`;
    }
    if (employeeId) {
      params.push(employeeId);
      where += ` AND te.employee_id = $${params.length}`;
    }
    
    const [totalHours, totalCost, entryCount, topEmployees, topProjects] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes FROM time_entries te ${where}`, params),
      pool.query(`SELECT COALESCE(SUM(cost), 0) as total_cost FROM time_entries te ${where}`, params),
      pool.query(`SELECT COUNT(*) as count FROM time_entries te ${where}`, params),
      pool.query(`SELECT e.first_name, e.last_name, e.employee_id, SUM(te.duration_minutes) as total_minutes, SUM(te.cost) as total_cost FROM time_entries te JOIN employees e ON te.employee_id = e.id ${where} GROUP BY e.id, e.first_name, e.last_name, e.employee_id ORDER BY total_minutes DESC LIMIT 5`, params),
      pool.query(`SELECT p.name, p.status, SUM(te.duration_minutes) as total_minutes, SUM(te.cost) as total_cost FROM time_entries te JOIN projects p ON te.project_id = p.id ${where} GROUP BY p.id, p.name, p.status ORDER BY total_minutes DESC LIMIT 5`, params)
    ]);
    
    res.json({
      summary: {
        totalHours: Math.round(parseInt(totalHours.rows[0].total_minutes) / 60 * 100) / 100,
        totalCost: parseFloat(totalCost.rows[0].total_cost),
        totalEntries: parseInt(entryCount.rows[0].count)
      },
      topEmployees: topEmployees.rows.map(emp => ({
        ...emp,
        totalHours: Math.round(parseInt(emp.total_minutes) / 60 * 100) / 100
      })),
      topProjects: topProjects.rows.map(proj => ({
        ...proj,
        totalHours: Math.round(parseInt(proj.total_minutes) / 60 * 100) / 100
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

