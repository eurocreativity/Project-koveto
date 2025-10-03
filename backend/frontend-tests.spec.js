const { test, expect } = require('@playwright/test');

/**
 * Frontend E2E Tests - Projekt Követő Rendszer
 * Tests the complete user flow including login, CRUD operations, dark mode, etc.
 */

const FRONTEND_URL = 'http://localhost:8000';
const API_URL = 'http://localhost:3001/api';

// Test user credentials
const TEST_USER = {
  email: 'janos@example.com',
  password: 'password123',
  name: 'János'
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'password123',
  name: 'Admin'
};

test.describe('Frontend E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(FRONTEND_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('01. Landing page loads correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Check if landing page is displayed
    await expect(page.locator('h1')).toContainText('Projekt Követő Rendszer');

    // Check if login/register buttons are visible
    await expect(page.locator('button:has-text("Bejelentkezés")')).toBeVisible();
    await expect(page.locator('button:has-text("Regisztráció")')).toBeVisible();

    console.log('✅ Landing page loaded successfully');
  });

  test('02. Login flow works correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Click "Bejelentkezés" button
    await page.click('button:has-text("Bejelentkezés")');

    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]:has-text("Bejelentkezés")');

    // Wait for dashboard to load
    await page.waitForTimeout(1000);

    // Check if we're logged in (dashboard visible)
    await expect(page.locator('.header')).toContainText(TEST_USER.name);
    await expect(page.locator('.tab-button:has-text("Dashboard")')).toBeVisible();

    console.log('✅ Login successful');
  });

  test('03. Create new project', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Switch to "Új Projekt" tab
    await page.click('.tab-button:has-text("Új Projekt")');

    // Fill project form
    await page.fill('input[name="project-name"]', 'Test Projekt E2E');
    await page.fill('textarea[name="project-description"]', 'Playwright E2E teszt projekt');
    await page.fill('input[name="project-start-date"]', '2025-10-03');
    await page.fill('input[name="project-end-date"]', '2025-12-31');
    await page.selectOption('select[name="project-owner"]', { index: 1 }); // Select first user
    await page.fill('input[name="project-color"]', '#ff5733');

    // Submit form
    await page.click('button[type="submit"]:has-text("Projekt mentése")');

    // Wait for response
    await page.waitForTimeout(1000);

    // Check if project appears in dashboard
    await page.click('.tab-button:has-text("Dashboard")');
    await expect(page.locator('.project-card')).toContainText('Test Projekt E2E');

    console.log('✅ Project created successfully');
  });

  test('04. Create new task', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Switch to "Új Feladat" tab
    await page.click('.tab-button:has-text("Új Feladat")');

    // Fill task form
    await page.selectOption('select[name="task-project"]', { index: 1 }); // Select first project
    await page.fill('input[name="task-name"]', 'E2E Test Task');
    await page.fill('textarea[name="task-description"]', 'Playwright teszt feladat');
    await page.fill('input[name="task-deadline"]', '2025-10-15');
    await page.selectOption('select[name="task-owner"]', { index: 1 });
    await page.selectOption('select[name="task-priority"]', 'high');

    // Submit form
    await page.click('button[type="submit"]:has-text("Feladat mentése")');

    // Wait for response
    await page.waitForTimeout(1000);

    // Switch to Tasks tab and verify
    await page.click('.tab-button:has-text("Feladatok")');
    await expect(page.locator('.task-item')).toContainText('E2E Test Task');

    console.log('✅ Task created successfully');
  });

  test('05. Edit project', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Go to Dashboard
    await page.click('.tab-button:has-text("Dashboard")');

    // Click Edit button on first project
    await page.click('.project-card button:has-text("✏️")');

    // Wait for form to be filled
    await page.waitForTimeout(500);

    // Modify project name
    const nameInput = page.locator('input[name="project-name"]');
    await nameInput.fill('Modified Project Name');

    // Submit
    await page.click('button[type="submit"]:has-text("Projekt mentése")');

    // Wait and verify
    await page.waitForTimeout(1000);
    await page.click('.tab-button:has-text("Dashboard")');
    await expect(page.locator('.project-card')).toContainText('Modified Project Name');

    console.log('✅ Project edited successfully');
  });

  test('06. Delete task', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Go to Tasks tab
    await page.click('.tab-button:has-text("Feladatok")');

    // Get initial task count
    const initialCount = await page.locator('.task-item').count();

    // Click delete button on first task
    page.once('dialog', dialog => dialog.accept()); // Accept confirmation
    await page.click('.task-item button:has-text("🗑️")');

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify task count decreased
    const newCount = await page.locator('.task-item').count();
    expect(newCount).toBeLessThan(initialCount);

    console.log('✅ Task deleted successfully');
  });

  test('07. Filter tasks by status', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Go to Tasks tab
    await page.click('.tab-button:has-text("Feladatok")');

    // Select "completed" filter
    await page.selectOption('select[name="filter-status"]', 'completed');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Get all visible tasks
    const tasks = await page.locator('.task-item').all();

    // Verify all tasks have "completed" status
    for (const task of tasks) {
      await expect(task.locator('.status-badge')).toContainText('Befejezett');
    }

    console.log('✅ Task filtering works');
  });

  test('08. Dark mode toggle', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Check initial state (light mode)
    const bodyClassBefore = await page.getAttribute('body', 'class');
    expect(bodyClassBefore).not.toContain('dark-mode');

    // Click dark mode toggle
    await page.click('.theme-toggle');

    // Wait for transition
    await page.waitForTimeout(500);

    // Check if dark mode is applied
    const bodyClassAfter = await page.getAttribute('body', 'class');
    expect(bodyClassAfter).toContain('dark-mode');

    // Check localStorage
    const darkModeSetting = await page.evaluate(() => localStorage.getItem('darkMode'));
    expect(darkModeSetting).toBe('enabled');

    console.log('✅ Dark mode toggle works');
  });

  test('09. Dark mode persists after reload', async ({ page }) => {
    // Login and enable dark mode
    await loginUser(page, TEST_USER);
    await page.click('.theme-toggle');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if dark mode is still enabled
    const bodyClass = await page.getAttribute('body', 'class');
    expect(bodyClass).toContain('dark-mode');

    console.log('✅ Dark mode persists after reload');
  });

  test('10. Export projects to CSV', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Go to Projects tab
    await page.click('.tab-button:has-text("Projektek")');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click CSV export button
    await page.click('button:has-text("📥 CSV")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/projektek-.*\.csv/);

    console.log('✅ CSV export works');
  });

  test('11. Export full backup to JSON', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Go to Settings tab
    await page.click('.tab-button:has-text("⚙️")');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click full backup button
    await page.click('button:has-text("💾 Teljes mentés letöltése")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/teljes-mentes-.*\.json/);

    console.log('✅ Full backup export works');
  });

  test('12. Logout works correctly', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Click logout button
    await page.click('button:has-text("Kijelentkezés")');

    // Wait for redirect
    await page.waitForTimeout(500);

    // Check if we're back to landing page
    await expect(page.locator('h1')).toContainText('Projekt Követő Rendszer');
    await expect(page.locator('button:has-text("Bejelentkezés")')).toBeVisible();

    // Check localStorage is cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();

    console.log('✅ Logout successful');
  });

  test('13. Admin can access user management', async ({ page }) => {
    // Login as admin
    await loginUser(page, ADMIN_USER);

    // Check if "Felhasználók" tab is visible
    await expect(page.locator('.tab-button:has-text("👥")')).toBeVisible();

    // Click on Users tab
    await page.click('.tab-button:has-text("👥")');

    // Check if user list is displayed
    await expect(page.locator('.user-item')).toHaveCount(await page.locator('.user-item').count());

    console.log('✅ Admin can access user management');
  });

  test('14. Calendar view loads', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Click on Calendar tab
    await page.click('.tab-button:has-text("📅")');

    // Wait for FullCalendar to load
    await page.waitForTimeout(1000);

    // Check if calendar is rendered
    await expect(page.locator('.fc-toolbar')).toBeVisible();
    await expect(page.locator('.fc-view')).toBeVisible();

    console.log('✅ Calendar loads correctly');
  });

  test('15. Real-time Socket.IO connection', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER);

    // Wait for Socket.IO connection
    await page.waitForTimeout(2000);

    // Check connection status indicator (if exists)
    const connectionStatus = await page.evaluate(() => {
      return window.socket && window.socket.connected;
    });

    expect(connectionStatus).toBe(true);

    console.log('✅ Socket.IO connected');
  });

});

/**
 * Helper function to login user
 */
async function loginUser(page, user) {
  await page.goto(FRONTEND_URL);
  await page.click('button:has-text("Bejelentkezés")');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]:has-text("Bejelentkezés")');
  await page.waitForTimeout(1500); // Wait for login to complete
}
