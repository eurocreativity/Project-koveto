/**
 * Playwright API Tests for Project Tracker Backend
 * Tests REST API endpoints using Playwright request context
 */

const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:3001/api';

let authToken = '';
let testUserId = 0;
let testProjectId = 0;
let testTaskId = 0;

test.describe('Project Tracker API Tests', () => {

  // ========== HEALTH CHECK ==========
  test('Health check endpoint should return success', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('running');
  });

  // ========== AUTHENTICATION ==========
  test.describe('Authentication', () => {

    test('Should register a new user', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/register`, {
        data: {
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'password123'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.user.name).toBe('Test User');
      expect(data.data.token).toBeDefined();

      testUserId = data.data.user.id;
    });

    test('Should not register user with duplicate email', async ({ request }) => {
      const email = 'janos@example.com'; // Already exists in mock data

      const response = await request.post(`${API_URL}/auth/register`, {
        data: {
          name: 'Duplicate User',
          email: email,
          password: 'password123'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('already registered');
    });

    test('Should login with valid credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'janos@example.com',
          password: 'password123'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('janos@example.com');
      expect(data.data.token).toBeDefined();

      // Save token for authenticated requests
      authToken = data.data.token;
    });

    test('Should not login with invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: 'janos@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid');
    });

    test('Should get current user info with valid token', async ({ request }) => {
      const response = await request.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.email).toBe('janos@example.com');
      expect(data.data.name).toBe('Kovács János');
    });

    test('Should reject request without token', async ({ request }) => {
      const response = await request.get(`${API_URL}/auth/me`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ========== PROJECTS ==========
  test.describe('Projects', () => {

    test('Should get all projects', async ({ request }) => {
      const response = await request.get(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('Should create a new project', async ({ request }) => {
      const response = await request.post(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          name: 'Test Project',
          description: 'Project created by Playwright test',
          start_date: '2025-03-01',
          end_date: '2025-06-30',
          owner_id: 2,
          status: 'open',
          color: '#ff5733'
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test Project');
      expect(data.data.color).toBe('#ff5733');

      testProjectId = data.data.id;
    });

    test('Should get project by ID with tasks', async ({ request }) => {
      const response = await request.get(`${API_URL}/projects/${testProjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testProjectId);
      expect(data.data.name).toBe('Test Project');
      expect(data.data.tasks).toBeDefined();
      expect(Array.isArray(data.data.tasks)).toBe(true);
    });

    test('Should update project', async ({ request }) => {
      const response = await request.put(`${API_URL}/projects/${testProjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          status: 'in_progress',
          description: 'Updated description'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.status).toBe('in_progress');
      expect(data.data.description).toBe('Updated description');
    });

    test('Should return 404 for non-existent project', async ({ request }) => {
      const response = await request.get(`${API_URL}/projects/99999`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ========== TASKS ==========
  test.describe('Tasks', () => {

    test('Should get all tasks', async ({ request }) => {
      const response = await request.get(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('Should create a new task', async ({ request }) => {
      const response = await request.post(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          project_id: testProjectId,
          name: 'Test Task',
          description: 'Task created by Playwright test',
          start_date: '2025-03-01',
          deadline: '2025-03-15',
          owner_id: 2,
          status: 'open',
          priority: 'high'
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test Task');
      expect(data.data.priority).toBe('high');
      expect(data.data.project_id).toBe(testProjectId);

      testTaskId = data.data.id;
    });

    test('Should update task status', async ({ request }) => {
      const response = await request.put(`${API_URL}/tasks/${testTaskId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          status: 'completed'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.status).toBe('completed');
    });

    test('Should delete task', async ({ request }) => {
      const response = await request.delete(`${API_URL}/tasks/${testTaskId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });

    test('Task should be deleted (404 on GET)', async ({ request }) => {
      const response = await request.get(`${API_URL}/tasks/${testTaskId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status()).toBe(404);
    });
  });

  // ========== PROJECT CLEANUP ==========
  test.describe('Cleanup', () => {

    test('Should delete test project', async ({ request }) => {
      const response = await request.delete(`${API_URL}/projects/${testProjectId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');
    });
  });

  // ========== AUTHORIZATION ==========
  test.describe('Authorization', () => {

    test('Should reject project access without token', async ({ request }) => {
      const response = await request.get(`${API_URL}/projects`);

      expect(response.status()).toBe(401);
    });

    test('Should reject project creation without token', async ({ request }) => {
      const response = await request.post(`${API_URL}/projects`, {
        data: {
          name: 'Unauthorized Project',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          owner_id: 2
        }
      });

      expect(response.status()).toBe(401);
    });
  });
});

test.afterAll(() => {
  console.log('\n✅ All API tests completed');
  console.log(`📊 Auth token used: ${authToken.substring(0, 20)}...`);
  console.log(`🔢 Test Project ID: ${testProjectId}`);
});
