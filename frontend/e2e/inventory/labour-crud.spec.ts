import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/job.fixture';

test.describe('Labour Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to Inventory and Labour tab
    await page.goto('/inventory');
    await expect(page.locator('h4:has-text("Inventory")')).toBeVisible({ timeout: 10000 });
    await page.click('button[role="tab"]:has-text("Labour")');
    // Wait for Labour tab content to load
    await expect(page.locator('button:has-text("Add Labour Rate")')).toBeVisible({ timeout: 5000 });
  });

  test('should display labour tab', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Labour")')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('input[placeholder="Search labour..."]')).toBeVisible();
  });

  test('should create hourly labour rate', async ({ page }) => {
    // Click Add Labour button
    await page.click('button:has-text("Add Labour Rate")');
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Fill the form
    await page.getByLabel('Name').fill('Diagnostic Work');
    await page.getByLabel('Description').fill('Vehicle diagnostic services');
    await page.getByLabel('Category').fill('Diagnostics');
    await page.getByLabel('Hourly Rate').fill('95.00');
    await page.getByLabel('Default Hours').fill('1.5');
    
    // Submit - click within dialog
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the labour rate was created
    await expect(page.locator('td:has-text("Diagnostic Work")')).toBeVisible();
    await expect(page.locator('td:has-text("$95.00")')).toBeVisible();
    await expect(page.locator('text=Hourly')).toBeVisible();
  });

  test('should create flat rate labour', async ({ page }) => {
    // Click Add Labour button
    await page.click('button:has-text("Add Labour Rate")');
    
    // Wait for dialog to open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Fill the form
    await page.getByLabel('Name').fill('Oil Change Service');
    await page.getByLabel('Description').fill('Standard oil change labor');
    
    // Toggle flat rate
    await page.click('text=Flat Rate (fixed price, not per hour)');
    await page.waitForTimeout(300);
    
    await page.getByLabel('Flat Rate').fill('35.00');
    
    // Submit
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the labour rate was created
    await expect(page.locator('td:has-text("Oil Change Service")')).toBeVisible();
    await expect(page.locator('td:has-text("$35.00")')).toBeVisible();
    await expect(page.locator('text=Flat Rate')).toBeVisible();
  });

  test('should edit an existing labour rate', async ({ page }) => {
    // First create a labour rate
    await page.click('button:has-text("Add Labour Rate")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Test Labour');
    await page.getByLabel('Hourly Rate').fill('50.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Test Labour")')).toBeVisible();
    
    // Click edit button
    await page.locator('tr:has-text("Test Labour") button').first().click();
    
    // Update the rate
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Hourly Rate').fill('75.00');
    await dialog.locator('button:has-text("Save")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    
    // Verify the update
    await expect(page.locator('td:has-text("$75.00")')).toBeVisible();
  });

  test('should delete a labour rate', async ({ page }) => {
    // First create a labour rate to delete
    await page.click('button:has-text("Add Labour Rate")');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.getByLabel('Name').fill('Labour To Delete');
    await page.getByLabel('Hourly Rate').fill('40.00');
    await dialog.locator('button:has-text("Add")').click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('td:has-text("Labour To Delete")')).toBeVisible();
    
    // Click delete button
    await page.locator('tr:has-text("Labour To Delete") button').last().click();
    
    // Confirm deletion
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('button:has-text("Delete")').click();
    
    // Verify the labour rate was deleted
    await expect(page.locator('td:has-text("Labour To Delete")')).not.toBeVisible();
  });
});
