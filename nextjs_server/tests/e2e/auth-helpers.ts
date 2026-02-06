import type { Page } from '@playwright/test'

type AuthenticatorClient = {
  send: (method: string, params?: Record<string, any>) => Promise<any>
}

export async function addVirtualAuthenticator(page: Page): Promise<AuthenticatorClient> {
  const client = await page.context().newCDPSession(page)
  await client.send('WebAuthn.enable')
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  })
  return client
}

export async function registerAndLogin(page: Page, username = 'test-user') {
  await addVirtualAuthenticator(page)
  await page.goto('/login')
  await page.fill('#username', username)
  await page.getByRole('button', { name: 'Create passkey' }).click()
  await page.waitForURL('**/')
}

export async function loginWithPasskey(page: Page, username = 'test-user') {
  await page.goto('/login')
  await page.fill('#username', username)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/')
}
