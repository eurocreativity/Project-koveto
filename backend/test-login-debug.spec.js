const { test, expect } = require('@playwright/test');

test('Debug login flow', async ({ page }) => {
  await page.goto('http://localhost:8000');

  // Screenshot 1: Landing page
  await page.screenshot({ path: 'test-results/01-landing.png', fullPage: true });

  // Fill login
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');

  // Screenshot 2: Filled form
  await page.screenshot({ path: 'test-results/02-filled-form.png', fullPage: true });

  // Click login
  await page.click('button:has-text("Bejelentkezés")');

  // Wait and screenshot
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

  // Log page content
  const bodyText = await page.textContent('body');
  console.log('Page text includes Dashboard:', bodyText.includes('Dashboard'));
  console.log('Page text includes 🏠:', bodyText.includes('🏠'));

  // Check for errors
  const errors = await page.evaluate(() => {
    return window.lastError || 'No errors';
  });
  console.log('JavaScript errors:', errors);
});
