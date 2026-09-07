import { PrismaClient } from '@prisma/client';
import {
  AdminBootstrapError,
  bootstrapAdmin,
  readAdminBootstrapConfig,
} from './admin-bootstrap';

/** Runs the explicit, one-time administrator bootstrap command. */
async function main() {
  // Validate configuration before constructing a database client or issuing I/O.
  const config = readAdminBootstrapConfig(process.env);
  const prisma = new PrismaClient();

  try {
    const result = await bootstrapAdmin(prisma, config);
    if (result.status === 'already-exists') {
      console.log(
        `Administrator already exists: ${result.email} (${result.username}); no changes made`,
      );
      return;
    }
    console.log(`Administrator created: ${result.email} (${result.username})`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message =
      error instanceof AdminBootstrapError
        ? error.message
        : 'Administrator bootstrap failed';
    console.error(message);
    process.exitCode = 1;
  });
}
