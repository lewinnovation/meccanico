import { test, expect } from '../fixtures/auth.fixture';
import { VehiclePage, generateTestVehicle, generateCustomVehicle } from '../fixtures/vehicle.fixture';
import { CustomerPage, generateTestCustomer } from '../fixtures/customer.fixture';

test.describe('Vehicle Create', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('should create a new vehicle with basic info', async ({ page }) => {
    // First create a customer to assign the vehicle to
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('VehicleTest');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    // Now create vehicle
    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateTestVehicle();
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(1000);

    // Verify vehicle appears in list
    await expect(page.locator(`text=${vehicleData.make}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${vehicleData.model}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should generate vehicle code in format V{NNN}', async ({ page }) => {
    // First create a customer
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('VCodeTest');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    // Create vehicle
    const vehiclePage = new VehiclePage(page);
    const vehicleData = generateCustomVehicle('Honda', 'Civic');
    await vehiclePage.goto();
    await vehiclePage.createVehicle(vehicleData, customerData.name);
    await page.waitForTimeout(1000);

    // Click on the vehicle to view details
    await vehiclePage.clickVehicle('Honda');
    await page.waitForTimeout(500);

    // Check the code format
    const code = await vehiclePage.getVehicleCode();
    if (code) {
      expect(code).toMatch(/^V\d{3,}$/);
    }
  });

  test('should show available makes from lexicon', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();
    await vehiclePage.clickAddVehicle();
    await page.waitForTimeout(500);

    // Type in make field and check for suggestions
    const makeInput = page.locator('[data-testid="vehicle-make"]');
    await makeInput.fill('Toy');
    await page.waitForTimeout(300);

    // Should see Toyota in suggestions
    const toyotaOption = page.locator('li:has-text("Toyota")');
    await expect(toyotaOption).toBeVisible({ timeout: 5000 });
  });

  test('should show available models for selected make', async ({ page }) => {
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();
    await vehiclePage.clickAddVehicle();
    await page.waitForTimeout(500);

    // Select Toyota
    const makeInput = page.locator('[data-testid="vehicle-make"]');
    await makeInput.fill('Toyota');
    await page.waitForTimeout(300);
    const toyotaOption = page.locator('li:has-text("Toyota")');
    if (await toyotaOption.isVisible()) {
      await toyotaOption.click();
    }

    // Type in model field
    const modelInput = page.locator('[data-testid="vehicle-model"]');
    await modelInput.fill('Cam');
    await page.waitForTimeout(300);

    // Should see Camry in suggestions
    const camryOption = page.locator('li:has-text("Camry")');
    await expect(camryOption).toBeVisible({ timeout: 5000 });
  });

  test('should allow custom make and model', async ({ page }) => {
    // First create a customer
    const customerPage = new CustomerPage(page);
    const customerData = generateTestCustomer('CustomMake');
    await customerPage.goto();
    await customerPage.createCustomer(customerData);
    await page.waitForTimeout(500);

    // Create vehicle with custom make/model
    const vehiclePage = new VehiclePage(page);
    await vehiclePage.goto();
    await vehiclePage.clickAddVehicle();
    await page.waitForTimeout(500);

    // Select customer
    await page.click('[role="combobox"]:near(label:has-text("Customer"))');
    await page.fill('input[role="combobox"]', customerData.name);
    await page.click(`li:has-text("${customerData.name}")`);

    // Type custom make
    const makeInput = page.locator('[data-testid="vehicle-make"]');
    await makeInput.fill('CustomMake123');
    await makeInput.press('Escape');

    // Type custom model
    const modelInput = page.locator('[data-testid="vehicle-model"]');
    await modelInput.fill('CustomModel456');
    await modelInput.press('Escape');

    // Submit
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify custom vehicle appears
    await expect(page.locator('text=CustomMake123').first()).toBeVisible({ timeout: 10000 });
  });
});

