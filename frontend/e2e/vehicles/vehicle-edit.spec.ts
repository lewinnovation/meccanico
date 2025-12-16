import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage, generateTestVehicle } from '../fixtures/vehicle.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Vehicle Edit', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should open edit form from vehicle view', async ({ page }) => {
    // Create customer and vehicle
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('EditForm');
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

    await vehiclePage.clickEdit();

    // Should see edit dialog
    await expect(page.locator('text=/edit vehicle/i').first()).toBeVisible();
  });

  test('should update vehicle color', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('UpdateColor');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = { ...generateTestVehicle(), color: 'Red' };
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickEdit();
    await page.waitForTimeout(500);

    // Update color
    await page.fill('[data-testid="vehicle-color"]', 'Blue');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Should see updated color
    await expect(page.locator('text=Blue').first()).toBeVisible();
  });

  test('should update vehicle mileage', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('UpdateMileage');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = { ...generateTestVehicle(), mileage: '50000' };
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    await vehiclePage.clickEdit();
    await page.waitForTimeout(500);

    // Update mileage
    await page.fill('[data-testid="vehicle-mileage"]', '55000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Should see updated mileage
    await expect(page.locator('text=55,000 km').first()).toBeVisible();
  });

  test('should preserve vehicle code on edit (immutable)', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('PreserveCode');
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

    const originalCode = await vehiclePage.getVehicleCode();

    await vehiclePage.clickEdit();
    await page.waitForTimeout(500);

    await page.fill('[data-testid="vehicle-color"]', 'Green');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    const newCode = await vehiclePage.getVehicleCode();
    expect(newCode).toBe(originalCode);
  });
});

