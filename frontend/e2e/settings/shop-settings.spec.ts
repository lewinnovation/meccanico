import { test, expect } from '../fixtures/auth.fixture';

test.describe('Shop Settings', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display shop settings form with fields', async ({ page }) => {
    await page.goto('/settings/shop');
    
    // Verify all form fields are present
    await expect(page.locator('[data-testid="shop-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-phone-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="shop-email-input"]')).toBeVisible();
    
    // Verify save button is present for admin
    await expect(page.locator('[data-testid="save-shop-button"]')).toBeVisible();
  });

  test('should update shop name', async ({ page }) => {
    await page.goto('/settings/shop');
    
    // Clear and enter new shop name
    const nameInput = page.locator('[data-testid="shop-name-input"] input');
    await nameInput.clear();
    await nameInput.fill('Test Auto Shop');
    
    // Save changes
    await page.click('[data-testid="save-shop-button"]');
    
    // Wait for success message
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Reload and verify persistence
    await page.reload();
    await expect(nameInput).toHaveValue('Test Auto Shop');
  });

  test('should update shop address', async ({ page }) => {
    await page.goto('/settings/shop');
    
    const addressInput = page.locator('[data-testid="shop-address-input"] textarea').first();
    await addressInput.clear();
    await addressInput.fill('123 Main Street\nNew York, NY 10001');
    
    await page.click('[data-testid="save-shop-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should update shop contact details', async ({ page }) => {
    await page.goto('/settings/shop');
    
    // Update phone
    const phoneInput = page.locator('[data-testid="shop-phone-input"] input');
    await phoneInput.clear();
    await phoneInput.fill('+1 555-123-4567');
    
    // Update email
    const emailInput = page.locator('[data-testid="shop-email-input"] input');
    await emailInput.clear();
    await emailInput.fill('contact@testshop.com');
    
    await page.click('[data-testid="save-shop-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(phoneInput).toHaveValue('+1 555-123-4567');
    await expect(emailInput).toHaveValue('contact@testshop.com');
  });

  test('should preserve data when navigating away and back', async ({ page }) => {
    await page.goto('/settings/shop');
    
    // Enter data
    const nameInput = page.locator('[data-testid="shop-name-input"] input');
    await nameInput.clear();
    await nameInput.fill('Persistence Test Shop');
    await page.click('[data-testid="save-shop-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Navigate away
    await page.goto('/settings');
    
    // Navigate back
    await page.click('text=Shop Information');
    
    // Verify data persisted
    await expect(page.locator('[data-testid="shop-name-input"] input')).toHaveValue('Persistence Test Shop');
  });
});

