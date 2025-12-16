import { test, expect } from '../fixtures/auth.fixture';

test.describe('Settings Navigation', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display settings menu with all categories', async ({ page }) => {
    await page.goto('/settings');
    
    // Verify settings page title
    await expect(page.locator('h4:has-text("Settings")')).toBeVisible();
    
    // Verify all settings categories are displayed
    await expect(page.locator('text=Shop Information')).toBeVisible();
    await expect(page.locator('text=Tax Settings')).toBeVisible();
    await expect(page.locator('text=Invoice Templates')).toBeVisible();
    await expect(page.locator('text=Currency')).toBeVisible();
  });

  test('should navigate to shop settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Shop Information');
    
    await expect(page).toHaveURL('/settings/shop');
    await expect(page.locator('h5:has-text("Shop Information")')).toBeVisible();
  });

  test('should navigate to tax settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Tax Settings');
    
    await expect(page).toHaveURL('/settings/tax');
    await expect(page.locator('h5:has-text("Tax Settings")')).toBeVisible();
  });

  test('should navigate to currency settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Currency');
    
    await expect(page).toHaveURL('/settings/currency');
    await expect(page.locator('h5:has-text("Currency Settings")')).toBeVisible();
  });

  test('should navigate to invoice settings', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Invoice Templates');
    
    await expect(page).toHaveURL('/settings/invoice');
    await expect(page.locator('h5:has-text("Invoice Settings")')).toBeVisible();
  });

  test('should navigate back to settings menu from sub-page', async ({ page }) => {
    await page.goto('/settings/shop');
    
    // Click back button
    await page.click('[data-testid="ArrowBackIcon"]').catch(() => {
      // Try alternative selector if data-testid doesn't work
      page.click('button:has(svg)');
    });
    
    await expect(page).toHaveURL('/settings');
  });

  test('should access settings from sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Click settings in sidebar
    await page.click('text=Settings');
    
    await expect(page).toHaveURL('/settings');
  });
});

