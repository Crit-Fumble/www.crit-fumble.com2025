/**
 * Global Teardown for Playwright Tests
 * Runs once after all tests complete
 */

import * as path from 'path';
import { processArtifacts } from './utils/artifact-processor';

async function globalTeardown() {
  const artifactsDir = path.join(__dirname, 'artifacts');

  // Process artifacts (convert videos, simplify names)
  await processArtifacts(artifactsDir);
}

export default globalTeardown;
