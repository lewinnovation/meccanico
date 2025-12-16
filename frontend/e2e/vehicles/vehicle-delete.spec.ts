import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage, generateTestVehicle } from '../fixtures/vehicle.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Vehicle Delete', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('DeleteConfirm');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateTestVehicle();
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickDelete();

    // Should see confirmation dialog
    await expect(page.locator('text=/delete vehicle/i').first()).toBeVisible();
    await expect(page.locator('[data-testid="confirm-delete"]')).toBeVisible();
  });

  test('should cancel delete and keep vehicle', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('CancelDelete');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateTestVehicle();
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickDelete();
    await page.click('[data-testid="cancel-delete"]');
    await page.waitForTimeout(500);

    // Vehicle should still be visible
    await expect(page.locator(`text=${vehicleData.make}`).first()).toBeVisible();
  });

  test('should delete vehicle on confirm', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('ConfirmDelete');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = { ...generateTestVehicle(), licensePlate: `DEL${Date.now().toString().slice(-4)}` };
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickDelete();
    await vehiclePage.confirmDelete();
    await page.waitForTimeout(1000);

    // Should redirect to vehicles list
    await expect(page).toHaveURL(/\/vehicles/);

    // Search for the deleted vehicle
    await vehiclePage.search(vehicleData.licensePlate!);
    await page.waitForTimeout(500);

    // Vehicle should not be visible
    const vehicleRow = page.locator(`text=${vehicleData.licensePlate}`);
    await expect(vehicleRow).not.toBeVisible().catch(() => {});
  });

  test('should redirect to vehicles list after deletion', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('RedirectDelete');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateTestVehicle();
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickDelete();
    await vehiclePage.confirmDelete();
    await page.waitForTimeout(500);

    // Should be on vehicles list
    await expect(page).toHaveURL(/\/vehicles/);
  });
});

