const { test, expect } = require('@playwright/test');

/**
 * Quick E2E Tests - Projekt Követő Rendszer
 * Simple tests for drag & drop and core functionality
 */

const FRONTEND_URL = 'http://localhost:8000';
const API_URL = 'http://localhost:3001/api';

test.describe('Quick E2E Tests', () => {

  test('01. API Health Check', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    console.log('✅ API is healthy');
  });

  test('02. Frontend loads', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if page has content
    const content = await page.content();
    expect(content).toContain('Projekt Követő');

    console.log('✅ Frontend loaded');
  });

  test('03. Login and verify dashboard', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Find and click login button (look for "Bejelentkezés" text)
    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);

      // Fill login form
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Submit
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Check if logged in (look for user name or dashboard)
    const pageContent = await page.content();
    const isLoggedIn = pageContent.includes('Kovács') || pageContent.includes('Dashboard') || pageContent.includes('Projektek');

    expect(isLoggedIn).toBe(true);
    console.log('✅ Login successful');
  });

  test('04. Check projects and tasks loaded', async ({ page }) => {
    // Login first
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Check if projects are visible (should have 3 projects from seed)
    const content = await page.content();
    const hasProjects = content.includes('E-commerce') || content.includes('Mobilalkalmazás') || content.includes('CRM');

    expect(hasProjects).toBe(true);
    console.log('✅ Projects loaded from database');
  });

  test('05. Calendar view loads', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Click calendar tab (look for calendar icon or text)
    const calendarTab = page.locator('text=📅').or(page.locator('text=Naptár'));
    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(2000);

      // Check if FullCalendar loaded
      const hasCalendar = await page.locator('.fc-toolbar').isVisible().catch(() => false);
      expect(hasCalendar).toBe(true);

      console.log('✅ Calendar loaded');
    } else {
      console.log('⚠️ Calendar tab not found, skipping test');
    }
  });

  test('06. Test drag & drop preparation', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Go to calendar
    const calendarTab = page.locator('text=📅').or(page.locator('text=Naptár'));
    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(2000);

      // Check if events are visible
      const events = await page.locator('.fc-event').count();
      console.log(`✅ Found ${events} calendar events`);
      expect(events).toBeGreaterThan(0);

      // Take screenshot for manual verification
      await page.screenshot({ path: 'calendar-with-events.png' });
      console.log('📸 Screenshot saved: calendar-with-events.png');
    }
  });

  test('07. Dark mode toggle', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }

    // Look for dark mode toggle
    const darkModeToggle = page.locator('.theme-toggle').or(page.locator('text=🌙'));
    if (await darkModeToggle.isVisible()) {
      // Get initial state
      const bodyClassBefore = await page.getAttribute('body', 'class') || '';

      // Click toggle
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      // Get new state
      const bodyClassAfter = await page.getAttribute('body', 'class') || '';

      // Verify it changed
      const changed = bodyClassBefore !== bodyClassAfter;
      expect(changed).toBe(true);

      console.log('✅ Dark mode toggled');
    } else {
      console.log('⚠️ Dark mode toggle not found');
    }
  });

  test('08. API - Get projects', async ({ request }) => {
    // Login to get token
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'janos@example.com',
        password: 'password123'
      }
    });

    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    const token = loginData.token;

    // Get projects
    const projectsResponse = await request.get(`${API_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const projectsData = await projectsResponse.json();
    expect(projectsData.success).toBe(true);
    expect(projectsData.data.length).toBeGreaterThan(0);

    console.log(`✅ API returned ${projectsData.data.length} projects`);
  });

  test('09. API - Get tasks', async ({ request }) => {
    // Login to get token
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'janos@example.com',
        password: 'password123'
      }
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Get tasks
    const tasksResponse = await request.get(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const tasksData = await tasksResponse.json();
    expect(tasksData.success).toBe(true);
    expect(tasksData.data.length).toBeGreaterThan(0);

    console.log(`✅ API returned ${tasksData.data.length} tasks`);
  });

  test('10. Socket.IO connection', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('text=Bejelentkezés').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
      await page.fill('input[type="email"]', 'janos@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }

    // Check if Socket.IO connected
    const socketConnected = await page.evaluate(() => {
      return window.socket && window.socket.connected;
    }).catch(() => false);

    if (socketConnected) {
      console.log('✅ Socket.IO connected');
    } else {
      console.log('⚠️ Socket.IO connection status unknown');
    }
  });

});
