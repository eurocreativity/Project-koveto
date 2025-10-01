/**
 * Socket.IO event handlers for real-time project/task updates
 */

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins a room (optional: for project-specific updates)
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.id} joined project room: ${projectId}`);
    });

    // User leaves a room
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.id} left project room: ${projectId}`);
    });

    // Broadcast project updates (triggered by REST API after DB update)
    socket.on('project:updated', (project) => {
      io.emit('project:updated', project);
    });

    socket.on('project:created', (project) => {
      io.emit('project:created', project);
    });

    socket.on('project:deleted', (projectId) => {
      io.emit('project:deleted', { id: projectId });
    });

    // Broadcast task updates
    socket.on('task:updated', (task) => {
      io.emit('task:updated', task);
      // Also emit to specific project room
      io.to(`project:${task.project_id}`).emit('task:updated', task);
    });

    socket.on('task:created', (task) => {
      io.emit('task:created', task);
      io.to(`project:${task.project_id}`).emit('task:created', task);
    });

    socket.on('task:deleted', (data) => {
      io.emit('task:deleted', data);
      io.to(`project:${data.project_id}`).emit('task:deleted', data);
    });

    // User online/offline status
    socket.on('user:online', (userId) => {
      io.emit('user:online', { userId, socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      io.emit('user:offline', { socketId: socket.id });
    });
  });
}

/**
 * Emit events from REST API controllers
 * Usage: emitProjectUpdate(io, project)
 */
function emitProjectUpdate(io, project) {
  io.emit('project:updated', project);
}

function emitProjectCreate(io, project) {
  io.emit('project:created', project);
}

function emitProjectDelete(io, projectId) {
  io.emit('project:deleted', { id: projectId });
}

function emitTaskUpdate(io, task) {
  io.emit('task:updated', task);
}

function emitTaskCreate(io, task) {
  io.emit('task:created', task);
}

function emitTaskDelete(io, taskId, projectId) {
  io.emit('task:deleted', { id: taskId, project_id: projectId });
}

module.exports = {
  setupSocketHandlers,
  emitProjectUpdate,
  emitProjectCreate,
  emitProjectDelete,
  emitTaskUpdate,
  emitTaskCreate,
  emitTaskDelete
};
