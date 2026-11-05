import { defineConfig, devices } from '@playwright/test'

const DEMO_PORT = 4173
const FULLSTACK_PORT = 5174
const API_PORT = 7072

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      testMatch: 'experience.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEMO_PORT}` },
    },
    {
      name: 'mobile',
      testMatch: ['experience.spec.ts', 'mobile.spec.ts'],
      use: { ...devices['Pixel 7'], baseURL: `http://localhost:${DEMO_PORT}` },
    },
    {
      name: 'shared-voting',
      testMatch: 'shared-voting.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${FULLSTACK_PORT}` },
    },
  ],
  // Binaries are invoked directly: pnpm wrappers detach their children, which hangs Playwright's teardown.
  webServer: [
    {
      command: `./node_modules/.bin/vite build && exec ./node_modules/.bin/vite preview --port ${DEMO_PORT} --strictPort`,
      port: DEMO_PORT,
      env: { VITE_VOTING_MODE: 'demo' },
    },
    {
      command: 'exec node --import tsx src/dev-server.ts',
      cwd: '../api',
      port: API_PORT,
      env: { PORT: String(API_PORT), ALLOWED_ORIGINS: `http://localhost:${FULLSTACK_PORT}` },
    },
    {
      command: `exec ./node_modules/.bin/vite --mode fullstack --port ${FULLSTACK_PORT} --strictPort`,
      port: FULLSTACK_PORT,
      env: { VITE_API_PROXY: `http://localhost:${API_PORT}` },
    },
  ],
})
