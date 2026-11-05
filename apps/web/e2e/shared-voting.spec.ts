import { expect, test } from './fixtures'
import type { Browser, Page } from '@playwright/test'

// Runs against the real API handlers (dev server) with an in-memory repository. The tests share
// one group, so they must not interleave. The dev server accepts a local stand-in for Google.
test.describe.configure({ mode: 'serial' })

const ADMIN = 'admin@example.com'
const suffix = Date.now().toString(36)
const email = (name: string) => `${name}.${suffix}@example.com`

async function open(browser: Browser, path = '/') {
  const page = await (await browser.newContext()).newPage()
  await page.goto(path)
  return page
}

async function signIn(page: Page, address: string) {
  await page.getByLabel('Email invitado (solo desarrollo)').fill(address)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

async function adminPage(browser: Browser) {
  const page = await open(browser, '/admin')
  await signIn(page, ADMIN)
  await expect(page.getByRole('heading', { name: 'Invitados' })).toBeVisible()
  return page
}

async function invite(admin: Page, ...addresses: string[]) {
  await admin.getByLabel(/Emails, separados/).fill(addresses.join(', '))
  await admin.getByRole('button', { name: 'Invitar' }).click()
  await expect(admin.getByTestId('invitation').filter({ hasText: addresses.at(-1) as string })).toBeVisible()
}

async function voter(browser: Browser, address: string, destination: 'Tailandia' | 'Malasia') {
  const page = await open(browser)
  const section = page.locator('#votacion')
  await section.scrollIntoViewIfNeeded()
  await signIn(page, address)
  await section.locator('label', { hasText: destination }).click()
  await section.getByRole('button', { name: 'Enviar mi voto' }).click()
  await expect(section.getByTestId('vote-confirmation')).toContainText(`Has elegido ${destination}`)
  return page
}

test('only invited people get in, and results stay hidden until then', async ({ browser }) => {
  const page = await open(browser)
  const section = page.locator('#votacion')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByTestId('sign-in')).toBeVisible()
  await expect(section.getByTestId('results')).toHaveCount(0)
  await signIn(page, email('stranger'))
  await expect(section.getByRole('alert')).toContainText('no está invitada')
  await expect(section.getByRole('button', { name: 'Enviar mi voto' })).toHaveCount(0)
})

test('friends share one result and keep their vote across devices', async ({ browser }) => {
  const admin = await adminPage(browser)
  await invite(admin, email('ana'), email('beto'))

  const first = await voter(browser, email('ana'), 'Malasia')
  await expect(first.locator('#votacion').getByRole('note')).toHaveCount(0)
  const initial = Number(await first.getByTestId('participants').textContent())

  const second = await voter(browser, email('beto'), 'Tailandia')
  await expect(second.getByTestId('participants')).toHaveText(String(initial + 1))

  await first.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(first.getByTestId('participants')).toHaveText(String(initial + 1))

  // Same account on a new device: the vote is there and no one is counted twice.
  const phone = await open(browser)
  await phone.locator('#votacion').scrollIntoViewIfNeeded()
  await signIn(phone, email('beto'))
  await expect(phone.getByTestId('vote-confirmation')).toContainText('Has elegido Tailandia')
  await expect(phone.getByTestId('participants')).toHaveText(String(initial + 1))

  await admin.reload()
  await expect(admin.getByTestId('invitation').filter({ hasText: email('ana') })).toContainText('Ha votado')
})

test('removing a friend revokes their access immediately', async ({ browser }) => {
  const admin = await adminPage(browser)
  await invite(admin, email('carla'))
  const friend = await voter(browser, email('carla'), 'Malasia')

  await admin.getByRole('button', { name: `Quitar a ${email('carla')}` }).click()
  await expect(admin.getByTestId('invitation').filter({ hasText: email('carla') })).toHaveCount(0)

  await friend.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(friend.getByTestId('sign-in')).toBeVisible()
})

test('a price edited by one friend reaches the other, and stale edits are refused', async ({ browser }) => {
  const admin = await adminPage(browser)
  await invite(admin, email('fede'), email('gema'))
  const [fede, gema] = [await voter(browser, email('fede'), 'Malasia'), await voter(browser, email('gema'), 'Tailandia')]
  const editor = (page: Page) => page.locator('#presupuesto')

  // Both open the same item before either saves.
  await editor(gema).getByRole('button', { name: 'Editar Comida (por día), Malasia' }).click()
  await editor(fede).getByRole('button', { name: 'Editar Comida (por día), Malasia' }).click()
  await editor(fede).getByLabel('Comida (por día), Malasia, mínimo').fill('18')
  await editor(fede).getByRole('button', { name: 'Guardar para todos' }).click()
  await expect(editor(fede).getByTestId('item-malaysia-food')).toContainText(`fede.${suffix}`)

  await editor(gema).getByLabel('Comida (por día), Malasia, mínimo').fill('5')
  await editor(gema).getByRole('button', { name: 'Guardar para todos' }).click()
  await expect(editor(gema).getByRole('alert')).toContainText('Alguien acaba de cambiar')
  await expect(editor(gema).getByTestId('item-malaysia-food')).toContainText(`fede.${suffix}`)
})

test('admin area refuses ordinary participants', async ({ browser }) => {
  const admin = await adminPage(browser)
  await invite(admin, email('dani'))
  const page = await open(browser, '/admin')
  await signIn(page, email('dani'))
  await expect(page.getByRole('alert')).toContainText('no tiene permisos')
  await expect(page.getByRole('heading', { name: 'Invitados' })).toHaveCount(0)
})

test('admin locks voting and the reveal reaches voters', async ({ browser }) => {
  const admin = await adminPage(browser)
  await invite(admin, email('eva'))
  const friend = await voter(browser, email('eva'), 'Malasia')

  await admin.getByRole('button', { name: 'Cerrar votación' }).click()
  await expect(admin.getByText('Cerrada')).toBeVisible()

  await friend.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(friend.getByTestId('final-reveal')).toBeVisible()

  await admin.getByRole('button', { name: 'Reabrir votación' }).click()
  await expect(admin.getByText('Abierta')).toBeVisible()
})
