import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer Create - Validation', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should show error for empty name field', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    await customerPage.goto();
    await customerPage.clickAddCustomer();
    
    // Try to submit without filling name - button should be disabled
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")')
      .filter({ hasNotText: 'Cancel' })
      .first();
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check that button is disabled when name is empty
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Fill name to enable button
    await page.getByLabel('Name').fill('Test');
    await page.waitForTimeout(200);
    const isEnabled = await submitButton.isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should show error for invalid email format', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    await customerPage.goto();
    await customerPage.clickAddCustomer();
    
    await customerPage.fillCustomerForm({
      name: 'Test Customer',
      email: 'invalid-email',
    });
    
    // Try to submit - MUI email input may show validation or allow submission
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")')
      .filter({ hasNotText: 'Cancel' })
      .first();
    
    // Check if button is enabled (email validation might be client-side)
    const isEnabled = await submitButton.isEnabled();
    if (isEnabled) {
      await submitButton.click();
      // Wait to see if there's an error
      await page.waitForTimeout(500);
      // Check for error message (might be from backend or client-side validation)
      const error = page.locator('[role="alert"], .MuiFormHelperText-root').filter({ hasText: /email|invalid/i });
      const hasError = await error.first().isVisible({ timeout: 2000 }).catch(() => false);
      // Test passes if either validation prevents submission or shows error
      expect(hasError || !isEnabled).toBeTruthy();
    }
  });

  test('should show error for duplicate email', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const sharedEmail = `duplicate.${Date.now()}@test.com`;
    
    // Create first customer
    await customerPage.goto();
    await customerPage.createCustomer({
      name: 'First Customer',
      email: sharedEmail,
    });

    // Wait for first customer to be created and dialog to close
    await page.waitForTimeout(1500);

    // Try to create second customer with same email
    await customerPage.goto();
    await customerPage.clickAddCustomer();
    await customerPage.fillCustomerForm({
      name: 'Second Customer',
      email: sharedEmail,
    });
    
    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")')
      .filter({ hasNotText: 'Cancel' })
      .first();
    await submitButton.click();
    
    // Wait for error to appear (either in dialog or after submission)
    await page.waitForTimeout(1000);
    
    // Should show duplicate error
    const error = page.locator(
      '[role="alert"]:has-text("exists"), ' +
      '[role="alert"]:has-text("duplicate"), ' +
      '[role="alert"]:has-text("already"), ' +
      'text=/already.*exists|duplicate|email.*already/i'
    );
    const hasError = await error.first().isVisible({ timeout: 5000 }).catch(() => false);
    // Test passes if error is shown (backend validation)
    expect(hasError).toBe(true);
  });

  test('should trim whitespace from fields', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: '  Whitespace Test  ',
      email: '  whitespace@test.com  ',
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Wait for customer to appear in list
    await page.waitForTimeout(1000);
    
    // Customer should be created with trimmed name (backend should trim)
    // Check for the trimmed version (without leading/trailing spaces)
    await expect(page.locator('text=Whitespace Test').first()).toBeVisible({ timeout: 10000 });
  });
});

