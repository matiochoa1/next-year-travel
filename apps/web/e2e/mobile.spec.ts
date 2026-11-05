import { expect, test } from './fixtures'

test('compact navigation reaches a section and closes', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#votacion')).toBeAttached()
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  const menu = page.getByRole('dialog', { name: 'Menú de navegación' })
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: 'Islas' }).click()
  await expect(menu).toBeHidden()
  await expect(page.locator('#islas')).toBeInViewport()
})

test('touch targets of the main controls are large enough', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#rutas')).toBeAttached()
  const buttons = page.locator('#rutas button:visible')
  const heights = await buttons.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(40)
})

test('stays free of horizontal overflow in every section', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#votacion')).toBeAttached()
  for (const id of ['destinos', 'rutas', 'islas', 'clima', 'comparativa', 'presupuesto', 'votacion']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, id).toBeLessThanOrEqual(0)
  }
})
