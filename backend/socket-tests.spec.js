/**
 * Playwright Socket.IO Tests for Real-time Events
 * Tests WebSocket connections and real-time broadcasts
 */

const { test, expect } = require('@playwright/test');
const io = require('socket.io-client');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

let authToken = '';
let socket1, socket2;

test.describe('Socket.IO Real-time Tests', () => {

  // Login to get auth token
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'janos@example.com',
        password: 'password123'
      }
    });

    const data = await response.json();
    authToken = data.data.token;
    console.log('✅ Authenticated for Socket.IO tests');
  });

  // ========== SOCKET CONNECTION ==========
  test('Should establish Socket.IO connection', async () => {
    return new Promise((resolve, reject) => {
      socket1 = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      socket1.on('connect', () => {
        console.log(`✅ Socket 1 connected: ${socket1.id}`);
        expect(socket1.connected).toBe(true);
        resolve();
      });

      socket1.on('connect_error', (error) => {
        reject(new Error(`Socket connection failed: ${error.message}`));
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!socket1.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 5000);
    });
  });

  test('Should connect multiple sockets simultaneously', async () => {
    return new Promise((resolve, reject) => {
      socket2 = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      socket2.on('connect', () => {
        console.log(`✅ Socket 2 connected: ${socket2.id}`);
        expect(socket2.connected).toBe(true);
        expect(socket1.id).not.toBe(socket2.id); // Different socket IDs
        resolve();
      });

      socket2.on('connect_error', (error) => {
        reject(new Error(`Socket 2 connection failed: ${error.message}`));
      });

      setTimeout(() => {
        if (!socket2.connected) {
          reject(new Error('Socket 2 connection timeout'));
        }
      }, 5000);
    });
  });

  // ========== REAL-TIME PROJECT EVENTS ==========
  test('Should broadcast project creation to all connected clients', async ({ request }) => {
    const eventReceived = new Promise((resolve) => {
      socket2.once('project:created', (data) => {
        console.log('📢 Socket 2 received project:created:', data.name);
        expect(data.name).toBe('Real-time Test Project');
        expect(data.color).toBe('#00ff00');
        resolve(data);
      });
    });

    // Create project via API (socket1 triggers the event)
    const response = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Real-time Test Project',
        description: 'Testing Socket.IO broadcast',
        start_date: '2025-04-01',
        end_date: '2025-06-30',
        owner_id: 2,
        status: 'open',
        color: '#00ff00'
      }
    });

    expect(response.status()).toBe(201);
    const projectData = await response.json();
    const testProjectId = projectData.data.id;

    // Wait for Socket.IO event
    const receivedData = await eventReceived;
    expect(receivedData.id).toBe(testProjectId);

    return testProjectId;
  });

  test('Should broadcast project update to all clients', async ({ request }) => {
    // First create a project
    const createResponse = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Update Test Project',
        description: 'To be updated',
        start_date: '2025-05-01',
        end_date: '2025-07-31',
        owner_id: 2,
        color: '#0000ff'
      }
    });

    const project = (await createResponse.json()).data;

    const eventReceived = new Promise((resolve) => {
      socket2.once('project:updated', (data) => {
        console.log('📢 Socket 2 received project:updated:', data.name);
        expect(data.status).toBe('in_progress');
        expect(data.description).toBe('Updated via real-time test');
        resolve(data);
      });
    });

    // Update project via API
    const updateResponse = await request.put(`${API_URL}/projects/${project.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        status: 'in_progress',
        description: 'Updated via real-time test'
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // Wait for Socket.IO event
    const receivedData = await eventReceived;
    expect(receivedData.id).toBe(project.id);
  });

  test('Should broadcast project deletion', async ({ request }) => {
    // Create project to delete
    const createResponse = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Project to Delete',
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        owner_id: 2
      }
    });

    const project = (await createResponse.json()).data;

    const eventReceived = new Promise((resolve) => {
      socket2.once('project:deleted', (data) => {
        console.log('📢 Socket 2 received project:deleted, ID:', data.id);
        expect(data.id).toBe(project.id);
        resolve(data);
      });
    });

    // Delete project via API
    const deleteResponse = await request.delete(`${API_URL}/projects/${project.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.ok()).toBeTruthy();

    // Wait for Socket.IO event
    await eventReceived;
  });

  // ========== REAL-TIME TASK EVENTS ==========
  test('Should broadcast task creation to all clients', async ({ request }) => {
    // Create a project first
    const projectResponse = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Task Test Project',
        start_date: '2025-03-01',
        end_date: '2025-05-31',
        owner_id: 2
      }
    });

    const project = (await projectResponse.json()).data;

    const eventReceived = new Promise((resolve) => {
      socket2.once('task:created', (data) => {
        console.log('📢 Socket 2 received task:created:', data.name);
        expect(data.name).toBe('Real-time Task');
        expect(data.priority).toBe('high');
        expect(data.project_id).toBe(project.id);
        resolve(data);
      });
    });

    // Create task via API
    const taskResponse = await request.post(`${API_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        project_id: project.id,
        name: 'Real-time Task',
        description: 'Testing task broadcast',
        deadline: '2025-04-15',
        owner_id: 2,
        priority: 'high'
      }
    });

    expect(taskResponse.status()).toBe(201);

    // Wait for Socket.IO event
    await eventReceived;
  });

  test('Should broadcast task status update', async ({ request }) => {
    // Create project and task
    const projectResponse = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Status Update Test',
        start_date: '2025-04-01',
        end_date: '2025-06-30',
        owner_id: 2
      }
    });

    const project = (await projectResponse.json()).data;

    const taskResponse = await request.post(`${API_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        project_id: project.id,
        name: 'Task to Complete',
        deadline: '2025-05-01',
        owner_id: 2,
        status: 'open'
      }
    });

    const task = (await taskResponse.json()).data;

    const eventReceived = new Promise((resolve) => {
      socket2.once('task:updated', (data) => {
        console.log('📢 Socket 2 received task:updated, status:', data.status);
        expect(data.status).toBe('completed');
        expect(data.id).toBe(task.id);
        resolve(data);
      });
    });

    // Update task status
    const updateResponse = await request.put(`${API_URL}/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        status: 'completed'
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // Wait for Socket.IO event
    await eventReceived;
  });

  test('Should broadcast task deletion', async ({ request }) => {
    // Create project and task
    const projectResponse = await request.post(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Task Delete Test',
        start_date: '2025-03-01',
        end_date: '2025-05-31',
        owner_id: 2
      }
    });

    const project = (await projectResponse.json()).data;

    const taskResponse = await request.post(`${API_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        project_id: project.id,
        name: 'Task to Delete',
        deadline: '2025-04-01',
        owner_id: 2
      }
    });

    const task = (await taskResponse.json()).data;

    const eventReceived = new Promise((resolve) => {
      socket2.once('task:deleted', (data) => {
        console.log('📢 Socket 2 received task:deleted, ID:', data.id);
        expect(data.id).toBe(task.id);
        expect(data.project_id).toBe(project.id);
        resolve(data);
      });
    });

    // Delete task
    const deleteResponse = await request.delete(`${API_URL}/tasks/${task.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(deleteResponse.ok()).toBeTruthy();

    // Wait for Socket.IO event
    await eventReceived;
  });

  // ========== CLEANUP ==========
  test.afterAll(async () => {
    console.log('\n🧹 Closing Socket.IO connections...');

    if (socket1 && socket1.connected) {
      socket1.disconnect();
      console.log('✅ Socket 1 disconnected');
    }

    if (socket2 && socket2.connected) {
      socket2.disconnect();
      console.log('✅ Socket 2 disconnected');
    }

    console.log('✅ All Socket.IO tests completed');
  });
});
