const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, requireRole, getDbPool } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(authenticateToken);

// Helper to check if user is from organization registry (real org user, not demo)
function isOrganizationUser(req) {
  return req.user && req.user.source === 'registry';
}

// GET /api/time-entries - List all time entries with filters
router.get('/', async (req, res) => {
  try {
    const db = getDbPool(req);
    const { taskId, employeeId, projectId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    
    const offset = (pageNum - 1) * limitNum;
    let where = 'WHERE 1=1';
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
      where += ` AND te.task_id IN (SELECT task_id FROM tasks WHERE project_id = $${params.length})`;
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
    
    const list = await db.query(
      `SELECT te.id, te.task_id, te.employee_id, te.work_date, te.start_time, te.end_time, te.duration_minutes, te.created_at, te.updated_at,
              te.original_start_time, te.original_end_time,
              t.task_name as task_title, t.status as task_status,
              p.project_name as project_name, p.status as project_status,
              u.first_name, u.last_name, u.user_id as emp_id
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.task_id
       JOIN projects p ON t.project_id = p.project_id
       JOIN users u ON te.employee_id = u.user_id
       ${where}
       ORDER BY te.work_date DESC, te.start_time DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, limitNum, offset]
    );
    
    // Build count query - always use same WHERE conditions and JOINs as main query
    const count = await db.query(
      `SELECT COUNT(*) as count 
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.task_id
       JOIN projects p ON t.project_id = p.project_id
       JOIN users u ON te.employee_id = u.user_id
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

// GET /api/time-entries/active - List active (running) time entries
router.get('/active', async (req, res) => {
  try {
    const db = getDbPool(req);

    const active = await db.query(
      `SELECT te.id,
              te.task_id,
              te.employee_id,
              te.work_date,
              te.start_time,
              p.project_name,
              u.first_name,
              u.last_name
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.task_id
       JOIN projects p ON t.project_id = p.project_id
       JOIN users u ON te.employee_id = u.user_id
       WHERE te.end_time IS NULL
       ORDER BY te.start_time DESC
       LIMIT 100`
    );

    res.json({ activeTimeEntries: active.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/time-entries/:id - Get specific time entry
router.get('/:id', async (req, res) => {
  try {
    const db = getDbPool(req);
    const { id } = req.params;
    const result = await db.query(
      `SELECT te.id, te.task_id, te.employee_id, te.work_date, te.start_time, te.end_time, te.duration_minutes, te.created_at, te.updated_at,
              te.original_start_time, te.original_end_time,
              t.task_name as task_title, t.status as task_status,
              p.project_name as project_name, p.status as project_status,
              u.first_name, u.last_name, u.user_id as emp_id
       FROM time_entries te
       JOIN tasks t ON te.task_id = t.task_id
       JOIN projects p ON t.project_id = p.project_id
       JOIN users u ON te.employee_id = u.user_id
       WHERE te.id = $1`,
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

// POST /api/time-entries/start - Start a running time entry (end_time remains NULL)
router.post('/start', [
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('employeeId').optional().isUUID().withMessage('Valid employee ID is required'),
  body('description').optional().isString().trim(),
], handleValidation, async (req, res) => {
  try {
    const db = getDbPool(req);
    const { projectId, employeeId } = req.body;
    const userRole = req.user?.role;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Determine employee ID
    let finalEmployeeId = employeeId;
    if (userRole === 'employee') {
      finalEmployeeId = req.user.id;
      if (employeeId && employeeId !== finalEmployeeId) {
        return res.status(403).json({ error: 'Employees can only start time for themselves' });
      }
    } else if (userRole === 'admin' || userRole === 'manager') {
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required' });
      }
      finalEmployeeId = employeeId;
    } else {
      return res.status(403).json({ error: 'Unauthorized to start time entries' });
    }

    // Ensure employee exists
    const userExists = await db.query('SELECT user_id FROM users WHERE user_id = $1 AND is_active = true', [finalEmployeeId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // Find a task for this project:
    // 1) prefer a task that includes this employee in assigned_to
    // 2) fallback to any task in the project
    const preferredTask = await db.query(
      `SELECT task_id
       FROM tasks
       WHERE project_id = $1
         AND assigned_to @> to_jsonb($2::uuid)
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId, finalEmployeeId]
    );

    const taskRow = preferredTask.rows[0]
      ? preferredTask
      : await db.query(
          `SELECT task_id
           FROM tasks
           WHERE project_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [projectId]
        );

    const taskId = taskRow.rows[0]?.task_id;
    if (!taskId) {
      return res.status(404).json({ error: 'No tasks found for the selected project' });
    }

    const now = new Date();
    const workDate = now.toISOString().split('T')[0];

    const result = await db.query(
      `INSERT INTO time_entries (task_id, employee_id, work_date, start_time, end_time, duration_minutes)
       VALUES ($1, $2, $3, $4, NULL, NULL)
       RETURNING *`,
      [taskId, finalEmployeeId, workDate, now.toISOString()]
    );

    res.status(201).json({ timeEntry: result.rows[0] });
  } catch (err) {
    console.error('Error starting time entry:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// POST /api/time-entries - Create new time entry
// Employees can create their own time entries, admins/managers can create for any employee
router.post('/', [
  // Backwards compatible:
  // - some calls send taskId
  // - your frontend calls send projectId
  body('taskId').optional().isUUID().withMessage('Valid task ID must be a UUID'),
  body('projectId').optional().isUUID().withMessage('Valid project ID must be a UUID'),
  body('employeeId').optional().isUUID().withMessage('Valid employee ID is required'),
  body('workDate').optional().custom((value) => {
    if (!value) return true;
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Valid work date is required');
    return true;
  }),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
], handleValidation, async (req, res) => {
  try {
    const db = getDbPool(req);
    const { taskId, projectId, employeeId, workDate, startTime, endTime } = req.body;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Determine task ID:
    // - If taskId provided, use it
    // - Else pick a task from the project (prefer assigned_to match)
    let finalTaskId = taskId;
    if (!finalTaskId) {
      if (!projectId) {
        return res.status(400).json({ error: 'taskId or projectId is required' });
      }

      const preferredTask = await db.query(
        `SELECT task_id
         FROM tasks
         WHERE project_id = $1
           AND assigned_to @> to_jsonb($2::uuid)
         ORDER BY created_at DESC
         LIMIT 1`,
        [projectId, employeeId || req.user.id]
      );

      const anyTask = preferredTask.rows[0]
        ? preferredTask
        : await db.query(
            `SELECT task_id
             FROM tasks
             WHERE project_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [projectId]
          );

      finalTaskId = anyTask.rows[0]?.task_id;
    }

    if (!finalTaskId) {
      return res.status(404).json({ error: 'No tasks found for provided project' });
    }
    
    // Determine the employee ID to use
    let finalEmployeeId = employeeId;
    
    // If employee role, they can only create entries for themselves
    if (userRole === 'employee') {
      // Find user by email
      if (userEmail) {
        const userByEmail = await db.query('SELECT user_id FROM users WHERE email_id = $1 AND is_active = true', [userEmail]);
        if (userByEmail.rows.length > 0) {
          finalEmployeeId = userByEmail.rows[0].user_id;
          // If employeeId was provided, verify it matches the logged-in user
          if (employeeId && employeeId !== finalEmployeeId) {
            return res.status(403).json({ error: 'Employees can only create time entries for themselves' });
          }
        } else {
          return res.status(404).json({ error: 'User record not found for your account' });
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
    
    // Verify user exists
    const userExists = await db.query('SELECT user_id FROM users WHERE user_id = $1 AND is_active = true', [finalEmployeeId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    
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
    
    // Validate required fields are present
    if (!finalTaskId || !finalEmployeeId || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          taskId: !!finalTaskId,
          employeeId: !!finalEmployeeId,
          workDate: !!workDate,
          startTime: !!startTime,
          endTime: !!endTime
        }
      });
    }
    
    // Ensure workDate is in the correct format for PostgreSQL DATE type.
    // If not provided, derive from startTime.
    let formattedWorkDate = workDate;
    if (!formattedWorkDate) {
      formattedWorkDate = startTime.includes('T') ? startTime.split('T')[0] : new Date(startTime).toISOString().split('T')[0];
    } else if (formattedWorkDate.includes('T')) {
      formattedWorkDate = formattedWorkDate.split('T')[0];
    } else if (formattedWorkDate.includes(' ')) {
      formattedWorkDate = formattedWorkDate.split(' ')[0];
    }
    
    // Insert time entry - PostgreSQL will automatically convert the string formats to the correct types
    let result;
    try {
      result = await db.query(
        `INSERT INTO time_entries (task_id, employee_id, work_date, start_time, end_time, duration_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [finalTaskId, finalEmployeeId, formattedWorkDate, startTime, endTime, durationMinutes]
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
      const taskInfo = await db.query(
        `SELECT t.task_name, t.project_id, p.project_name as project_name
         FROM tasks t
         JOIN projects p ON t.project_id = p.project_id
          WHERE t.task_id = $1`,
        [finalTaskId]
      );
      const employeeInfo = await db.query(
        `SELECT first_name, last_name FROM users WHERE user_id = $1`,
        [finalEmployeeId]
      );
      
      if (taskInfo.rows.length > 0 && employeeInfo.rows.length > 0) {
        const task = taskInfo.rows[0];
        const employee = employeeInfo.rows[0];
        const employeeName = `${employee.first_name} ${employee.last_name}`;
        const hours = (durationMinutes / 60).toFixed(1);
        const actorId = req.user?.id || null;
        const actorName = req.user?.first_name ? `${req.user.first_name} ${req.user.last_name}` : null;
        
        await db.query(
          `INSERT INTO activity_logs (action_type, actor_id, actor_name, employee_id, employee_name, project_id, project_name, task_id, task_title, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            'time_logged',
            actorId,
            actorName,
            finalEmployeeId,
            employeeName,
            task.project_id,
            task.project_name,
            taskId,
            task.task_name,
            `${employeeName} logged ${hours} hours on ${task.task_name}`
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

// PUT /api/time-entries/:id/stop - Stop a running time entry
router.put('/:id/stop', [
  body('description').optional().isString().trim(),
], handleValidation, async (req, res) => {
  try {
    const db = getDbPool(req);
    const { id } = req.params;
    const { description } = req.body;
    const userRole = req.user?.role;

    const exists = await db.query('SELECT * FROM time_entries WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const timeEntry = exists.rows[0];

    if (timeEntry.end_time) {
      return res.status(400).json({ error: 'Time entry is already stopped' });
    }

    // Permission check
    if (userRole === 'employee') {
      if (timeEntry.employee_id !== req.user.id) {
        return res.status(403).json({ error: 'Employees can only stop their own time entries' });
      }
    } else if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const start = new Date(timeEntry.start_time);
    const end = new Date();
    const durationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));

    const result = await db.query(
      `UPDATE time_entries
       SET end_time = $1,
           duration_minutes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [end.toISOString(), durationMinutes, id]
    );

    // Non-blocking activity log (optional)
    try {
      const actorId = req.user?.id || null;
      const actorName = req.user?.first_name ? `${req.user.first_name} ${req.user.last_name}` : null;

      await db.query(
        `INSERT INTO activity_logs (action_type, actor_id, actor_name, employee_id, employee_name, task_id, task_title, project_id, project_name, description)
         SELECT
           'time_stopped',
           $1, $2,
           te.employee_id,
           CONCAT(u.first_name, ' ', u.last_name),
           t.task_id,
           t.task_name,
           p.project_id,
           p.project_name,
           $4
         FROM time_entries te
         JOIN tasks t ON te.task_id = t.task_id
         JOIN projects p ON t.project_id = p.project_id
         JOIN users u ON te.employee_id = u.user_id
         WHERE te.id = $3`,
        [actorId, actorName, id, description || null]
      );
    } catch (e) {
      // ignore log errors
    }

    res.json({ timeEntry: result.rows[0] });
  } catch (err) {
    console.error('Error stopping time entry:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// PUT /api/time-entries/:id - Update time entry
router.put('/:id', [
  body('projectId').optional().isUUID().withMessage('Valid project ID required'),
  body('employeeId').optional().isUUID().withMessage('Valid employee ID required'),
  body('startTime').optional().isISO8601().withMessage('Valid start time required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time required'),
], handleValidation, async (req, res) => {
  try {
    const db = getDbPool(req);
    const { id } = req.params;
    const { projectId, employeeId, startTime, endTime } = req.body;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    // Check if time entry exists
    const exists = await db.query('SELECT * FROM time_entries WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    const timeEntry = exists.rows[0];
    
    // Permission check: Employees can only edit their own time entries
    if (userRole === 'employee') {
      // Find user by email
      if (userEmail) {
        const userByEmail = await db.query('SELECT user_id FROM users WHERE email_id = $1 AND is_active = true', [userEmail]);
        if (userByEmail.rows.length === 0) {
          return res.status(403).json({ error: 'User record not found for your account' });
        }
        const currentEmployeeId = userByEmail.rows[0].user_id;
        
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
      const projectExists = await db.query('SELECT project_id as id FROM projects WHERE project_id = $1', [projectId]);
      if (projectExists.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }
    
    // Verify user exists if being updated (only for admins/managers)
    if (employeeId && userRole !== 'employee') {
      const userExists = await db.query('SELECT user_id FROM users WHERE user_id = $1 AND is_active = true', [employeeId]);
      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or inactive' });
      }
    }
    
    // Get current values for calculation
    const currentEntry = timeEntry;
    
    const finalStartTime = startTime || currentEntry.start_time;
    const finalEndTime = endTime || currentEntry.end_time;
    // For employees, always use their own user_id
    let finalEmployeeId;
    if (userRole === 'employee') {
      const userByEmail = await db.query('SELECT user_id FROM users WHERE email_id = $1 AND is_active = true', [userEmail]);
      finalEmployeeId = userByEmail.rows[0].user_id;
    } else {
      finalEmployeeId = employeeId || currentEntry.employee_id;
    }
    
    // Calculate new duration
    const start = new Date(finalStartTime);
    const end = new Date(finalEndTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));
    
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Store original times if this is the first edit (original times not yet set)
    let originalStartTime = currentEntry.original_start_time;
    let originalEndTime = currentEntry.original_end_time;
    
    if (!originalStartTime && !originalEndTime && (startTime || endTime)) {
      // First time editing - save the original times
      originalStartTime = currentEntry.start_time;
      originalEndTime = currentEntry.end_time;
    }
    
    const result = await db.query(
      `UPDATE time_entries 
       SET employee_id = COALESCE($1, employee_id), 
           start_time = COALESCE($2, start_time), 
           end_time = COALESCE($3, end_time), 
           duration_minutes = $4, 
           original_start_time = COALESCE($5, original_start_time),
           original_end_time = COALESCE($6, original_end_time),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [employeeId, startTime, endTime, durationMinutes, originalStartTime, originalEndTime, id]
    );
    res.json({ timeEntry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/time-entries/:id - Delete time entry
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDbPool(req);
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM time_entries WHERE id = $1 RETURNING id', [id]);
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
    const db = getDbPool(req);
    const { startDate, endDate, projectId, employeeId } = req.query;
    
    let where = 'WHERE 1=1';
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
      where += ` AND te.task_id IN (SELECT task_id FROM tasks WHERE project_id = $${params.length})`;
    }
    if (employeeId) {
      params.push(employeeId);
      where += ` AND te.employee_id = $${params.length}`;
    }
    
    const [totalHours, totalCost, entryCount, topEmployees, topProjects] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes FROM time_entries te ${where}`, params),
      db.query(`SELECT 0 as total_cost`, []),
      db.query(`SELECT COUNT(*) as count FROM time_entries te ${where}`, params),
      db.query(`SELECT u.first_name, u.last_name, u.user_id, SUM(te.duration_minutes) as total_minutes FROM time_entries te JOIN users u ON te.employee_id = u.user_id ${where} GROUP BY u.user_id, u.first_name, u.last_name ORDER BY total_minutes DESC LIMIT 5`, params),
      db.query(`SELECT p.project_name, p.status, SUM(te.duration_minutes) as total_minutes FROM time_entries te JOIN tasks t ON te.task_id = t.task_id JOIN projects p ON t.project_id = p.project_id ${where} GROUP BY p.project_id, p.project_name, p.status ORDER BY total_minutes DESC LIMIT 5`, params)
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

