const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/dashboard/overview - Get dashboard overview
// GET /api/dashboard/overview - Get dashboard overview and recent activity
router.get('/overview', async (req, res) => {
  try {
    const [clients, activeProjects, completedProjects, pendingProjects, onHoldProjects, cancelledProjects, activeEmployees, totalTimeEntries] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM clients'),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'on_hold'"),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'cancelled'"),
      pool.query('SELECT COUNT(*) as count FROM employees WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM time_entries WHERE is_active = true'),
    ]);

    // Fetch recent activities (task_created, task_assigned, time_logged)
    const recentActivities = await pool.query(
      `SELECT id, type, actor_id, actor_name, employee_id, employee_name, project_id, project_name, task_id, task_title, description, created_at
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT 10`
    );

    res.json({
      overview: {
        totalClients: parseInt(clients.rows[0].count),
        activeClients: parseInt(clients.rows[0].count),
        totalProjects: parseInt(activeProjects.rows[0].count) + parseInt(completedProjects.rows[0].count) + parseInt(pendingProjects.rows[0].count) + parseInt(onHoldProjects.rows[0].count) + parseInt(cancelledProjects.rows[0].count),
        activeProjects: parseInt(activeProjects.rows[0].count),
        completedProjects: parseInt(completedProjects.rows[0].count),
        pendingProjects: parseInt(pendingProjects.rows[0].count),
        onHoldProjects: parseInt(onHoldProjects.rows[0].count),
        cancelledProjects: parseInt(cancelledProjects.rows[0].count),
        totalActiveEmployees: parseInt(activeEmployees.rows[0].count),
        totalTimeEntries: parseInt(totalTimeEntries.rows[0].count),
        totalCost: 0,
      },
      recentActivity: recentActivities.rows,
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /api/dashboard/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = `AND te.start_time >= $${params.length - 1} AND te.start_time <= $${params.length}`;
    } else {
      // Default to last 30 days
      params.push(`NOW() - INTERVAL '${period} days'`);
      dateFilter = `AND te.start_time >= $${params.length}`;
    }

    const [
      timeByProject,
      timeByEmployee,
      costByProject,
      costByEmployee,
      dailyTimeEntries,
      projectStatusDistribution,
      employeePerformance
    ] = await Promise.all([
      // Time by project
      pool.query(`
        SELECT p.name, p.status, SUM(te.duration_minutes) as total_minutes, COUNT(te.id) as entry_count
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN projects p ON t.project_id = p.id
        WHERE te.is_active = true ${dateFilter}
        GROUP BY p.id, p.name, p.status
        ORDER BY total_minutes DESC
        LIMIT 10
      `, params),
      
      // Time by employee
      pool.query(`
        SELECT e.first_name, e.last_name, e.employee_id, SUM(te.duration_minutes) as total_minutes, COUNT(te.id) as entry_count
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.is_active = true ${dateFilter}
        GROUP BY e.id, e.first_name, e.last_name, e.employee_id
        ORDER BY total_minutes DESC
        LIMIT 10
      `, params),
      
      // Cost by project (removed as cost column doesn't exist)
      pool.query(`
        SELECT p.name, p.status, 0 as total_cost, COUNT(te.id) as entry_count
        FROM time_entries te
        JOIN tasks t ON te.task_id = t.id
        JOIN projects p ON t.project_id = p.id
        WHERE te.is_active = true ${dateFilter}
        GROUP BY p.id, p.name, p.status
        ORDER BY entry_count DESC
        LIMIT 10
      `, params),
      
      // Cost by employee (removed as cost column doesn't exist)
      pool.query(`
        SELECT e.first_name, e.last_name, e.employee_id, 0 as total_cost, COUNT(te.id) as entry_count
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.is_active = true ${dateFilter}
        GROUP BY e.id, e.first_name, e.last_name, e.employee_id
        ORDER BY entry_count DESC
        LIMIT 10
      `, params),
      
      // Daily time entries
      pool.query(`
        SELECT DATE(te.start_time) as date, SUM(te.duration_minutes) as total_minutes, COUNT(te.id) as entry_count
        FROM time_entries te
        WHERE te.is_active = true ${dateFilter}
        GROUP BY DATE(te.start_time)
        ORDER BY date DESC
        LIMIT 30
      `, params),
      
      // Project status distribution
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM projects
        GROUP BY status
        ORDER BY count DESC
      `),
      
      // Employee performance (hours per day)
      pool.query(`
        SELECT e.first_name, e.last_name, e.employee_id, 
               ROUND(AVG(te.duration_minutes) / 60, 2) as avg_hours_per_day,
               COUNT(DISTINCT DATE(te.start_time)) as days_worked
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE te.is_active = true ${dateFilter}
        GROUP BY e.id, e.first_name, e.last_name, e.employee_id
        HAVING COUNT(DISTINCT DATE(te.start_time)) > 0
        ORDER BY avg_hours_per_day DESC
        LIMIT 10
      `, params)
    ]);

    res.json({
      timeByProject: timeByProject.rows.map(p => ({
        ...p,
        totalHours: Math.round(parseInt(p.total_minutes) / 60 * 100) / 100
      })),
      timeByEmployee: timeByEmployee.rows.map(e => ({
        ...e,
        totalHours: Math.round(parseInt(e.total_minutes) / 60 * 100) / 100
      })),
      costByProject: costByProject.rows.map(p => ({
        ...p,
        totalCost: parseFloat(p.total_cost)
      })),
      costByEmployee: costByEmployee.rows.map(e => ({
        ...e,
        totalCost: parseFloat(e.total_cost)
      })),
      dailyTimeEntries: dailyTimeEntries.rows.map(d => ({
        ...d,
        totalHours: Math.round(parseInt(d.total_minutes) / 60 * 100) / 100
      })),
      projectStatusDistribution: projectStatusDistribution.rows,
      employeePerformance: employeePerformance.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/reports - Get various reports
router.get('/reports', async (req, res) => {
  try {
    const { type = 'summary', startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = `AND te.start_time >= $${params.length - 1} AND te.start_time <= $${params.length}`;
    }

    switch (type) {
      case 'summary':
        const [totalStats, projectStats, employeeStats] = await Promise.all([
          pool.query(`
            SELECT 
              COUNT(DISTINCT t.project_id) as projects_worked,
              COUNT(DISTINCT te.employee_id) as employees_worked,
              SUM(te.duration_minutes) as total_minutes,
              0 as total_cost,
              COUNT(te.id) as total_entries
            FROM time_entries te
            JOIN tasks t ON te.task_id = t.id
            WHERE te.is_active = true ${dateFilter}
          `, params),
          
          pool.query(`
            SELECT p.name, p.status, p.budget,
                   SUM(te.duration_minutes) as total_minutes,
                   0 as total_cost,
                   COUNT(te.id) as entry_count
            FROM projects p
            LEFT JOIN tasks t ON p.id = t.project_id
            LEFT JOIN time_entries te ON t.id = te.task_id AND te.is_active = true ${dateFilter}
            GROUP BY p.id, p.name, p.status, p.budget
            ORDER BY total_minutes DESC
          `, params),
          
          pool.query(`
            SELECT e.first_name, e.last_name, e.employee_id, e.department,
                   SUM(te.duration_minutes) as total_minutes,
                   0 as total_cost,
                   COUNT(te.id) as entry_count
            FROM employees e
            LEFT JOIN time_entries te ON e.id = te.employee_id AND te.is_active = true ${dateFilter}
            WHERE e.is_active = true
            GROUP BY e.id, e.first_name, e.last_name, e.employee_id, e.department
            ORDER BY total_minutes DESC
          `, params)
        ]);
        
        res.json({
          totalStats: {
            ...totalStats.rows[0],
            totalHours: Math.round(parseInt(totalStats.rows[0].total_minutes) / 60 * 100) / 100,
            totalCost: parseFloat(totalStats.rows[0].total_cost)
          },
          projectStats: projectStats.rows.map(p => ({
            ...p,
            totalHours: Math.round(parseInt(p.total_minutes) / 60 * 100) / 100,
            totalCost: parseFloat(p.total_cost)
          })),
          employeeStats: employeeStats.rows.map(e => ({
            ...e,
            totalHours: Math.round(parseInt(e.total_minutes) / 60 * 100) / 100,
            totalCost: parseFloat(e.total_cost)
          }))
        });
        break;
        
      case 'overdue':
        const overdueProjects = await pool.query(`
          SELECT p.id, p.name, p.end_date, p.status,
                 c.name as client_name,
                 SUM(te.duration_minutes) as total_minutes,
                 0 as total_cost
          FROM projects p
          JOIN clients c ON p.client_id = c.id
          LEFT JOIN tasks t ON p.id = t.project_id
          LEFT JOIN time_entries te ON t.id = te.task_id AND te.is_active = true
          WHERE p.end_date < CURRENT_DATE AND p.status NOT IN ('completed', 'cancelled')
          GROUP BY p.id, p.name, p.end_date, p.status, c.name
          ORDER BY p.end_date ASC
        `);
        
        res.json({
          overdueProjects: overdueProjects.rows.map(p => ({
            ...p,
            totalHours: Math.round(parseInt(p.total_minutes) / 60 * 100) / 100,
            totalCost: parseFloat(p.total_cost),
            daysOverdue: Math.ceil((new Date() - new Date(p.end_date)) / (1000 * 60 * 60 * 24))
          }))
        });
        break;
        
      default:
        res.status(400).json({ error: 'Invalid report type' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/activity/task/:taskId - Get activity logs for a specific task
router.get('/activity/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 20 } = req.query;
    
    const activities = await pool.query(
      `SELECT id, type, actor_id, actor_name, employee_id, employee_name, project_id, project_name, task_id, task_title, description, created_at
       FROM activity_logs
       WHERE task_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [taskId, limit]
    );
    
    res.json({ activities: activities.rows });
  } catch (err) {
    console.error('Error fetching task activity logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

