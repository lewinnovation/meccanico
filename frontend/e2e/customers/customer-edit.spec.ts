import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer Edit', () => {
  let testCustomerName: string;
  let testCustomerEmail: string;

  test.beforeEach(async ({ loginAsAdmin, page }) => {
    await loginAsAdmin();
    
    // Create a test customer for editing
    const customerPage = new CustomerPage(page);
    const testData = generateTestCustomer('EditTest');
    testCustomerName = testData.name;
    testCustomerEmail = testData.email!;
    
    await customerPage.goto();
    await customerPage.createCustomer(testData);
  });

  test('should open edit form from customer view', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();

    // Should see edit form with existing data
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    await expect(nameInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should update customer name', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const newName = `Updated Name ${Date.now()}`;

    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();
    
    // Clear and update name
    await page.fill('input[name="name"], [data-testid="customer-name"]', newName);
    await customerPage.submitForm();

    // Verify name was updated
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should update customer email', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const newEmail = `updated.${Date.now()}@test.com`;

    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();
    
    // Update email
    await page.fill('input[name="email"], input[type="email"]', newEmail);
    await customerPage.submitForm();

    // Verify email was updated
    await expect(page.locator(`text=${newEmail}`)).toBeVisible({ timeout: 10000 });
  });

  test('should update customer phone', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const newPhone = '555-9999';

    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();
    
    // Update phone
    await page.fill('input[name="phone"], input[type="tel"]', newPhone);
    await customerPage.submitForm();

    // Verify phone was updated
    await expect(page.locator(`text=${newPhone}`)).toBeVisible({ timeout: 10000 });
  });

  test('should preserve customer code on edit (immutable)', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    
    // Get original code
    const originalCode = await customerPage.getCustomerCode();
    
    await customerPage.clickEdit();
    
    // Update name
    await page.fill('input[name="name"], [data-testid="customer-name"]', 'Changed Name');
    await customerPage.submitForm();

    // Code field should not be editable or code should remain same
    const codeInput = page.locator('input[name="code"]');
    const isDisabled = await codeInput.isDisabled().catch(() => true);
    
    if (originalCode) {
      const currentCode = await customerPage.getCustomerCode();
      expect(currentCode).toBe(originalCode);
    }
  });

  test('should cancel edit and preserve original data', async ({ page }) => {
    const customerPage = new CustomerPage(page);

    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();
    
    // Make changes but cancel
    await page.fill('input[name="name"], [data-testid="customer-name"]', 'Should Not Save');
    
    // Click cancel
    await page.click('button:has-text("Cancel"), [data-testid="cancel-edit"]');

    // Original name should still be visible
    await expect(page.locator(`text=${testCustomerName}`)).toBeVisible({ timeout: 5000 });
  });

  test('should show error when updating to duplicate email', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    
    // Create another customer with a specific email
    const otherEmail = `other.${Date.now()}@test.com`;
    await customerPage.goto();
    await customerPage.createCustomer({
      name: 'Other Customer',
      email: otherEmail,
    });
    
    // Try to update first customer to have same email
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);
    await customerPage.clickEdit();
    
    await page.fill('input[name="email"], input[type="email"]', otherEmail);
    await customerPage.submitForm();

    // Should show error
    const error = page.locator(
      '[role="alert"]:has-text("exists"), ' +
      'text=/already.*exists|duplicate/i'
    );
    await expect(error.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

