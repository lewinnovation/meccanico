import { test, expect } from '@playwright/test';

test.describe('Services Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to Inventory and Services tab
    await page.click('button:has-text("Inventory")');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible();
    await page.click('button[role="tab"]:has-text("Services")');
  });

  test('should display services tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Services")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search services..."]')).toBeVisible();
  });

  test('should create a new service', async ({ page }) => {
    // Click Add Service button
    await page.click('button:has-text("Add Service")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Full Service');
    await page.fill('input[aria-label="Description"]', 'Complete vehicle service package');
    await page.fill('input[aria-label="Base Price"]', '199.99');
    await page.fill('input[aria-label="Category"]', 'Maintenance');
    
    // Submit
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the service was created
    await expect(page.locator('td:has-text("Full Service")')).toBeVisible();
    await expect(page.locator('td:has-text("$199.99")')).toBeVisible();
  });

  test('should edit an existing service', async ({ page }) => {
    // First create a service
    await page.click('button:has-text("Add Service")');
    await page.fill('input[aria-label="Name"]', 'Test Service');
    await page.fill('input[aria-label="Base Price"]', '100.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Test Service")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Service") button').first().click();
    
    // Update the price
    await page.fill('input[aria-label="Base Price"]', '150.00');
    await page.click('button:has-text("Save")');
    
    // Verify the update
    await expect(page.locator('td:has-text("$150.00")')).toBeVisible();
  });

  test('should delete a service', async ({ page }) => {
    // First create a service to delete
    await page.click('button:has-text("Add Service")');
    await page.fill('input[aria-label="Name"]', 'Service To Delete');
    await page.fill('input[aria-label="Base Price"]', '50.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Service To Delete")')).toBeVisible();
    
    // Click delete button
    await page.locator('tr:has-text("Service To Delete") button').last().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify the service was deleted
    await expect(page.locator('td:has-text("Service To Delete")')).not.toBeVisible();
  });

  test('should search services', async ({ page }) => {
    // Create a service
    await page.click('button:has-text("Add Service")');
    await page.fill('input[aria-label="Name"]', 'Searchable Service');
    await page.fill('input[aria-label="Base Price"]', '75.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Searchable Service")')).toBeVisible();
    
    // Search for it
    await page.fill('input[placeholder="Search services..."]', 'Searchable');
    await expect(page.locator('td:has-text("Searchable Service")')).toBeVisible();
    
    // Search for non-existent
    await page.fill('input[placeholder="Search services..."]', 'NonExistent');
    await expect(page.locator('td:has-text("Searchable Service")')).not.toBeVisible();
  });
});

