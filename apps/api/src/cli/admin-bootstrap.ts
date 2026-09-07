import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const MIN_PASSWORD_CHARACTERS = 12;
const MAX_BCRYPT_BYTES = 72;

export interface AdminBootstrapConfig {
  email: string;
  username: string;
  password: string;
}

export type AdminBootstrapResult =
  | { status: 'created'; email: string; username: string }
  | { status: 'already-exists'; email: string; username: string };

export class AdminBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminBootstrapError';
  }
}

function readRequiredValue(
  env: NodeJS.ProcessEnv,
  name: 'ADMIN_EMAIL' | 'ADMIN_USERNAME' | 'ADMIN_PASSWORD',
): string {
  const value = env[name];
  if (!value) {
    throw new AdminBootstrapError(`${name} is required`);
  }
  return value;
}

/**
 * Reads the one-time bootstrap credentials without applying fallback values.
 * Production operators must make every identity and secret choice explicitly.
 */
export function readAdminBootstrapConfig(
  env: NodeJS.ProcessEnv,
): AdminBootstrapConfig {
  const email = readRequiredValue(env, 'ADMIN_EMAIL').trim().toLowerCase();
  const username = readRequiredValue(env, 'ADMIN_USERNAME').trim();
  const rawPassword = readRequiredValue(env, 'ADMIN_PASSWORD');
  const password = rawPassword.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminBootstrapError('ADMIN_EMAIL must be a valid email address');
  }
  if (!username) {
    throw new AdminBootstrapError('ADMIN_USERNAME must not be blank');
  }
  if (rawPassword !== password) {
    throw new AdminBootstrapError(
      'ADMIN_PASSWORD must not start or end with whitespace',
    );
  }
  if (Array.from(password).length < MIN_PASSWORD_CHARACTERS) {
    throw new AdminBootstrapError(
      `ADMIN_PASSWORD must contain at least ${MIN_PASSWORD_CHARACTERS} characters`,
    );
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_BCRYPT_BYTES) {
    throw new AdminBootstrapError(
      `ADMIN_PASSWORD must not exceed ${MAX_BCRYPT_BYTES} UTF-8 bytes`,
    );
  }

  return { email, username, password };
}

/**
 * Creates the first administrator only. Existing users are never promoted and
 * existing administrator passwords are never changed by this bootstrap path.
 */
export async function bootstrapAdmin(
  prisma: PrismaClient,
  config: AdminBootstrapConfig,
): Promise<AdminBootstrapResult> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: config.email }, { username: config.username }],
    },
    select: { email: true, username: true, role: true },
  });

  if (existing?.email === config.email) {
    if (existing.role === UserRole.ADMIN) {
      return {
        status: 'already-exists',
        email: existing.email,
        username: existing.username,
      };
    }
    throw new AdminBootstrapError(
      'A non-admin user already uses ADMIN_EMAIL; refusing to promote it',
    );
  }

  if (existing) {
    throw new AdminBootstrapError(
      'Another user already uses ADMIN_USERNAME; choose a different username',
    );
  }

  // This is a bootstrap path, not a general-purpose administrator creator.
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { email: true },
  });
  if (existingAdmin) {
    throw new AdminBootstrapError(
      `An administrator already exists (${existingAdmin.email}); refusing to create another`,
    );
  }

  const passwordHash = await bcrypt.hash(config.password, 10);
  const created = await prisma.user.create({
    data: {
      email: config.email,
      username: config.username,
      passwordHash,
      role: UserRole.ADMIN,
    },
    select: { email: true, username: true },
  });

  return { status: 'created', ...created };
}
