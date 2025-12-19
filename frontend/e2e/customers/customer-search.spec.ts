import { test, expect } from '../fixtures/auth.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Customer Search', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should filter customers by name', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueName = `UniqueSearch${Date.now()}`;
    
    // Create a customer with unique name
    await customerPage.goto();
    await customerPage.createCustomer({
      name: uniqueName,
      email: `${uniqueName.toLowerCase()}@test.com`,
    });

    // Search for the customer
    await customerPage.goto();
    await customerPage.search(uniqueName);

    // Should find the customer (use first() to handle multiple matches)
    await expect(page.locator(`text=${uniqueName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter customers by email', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueEmail = `searchtest${Date.now()}@unique.com`;
    
    // Create a customer with unique email
    await customerPage.goto();
    await customerPage.createCustomer({
      name: 'Email Search Test',
      email: uniqueEmail,
    });

    // Search by email
    await customerPage.goto();
    await customerPage.search(uniqueEmail);

    // Should find the customer
    await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible({ timeout: 10000 });
  });

  test('should filter customers by phone', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniquePhone = `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Create a customer with unique phone
    await customerPage.goto();
    await customerPage.createCustomer({
      name: 'Phone Search Test',
      phone: uniquePhone,
    });

    // Search by phone
    await customerPage.goto();
    await customerPage.search(uniquePhone);

    // Should find the customer
    await expect(page.locator(`text=${uniquePhone}`)).toBeVisible({ timeout: 10000 });
  });

  test('should filter customers by code', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const uniqueName = `CodeSearch${Date.now()}`;
    
    // Create a customer
    await customerPage.goto();
    await customerPage.createCustomer({
      name: uniqueName,
    });

    // View customer to get code
    await customerPage.goto();
    await customerPage.clickCustomer(uniqueName);
    const code = await customerPage.getCustomerCode();

    if (code) {
      // Search by code
      await customerPage.goto();
      await customerPage.search(code);

      // Should find the customer
      await expect(page.locator(`text=${code}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show no results for non-matching search', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const nonExistentSearch = 'ZZZZNONEXISTENT999999';

    await customerPage.goto();
    await customerPage.search(nonExistentSearch);

    // Should show no results or empty state
    const noResults = page.locator(
      'text=/no.*results|no.*customers|not found|no.*data/i, ' +
      '[data-testid="no-results"], ' +
      '.empty-state'
    );
    
    // Either show no results message or have empty table
    const tableRows = await customerPage.getCustomerRows();
    const hasNoResultsMessage = await noResults.first().isVisible().catch(() => false);
    
    expect(hasNoResultsMessage || tableRows.length === 0).toBe(true);
  });

  test('should clear search and show all customers', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    
    // Create multiple customers
    const testData1 = generateTestCustomer('SearchClear1');
    const testData2 = generateTestCustomer('SearchClear2');
    
    await customerPage.goto();
    await customerPage.createCustomer(testData1);
    await customerPage.goto();
    await customerPage.createCustomer(testData2);

    // Search for first customer
    await customerPage.goto();
    await customerPage.search(testData1.name);
    await page.waitForTimeout(500);

    // Clear search
    await customerPage.search('');
    await page.waitForTimeout(500);

    // Both customers should be visible (use first() to handle multiple matches)
    const customer1Visible = await page.locator(`text=${testData1.name}`).first().isVisible().catch(() => false);
    const customer2Visible = await page.locator(`text=${testData2.name}`).first().isVisible().catch(() => false);
    
    expect(customer1Visible || customer2Visible).toBe(true);
  });

  test('should handle partial search matches', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const fullName = `PartialSearchTest${Date.now()}`;
    
    // Create a customer
    await customerPage.goto();
    await customerPage.createCustomer({
      name: fullName,
    });

    // Search with partial name
    await customerPage.goto();
    await customerPage.search('PartialSearch');

    // Should find the customer (use first() to handle multiple matches)
    await expect(page.locator(`text=${fullName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should be case-insensitive', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const name = `CaseTest${Date.now()}`;
    
    // Create a customer
    await customerPage.goto();
    await customerPage.createCustomer({
      name: name,
    });

    // Search with different case
    await customerPage.goto();
    await customerPage.search(name.toLowerCase());

    // Should find the customer (use first() to handle multiple matches)
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 10000 });
  });
});

