import { test as base } from '@playwright/test'

/** Keeps the suite independent from the public tile server, and fast. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          version: 8,
          sources: {},
          layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f3ecdc' } }],
        }),
      }),
    )
    await use(page)
  },
})

export { expect } from '@playwright/test'
