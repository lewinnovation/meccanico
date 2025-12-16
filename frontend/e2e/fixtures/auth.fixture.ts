import { test as base, Page } from '@playwright/test';

/**
 * Extended test fixture with authentication helpers
 */

export interface AuthFixture {
  /** Login as admin user */
  loginAsAdmin: () => Promise<void>;
  /** Login with specific credentials */
  login: (email: string, password: string) => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Authenticated page */
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixture>({
  loginAsAdmin: async ({ page }, use) => {
    const loginAsAdmin = async () => {
      await page.goto('/login');
      // MUI TextField - use type selectors
      await page.fill('input[type="email"]', 'admin@meccanico.dev');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      // Wait for the dashboard to load (look for sidebar or dashboard content)
      await page.waitForSelector('[data-testid="sidebar"], nav, .MuiDrawer-root', { timeout: 15000 });
    };
    await use(loginAsAdmin);
  },

  login: async ({ page }, use) => {
    const login = async (email: string, password: string) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="sidebar"], nav, .MuiDrawer-root', { timeout: 15000 });
    };
    await use(login);
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Click on user menu or logout button
      await page.click('[data-testid="logout-button"], [aria-label="Logout"]');
      await page.waitForURL('**/login');
    };
    await use(logout);
  },

  authenticatedPage: async ({ page, loginAsAdmin }, use) => {
    await loginAsAdmin();
    await use(page);
  },
});

export { expect } from '@playwright/test';

