import { test, expect } from '../fixtures/auth.fixture';

test.describe('Currency Settings', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display currency settings form with fields', async ({ page }) => {
    await page.goto('/settings/currency');
    
    // Verify form fields
    await expect(page.locator('[data-testid="currency-code-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="currency-symbol-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-currency-button"]')).toBeVisible();
  });

  test('should update currency code', async ({ page }) => {
    await page.goto('/settings/currency');
    
    // Wait for form to load
    await expect(page.locator('[data-testid="currency-code-input"]')).toBeVisible({ timeout: 5000 });
    
    const codeInput = page.locator('[data-testid="currency-code-input"] input');
    await codeInput.clear();
    await codeInput.fill('EUR');
    
    await page.click('[data-testid="save-currency-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await page.waitForTimeout(500); // Wait for form to load
    await expect(codeInput).toHaveValue('EUR');
  });

  test('should update currency symbol', async ({ page }) => {
    await page.goto('/settings/currency');
    
    // Wait for form to load
    await expect(page.locator('[data-testid="currency-symbol-input"]')).toBeVisible({ timeout: 5000 });
    
    const symbolInput = page.locator('[data-testid="currency-symbol-input"] input');
    await symbolInput.clear();
    await symbolInput.fill('€');
    
    await page.click('[data-testid="save-currency-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await page.waitForTimeout(500); // Wait for form to load
    await expect(symbolInput).toHaveValue('€');
  });

  test('should update both currency code and symbol', async ({ page }) => {
    await page.goto('/settings/currency');
    
    // Wait for form to load
    await expect(page.locator('[data-testid="currency-code-input"]')).toBeVisible({ timeout: 5000 });
    
    const codeInput = page.locator('[data-testid="currency-code-input"] input');
    await codeInput.clear();
    await codeInput.fill('GBP');
    
    const symbolInput = page.locator('[data-testid="currency-symbol-input"] input');
    await symbolInput.clear();
    await symbolInput.fill('£');
    
    await page.click('[data-testid="save-currency-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await page.waitForTimeout(500); // Wait for form to load
    await expect(codeInput).toHaveValue('GBP');
    await expect(symbolInput).toHaveValue('£');
  });

  test('should handle different currency formats', async ({ page }) => {
    await page.goto('/settings/currency');
    
    const codeInput = page.locator('[data-testid="currency-code-input"] input');
    const symbolInput = page.locator('[data-testid="currency-symbol-input"] input');
    
    // Test Japanese Yen
    await codeInput.clear();
    await codeInput.fill('JPY');
    await symbolInput.clear();
    await symbolInput.fill('¥');
    
    await page.click('[data-testid="save-currency-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
  });
});

