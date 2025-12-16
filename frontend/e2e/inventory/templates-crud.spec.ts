import { test, expect } from '@playwright/test';

test.describe('Templates Management', () => {
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
    
    // Click Templates tab
    await page.click('button[role="tab"]:has-text("Templates")');
    await expect(page.locator('input[placeholder="Search templates..."]')).toBeVisible();
  });

  test('should display templates tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Templates")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should create a new template without items', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Empty Template');
    await page.fill('textarea[aria-label="Description"]', 'A template with no items');
    
    // Submit the template
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the template was created
    await expect(page.locator('td:has-text("Empty Template")')).toBeVisible();
  });

  test('should create a global template', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Fill the form
    await page.fill('input[aria-label="Name"]', 'Global Template');
    
    // Toggle global switch
    await page.click('input[role="checkbox"]');
    
    // Submit
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the template was created with Global chip
    await expect(page.locator('tr:has-text("Global Template") .MuiChip-root:has-text("Global")')).toBeVisible();
  });

  test('should show item type selection when adding item', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Test Template');
    
    // Click Add Item
    await page.click('button:has-text("Add Item")');
    
    // Verify type selector shows with correct options
    await expect(page.locator('div[role="dialog"]:visible label:has-text("Type")')).toBeVisible();
    
    // Click the select and verify options
    await page.click('div[role="dialog"]:visible div[role="combobox"]');
    await expect(page.locator('li:has-text("Part (from inventory)")')).toBeVisible();
    await expect(page.locator('li:has-text("Labour")')).toBeVisible();
    await expect(page.locator('li:has-text("Service")')).toBeVisible();
    await expect(page.locator('li:has-text("Text (custom description)")')).toBeVisible();
  });

  test('should add text item to template', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Text Item Template');
    
    // Click Add Item
    await page.click('button:has-text("Add Item")');
    
    // Select Text type
    await page.click('div[role="dialog"]:visible div[role="combobox"]');
    await page.click('li:has-text("Text (custom description)")');
    
    // Fill text item details
    await page.fill('input[aria-label="Description"]', 'Custom text line');
    await page.fill('input[aria-label="Quantity"]', '2');
    await page.fill('input[aria-label="Unit Price"]', '50.00');
    
    // Add item
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').last().click();
    
    // Verify item was added
    await expect(page.locator('td:has-text("Custom text line")')).toBeVisible();
    
    // Submit the template
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').first().click();
    
    // Verify the template was created
    await expect(page.locator('tr:has-text("Text Item Template") td:has-text("1 items")')).toBeVisible();
  });

  test('should edit an existing template', async ({ page }) => {
    // First create a template
    await page.click('button:has-text("Add Template")');
    await page.fill('input[aria-label="Name"]', 'Test Template');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Test Template")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Template") button').first().click();
    
    // Update the name
    await page.fill('input[aria-label="Name"]', 'Updated Template');
    await page.click('button:has-text("Save")');
    
    // Verify the update
    await expect(page.locator('td:has-text("Updated Template")')).toBeVisible();
  });

  test('should delete a template', async ({ page }) => {
    // First create a template to delete
    await page.click('button:has-text("Add Template")');
    await page.fill('input[aria-label="Name"]', 'Template To Delete');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Template To Delete")')).toBeVisible();
    
    // Click delete button (second button in the row)
    await page.locator('tr:has-text("Template To Delete") button').last().click();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify the template was deleted
    await expect(page.locator('td:has-text("Template To Delete")')).not.toBeVisible();
  });

  test('should search templates', async ({ page }) => {
    // Create a template
    await page.click('button:has-text("Add Template")');
    await page.fill('input[aria-label="Name"]', 'Searchable Template');
    await page.click('button:has-text("Add"):not([disabled])');
    await expect(page.locator('td:has-text("Searchable Template")')).toBeVisible();
    
    // Search for it
    await page.fill('input[placeholder="Search templates..."]', 'Searchable');
    await expect(page.locator('td:has-text("Searchable Template")')).toBeVisible();
    
    // Search for non-existent
    await page.fill('input[placeholder="Search templates..."]', 'NonExistent');
    await expect(page.locator('td:has-text("Searchable Template")')).not.toBeVisible();
  });
});

