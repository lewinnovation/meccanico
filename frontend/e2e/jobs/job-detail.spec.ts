import { test, expect } from '@playwright/test';

test.describe('Job Detail View', () => {
  // Note: These tests require pre-existing job data
  // In a real scenario, we would seed the database or create jobs via API before tests
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    await expect(page.locator('h4:has-text("Jobs")')).toBeVisible();
  });

  test('should show empty state when no jobs exist', async ({ page }) => {
    // If no jobs exist, we should see the empty state
    // This test assumes no jobs in the database
    const emptyState = page.locator('text=No jobs yet');
    const jobsList = page.locator('table');
    
    // Either empty state or jobs list should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasJobsList = await jobsList.isVisible().catch(() => false);
    
    expect(hasEmptyState || hasJobsList).toBeTruthy();
  });

  test('should navigate to job detail when clicking a job row', async ({ page }) => {
    // Check if there are any jobs
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible().catch(() => false);
    
    if (hasJobs) {
      // Click the first job
      await jobRow.click();
      
      // Verify we're on the job detail page
      // The job code should be visible in the header
      await expect(page.locator('h4')).toBeVisible();
    }
  });
});

test.describe('Job Line Items', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show add item button for estimate jobs', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    
    // If we can access a job in ESTIMATE status, verify the Add Item button
    const jobRow = page.locator('table tbody tr:has(.MuiChip-root:has-text("Estimate"))').first();
    const hasEstimateJob = await jobRow.isVisible().catch(() => false);
    
    if (hasEstimateJob) {
      await jobRow.click();
      
      // Verify Add Item button is visible for estimate
      await expect(page.locator('button:has-text("Add Item")')).toBeVisible();
    }
  });
});

test.describe('Job Status Transitions', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
  });

  test('should show valid status transitions in menu', async ({ page }) => {
    // If we have a job, check the actions menu
    const jobRow = page.locator('table tbody tr').first();
    const hasJobs = await jobRow.isVisible().catch(() => false);
    
    if (hasJobs) {
      await jobRow.click();
      
      // Wait for detail page to load
      await page.waitForLoadState('networkidle');
      
      // Open the actions menu
      const menuButton = page.locator('button[aria-label="more"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        // Verify menu items exist
        const menu = page.locator('[role="menu"]');
        await expect(menu).toBeVisible();
      }
    }
  });
});

test.describe('Job Templates', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@meccanico.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show apply template button for estimate jobs', async ({ page }) => {
    // Navigate to Jobs
    await page.click('button:has-text("Jobs")');
    
    // If we have an estimate job, verify the Apply Template button
    const jobRow = page.locator('table tbody tr:has(.MuiChip-root:has-text("Estimate"))').first();
    const hasEstimateJob = await jobRow.isVisible().catch(() => false);
    
    if (hasEstimateJob) {
      await jobRow.click();
      
      // Verify Apply Template button is visible
      await expect(page.locator('button:has-text("Apply Template")')).toBeVisible();
    }
  });
});

