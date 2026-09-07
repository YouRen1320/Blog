export interface DemoAdminConfig {
  email: string;
  username: string;
  password: string;
}

export class DemoSeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoSeedError';
  }
}

/** Prevents sample content from ever being written by a production process. */
export function assertDemoSeedAllowed(env: NodeJS.ProcessEnv) {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    throw new DemoSeedError(
      'Demo seed requires NODE_ENV=development or NODE_ENV=test',
    );
  }
}

/** Supplies isolated, non-production credentials for local and browser tests. */
export function readDemoAdminConfig(env: NodeJS.ProcessEnv): DemoAdminConfig {
  return {
    email:
      env.E2E_ADMIN_EMAIL?.trim().toLowerCase() || 'e2e-admin@example.test',
    username: env.E2E_ADMIN_USERNAME?.trim() || 'e2e-admin',
    password: env.E2E_ADMIN_PASSWORD || 'e2e-admin-password',
  };
}
