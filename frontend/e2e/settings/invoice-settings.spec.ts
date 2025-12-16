import { test, expect } from '../fixtures/auth.fixture';

test.describe('Invoice Settings', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display invoice settings form with fields', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    // Verify form fields
    await expect(page.locator('[data-testid="invoice-prefix-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-terms-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-footer-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-invoice-button"]')).toBeVisible();
  });

  test('should update invoice prefix', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    const prefixInput = page.locator('[data-testid="invoice-prefix-input"] input');
    await prefixInput.clear();
    await prefixInput.fill('MEC-');
    
    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(prefixInput).toHaveValue('MEC-');
  });

  test('should update payment terms', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    const termsInput = page.locator('[data-testid="invoice-terms-input"] textarea').first();
    await termsInput.clear();
    await termsInput.fill('Payment due within 14 days of invoice date. Late payments may incur interest.');
    
    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(page.locator('[data-testid="invoice-terms-input"] textarea').first()).toHaveValue(
      'Payment due within 14 days of invoice date. Late payments may incur interest.'
    );
  });

  test('should update invoice footer', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    const footerInput = page.locator('[data-testid="invoice-footer-input"] textarea').first();
    await footerInput.clear();
    await footerInput.fill('Thank you for choosing our services!');
    
    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(page.locator('[data-testid="invoice-footer-input"] textarea').first()).toHaveValue(
      'Thank you for choosing our services!'
    );
  });

  test('should update all invoice settings together', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    // Update prefix
    const prefixInput = page.locator('[data-testid="invoice-prefix-input"] input');
    await prefixInput.clear();
    await prefixInput.fill('INV-2024-');
    
    // Update terms
    const termsInput = page.locator('[data-testid="invoice-terms-input"] textarea').first();
    await termsInput.clear();
    await termsInput.fill('Net 30 days');
    
    // Update footer
    const footerInput = page.locator('[data-testid="invoice-footer-input"] textarea').first();
    await footerInput.clear();
    await footerInput.fill('We appreciate your business!');
    
    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Verify persistence
    await page.reload();
    await expect(prefixInput).toHaveValue('INV-2024-');
    await expect(page.locator('[data-testid="invoice-terms-input"] textarea').first()).toHaveValue('Net 30 days');
    await expect(page.locator('[data-testid="invoice-footer-input"] textarea').first()).toHaveValue('We appreciate your business!');
  });

  test('should handle multiline terms', async ({ page }) => {
    await page.goto('/settings/invoice');
    
    const termsInput = page.locator('[data-testid="invoice-terms-input"] textarea').first();
    await termsInput.clear();
    await termsInput.fill('Line 1: Payment due within 30 days\nLine 2: Late fee of 1.5% per month\nLine 3: Contact us for payment plans');
    
    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('text=Settings saved successfully')).toBeVisible({ timeout: 10000 });
  });
});

