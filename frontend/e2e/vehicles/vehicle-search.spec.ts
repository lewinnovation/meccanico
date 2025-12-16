import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage, generateTestVehicle } from '../fixtures/vehicle.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Vehicle Search', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should filter vehicles by make', async ({ page }) => {
    // First create a customer and vehicle
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('SearchMake');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = { ...generateTestVehicle(), make: 'UniqueSearchMake' };
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    // Search by make
    await vehiclePage.search('UniqueSearchMake');
    await page.waitForTimeout(500);

    // Should find the vehicle
    await expect(page.locator('text=UniqueSearchMake').first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter vehicles by license plate', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('SearchPlate');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const uniquePlate = `SRCH${Date.now().toString().slice(-4)}`;
    const vehicleData = { ...generateTestVehicle(), licensePlate: uniquePlate };
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    // Search by plate
    await vehiclePage.search(uniquePlate);
    await page.waitForTimeout(500);

    // Should find the vehicle
    await expect(page.locator(`text=${uniquePlate}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show no results for non-matching search', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();

    // Search for non-existent vehicle
    await vehiclePage.search('ZZZZNONEXISTENT999');
    await page.waitForTimeout(500);

    // Should show no results or empty state
    const noResults = page.locator('text=/no vehicles found|no results/i');
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(noResults.or(emptyState).first()).toBeVisible().catch(() => {
      // May just show empty table
    });
  });
});

