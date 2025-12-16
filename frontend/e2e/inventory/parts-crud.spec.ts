import { test, expect } from '@playwright/test';

test.describe('Parts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to Inventory
    await page.click('button:has-text("Inventory")');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible();
  });

  test('should display parts tab by default', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Parts")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search parts..."]')).toBeVisible();
  });

  test('should create a new part', async ({ page }) => {
    // Click Add Part button
    await page.click('button:has-text("Add Part")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Brake Pads');
    await page.fill('input[aria-label="Description"]', 'High performance ceramic brake pads');
    await page.fill('input[aria-label="SKU"]', 'BP-001');
    await page.fill('input[aria-label="Category"]', 'Brakes');
    await page.fill('input[aria-label="Unit Price"]', '45.99');
    await page.fill('input[aria-label="Cost Price"]', '25.00');
    await page.fill('input[aria-label="Stock Qty"]', '50');
    await page.fill('input[aria-label="Min Stock"]', '10');
    
    // Submit
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the part was created
    await expect(page.locator('td:has-text("Brake Pads")')).toBeVisible();
    await expect(page.locator('td:has-text("BP-001")')).toBeVisible();
    await expect(page.locator('td:has-text("$45.99")')).toBeVisible();
  });

  test('should edit an existing part', async ({ page }) => {
    // First create a part
    await page.click('button:has-text("Add Part")');
    await page.fill('input[aria-label="Name"]', 'Test Part');
    await page.fill('input[aria-label="Unit Price"]', '10.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Test Part")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Part") button').first().click();
    
    // Update the name
    await page.fill('input[aria-label="Name"]', 'Updated Part');
    await page.click('button:has-text("Save")');
    
    // Verify the update
    await expect(page.locator('td:has-text("Updated Part")')).toBeVisible();
  });

  test('should delete a part', async ({ page }) => {
    // First create a part to delete
    await page.click('button:has-text("Add Part")');
    await page.fill('input[aria-label="Name"]', 'Part To Delete');
    await page.fill('input[aria-label="Unit Price"]', '5.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Part To Delete")')).toBeVisible();
    
    // Click delete button (second button in the row)
    await page.locator('tr:has-text("Part To Delete") button').last().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify the part was deleted
    await expect(page.locator('td:has-text("Part To Delete")')).not.toBeVisible();
  });

  test('should show low stock warning', async ({ page }) => {
    // Create a part with low stock
    await page.click('button:has-text("Add Part")');
    await page.fill('input[aria-label="Name"]', 'Low Stock Part');
    await page.fill('input[aria-label="Unit Price"]', '20.00');
    await page.fill('input[aria-label="Stock Qty"]', '5');
    await page.fill('input[aria-label="Min Stock"]', '10');
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify low stock warning is displayed
    await expect(page.locator('tr:has-text("Low Stock Part") svg[data-testid="WarningIcon"]')).toBeVisible();
  });

  test('should search parts', async ({ page }) => {
    // Create a part
    await page.click('button:has-text("Add Part")');
    await page.fill('input[aria-label="Name"]', 'Searchable Part');
    await page.fill('input[aria-label="Unit Price"]', '15.00');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Searchable Part")')).toBeVisible();
    
    // Search for it
    await page.fill('input[placeholder="Search parts..."]', 'Searchable');
    await expect(page.locator('td:has-text("Searchable Part")')).toBeVisible();
    
    // Search for non-existent
    await page.fill('input[placeholder="Search parts..."]', 'NonExistent');
    await expect(page.locator('td:has-text("Searchable Part")')).not.toBeVisible();
  });
});

