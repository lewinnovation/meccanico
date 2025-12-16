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
    await this.page.click('button:has-text("Add"), button:has-text("New Customer"), [data-testid="add-customer"]');
  }

  /**
   * Fill out customer form
   */
  async fillCustomerForm(data: CustomerData) {
    if (data.name) {
      await this.page.fill('input[name="name"], input[placeholder*="Name"], [data-testid="customer-name"]', data.name);
    }
    if (data.email) {
      await this.page.fill('input[name="email"], input[type="email"], [data-testid="customer-email"]', data.email);
    }
    if (data.phone) {
      await this.page.fill('input[name="phone"], input[type="tel"], [data-testid="customer-phone"]', data.phone);
    }
    if (data.address) {
      await this.page.fill('input[name="address"], textarea[name="address"], [data-testid="customer-address"]', data.address);
    }
    if (data.notes) {
      await this.page.fill('input[name="notes"], textarea[name="notes"], [data-testid="customer-notes"]', data.notes);
    }
  }

  /**
   * Submit the customer form
   */
  async submitForm() {
    await this.page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
  }

  /**
   * Create a new customer (full flow)
   */
  async createCustomer(data: CustomerData) {
    await this.clickAddCustomer();
    await this.fillCustomerForm(data);
    await this.submitForm();
    // Wait for either success message or navigation
    await this.page.waitForResponse(response => 
      response.url().includes('/customers') && response.status() < 400
    ).catch(() => {});
  }

  /**
   * Search for customers
   */
  async search(query: string) {
    await this.page.fill('input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]', query);
    await this.page.waitForTimeout(300); // Wait for debounce
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

