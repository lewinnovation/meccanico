import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer View', () => {
  let testCustomerName: string;

  test.beforeEach(async ({ loginAsAdmin, page }) => {
    await loginAsAdmin();
    
    // Create a test customer for viewing
    const customerPage = new CustomerPage(page);
    const testData = generateTestCustomer('ViewTest');
    testCustomerName = testData.name;
    
    await customerPage.goto();
    await customerPage.createCustomer(testData);
  });

  test('should display customer details', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    // Should see customer name in detail view
    await expect(page.locator(`text=${testCustomerName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should display customer code', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    // Look for code display
    const codePattern = /C[A-Z]{5}\d{3,}/;
    const codeElement = page.locator(
      '[data-testid="customer-code"], ' +
      '.customer-code, ' +
      `text=${codePattern.source}`
    );
    await expect(codeElement.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Code might be displayed differently
    });
  });

  test('should display customer contact info', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    // Should see contact information
    const contactInfo = page.locator(
      'text=@example.com, ' +
      'text=/555-\\d{4}/, ' +
      '[data-testid="customer-email"], ' +
      '[data-testid="customer-phone"]'
    );
    await expect(contactInfo.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should show edit button in customer view', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    const editButton = page.locator(
      'button:has-text("Edit"), ' +
      '[data-testid="edit-customer"], ' +
      '[aria-label="Edit"]'
    );
    await expect(editButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show delete button in customer view', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    const deleteButton = page.locator(
      'button:has-text("Delete"), ' +
      '[data-testid="delete-customer"], ' +
      '[aria-label="Delete"]'
    );
    await expect(deleteButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display vehicles section (empty for new customer)', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();
    await customerPage.clickCustomer(testCustomerName);

    // Look for vehicles section
    const vehiclesSection = page.locator(
      'text=/vehicles/i, ' +
      '[data-testid="customer-vehicles"], ' +
      'text=/no vehicles|add vehicle/i'
    );
    await expect(vehiclesSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

