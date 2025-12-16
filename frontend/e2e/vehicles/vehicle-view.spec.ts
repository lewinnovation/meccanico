import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage, generateTestVehicle } from '../fixtures/vehicle.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Vehicle View', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should display vehicle details', async ({ page }) => {
    // First create a customer and vehicle
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('ViewTest');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateTestVehicle();
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(500);

    // Click on the vehicle
    await vehiclePage.clickVehicle(vehicleData.make);
    await page.waitForTimeout(500);

    // Should see vehicle info
    await expect(page.locator(`text=${vehicleData.make}`).first()).toBeVisible();
    await expect(page.locator(`text=${vehicleData.model}`).first()).toBeVisible();
  });

  test('should display vehicle code', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('CodeView');
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

    const code = await vehiclePage.getVehicleCode();
    expect(code).toBeTruthy();
    expect(code).toMatch(/^V\d{3,}$/);
  });

  test('should display owner information', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('OwnerView');
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

    // Should see owner section with customer name
    await expect(page.locator('text=Owner').first()).toBeVisible();
    await expect(page.locator(`text=${customerData.name}`).first()).toBeVisible();
  });

  test('should show edit button in vehicle view', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('EditBtn');
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

    const editButton = page.locator('[data-testid="edit-vehicle"]');
    await expect(editButton.first()).toBeVisible();
  });

  test('should show delete button in vehicle view', async ({ page }) => {
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('DeleteBtn');
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

    const deleteButton = page.locator('[data-testid="delete-vehicle"]');
    await expect(deleteButton.first()).toBeVisible();
  });
});

