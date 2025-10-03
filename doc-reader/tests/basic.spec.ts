import { test, expect } from '@playwright/test';

test.describe('Doc Reader Basic Flow', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Doc Reader' })).toBeVisible();

    // Check for URL input
    const urlInput = page.getByPlaceholder('https://docs.example.com');
    await expect(urlInput).toBeVisible();

    // Check for generate button
    const generateButton = page.getByRole('button', { name: /Generate/i });
    await expect(generateButton).toBeVisible();
  });

  test('URL input validation works', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.getByPlaceholder('https://docs.example.com');
    const generateButton = page.getByRole('button', { name: /Generate/i });

    // Try submitting empty form
    await generateButton.click();

    // Button should be disabled when input is empty
    await expect(generateButton).toBeDisabled();
  });

  test('guide list shows empty state initially', async ({ page }) => {
    await page.goto('/');

    // Check for "Your Guides" section
    await expect(page.getByText('Your Guides')).toBeVisible();
  });

  test('empty state shows when no guide selected', async ({ page }) => {
    await page.goto('/');

    // Check for empty state message
    await expect(page.getByText('No guide selected')).toBeVisible();
    await expect(
      page.getByText('Enter a documentation URL above or select a guide from the list')
    ).toBeVisible();
  });
});
