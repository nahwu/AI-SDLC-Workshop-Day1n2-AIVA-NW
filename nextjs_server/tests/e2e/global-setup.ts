import { chromium, type FullConfig } from '@playwright/test'
import { addVirtualAuthenticator } from './auth-helpers'

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://127.0.0.1:3000'

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await addVirtualAuthenticator(page)

  await context.request.post(`${baseURL}/api/test/reset`)

  await page.goto(`${baseURL}/login`)
  await page.fill('#username', 'e2e-user')
  await page.getByRole('button', { name: 'Create passkey' }).click()
  await page.waitForURL(`${baseURL}/`)

  await context.storageState({ path: 'tests/e2e/auth-state.json' })
  await browser.close()
}
