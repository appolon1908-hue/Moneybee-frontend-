import { test, expect } from '@playwright/test'
test('marketing shell renders', async ({ page }) => { await page.goto('/'); await expect(page.getByRole('heading', { name: 'MoneyBee' })).toBeVisible() })
