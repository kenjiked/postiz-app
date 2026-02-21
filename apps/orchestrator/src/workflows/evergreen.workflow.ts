import { proxyActivities, sleep } from '@temporalio/workflow';
import { EvergreenActivity } from '@gitroom/orchestrator/activities/evergreen.activity';

const { getAllOrganizationIds, processEvergreenForOrganization } =
  proxyActivities<EvergreenActivity>({
    startToCloseTimeout: '10 minute',
    taskQueue: 'main',
    retry: {
      maximumAttempts: 3,
      backoffCoefficient: 1,
      initialInterval: '2 minutes',
    },
  });

export async function evergreenWorkflow() {
  while (true) {
    try {
      const orgIds = await getAllOrganizationIds();
      for (const orgId of orgIds) {
        try {
          await processEvergreenForOrganization(orgId);
        } catch (err) {}
      }
    } catch (err) {}
    // Run every 6 hours
    await sleep(6 * 60 * 60 * 1000);
  }
}
