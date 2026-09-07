/**
 * Browser tests use an isolated identity. Environment overrides let CI seed and
 * Playwright share credentials without referring to a production account.
 */
export const E2E_ADMIN = Object.freeze({
  email: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@example.test',
  username: process.env.E2E_ADMIN_USERNAME || 'e2e-admin',
  password: process.env.E2E_ADMIN_PASSWORD || 'e2e-admin-password',
})
