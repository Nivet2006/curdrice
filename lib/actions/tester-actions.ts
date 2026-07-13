'use server';

import { runServiceTests } from '@/lib/services/service-tester';
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
