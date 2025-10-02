const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

/**
 * Get all users (without passwords)
 * GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const sql = `
      SELECT id, name, email, role, avatar_url, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const [users] = await pool.query(sql);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user by ID
 * GET /api/users/:id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT id, name, email, role, avatar_url, created_at, updated_at
      FROM users
      WHERE id = ?
    `;

    const [users] = await pool.query(sql, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 * Only admins can update users
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, avatar_url, password } = req.body;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Check if user exists
    const checkSql = 'SELECT id FROM users WHERE id = ?';
    const existingUser = await pool.query(checkSql, [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheckSql = 'SELECT id FROM users WHERE email = ? AND id != ?';
      const emailExists = await pool.query(emailCheckSql, [email, id]);

      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(password_hash);
    }

    updates.push('updated_at = NOW()');

    if (updates.length === 1) { // Only updated_at
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const updateSql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await pool.query(updateSql, values);

    // Fetch updated user
    const getUserSql = `
      SELECT id, name, email, role, avatar_url, created_at, updated_at
      FROM users
      WHERE id = ?
    `;
    const updatedUsers = await pool.query(getUserSql, [id]);
    const updatedUser = updatedUsers[0];

    // Broadcast to all clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', updatedUser);
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 * Only admins can delete users
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if requesting user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Prevent deleting yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const checkSql = 'SELECT id FROM users WHERE id = ?';
    const existingUser = await pool.query(checkSql, [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user (cascades to projects and tasks)
    const deleteSql = 'DELETE FROM users WHERE id = ?';
    await pool.query(deleteSql, [id]);

    // Broadcast to all clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('user:deleted', { id: parseInt(id) });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
