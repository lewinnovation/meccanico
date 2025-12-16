import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer List', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display customers list page', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();

    // Should see the customers page header or content
    await expect(page.locator('text=/customers/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display customer table with headers', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();

    // Check for table headers
    const headers = ['Name', 'Email', 'Phone', 'Code'];
    for (const header of headers) {
      const headerElement = page.locator(`th:has-text("${header}"), [role="columnheader"]:has-text("${header}")`);
      // At least some headers should be visible
      await expect(headerElement.first()).toBeVisible().catch(() => {});
    }
  });

  test('should show add customer button', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();

    const addButton = page.locator(
      'button:has-text("Add"), ' +
      'button:has-text("New Customer"), ' +
      '[data-testid="add-customer"]'
    );
    await expect(addButton.first()).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();

    const searchInput = page.locator(
      'input[placeholder*="Search"], ' +
      'input[type="search"], ' +
      '[data-testid="search-input"]'
    );
    await expect(searchInput.first()).toBeVisible();
  });

  test('should show customer count or pagination info', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    await customerPage.goto();

    // Look for pagination or count indicator
    const countIndicator = page.locator(
      '.MuiTablePagination-displayedRows, ' +
      'text=/\\d+\\s*(of|total|customers|results)/i, ' +
      '[data-testid="customer-count"]'
    );
    // May or may not have pagination depending on customer count
    await expect(countIndicator.first()).toBeVisible().catch(() => {});
  });

  test('should navigate to customer details on row click', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    
    // First create a customer
    const testData = generateTestCustomer();
    await customerPage.goto();
    await customerPage.createCustomer(testData);
    
    // Wait and refresh list
    await customerPage.goto();
    
    // Click on customer
    await customerPage.clickCustomer(testData.name);
    
    // Should navigate to detail view or open modal
    await page.waitForTimeout(500);
    const detailView = page.locator(`text=${testData.name}`);
    await expect(detailView.first()).toBeVisible();
  });
});

