const { pool } = require('../config/database');
const emailService = require('../services/emailService');

/**
 * Get all tasks with optional filters
 * GET /api/tasks?project_id=5&status=open&priority=high
 */
async function getAllTasks(req, res) {
  try {
    const { project_id, status, priority } = req.query;

    let query = `
      SELECT
        t.*,
        u.name as owner_name,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY t.deadline ASC, t.priority DESC';

    const [tasks] = await pool.query(query, params);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
}

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
async function getTaskById(req, res) {
  try {
    const taskId = req.params.id;

    const [tasks] = await pool.query(
      `SELECT
        t.*,
        u.name as owner_name,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?`,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: tasks[0]
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
}

/**
 * Create new task
 * POST /api/tasks
 */
async function createTask(req, res) {
  try {
    const { project_id, name, description, start_date, deadline, owner_id, status = 'open', priority = 'medium' } = req.body;

    // Validation
    if (!project_id || !name || !deadline || !owner_id) {
      return res.status(400).json({
        success: false,
        message: 'project_id, name, deadline, and owner_id are required'
      });
    }

    // Check if project exists
    const [projects] = await pool.query('SELECT id FROM projects WHERE id = ?', [project_id]);

    if (projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Insert task
    const [result] = await pool.query(
      `INSERT INTO tasks (project_id, name, description, start_date, deadline, owner_id, status, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, name, description, start_date, deadline, owner_id, status, priority]
    );

    // Get created task
    const [tasks] = await pool.query(
      `SELECT
        t.*,
        u.name as owner_name,
        u.email as owner_email,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?`,
      [result.insertId]
    );

    const task = tasks[0];

    // Send email notification (async, don't wait)
    if (task.owner_email) {
      emailService.sendTaskAssignment(task, { email: task.owner_email, name: task.owner_name })
        .catch(err => console.error('Email send error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
}

/**
 * Update task
 * PUT /api/tasks/:id
 */
async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const { name, description, start_date, deadline, owner_id, status, priority } = req.body;

    // Check if task exists and get old status for email notification
    const [existing] = await pool.query('SELECT id, status FROM tasks WHERE id = ?', [taskId]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldStatus = existing[0].status;
    const statusChanged = status !== undefined && status !== oldStatus;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
    if (deadline !== undefined) { updates.push('deadline = ?'); params.push(deadline); }
    if (owner_id !== undefined) { updates.push('owner_id = ?'); params.push(owner_id); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(taskId);

    await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated task
    const [tasks] = await pool.query(
      `SELECT
        t.*,
        u.name as owner_name,
        u.email as owner_email,
        p.name as project_name,
        p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?`,
      [taskId]
    );

    const task = tasks[0];

    // Send email notification if status changed
    if (statusChanged && task.owner_email) {
      emailService.sendTaskStatusChange(task, { email: task.owner_email, name: task.owner_name }, oldStatus, status)
        .catch(err => console.error('Email send error:', err));
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
}

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
async function deleteTask(req, res) {
  try {
    const taskId = req.params.id;

    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
