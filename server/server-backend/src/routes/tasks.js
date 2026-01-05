const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();
router.use(authenticateToken);

// Helper to check if user is from organization registry (real org user, not demo)
function isOrganizationUser(req) {
  return req.user && req.user.source === 'registry';
}

// GET /api/tasks - Get all tasks with employee and project information
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, status = '', projectId = '', assignedTo = '' } = req.query;
    const offset = (page - 1) * limit;

    // Real organization users see empty tasks list (no dummy data)
    if (isOrganizationUser(req)) {
      return res.json({
        tasks: [],
        total: 0,
        page: Number(page),
        limit: Number(limit)
      });
    }

    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status.toLowerCase());
      where += ` AND LOWER(t.status) = $${params.length}`;
    }

    if (projectId) {
      params.push(projectId);
      where += ` AND t.project_id = $${params.length}`;
    }

    if (assignedTo) {
      params.push(assignedTo);
      where += ` AND t.assigned_to = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, t.created_at, t.updated_at,
              t.approved, t.approved_at, t.approval_notes,
              p.name as project_name, p.status as project_status,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', e.id,
                    'first_name', e.first_name,
                    'last_name', e.last_name,
                    'email', e.email,
                    'department', e.department
                  )
                ) FILTER (WHERE e.id IS NOT NULL),
                '[]'
              ) as assigned_employees
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN employees e ON ta.employee_id = e.id
       ${where}
       GROUP BY t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, t.created_at, t.updated_at,
                t.approved, t.approved_at, t.approval_notes, p.name, p.status
       ORDER BY t.due_date ASC, t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const count = await pool.query(`SELECT COUNT(*) as count FROM tasks t ${where}`, params);

    res.json({
      tasks: result.rows,
      total: parseInt(count.rows[0].count),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    console.error('Error fetching all tasks:', err);
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

// GET /api/projects/:id/tasks - list tasks for a project
router.get('/project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    const project = await pool.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const list = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, t.created_at, t.updated_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', e.id,
                    'first_name', e.first_name,
                    'last_name', e.last_name,
                    'email', e.email,
                    'department', e.department
                  )
                ) FILTER (WHERE e.id IS NOT NULL),
                '[]'
              ) as assigned_employees
       FROM tasks t
       LEFT JOIN task_assignments ta ON t.id = ta.task_id
       LEFT JOIN employees e ON ta.employee_id = e.id
       WHERE t.project_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [id]
    );
    const count = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE project_id = $1', [id]);
    res.json({ tasks: list.rows, total: parseInt(count.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/tasks - create a task
router.post('/project/:id', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'overdue']),
  body('assignedTo').optional().isUUID(),
  body('dueDate').optional().isISO8601(),
], handleValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status = 'todo', assignedTo = null, dueDate = null } = req.body;
    const project = await pool.query('SELECT id FROM projects WHERE id = $1', [id]);
    if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, status, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, project_id, title, status, assigned_to, due_date, created_at, updated_at`,
      [id, title, status, assignedTo, dueDate]
    );
    // Log activity: task_created (by manager)
    try {
      const actorId = req.user?.id || null;
      const actorName = req.user?.first_name ? `${req.user.first_name} ${req.user.last_name}` : null;
      await pool.query(
        `INSERT INTO activity_logs (type, actor_id, actor_name, employee_id, employee_name, project_id, project_name, task_id, task_title, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          'task_created',
          actorId,
          actorName,
          assignedTo,
          null,
          id,
          null,
          result.rows[0].id,
          title,
          `Task created and assigned to employee.`
        ]
      );
    } catch (e) { /* ignore logging errors */ }
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/employee/:employeeId - get tasks assigned to an employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 100, status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Find employee by ID or by email (for users table compatibility)
    let finalEmployeeId = employeeId;
    const employeeCheck = await pool.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
    
    if (employeeCheck.rows.length === 0) {
      // If not found by ID, try to find by email using the logged-in user's email
      if (req.user && req.user.email) {
        const empByEmail = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
        if (empByEmail.rows.length > 0) {
          finalEmployeeId = empByEmail.rows[0].id;
          console.log(`✅ Found employee by email for tasks: ${req.user.email} -> ${finalEmployeeId}`);
        } else {
          return res.status(404).json({ error: 'Employee not found' });
        }
      } else {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    let where = 'WHERE ta.employee_id = $1';
    const params = [finalEmployeeId];
    
    if (status) {
      params.push(status.toLowerCase());
      where += ` AND LOWER(t.status) = $${params.length}`;
    }

    // Use task_assignments junction table instead of tasks.assigned_to
    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.due_date, t.created_at, t.updated_at,
              p.name as project_name, p.status as project_status, p.location,
              json_agg(json_build_object(
                'id', e.id,
                'first_name', e.first_name,
                'last_name', e.last_name,
                'email', e.email,
                'department', e.department
              ) ORDER BY e.first_name) FILTER (WHERE e.id IS NOT NULL) as assigned_employees
       FROM tasks t
       JOIN task_assignments ta ON t.id = ta.task_id
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN task_assignments all_ta ON t.id = all_ta.task_id
       LEFT JOIN employees e ON all_ta.employee_id = e.id
       ${where}
       GROUP BY t.id, t.project_id, t.title, t.status, t.due_date, t.created_at, t.updated_at,
                p.name, p.status, p.location
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) as count 
       FROM (
         SELECT t.id
         FROM tasks t
         JOIN task_assignments ta ON t.id = ta.task_id
         ${where}
         GROUP BY t.id
       ) as task_count`, 
      params
    );
    
    console.log(`✅ Found ${result.rows.length} tasks for employee ${finalEmployeeId}`);
    
    res.json({ 
      tasks: result.rows, 
      total: parseInt(count.rows[0].count), 
      page: Number(page), 
      limit: Number(limit) 
    });
  } catch (err) {
    console.error('Error fetching employee tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:taskId - update task fields
router.patch('/:taskId', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'overdue']),
  body('assignedTo').optional().isUUID(),
  body('dueDate').optional().isISO8601(),
], handleValidation, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, status, assignedTo, dueDate } = req.body;
    const exists = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (exists.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           status = COALESCE($2, status),
           assigned_to = COALESCE($3, assigned_to),
           due_date = COALESCE($4, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, project_id, title, status, assigned_to, due_date, created_at, updated_at`,
      [title, status, assignedTo, dueDate, taskId]
    );
    // Log activity: task_assigned (if assignedTo changed)
    if (assignedTo) {
      try {
        const actorId = req.user?.id || null;
        const actorName = req.user?.first_name ? `${req.user.first_name} ${req.user.last_name}` : null;
        await pool.query(
          `INSERT INTO activity_logs (type, actor_id, actor_name, employee_id, employee_name, project_id, project_name, task_id, task_title, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            'task_assigned',
            actorId,
            actorName,
            assignedTo,
            null,
            result.rows[0].project_id,
            null,
            result.rows[0].id,
            result.rows[0].title,
            `Task assigned to employee.`
          ]
        );
      } catch (e) { /* ignore logging errors */ }
    }
    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id/assign - Assign a task to a team member
router.patch('/:id/assign', [
  body('assignedTo').isUUID().withMessage('Valid employee ID is required'),
], handleValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    
    // Check if task exists
    const taskExists = await pool.query('SELECT id, project_id FROM tasks WHERE id = $1', [id]);
    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if employee exists
    const employeeExists = await pool.query('SELECT id, first_name, last_name FROM employees WHERE id = $1', [assignedTo]);
    if (employeeExists.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update the task assignment
    const result = await pool.query(
      `UPDATE tasks SET assigned_to = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, project_id, title, status, assigned_to, due_date, created_at, updated_at`,
      [assignedTo, id]
    );

    const employee = employeeExists.rows[0];
    res.json({ 
      task: result.rows[0],
      assignedTo: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        name: `${employee.first_name} ${employee.last_name}`
      }
    });
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:taskId/approve - Approve a completed task
router.put('/:taskId/approve', [
  body('approved').isBoolean().withMessage('Approved status is required'),
  body('approvalNotes').optional().isString().trim(),
], handleValidation, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { approved, approvalNotes } = req.body;
    const approverId = req.user.id;

    // Check if task exists and get current status
    const taskQuery = `
      SELECT t.id, t.title, t.status, t.assigned_to, 
             e.first_name, e.last_name, p.name as project_name
      FROM tasks t
      JOIN employees e ON t.assigned_to = e.id
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Only allow approval of completed tasks
    if (task.status !== 'done') {
      return res.status(400).json({ 
        error: 'Only completed tasks can be approved',
        currentStatus: task.status
      });
    }

    // Update task approval status
    const updateQuery = `
      UPDATE tasks 
      SET approved = $1, 
          approved_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
          approval_notes = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, title, status, approved, approved_at, approval_notes, updated_at
    `;

    const result = await pool.query(updateQuery, [
      approved, 
      approvalNotes, 
      taskId
    ]);

    res.json({
      success: true,
      task: result.rows[0],
      message: approved ? 'Task approved successfully' : 'Task approval removed'
    });

  } catch (err) {
    console.error('Error approving task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/pending-approval - Get tasks pending approval
router.get('/pending-approval', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, 
             t.created_at, t.updated_at, t.approved, t.approved_at, t.approval_notes,
             p.name as project_name, p.status as project_status,
             e.first_name, e.last_name, e.email as employee_email
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.status = 'done' AND t.approved = false
      ORDER BY t.updated_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks 
      WHERE status = 'done' AND approved = false
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    res.json({
      tasks: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error('Error fetching pending approval tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/approved - Get approved tasks
router.get('/approved', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, 
             t.created_at, t.updated_at, t.approved, t.approved_at, t.approval_notes,
             p.name as project_name, p.status as project_status,
             e.first_name, e.last_name, e.email as employee_email
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN employees e ON t.assigned_to = e.id
      WHERE t.status = 'done' AND t.approved = true
      ORDER BY t.approved_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks 
      WHERE status = 'done' AND approved = true
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    res.json({
      tasks: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: Number(page),
      limit: Number(limit)
    });

  } catch (err) {
    console.error('Error fetching approved tasks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - Get a specific task by ID (must be last due to wildcard)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get task details
    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.status, t.assigned_to, t.due_date, 
              t.created_at, t.updated_at, t.approved, t.approved_at, t.approval_notes,
              p.name as project_name, p.status as project_status, p.location,
              c.name as client_name,
              COALESCE(e.first_name, '') as first_name, 
              COALESCE(e.last_name, '') as last_name, 
              COALESCE(e.email, '') as employee_email,
              COALESCE(e.department, '') as department
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN employees e ON t.assigned_to = e.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get total time and total cost from time entries
    const timeStats = await pool.query(
      `SELECT 
         COALESCE(SUM(te.duration_minutes), 0) as total_time_minutes,
         COALESCE(SUM(te.cost), 0) as total_cost
       FROM time_entries te
       WHERE te.task_id = $1 AND te.is_active = true`,
      [id]
    );
    
    const task = result.rows[0];
    const stats = timeStats.rows[0];
    
    // Add total time and total cost to task object
    task.total_time_minutes = parseInt(stats.total_time_minutes) || 0;
    task.total_cost = parseFloat(stats.total_cost) || 0;
    
    res.json({ task });
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


