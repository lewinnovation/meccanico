import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/job.fixture';

test.describe('Templates Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Inventory
    await page.goto('/inventory');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
    
    // Click Templates tab
    await page.click('button[role="tab"]:has-text("Templates")');
    // Wait for Templates tab content to load
    await expect(page.locator('button:has-text("Add Template")')).toBeVisible({ timeout: 5000 });
  });

  test('should display templates tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Templates")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should create a new template without items', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
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
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
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
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Test Template');
    
    // Click Add Item
    await page.click('button:has-text("Add Item")');
    
    // Verify type selector shows with correct options
    await expect(page.locator('div[role="dialog"]:visible label:has-text("Type")')).toBeVisible();
    
    // Click the select and verify options - Text is first now
    await page.click('div[role="dialog"]:visible div[role="combobox"]');
    await expect(page.locator('li:has-text("Text (note/description)")')).toBeVisible();
    await expect(page.locator('li:has-text("Part (from inventory)")')).toBeVisible();
    await expect(page.locator('li:has-text("Labour")')).toBeVisible();
    await expect(page.locator('li:has-text("Service")')).toBeVisible();
  });

  test('should add text item to template', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Text Item Template');
    
    // Click Add Item
    await page.click('button:has-text("Add Item")');
    
    // TEXT is now the default type, just fill the description (no qty/price for text)
    await page.fill('textarea[aria-label="Text / Note"]', 'Custom text line');
    
    // Add item
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').last().click();
    
    // Verify item was added (shown in italic for text items)
    await expect(page.locator('td:has-text("Custom text line")')).toBeVisible();
    
    // Submit the template
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').first().click();
    
    // Verify the template was created
    await expect(page.locator('tr:has-text("Text Item Template") td:has-text("1 items")')).toBeVisible();
  });

  test('should add part item to template from autocomplete', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Part Template');
    
    // Click Add Item
    await page.click('button:has-text("Add Item")');
    
    // Change type to Part (from inventory)
    await page.click('div[role="dialog"]:visible div[role="combobox"]');
    await page.click('li:has-text("Part (from inventory)")');
    
    // The autocomplete should now be visible for selecting parts
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should support drag and drop reordering of items', async ({ page }) => {
    // Click Add Template button
    await page.click('button:has-text("Add Template")');
    
    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Fill the name
    await page.fill('input[aria-label="Name"]', 'Drag Test Template');
    
    // Add first text item
    await page.click('button:has-text("Add Item")');
    await page.fill('textarea[aria-label="Text / Note"]', 'First item');
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').last().click();
    
    // Add second text item
    await page.click('button:has-text("Add Item")');
    await page.fill('textarea[aria-label="Text / Note"]', 'Second item');
    await page.locator('div[role="dialog"]:visible button:has-text("Add"):not([disabled])').last().click();
    
    // Verify both items are visible with drag handles
    await expect(page.locator('td:has-text("First item")')).toBeVisible();
    await expect(page.locator('td:has-text("Second item")')).toBeVisible();
    await expect(page.locator('svg[data-testid="DragIndicatorIcon"]')).toHaveCount(2);
  });

  test('should edit an existing template', async ({ page }) => {
    // First create a template
    await page.click('button:has-text("Add Template")');
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
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
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
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
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
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

