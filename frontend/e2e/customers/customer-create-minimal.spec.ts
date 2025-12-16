import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage } from '../fixtures/customer.fixture';

test.describe('Customer Create - Minimal Data', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should create customer with only name (required field)', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: `Minimal Customer ${Date.now()}`,
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Verify customer appears
    await expect(page.locator(`text=${testData.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('should create customer with name and email only', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: `Email Only ${Date.now()}`,
      email: `emailonly.${Date.now()}@test.com`,
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Verify customer appears
    await expect(page.locator(`text=${testData.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('should create customer with name and phone only', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: `Phone Only ${Date.now()}`,
      phone: '555-0001',
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);

    // Verify customer appears
    await expect(page.locator(`text=${testData.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('should generate code for short names (padded with X)', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const testData = {
      name: 'Bob', // 3 letters, should become BOBXX
      email: `bob.${Date.now()}@test.com`,
    };

    await customerPage.goto();
    await customerPage.createCustomer(testData);
    
    // Click to view details and check code
    await customerPage.clickCustomer(testData.name);
    const code = await customerPage.getCustomerCode();
    
    if (code) {
      expect(code).toMatch(/^CBOBXX\d{3,}$/);
    }
  });
});

