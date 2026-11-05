import { expect, test } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#votacion')).toBeAttached()
})

test('shows the hero and has no horizontal overflow', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '¿Cuál será nuestra próxima aventura?' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Descubrir el viaje' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('explores a destination and switches country', async ({ page }) => {
  const section = page.locator('#destinos')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { name: 'Tailandia', level: 3 })).toBeVisible()
  await section.getByRole('button', { name: 'Malasia' }).click()
  await expect(section.getByRole('heading', { name: 'Malasia', level: 3 })).toBeVisible()
  await section.getByRole('button', { name: /Gastronomía/ }).click()
  await expect(section.getByText('Tres cocinas compitiendo')).toBeVisible()
  await expect(section.getByText('Nasi lemak, roti canai')).toBeVisible()
})

test('opens an itinerary day and syncs it with the map card', async ({ page }) => {
  const section = page.locator('#rutas')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByTestId('day')).toHaveCount(15)
  await section.getByRole('button', { name: /Excursión a Ayutthaya/ }).click()
  await expect(section.getByText('Ruinas en bici, tuk-tuk o barca.')).toBeVisible()
  await expect(section.getByTestId('map-card')).toContainText('Ayutthaya')
})

test('interacts with the map and its list alternative', async ({ page }) => {
  const section = page.locator('#rutas')
  await section.scrollIntoViewIfNeeded()
  await expect(section.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15_000 })
  await expect(section.locator('.map-marker')).toHaveCount(8)
  // Dispatched directly: at route zoom the marker can legitimately sit under its neighbour.
  await section.locator('.map-marker[aria-label="Koh Tao"]').dispatchEvent('click')
  await expect(section.getByTestId('map-card')).toContainText('Koh Tao')
  await expect(section.locator('.map-marker[aria-label="Koh Tao"]')).toHaveAttribute('data-active', 'true')

  await section.getByRole('button', { name: /^Malasia$/ }).click()
  await expect(section.locator('.map-marker')).toHaveCount(8)
  await section.getByTestId('route-stop').filter({ hasText: 'Perhentian Kecil' }).click()
  await expect(section.getByTestId('map-card')).toContainText('Perhentian Kecil')
})

test('switches to an alternative route with its caveat', async ({ page }) => {
  const section = page.locator('#rutas')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: /^Malasia$/ }).click()
  await section.getByRole('button', { name: 'Sabah y Semporna' }).click()
  await expect(section.getByText(/no cabe en 15 días/)).toBeVisible()
  await expect(section.getByTestId('day-count')).toHaveCount(0)
})

test('changes the trip duration', async ({ page }) => {
  const section = page.locator('#rutas')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: '16 días' }).click()
  await expect(section.getByTestId('day')).toHaveCount(16)
  await section.getByRole('button', { name: '14 días' }).click()
  await expect(section.getByTestId('day')).toHaveCount(14)
  await expect(section.getByTestId('day-count')).toHaveText('14 días')
})

test('the selected month updates recommendations', async ({ page }) => {
  const section = page.locator('#clima')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByTestId('advice-thailand')).toContainText('Golfo de Tailandia')
  await section.getByRole('button', { name: /^Ene/ }).click()
  await expect(section.getByTestId('advice-thailand')).toContainText('Andamán')
  await expect(section.getByTestId('region-eastcoast')).toContainText('Evitar')
  await expect(page.locator('#rutas').getByTestId('seasonal-advice')).toContainText('Enero')
  await expect(page.locator('#comparativa').getByText('Encaje con enero')).toBeAttached()
})

test('filters islands', async ({ page }) => {
  const section = page.locator('#islas')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: 'Mejor vida nocturna' }).click()
  await expect(section.getByTestId('island-name')).toHaveText('Koh Phangan')
  await section.getByRole('button', { name: 'Más tranquilas' }).click()
  await expect(section.getByTestId('island-name')).toHaveText(/Perhentian Besar|Lang Tengah/)
})

test('preference sliders update the match instantly and persist', async ({ page }) => {
  const section = page.locator('#comparativa')
  const slider = section.getByRole('slider', { name: 'Vida nocturna' })
  await slider.scrollIntoViewIfNeeded()
  const before = await section.getByTestId('match-thailand').textContent()
  await slider.fill('5')
  await expect(section.getByTestId('match-thailand')).not.toHaveText(before ?? '')
  await expect(section.getByTestId('match-explanation')).toContainText('Tailandia')
  await page.reload()
  await expect(page.getByRole('slider', { name: 'Vida nocturna' })).toHaveValue('5')
})

test('updates the personal budget view', async ({ page }) => {
  const section = page.locator('#presupuesto')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByTestId('total-thailand')).toContainText('1.520')
  await expect(section.getByTestId('total-thailand')).toContainText('2.610')
  await expect(section.getByTestId('total-malaysia')).toContainText('1.320')
  await section.getByLabel('Viajeros').fill('2')
  await expect(section.getByTestId('group-thailand')).toContainText('3.040')
})

test('the travelers field can be cleared and retyped', async ({ page }) => {
  const field = page.locator('#presupuesto').getByLabel('Viajeros')
  await field.scrollIntoViewIfNeeded()

  await field.click()
  await page.keyboard.type('5')
  await expect(field).toHaveValue('5')

  await page.keyboard.press('Backspace')
  await expect(field).toHaveValue('')
  await page.keyboard.type('12')
  await expect(field).toHaveValue('12')
  await expect(page.getByTestId('group-thailand')).toContainText('18.240')

  await page.keyboard.press('Control+a')
  await page.keyboard.press('Backspace')
  await field.blur()
  await expect(field).toHaveValue('12')

  await field.click()
  await page.keyboard.type('99')
  await field.blur()
  await expect(field).toHaveValue('30')
})

test('edits a price after signing in, and undoes it', async ({ page }) => {
  const section = page.locator('#presupuesto')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('button', { name: /^Editar/ })).toHaveCount(0)

  const voting = page.locator('#votacion')
  await voting.scrollIntoViewIfNeeded()
  await voting.getByLabel('Tu nombre').fill('Ana')
  await voting.getByRole('button', { name: 'Entrar' }).click()

  await section.getByRole('button', { name: 'Editar Vuelos internacionales, Tailandia' }).click()
  await section.getByLabel('Vuelos internacionales, Tailandia, mínimo').fill('5000')
  await section.getByRole('button', { name: 'Guardar para todos' }).click()
  await expect(section.getByRole('alert')).toContainText('mínimo igual o menor')

  await section.getByLabel('Vuelos internacionales, Tailandia, mínimo').fill('820')
  await section.getByLabel('Vuelos internacionales, Tailandia, nota').fill('<b>Qatar</b> en eDreams')
  await section.getByRole('button', { name: 'Guardar para todos' }).click()
  const item = section.getByTestId('item-thailand-flights')
  await expect(item).toContainText('Ana')
  await expect(item).toContainText('<b>Qatar</b> en eDreams')
  await expect(section.getByTestId('total-thailand')).toContainText('1.720')
  await expect(section.getByTestId('budget-status')).toContainText('1 precio actualizado')

  await page.reload()
  await expect(page.getByTestId('total-thailand')).toContainText('1.720')

  await page.getByRole('button', { name: 'Editar Vuelos internacionales, Tailandia' }).click()
  await page.getByRole('button', { name: 'Volver a la estimación inicial' }).click()
  await expect(page.getByTestId('total-thailand')).toContainText('1.520')
})

test('search links carry the route and the chosen dates', async ({ page }) => {
  const section = page.locator('#presupuesto')
  await section.getByLabel('Salida desde Madrid').scrollIntoViewIfNeeded()
  await section.getByLabel('Salida desde Madrid').fill('2027-05-15')
  const thailand = section.getByTestId('search-thailand')
  await expect(thailand.getByRole('link', { name: /^Skyscanner: Madrid/ })).toHaveAttribute('href', /flights\/mad\/bkk\/270515\/270529\//)
  await expect(thailand.getByRole('link', { name: /^eDreams: Madrid/ })).toHaveAttribute('href', /from=MAD;to=BKK;dep=2027-05-15;ret=2027-05-29/)
  await expect(section.getByTestId('search-malaysia').getByRole('link', { name: /^Google Flights: Madrid/ })).toHaveAttribute('href', /KUL/)
  await expect(thailand.getByRole('link', { name: /^Koh Tao · / })).toHaveAttribute('href', /booking\.com.*checkin=2027-05-2/)
  await expect(thailand.getByRole('link', { name: /^Koh Tao · / })).toHaveAttribute('target', '_blank')
})

test('signs in, votes, changes the vote and sees the final reveal in demo mode', async ({ page }) => {
  const section = page.locator('#votacion')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('note')).toContainText('solo en este navegador')

  await section.getByLabel('Tu nombre').fill('Ana')
  await section.getByRole('button', { name: 'Entrar' }).click()

  await section.getByRole('button', { name: 'Enviar mi voto' }).click()
  await expect(section.getByText('Elige Tailandia o Malasia.')).toBeVisible()

  await section.locator('label', { hasText: 'Malasia' }).click()
  await section.getByLabel(/Tu motivo/).fill('<b>Perhentian</b> en mayo')
  await section.getByRole('button', { name: 'Enviar mi voto' }).click()

  await expect(section.getByTestId('vote-confirmation')).toContainText('Has elegido Malasia')
  await expect(section.getByTestId('pct-malaysia')).toHaveText('100%')
  await expect(section.getByText('<b>Perhentian</b> en mayo').first()).toBeVisible()

  await page.reload()
  await page.locator('#votacion').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('vote-confirmation')).toContainText('Has elegido Malasia')

  await page.getByRole('button', { name: 'Cambiar mi voto' }).click()
  await page.locator('#votacion').locator('label', { hasText: 'Tailandia' }).click()
  await page.getByRole('button', { name: 'Actualizar mi voto' }).click()
  await expect(page.getByTestId('vote-confirmation')).toContainText('Has elegido Tailandia')

  await page.getByRole('button', { name: 'Simular el cierre de la votación' }).click()
  await expect(page.getByTestId('reveal-title')).toHaveText('Tailandia')
  await expect(page.getByRole('button', { name: 'Compartir el resultado' })).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByTestId('sign-in')).toBeVisible()
  await expect(page.getByTestId('reveal-title')).toHaveCount(0)
})

test('lists sources and credits', async ({ page }) => {
  await page.goto('/creditos')
  await expect(page.getByRole('heading', { name: 'Fuentes y créditos' })).toBeVisible()
  await expect(page.getByText(/CC BY/).first()).toBeVisible()
})
