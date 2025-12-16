import { test, expect } from '../fixtures/auth.fixture';

test.describe('Tax Settings', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display tax settings form with fields', async ({ page }) => {
    await page.goto('/settings/tax');
    
    // Verify form fields
    await expect(page.locator('[data-testid="tax-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-rate-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-tax-button"]')).toBeVisible();
  });

  test('should update tax name', async ({ page }) => {
    await page.goto('/settings/tax');
    
    const taxNameInput = page.locator('[data-testid="tax-name-input"] input');
    await taxNameInput.clear();
    await taxNameInput.fill('VAT');
    
    await page.click('[data-testid="save-tax-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(taxNameInput).toHaveValue('VAT');
  });

  test('should update tax rate', async ({ page }) => {
    await page.goto('/settings/tax');
    
    const taxRateInput = page.locator('[data-testid="tax-rate-input"] input');
    await taxRateInput.clear();
    await taxRateInput.fill('15');
    
    await page.click('[data-testid="save-tax-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(taxRateInput).toHaveValue('15');
  });

  test('should update both tax name and rate together', async ({ page }) => {
    await page.goto('/settings/tax');
    
    const taxNameInput = page.locator('[data-testid="tax-name-input"] input');
    await taxNameInput.clear();
    await taxNameInput.fill('Sales Tax');
    
    const taxRateInput = page.locator('[data-testid="tax-rate-input"] input');
    await taxRateInput.clear();
    await taxRateInput.fill('8.5');
    
    await page.click('[data-testid="save-tax-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(taxNameInput).toHaveValue('Sales Tax');
    await expect(taxRateInput).toHaveValue('8.5');
  });

  test('should display % symbol in tax rate input', async ({ page }) => {
    await page.goto('/settings/tax');
    
    // Check for % adornment
    await expect(page.locator('text=%')).toBeVisible();
  });
});

