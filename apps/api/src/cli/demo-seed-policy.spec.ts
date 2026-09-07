import { assertDemoSeedAllowed, readDemoAdminConfig } from './demo-seed-policy';

describe('demo seed policy', () => {
  it('rejects production before seed database work can start', () => {
    expect(() => assertDemoSeedAllowed({ NODE_ENV: 'production' })).toThrow(
      'Demo seed requires NODE_ENV=development or NODE_ENV=test',
    );
  });

  it('fails closed when NODE_ENV is missing', () => {
    expect(() => assertDemoSeedAllowed({})).toThrow('Demo seed requires');
  });

  it('allows test mode with isolated example.test credentials', () => {
    expect(() => assertDemoSeedAllowed({ NODE_ENV: 'test' })).not.toThrow();
    expect(readDemoAdminConfig({})).toEqual({
      email: 'e2e-admin@example.test',
      username: 'e2e-admin',
      password: 'e2e-admin-password',
    });
  });
});
