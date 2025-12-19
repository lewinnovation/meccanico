import { Page, expect } from '@playwright/test';

/**
 * Customer test utilities and page object
 */

export interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export class CustomerPage {
  constructor(private page: Page) {}

  /**
   * Navigate to customers page
   */
  async goto() {
    await this.page.goto('/customers');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the add new customer button
   */
  async clickAddCustomer() {
    // Wait for page to be ready
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
    // Try multiple selectors
    const addButton = this.page.locator('button:has-text("New Customer"), button:has-text("Add Customer"), button:has-text("Add")').first();
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
    await addButton.click();
    // Wait for dialog to open
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill out customer form
   */
  async fillCustomerForm(data: CustomerData) {
    // Wait for form to be ready
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
    await this.page.waitForTimeout(200);
    
    if (data.name) {
      await this.page.getByLabel('Name').fill(data.name);
    }
    if (data.email) {
      await this.page.getByLabel('Email').fill(data.email);
    }
    if (data.phone) {
      await this.page.getByLabel('Phone').fill(data.phone);
    }
    if (data.address) {
      await this.page.getByLabel('Address').fill(data.address);
    }
    if (data.notes) {
      await this.page.getByLabel('Notes').fill(data.notes);
    }
  }

  /**
   * Submit the customer form
   */
  async submitForm() {
    // Wait a bit for form to be ready
    await this.page.waitForTimeout(200);
    // Find the submit button (Create or Save), excluding Cancel
    const submitButton = this.page.locator('button:has-text("Create"), button:has-text("Save")')
      .filter({ hasNotText: 'Cancel' })
      .first();
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait for button to be enabled (if it's disabled, wait a bit)
    let isEnabled = await submitButton.isEnabled();
    if (!isEnabled) {
      // Wait a bit more in case form is still validating
      await this.page.waitForTimeout(500);
      isEnabled = await submitButton.isEnabled();
    }
    
    if (isEnabled) {
      await submitButton.click();
      // Wait for dialog to close
      await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 }).catch(() => {});
    } else {
      // Button is disabled - this might be expected in validation tests
      // Don't throw, just return
      return;
    }
  }

  /**
   * Create a new customer (full flow)
   */
  async createCustomer(data: CustomerData) {
    await this.clickAddCustomer();
    await this.fillCustomerForm(data);
    await this.submitForm();
    // Wait for UI to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for customers
   */
  async search(query: string) {
    // Wait for search input to be visible
    const searchInput = this.page.locator('input[placeholder*="Search"], input[placeholder*="customer"], input[type="search"], [data-testid="search-input"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce and filtering
  }

  /**
   * Click on a customer row
   */
  async clickCustomer(name: string) {
    await this.page.click(`tr:has-text("${name}"), [data-testid="customer-row"]:has-text("${name}")`);
  }

  /**
   * Click edit button for a customer
   */
  async clickEdit() {
    await this.page.click('button:has-text("Edit"), [data-testid="edit-customer"], [aria-label="Edit"]');
  }

  /**
   * Click delete button
   */
  async clickDelete() {
    await this.page.click('button:has-text("Delete"), [data-testid="delete-customer"], [aria-label="Delete"]');
  }

  /**
   * Confirm delete dialog
   */
  async confirmDelete() {
    await this.page.click('button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]');
  }

  /**
   * Cancel delete dialog
   */
  async cancelDelete() {
    await this.page.click('button:has-text("Cancel"), button:has-text("No"), [data-testid="cancel-delete"]');
  }

  /**
   * Get all customer rows
   */
  async getCustomerRows() {
    return this.page.locator('tr[data-testid="customer-row"], tbody tr').all();
  }

  /**
   * Check if customer exists in list
   */
  async customerExists(name: string): Promise<boolean> {
    const customer = this.page.locator(`text=${name}`).first();
    return customer.isVisible();
  }

  /**
   * Get customer code from detail view
   */
  async getCustomerCode(): Promise<string | null> {
    const codeElement = this.page.locator('[data-testid="customer-code"], .customer-code');
    return codeElement.textContent();
  }
}

/**
 * Generate unique test customer data
 */
export function generateTestCustomer(prefix = 'Test'): CustomerData {
  const timestamp = Date.now();
  return {
    name: `${prefix} Customer ${timestamp}`,
    email: `test.customer.${timestamp}@example.com`,
    phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    address: `${Math.floor(Math.random() * 9999)} Test Street`,
    notes: `E2E test customer created at ${new Date().toISOString()}`,
  };
}

