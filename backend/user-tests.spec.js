const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:3001/api';

let authToken = '';
let adminToken = '';

test.describe('User Management API Tests', () => {

  test.beforeAll(async ({ request }) => {
    // Login as admin
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@example.com',
        password: 'password123'
      }
    });
    const loginData = await loginResponse.json();
    adminToken = loginData.data.token;

    // Login as regular user
    const userLogin = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'janos@example.com',
        password: 'password123'
      }
    });
    const userData = await userLogin.json();
    authToken = userData.data.token;
  });

  test('GET /api/users - should return all users', async ({ request }) => {
    const response = await request.get(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);

    // Check user structure
    const user = data.data[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).not.toHaveProperty('password_hash'); // Should not expose password
  });

  test('GET /api/users/:id - should return single user', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/1`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(1);
    expect(data.data.name).toBe('Admin User');
  });

  test('GET /api/users/:id - should return 404 for non-existent user', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/9999`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('PUT /api/users/:id - admin should update user successfully', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        name: 'Kovács János Updated',
        email: 'janos@example.com',
        role: 'user'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Kovács János Updated');
  });

  test('PUT /api/users/:id - admin should update user role', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/3`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        role: 'admin'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.role).toBe('admin');
  });

  test('PUT /api/users/:id - admin should update avatar URL', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        avatar_url: 'https://example.com/avatar.jpg'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.avatar_url).toBe('https://example.com/avatar.jpg');
  });

  test('PUT /api/users/:id - non-admin should get 403 error', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/1`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        name: 'Hacker Attempt'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Admin access required');
  });

  test('PUT /api/users/:id - should reject duplicate email', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        email: 'admin@example.com' // Already exists for user ID 1
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Email already in use');
  });

  test('PUT /api/users/:id - should return 404 for non-existent user', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/9999`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        name: 'Ghost User'
      }
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('PUT /api/users/:id - admin should change user password', async ({ request }) => {
    const response = await request.put(`${API_URL}/users/2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        password: 'newpassword123'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify login with new password
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'janos@example.com',
        password: 'newpassword123'
      }
    });

    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);

    // Reset password back
    await request.put(`${API_URL}/users/2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        password: 'password123'
      }
    });
  });

});
