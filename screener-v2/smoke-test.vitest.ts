import { test, describe, expect } from 'vitest';
import { chromium } from 'playwright';

const BASE_URL = 'https://screener-v2-staging.vercel.app';

describe('Workspace-aware Candidate UX Smoke Tests', () => {
  let browser: any;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test('Route /departments loads', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle' });

    expect(response?.status()).toBeLessThan(500);
    expect(response?.status()).toBeGreaterThanOrEqual(200);

    // Capture screenshot
    await page.screenshot({ path: 'smoke-screenshots/01-departments.png' });

    await context.close();
  });

  test('Route /people/candidates loads', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const response = await page.goto(`${BASE_URL}/people/candidates`, { waitUntil: 'networkidle' });

    expect(response?.status()).toBeLessThan(500);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    await page.screenshot({ path: 'smoke-screenshots/02-candidates-list.png' });

    await context.close();
  });

  test('Candidate profile structure loads', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/people/candidates`, { waitUntil: 'networkidle' });

    // Look for a candidate link and navigate
    const candidateLink = page.locator('a[href*="/candidates/"]').first();
    const isVisible = await candidateLink.isVisible().catch(() => false);

    if (isVisible) {
      await candidateLink.click();
      await page.waitForLoadState('networkidle');

      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);

      // Check for journey/milestone elements
      const hasJourney =
        content.includes('milestone') ||
        content.includes('journey') ||
        content.includes('stage') ||
        content.includes('Milestone');

      console.log('✓ Journey/milestone content found:', hasJourney);

      await page.screenshot({ path: 'smoke-screenshots/03-candidate-profile.png' });
    }

    await context.close();
  });

  test('No server 500 errors on main routes', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors: string[] = [];

    page.on('response', (response: any) => {
      if (response.status() >= 500) {
        errors.push(`${response.url()}: ${response.status()}`);
      }
    });

    await page.goto(`${BASE_URL}/departments`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.goto(`${BASE_URL}/people/candidates`, { waitUntil: 'networkidle' }).catch(() => {});

    expect(errors).toHaveLength(0);

    await context.close();
  });
});
