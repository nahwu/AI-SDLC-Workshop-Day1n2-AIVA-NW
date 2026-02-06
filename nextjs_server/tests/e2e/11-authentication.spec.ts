import { test, expect } from '@playwright/test'
import { loginWithPasskey, registerAndLogin } from './auth-helpers'

test.describe('Feature 11: Authentication (WebAuthn)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/test/reset')
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('registers a new user with passkey', async ({ page }) => {
    await registerAndLogin(page, 'auth-user')
    await expect(page.getByText('Welcome, auth-user')).toBeVisible()
  })

  test('logs in an existing user with passkey', async ({ page }) => {
    await registerAndLogin(page, 'auth-user')
    await page.getByTestId('logout-button').click()
    await expect(page).toHaveURL(/\/login/)

    await loginWithPasskey(page, 'auth-user')
    await expect(page.getByText('Welcome, auth-user')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    await registerAndLogin(page, 'auth-user')
    await page.getByTestId('logout-button').click()
    await expect(page).toHaveURL(/\/login/)

    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page redirects authenticated user', async ({ page }) => {
    await registerAndLogin(page, 'auth-user')
    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
  })
})
