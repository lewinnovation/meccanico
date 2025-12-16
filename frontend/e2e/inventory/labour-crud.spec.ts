import { test, expect } from '@playwright/test';

test.describe('Labour Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to Inventory and Labour tab
    await page.click('button:has-text("Inventory")');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible();
    await page.click('button[role="tab"]:has-text("Labour")');
  });

  test('should display labour tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Labour")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search labour..."]')).toBeVisible();
  });

  test('should create hourly labour rate', async ({ page }) => {
    // Click Add Labour button
    await page.click('button:has-text("Add Labour Rate")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Diagnostic Work');
    await page.fill('input[aria-label="Description"]', 'Vehicle diagnostic services');
    await page.fill('input[aria-label="Category"]', 'Diagnostics');
    await page.fill('input[aria-label="Hourly Rate"]', '95.00');
    await page.fill('input[aria-label="Default Hours"]', '1.5');
    
    // Submit
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the labour rate was created
    await expect(page.locator('td:has-text("Diagnostic Work")')).toBeVisible();
    await expect(page.locator('td:has-text("$95.00")')).toBeVisible();
    await expect(page.locator('text=Hourly')).toBeVisible();
  });

  test('should create flat rate labour', async ({ page }) => {
    // Click Add Labour button
    await page.click('button:has-text("Add Labour Rate")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Oil Change Service');
    await page.fill('input[aria-label="Description"]', 'Standard oil change labor');
    
    // Toggle flat rate
    await page.click('text=Flat Rate (fixed price, not per hour)');
    
    await page.fill('input[aria-label="Flat Rate"]', '35.00');
    
    // Submit
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the labour rate was created
    await expect(page.locator('td:has-text("Oil Change Service")')).toBeVisible();
    await expect(page.locator('td:has-text("$35.00")')).toBeVisible();
    await expect(page.locator('text=Flat Rate')).toBeVisible();
  });

  test('should edit an existing labour rate', async ({ page }) => {
    // First create a labour rate
    await page.click('button:has-text("Add Labour Rate")');
    await page.fill('input[aria-label="Name"]', 'Test Labour');
    await page.fill('input[aria-label="Hourly Rate"]', '50.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Test Labour")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Labour") button').first().click();
    
    // Update the rate
    await page.fill('input[aria-label="Hourly Rate"]', '75.00');
    await page.click('button:has-text("Save")');
    
    // Verify the update
    await expect(page.locator('td:has-text("$75.00")')).toBeVisible();
  });

  test('should delete a labour rate', async ({ page }) => {
    // First create a labour rate to delete
    await page.click('button:has-text("Add Labour Rate")');
    await page.fill('input[aria-label="Name"]', 'Labour To Delete');
    await page.fill('input[aria-label="Hourly Rate"]', '40.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Labour To Delete")')).toBeVisible();
    
    // Click delete button
    await page.locator('tr:has-text("Labour To Delete") button').last().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify the labour rate was deleted
    await expect(page.locator('td:has-text("Labour To Delete")')).not.toBeVisible();
  });
});

