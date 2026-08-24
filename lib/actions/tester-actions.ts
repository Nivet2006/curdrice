'use server';

import { runServiceTests, getEnvironmentAudit, EnvVariableAudit } from '@/lib/services/service-tester';
import { assertAdmin } from '@/lib/services/permission-service';

/**
 * Server action to run service diagnostic tests.
 * Enforces admin authority.
 */
export async function runServiceTestsAction(servicesToTest: string[]) {
  try {
    await assertAdmin();
    const results = await runServiceTests(servicesToTest, 'admin');
    return { data: results };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Server action to fetch environment variable configuration audit.
 * Admin only. Secrets are NEVER exposed.
 */
export async function getEnvironmentAuditAction(): Promise<{ data?: EnvVariableAudit[]; error?: string }> {
  try {
    await assertAdmin();
    const audit = getEnvironmentAudit();
    return { data: audit };
  } catch (error: any) {
    return { error: error.message };
  }
}
