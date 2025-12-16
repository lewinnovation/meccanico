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
    await this.page.click('button:has-text("Add"), button:has-text("New Vehicle"), [data-testid="add-vehicle"]');
  }

  /**
   * Fill out vehicle form
   */
  async fillVehicleForm(data: VehicleData, customerName?: string) {
    // Select customer if provided
    if (customerName) {
      await this.page.click('[role="combobox"]:near(label:has-text("Customer"))');
      await this.page.fill('input[role="combobox"]', customerName);
      await this.page.click(`li:has-text("${customerName}")`);
    }

    // Fill make (autocomplete)
    const makeInput = this.page.locator('[data-testid="vehicle-make"]');
    await makeInput.fill(data.make);
    // Try to select from dropdown if available
    const makeOption = this.page.locator(`li:has-text("${data.make}")`).first();
    if (await makeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await makeOption.click();
    } else {
      await makeInput.press('Escape');
    }

    // Fill model (autocomplete)
    const modelInput = this.page.locator('[data-testid="vehicle-model"]');
    await modelInput.fill(data.model);
    const modelOption = this.page.locator(`li:has-text("${data.model}")`).first();
    if (await modelOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modelOption.click();
    } else {
      await modelInput.press('Escape');
    }

    // Fill optional fields
    if (data.year) {
      await this.page.click('[data-testid="vehicle-year"]');
      await this.page.click(`li:has-text("${data.year}")`);
    }
    if (data.color) {
      await this.page.fill('[data-testid="vehicle-color"]', data.color);
    }
    if (data.licensePlate) {
      await this.page.fill('[data-testid="vehicle-license-plate"]', data.licensePlate);
    }
    if (data.vin) {
      await this.page.fill('[data-testid="vehicle-vin"]', data.vin);
    }
    if (data.mileage) {
      await this.page.fill('[data-testid="vehicle-mileage"]', data.mileage);
    }
    if (data.notes) {
      await this.page.fill('[data-testid="vehicle-notes"]', data.notes);
    }
  }

  /**
   * Submit the vehicle form
   */
  async submitForm() {
    await this.page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
  }

  /**
   * Create a new vehicle (full flow)
   */
  async createVehicle(data: VehicleData, customerName: string) {
    await this.clickAddVehicle();
    await this.page.waitForTimeout(500); // Wait for dialog to open
    await this.fillVehicleForm(data, customerName);
    await this.submitForm();
    // Wait for dialog to close or navigation
    await this.page.waitForResponse(response => 
      response.url().includes('/vehicles') && response.status() < 400
    ).catch(() => {});
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

