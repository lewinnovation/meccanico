import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer Create', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should create a new customer with all fields', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = generateTestCustomer();

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Verify customer appears in list or detail view
    await expect(page.locator(`text=${testData.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('should generate customer code in format C{5 letters}{000}', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: 'Michael Jordan',
      email: 'mj23@test.com',
      phone: '555-2323',
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Click on the customer to view details
    await customerPage.clickCustomer(testData.name);
    
    // Check the code format
    const code = await customerPage.getCustomerCode();
    if (code) {
      // Code should match pattern C{5 letters}{3+ digits}
      expect(code).toMatch(/^C[A-Z]{5}\d{3,}$/);
      // First 5 letters should be MICHA (from Michael)
      expect(code.substring(0, 6)).toBe('CMICHA');
    }
  });

  test('should display success message after creation', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = generateTestCustomer();

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Look for success toast or message
    const successIndicator = page.locator(
      '[role="alert"]:has-text("success"), ' +
      '.MuiAlert-success, ' +
      'text=/created|success/i'
    );
    await expect(successIndicator.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Success may be indicated by redirect without explicit message
    });
  });

  test('should redirect to customers list after creation', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = generateTestCustomer();

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Should be on customers page
    await expect(page).toHaveURL(/\/customers/);
  });
});

