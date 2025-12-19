import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/job.fixture';

test.describe('Services Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Inventory and Services tab
    await page.goto('/inventory');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
    await page.click('button[role="tab"]:has-text("Services")');
    // Wait for Services tab content to load
    await expect(page.locator('button:has-text("Add Service")')).toBeVisible({ timeout: 5000 });
  });

  test('should display services tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Services")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search services..."]')).toBeVisible();
  });

  test('should create a new service', async ({ page }) => {
    // Click Add Service button
    await page.click('button:has-text("Add Service")');
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Fill the form
    await page.getByLabel('Name').fill('Full Service');
    await page.getByLabel('Description').fill('Complete vehicle service package');
    await page.getByLabel('Base Price').fill('199.99');
    await page.getByLabel('Category').fill('Maintenance');
    
    // Submit
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the service was created
    await expect(page.locator('td:has-text("Full Service")')).toBeVisible();
    await expect(page.locator('td:has-text("$199.99")')).toBeVisible();
  });

  test('should edit an existing service', async ({ page }) => {
    // First create a service
    await page.click('button:has-text("Add Service")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Test Service');
    await page.getByLabel('Base Price').fill('100.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Test Service")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Service") button').first().click();
    
    // Update the price
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Base Price').fill('150.00');
    await dialog.locator('button:has-text("Save")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the update
    await expect(page.locator('td:has-text("$150.00")')).toBeVisible();
  });

  test('should delete a service', async ({ page }) => {
    // First create a service to delete
    await page.click('button:has-text("Add Service")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Service To Delete');
    await page.getByLabel('Base Price').fill('50.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Service To Delete")')).toBeVisible();
    
    // Click delete button
    await page.locator('tr:has-text("Service To Delete") button').last().click();
    
    // Confirm deletion
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('button:has-text("Delete")').click();
    
    // Verify the service was deleted
    await expect(page.locator('td:has-text("Service To Delete")')).not.toBeVisible();
  });

  test('should search services', async ({ page }) => {
    // Create a service
    await page.click('button:has-text("Add Service")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Searchable Service');
    await page.getByLabel('Base Price').fill('75.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Searchable Service")')).toBeVisible();
    
    // Search for it
    await page.fill('input[placeholder="Search services..."]', 'Searchable');
    await expect(page.locator('td:has-text("Searchable Service")')).toBeVisible();
    
    // Search for non-existent
    await page.fill('input[placeholder="Search services..."]', 'NonExistent');
    await expect(page.locator('td:has-text("Searchable Service")')).not.toBeVisible();
  });
});
