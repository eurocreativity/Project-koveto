const { test, expect } = require('@playwright/test');

const FRONTEND_URL = 'http://localhost:8000';
const API_URL = 'http://localhost:3001';

test.describe('Frontend Integration Tests with Production Backend', () => {

  test('1. Login and Dashboard Load', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Wait for page load
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Fill login form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit login
    await page.click('button:has-text("Bejelentkezés")');

    // Wait for dashboard
    await page.waitForTimeout(2000); // Wait for login redirect
    const dashboardTabVisible = await page.isVisible('text=🏠 Dashboard');

    // Verify user is logged in
    const dashboardVisible = await page.isVisible('text=Projektek');
    expect(dashboardVisible).toBe(true);

    console.log('✅ Login successful - Dashboard loaded');
  });

  test('2. User Management UI', async ({ page }) => {
    // Login first
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to Users tab
    await page.click('text=👥 Felhasználók');
    await page.waitForTimeout(1000);

    // Check if users are loaded
    const userListVisible = await page.isVisible('text=Admin User');
    expect(userListVisible).toBe(true);

    console.log('✅ User Management UI loaded - Users displayed');
  });

  test('3. Project List Display', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to Projects tab
    await page.click('text=📂 Projektek');
    await page.waitForTimeout(1000);

    // Check if projects are loaded
    const projectsLoaded = await page.locator('.project-card').count();
    expect(projectsLoaded).toBeGreaterThan(0);

    console.log(`✅ Projects loaded: ${projectsLoaded} projects found`);
  });

  test('4. Task List Display', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to Tasks tab
    await page.click('text=📋 Feladatok');
    await page.waitForTimeout(1000);

    // Check if tasks are loaded
    const tasksLoaded = await page.locator('.task-item').count();
    expect(tasksLoaded).toBeGreaterThan(0);

    console.log(`✅ Tasks loaded: ${tasksLoaded} tasks found`);
  });

  test('5. Create New Project', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to New Project tab
    await page.click('text=➕ Új Projekt');
    await page.waitForTimeout(500);

    // Fill project form
    await page.fill('input[placeholder*="Projekt neve"]', 'Playwright Test Project');
    await page.fill('textarea[placeholder*="Leírás"]', 'Created by automated test');
    await page.fill('input[type="date"]', '2025-10-10');
    await page.evaluate(() => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length > 1) dateInputs[1].value = '2025-12-31';
    });

    // Submit form
    await page.click('button:has-text("Projekt Mentése")');
    await page.waitForTimeout(2000);

    // Verify project was created
    await page.click('text=📂 Projektek');
    await page.waitForTimeout(1000);
    const projectExists = await page.isVisible('text=Playwright Test Project');
    expect(projectExists).toBe(true);

    console.log('✅ New project created successfully');
  });

  test('6. Create New Task', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to New Task tab
    await page.click('text=➕ Új Feladat');
    await page.waitForTimeout(500);

    // Fill task form
    await page.fill('input[placeholder*="Feladat neve"]', 'Playwright Test Task');
    await page.fill('textarea[placeholder*="Részletek"]', 'Automated test task');

    // Set deadline
    const today = new Date();
    const deadline = new Date(today.setDate(today.getDate() + 7));
    const deadlineStr = deadline.toISOString().split('T')[0];
    await page.fill('input[type="date"]', deadlineStr);

    // Submit form
    await page.click('button:has-text("Feladat Mentése")');
    await page.waitForTimeout(2000);

    // Verify task was created
    await page.click('text=📋 Feladatok');
    await page.waitForTimeout(1000);
    const taskExists = await page.isVisible('text=Playwright Test Task');
    expect(taskExists).toBe(true);

    console.log('✅ New task created successfully');
  });

  test('7. Dark Mode Toggle', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Check current mode
    const bodyClassBefore = await page.getAttribute('body', 'class');

    // Toggle dark mode
    await page.click('#darkModeToggle');
    await page.waitForTimeout(500);

    // Check mode changed
    const bodyClassAfter = await page.getAttribute('body', 'class');
    const darkModeActive = bodyClassAfter.includes('dark-mode');

    expect(bodyClassBefore !== bodyClassAfter).toBe(true);

    console.log(`✅ Dark mode toggled - Dark mode ${darkModeActive ? 'ON' : 'OFF'}`);
  });

  test('8. Export Projects to CSV', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to Projects
    await page.click('text=📂 Projektek');
    await page.waitForTimeout(1000);

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await page.click('button:has-text("CSV")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    console.log(`✅ CSV export successful - File: ${download.suggestedFilename()}`);
  });

  test('9. Settings Page Load', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Navigate to Settings
    await page.click('text=⚙️ Beállítások');
    await page.waitForTimeout(1000);

    // Check settings loaded
    const settingsVisible = await page.isVisible('text=Rendszer információ');
    expect(settingsVisible).toBe(true);

    // Check statistics are displayed
    const projectCount = await page.textContent('#settingsProjectCount');
    expect(parseInt(projectCount)).toBeGreaterThan(0);

    console.log(`✅ Settings page loaded - ${projectCount} projects in system`);
  });

  test('10. Socket.IO Connection Status', async ({ page }) => {
    // Login
    await page.goto(FRONTEND_URL);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Bejelentkezés")');
    await page.waitForTimeout(2000);

    // Wait for Socket.IO connection
    await page.waitForTimeout(2000);

    // Check connection status in console
    const socketConnected = await page.evaluate(() => {
      return window.socket && window.socket.connected;
    });

    expect(socketConnected).toBe(true);

    console.log('✅ Socket.IO connected successfully');
  });

});
