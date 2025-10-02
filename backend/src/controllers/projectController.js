const { pool } = require('../config/database');

/**
 * Get all projects with optional filters
 * GET /api/projects?status=in_progress&owner=3
 */
async function getAllProjects(req, res) {
  try {
    const { status, owner } = req.query;

    let query = `
      SELECT
        p.*,
        u.name as owner_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (owner) {
      query += ' AND p.owner_id = ?';
      params.push(owner);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [projects] = await pool.query(query, params);

    // Calculate progress percentage
    const projectsWithProgress = projects.map(p => ({
      ...p,
      progress: p.task_count > 0 ? Math.round((p.completed_tasks / p.task_count) * 100) : 0
    }));

    res.json({
      success: true,
      data: projectsWithProgress
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
}

/**
 * Get single project by ID with tasks
 * GET /api/projects/:id
 */
async function getProjectById(req, res) {
  try {
    const projectId = req.params.id;

    // Get project
    const [projects] = await pool.query(
      `SELECT
        p.*,
        u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?`,
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Get tasks for this project
    const [tasks] = await pool.query(
      `SELECT
        t.*,
        u.name as owner_name
      FROM tasks t
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.project_id = ?
      ORDER BY t.deadline ASC`,
      [projectId]
    );

    // Calculate progress
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        ...project,
        tasks,
        task_count: tasks.length,
        completed_tasks: completedTasks,
        progress
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
}

/**
 * Create new project
 * POST /api/projects
 */
async function createProject(req, res) {
  try {
    const { name, description, start_date, end_date, owner_id, status = 'open', color = '#667eea' } = req.body;

    // Validation
    if (!name || !start_date || !end_date || !owner_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, start_date, end_date, and owner_id are required'
      });
    }

    // Insert project
    const [result] = await pool.query(
      `INSERT INTO projects (name, description, start_date, end_date, owner_id, status, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, start_date, end_date, owner_id, status, color]
    );

    // Get created project
    const [projects] = await pool.query(
      `SELECT
        p.*,
        u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: projects[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
}

/**
 * Update project
 * PUT /api/projects/:id
 */
async function updateProject(req, res) {
  try {
    const projectId = req.params.id;
    const { name, description, start_date, end_date, owner_id, status, color } = req.body;

    // Check if project exists
    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
    if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }
    if (owner_id !== undefined) { updates.push('owner_id = ?'); params.push(owner_id); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(projectId);

    await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated project
    const [projects] = await pool.query(
      `SELECT
        p.*,
        u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?`,
      [projectId]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: projects[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
}

/**
 * Delete project
 * DELETE /api/projects/:id
 */
async function deleteProject(req, res) {
  try {
    const projectId = req.params.id;

    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
}

/**
 * Get calendar events (projects + tasks in FullCalendar format)
 * GET /api/calendar/events
 */
async function getCalendarEvents(req, res) {
  try {
    const events = [];

    // Get all projects
    const [projects] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.start_date,
        p.end_date,
        p.color,
        p.status,
        u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.start_date ASC`
    );

    // Add projects as events
    projects.forEach(project => {
      events.push({
        id: `project-${project.id}`,
        title: `📁 ${project.name}`,
        start: project.start_date,
        end: project.end_date,
        backgroundColor: project.color || '#667eea',
        borderColor: project.color || '#667eea',
        extendedProps: {
          type: 'project',
          projectId: project.id,
          status: project.status,
          owner: project.owner_name
        }
      });
    });

    // Get all tasks
    const [tasks] = await pool.query(
      `SELECT
        t.id,
        t.name,
        t.start_date,
        t.deadline,
        t.status,
        t.priority,
        p.name as project_name,
        p.color as project_color,
        u.name as owner_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.owner_id = u.id
      ORDER BY t.deadline ASC`
    );

    // Add tasks as events
    tasks.forEach(task => {
      // Determine task color based on priority
      let taskColor = task.project_color || '#667eea';
      if (task.priority === 'high') {
        taskColor = '#ef4444'; // Red
      } else if (task.priority === 'medium') {
        taskColor = '#f59e0b'; // Orange
      } else if (task.priority === 'low') {
        taskColor = '#10b981'; // Green
      }

      // Task icon based on status
      let icon = '📋';
      if (task.status === 'completed') icon = '✅';
      else if (task.status === 'in_progress') icon = '🔄';

      events.push({
        id: `task-${task.id}`,
        title: `${icon} ${task.name}`,
        start: task.start_date || task.deadline,
        end: task.deadline,
        backgroundColor: taskColor,
        borderColor: taskColor,
        extendedProps: {
          type: 'task',
          taskId: task.id,
          projectName: task.project_name,
          status: task.status,
          priority: task.priority,
          owner: task.owner_name
        }
      });
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events'
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCalendarEvents
};
