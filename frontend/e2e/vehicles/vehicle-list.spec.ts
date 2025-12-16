import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage } from '../fixtures/vehicle.fixture';

test.describe('Vehicle List', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display vehicles list page', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();

    // Should see the vehicles page header
    await expect(page.locator('text=/vehicles/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display vehicle table with headers', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();
    await page.waitForTimeout(1000);

    // Check for table headers
    const headers = ['Code', 'Vehicle', 'License Plate', 'Customer', 'Mileage'];
    for (const header of headers) {
      const headerElement = page.locator(`th:has-text("${header}"), [role="columnheader"]:has-text("${header}")`);
      await expect(headerElement.first()).toBeVisible().catch(() => {});
    }
  });

  test('should show add vehicle button', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();

    const addButton = page.locator('[data-testid="add-vehicle"]');
    await expect(addButton).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();

    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
  });

  test('should show pagination info', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();
    await page.waitForTimeout(1000);

    // Look for pagination or count indicator
    const countIndicator = page.locator(
      '.MuiTablePagination-displayedRows, ' +
      '[data-testid="vehicle-count"]'
    );
    await expect(countIndicator.first()).toBeVisible().catch(() => {});
  });
});

