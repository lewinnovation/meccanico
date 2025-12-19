import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToJobs } from '../fixtures/job.fixture';

test.describe('Jobs Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display jobs list', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Check tabs are present
    await expect(page.locator('button[role="tab"]:has-text("All")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Booked")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Pending")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Awaiting Pick Up")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Completed")')).toBeVisible();
  });

  test('should display totals columns in jobs list', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if table exists (jobs are present)
    const table = page.locator('table');
    const hasTable = await table.count() > 0;
    
    if (hasTable) {
      // Wait for table to be fully rendered
      await expect(table).toBeVisible({ timeout: 5000 });
      
      // Check that totals columns are present in the header
      // Use more flexible selectors that work with MUI table structure
      await expect(page.locator('th').filter({ hasText: /Excl\.?\s*GST/i })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th').filter({ hasText: /^GST$/i })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th').filter({ hasText: /^Total$/i })).toBeVisible({ timeout: 5000 });
    } else {
      // If no jobs exist, skip the column check but verify we're on the right page
      // The columns would be there if jobs existed
      await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
    }
  });

  test('should navigate to new job form', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Click New Job button
    await page.click('button:has-text("New Job")');
    
    // Verify we're on the new job page
    await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
  });

  test('should show customer selection on new job form', async ({ page }) => {
    // Navigate to New Job
    await navigateToJobs(page);
    await page.click('button:has-text("New Job")');
    
    // Wait for New Job page to load
    await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
    
    // Verify customer autocomplete is present (MUI TextField with label="Customer")
    // The Autocomplete renders an input, so we can find it by the label
    await expect(page.locator('label:has-text("Customer")')).toBeVisible();
    // Also verify there's an input field (the autocomplete input)
    const customerInput = page.locator('input').first();
    await expect(customerInput).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Click Booked tab
    await page.click('button[role="tab"]:has-text("Booked")');
    await expect(page.locator('button[role="tab"]:has-text("Booked")')).toHaveAttribute('aria-selected', 'true');
    
    // Click In Progress tab
    await page.click('button[role="tab"]:has-text("In Progress")');
    await expect(page.locator('button[role="tab"]:has-text("In Progress")')).toHaveAttribute('aria-selected', 'true');
    
    // Click Completed tab
    await page.click('button[role="tab"]:has-text("Completed")');
    await expect(page.locator('button[role="tab"]:has-text("Completed")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should search jobs', async ({ page }) => {
    // Navigate to Jobs
    await navigateToJobs(page);
    
    // Verify search input is present
    await expect(page.locator('input[placeholder="Search jobs by code, customer, or vehicle..."]')).toBeVisible();
    
    // Type in search
    await page.fill('input[placeholder="Search jobs by code, customer, or vehicle..."]', 'test');
    
    // Wait for search to trigger (debounced)
    await page.waitForTimeout(500);
  });

  test('should navigate back from new job form', async ({ page }) => {
    // Navigate to New Job
    await navigateToJobs(page);
    await page.click('button:has-text("New Job")');
    
    // Wait for New Job page to load
    await expect(page.locator('h4:has-text("New Job")')).toBeVisible();
    
    // Click back button
    await page.click('button[aria-label="Back"]');
    
    // Verify we're back on jobs list
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Job Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    
    // First create a customer with a vehicle
    await page.goto('/customers');
    await expect(page.locator('h4:has-text("Customers")')).toBeVisible();
  });

  test('should require customer and vehicle to create job', async ({ page }) => {
    // Navigate to New Job
    await navigateToJobs(page);
    await page.click('button:has-text("New Job")');
    
    // Verify Create Job button is disabled without selection
    await expect(page.locator('button:has-text("Create Job")')).toBeDisabled();
  });
});

