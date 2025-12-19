import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/job.fixture';

test.describe('Parts Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Inventory
    await page.goto('/inventory');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
  });

  test('should display parts tab by default', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Parts")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search parts..."]')).toBeVisible();
  });

  test('should create a new part', async ({ page }) => {
    // Click Add Part button
    await page.click('button:has-text("Add Part")');
    
    // Wait for dialog to open and content to be rendered
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500); // Wait for form to render
    
    // Fill the form - use getByLabel which works with MUI TextFields
    await page.getByLabel('Name').fill('Brake Pads');
    await page.getByLabel('Description').fill('High performance ceramic brake pads');
    await page.getByLabel('SKU').fill('BP-001');
    await page.getByLabel('Category').fill('Brakes');
    await page.getByLabel('Unit Price').fill('45.99');
    await page.getByLabel('Cost Price').fill('25.00');
    await page.getByLabel('Stock Qty').fill('50');
    await page.getByLabel('Min Stock').fill('10');
    
    // Submit - find Add button in DialogActions
    const addButton = dialog.locator('button').filter({ hasText: 'Add' }).last();
    await addButton.click();
    
    // Wait for success - either dialog closes or part appears in table
    await page.waitForTimeout(2000);
    
    // Verify the part was created
    await expect(page.locator('td:has-text("Brake Pads")')).toBeVisible({ timeout: 10000 });
  });

  test('should edit an existing part', async ({ page }) => {
    // First create a part
    await page.click('button:has-text("Add Part")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Test Part');
    await page.getByLabel('Unit Price').fill('10.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Test Part")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Part") button').first().click();
    
    // Update the name
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Updated Part');
    await dialog.locator('button:has-text("Save")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the update
    await expect(page.locator('td:has-text("Updated Part")')).toBeVisible();
  });

  test('should delete a part', async ({ page }) => {
    // First create a part to delete
    await page.click('button:has-text("Add Part")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Part To Delete');
    await page.getByLabel('Unit Price').fill('5.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Part To Delete")')).toBeVisible();
    
    // Click delete button (second button in the row)
    await page.locator('tr:has-text("Part To Delete") button').last().click();
    
    // Confirm deletion dialog
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('button:has-text("Delete")').click();
    
    // Verify the part was deleted
    await expect(page.locator('td:has-text("Part To Delete")')).not.toBeVisible();
  });

  test('should show low stock warning', async ({ page }) => {
    // Create a part with low stock
    await page.click('button:has-text("Add Part")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Low Stock Part');
    await page.getByLabel('Unit Price').fill('20.00');
    await page.getByLabel('Stock Qty').fill('5');
    await page.getByLabel('Min Stock').fill('10');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify low stock warning is displayed
    await expect(page.locator('tr:has-text("Low Stock Part") svg[data-testid="WarningIcon"]')).toBeVisible();
  });

  test('should search parts', async ({ page }) => {
    // Create a part
    await page.click('button:has-text("Add Part")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Searchable Part');
    await page.getByLabel('Unit Price').fill('15.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Searchable Part")')).toBeVisible();
    
    // Search for it
    await page.fill('input[placeholder="Search parts..."]', 'Searchable');
    await expect(page.locator('td:has-text("Searchable Part")')).toBeVisible();
    
    // Search for non-existent
    await page.fill('input[placeholder="Search parts..."]', 'NonExistent');
    await expect(page.locator('td:has-text("Searchable Part")')).not.toBeVisible();
  });
});

