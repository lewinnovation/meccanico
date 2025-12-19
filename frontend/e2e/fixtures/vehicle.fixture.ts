import { Page } from '@playwright/test';

/**
 * Vehicle test utilities and page object
 */

export interface VehicleData {
  make: string;
  model: string;
  year?: string;
  color?: string;
  licensePlate?: string;
  vin?: string;
  mileage?: string;
  notes?: string;
}

export class VehiclePage {
  constructor(private page: Page) {}

  /**
   * Navigate to vehicles page
   */
  async goto() {
    await this.page.goto('/vehicles');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the add new vehicle button
   */
  async clickAddVehicle() {
    // Wait for page to be ready
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
    const addButton = this.page.locator('button:has-text("New Vehicle"), button:has-text("Add Vehicle"), button:has-text("Add")').first();
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
    await addButton.click();
    // Wait for dialog to open
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill out vehicle form
   */
  async fillVehicleForm(data: VehicleData, customerName?: string) {
    // Wait for dialog to be ready
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await this.page.waitForTimeout(300);
    
    // Select customer if provided
    if (customerName) {
      // Get the Customer autocomplete input (combobox)
      const customerAutocomplete = this.page.getByRole('combobox', { name: 'Customer' });
      await customerAutocomplete.click();
      await this.page.waitForTimeout(200);
      await customerAutocomplete.fill(customerName);
      await this.page.waitForTimeout(300);
      // Click the option that contains the customer name
      const customerOption = this.page.locator(`[role="option"]:has-text("${customerName}")`).first();
      await customerOption.waitFor({ state: 'visible', timeout: 3000 });
      await customerOption.click();
      await this.page.waitForTimeout(200);
    }

    // Fill make (autocomplete) - use data-testid which is unique
    const makeInput = this.page.locator('[data-testid="vehicle-make"]');
    await makeInput.click();
    await this.page.waitForTimeout(200);
    await makeInput.fill(data.make);
    await this.page.waitForTimeout(500); // Wait for dropdown
    // Try to select from dropdown if available
    const makeOption = this.page.locator(`[role="option"]:has-text("${data.make}")`).first();
    if (await makeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await makeOption.click();
    } else {
      // Custom make - press Escape to close dropdown
      await makeInput.press('Escape');
    }
    await this.page.waitForTimeout(200);

    // Fill model (autocomplete) - use data-testid which is unique
    const modelInput = this.page.locator('[data-testid="vehicle-model"]');
    await modelInput.click();
    await this.page.waitForTimeout(200);
    await modelInput.fill(data.model);
    await this.page.waitForTimeout(500); // Wait for dropdown
    const modelOption = this.page.locator(`[role="option"]:has-text("${data.model}")`).first();
    if (await modelOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modelOption.click();
    } else {
      // Custom model - press Escape to close dropdown
      await modelInput.press('Escape');
    }
    await this.page.waitForTimeout(200);

    // Fill optional fields
    if (data.year) {
      // Year is a Select component (TextField with select prop) - use data-testid
      const yearSelect = this.page.locator('[data-testid="vehicle-year"]');
      await yearSelect.click();
      await this.page.waitForTimeout(500); // Wait for menu to open
      // Try to find the option - it might be in a Menu or List
      const yearOption = this.page.locator(`[role="option"]:has-text("${data.year}"), li[role="option"]:has-text("${data.year}")`).first();
      const optionVisible = await yearOption.isVisible({ timeout: 2000 }).catch(() => false);
      if (optionVisible) {
        await yearOption.click();
      }
      await this.page.waitForTimeout(200);
    }
    if (data.color) {
      await this.page.locator('[data-testid="vehicle-color"]').fill(data.color);
    }
    if (data.licensePlate) {
      await this.page.locator('[data-testid="vehicle-license-plate"]').fill(data.licensePlate);
    }
    if (data.vin) {
      await this.page.locator('[data-testid="vehicle-vin"]').fill(data.vin);
    }
    if (data.mileage) {
      await this.page.locator('[data-testid="vehicle-mileage"]').fill(data.mileage);
    }
    if (data.notes) {
      await this.page.locator('[data-testid="vehicle-notes"]').fill(data.notes);
    }
  }

  /**
   * Submit the vehicle form
   */
  async submitForm() {
    await this.page.waitForTimeout(200);
    // Find the submit button within dialog
    const dialog = this.page.locator('[role="dialog"]');
    const submitButton = dialog.locator('button').filter({ hasText: /^Create$|^Save$/ }).first();
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Create a new vehicle (full flow)
   */
  async createVehicle(data: VehicleData, customerName: string) {
    await this.clickAddVehicle();
    await this.fillVehicleForm(data, customerName);
    await this.submitForm();
    // Wait for UI to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for vehicles
   */
  async search(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.waitForTimeout(300); // Wait for debounce
  }

  /**
   * Click on a vehicle row
   */
  async clickVehicle(identifier: string) {
    await this.page.click(`tr:has-text("${identifier}"), [data-testid="vehicle-row"]:has-text("${identifier}")`);
  }

  /**
   * Click edit button for a vehicle
   */
  async clickEdit() {
    await this.page.click('button:has-text("Edit"), [data-testid="edit-vehicle"], [aria-label="Edit"]');
  }

  /**
   * Click delete button
   */
  async clickDelete() {
    await this.page.click('button:has-text("Delete"), [data-testid="delete-vehicle"], [aria-label="Delete"]');
  }

  /**
   * Confirm delete dialog
   */
  async confirmDelete() {
    await this.page.click('[data-testid="confirm-delete"]');
  }

  /**
   * Get vehicle code from detail view
   */
  async getVehicleCode(): Promise<string | null> {
    const codeElement = this.page.locator('[data-testid="vehicle-code"]');
    return codeElement.textContent();
  }

  /**
   * Check if vehicle exists in list
   */
  async vehicleExists(identifier: string): Promise<boolean> {
    const vehicle = this.page.locator(`text=${identifier}`).first();
    return vehicle.isVisible();
  }
}

/**
 * Generate unique test vehicle data
 */
export function generateTestVehicle(): VehicleData {
  const timestamp = Date.now();
  return {
    make: 'Toyota',
    model: 'Camry',
    year: '2023',
    color: 'Silver',
    licensePlate: `TEST${timestamp.toString().slice(-4)}`,
    mileage: '25000',
    notes: `E2E test vehicle created at ${new Date().toISOString()}`,
  };
}

/**
 * Generate unique test vehicle with custom make
 */
export function generateCustomVehicle(make: string, model: string): VehicleData {
  const timestamp = Date.now();
  return {
    make,
    model,
    year: '2022',
    color: 'Blue',
    licensePlate: `CUST${timestamp.toString().slice(-4)}`,
    mileage: '15000',
    notes: `Custom vehicle test at ${new Date().toISOString()}`,
  };
}

