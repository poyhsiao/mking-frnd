#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🧪 Testing jq health check fix...');

try {
  // Test the jq command that's used in GitHub Actions
  console.log('\n1. Testing jq command with docker compose output...');

  const dockerOutput = execSync('docker compose -f docker-compose.test.yml ps --format json', {
    encoding: 'utf8',
  });
  console.log('Docker compose output:');
  console.log(dockerOutput);

  // Test the fixed jq command
  const jqCommand =
    'docker compose -f docker-compose.test.yml ps --format json | jq -s -r ".[] | select(.Service == \\"postgres-test\\") | .Health"';
  console.log('\n2. Testing fixed jq command...');
  console.log('Command:', jqCommand);

  const healthStatus = execSync(jqCommand, { encoding: 'utf8', shell: '/bin/bash' }).trim();
  console.log('Health status result:', healthStatus);

  if (healthStatus === 'healthy' || healthStatus === 'starting') {
    console.log('✅ jq command is working correctly!');
  } else {
    console.log('❌ jq command returned unexpected result:', healthStatus);
  }

  // Test edge cases
  console.log('\n3. Testing edge cases...');

  // Test with non-existent service
  try {
    const nonExistentResult = execSync(
      'docker compose -f docker-compose.test.yml ps --format json | jq -s -r ".[] | select(.Service == \\"non-existent\\") | .Health"',
      { encoding: 'utf8', shell: '/bin/bash' },
    ).trim();
    console.log('Non-existent service result:', nonExistentResult || 'null');
  } catch (error) {
    console.log('Non-existent service test failed as expected');
  }

  console.log('\n🎉 All tests completed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
