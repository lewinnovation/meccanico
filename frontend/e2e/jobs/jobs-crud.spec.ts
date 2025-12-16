import { test, expect } from '@playwright/test';

test.describe('Jobs Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display jobs list', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
    
    // Check tabs are present
    await expect(page.locator('button[role="tab"]:has-text("All")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Estimates")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Paid")')).toBeVisible();
  });

  test('should navigate to new job form', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
    
    // Click New Job button
    await page.click('button:has-text("New Job")');
    
    // Verify we're on the new job page
    await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
  });

  test('should show customer selection on new job form', async ({ page }) => {
    // Navigate to New Job
    await page.click('button:has-text("Jobs")');
    await page.click('button:has-text("New Job")');
    
    // Verify customer autocomplete is present
    await expect(page.locator('input[aria-label="Customer"]')).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
    
    // Click Estimates tab
    await page.click('button[role="tab"]:has-text("Estimates")');
    await expect(page.locator('button[role="tab"]:has-text("Estimates")')).toHaveAttribute('aria-selected', 'true');
    
    // Click In Progress tab
    await page.click('button[role="tab"]:has-text("In Progress")');
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should search jobs', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
    
    // Verify search input is present
    await expect(page.locator('input[placeholder="Search jobs by code, customer, or vehicle..."]')).toBeVisible();
    
    // Type in search
    await page.fill('input[placeholder="Search jobs by code, customer, or vehicle..."]', 'test');
    
    // Wait for search to trigger (debounced)
    await page.waitForTimeout(500);
  });

  test('should navigate back from new job form', async ({ page }) => {
    // Navigate to New Job
    await page.click('button:has-text("Jobs")');
    await page.click('button:has-text("New Job")');
    
    // Click back button
    await page.click('button[aria-label="Back"]');
    
    // Verify we're back on jobs list
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
  });
});

test.describe('Job Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // First create a customer with a vehicle
    await page.click('button:has-text("Customers")');
    await expect(page.locator('h4:has-text("Customers")')).toBeVisible();
  });

  test('should require customer and vehicle to create job', async ({ page }) => {
    // Navigate to New Job
    await page.click('button:has-text("Jobs")');
    await page.click('button:has-text("New Job")');
    
    // Verify Create Job button is disabled without selection
    await expect(page.locator('button:has-text("Create Job")')).toBeDisabled();
  });
});

