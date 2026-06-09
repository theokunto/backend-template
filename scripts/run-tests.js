const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const projectRoot = path.join(__dirname, '..');
const teardownHook = path.join(projectRoot, 'tests', 'helpers', 'teardown.js');

function collectTests(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.test.js'))
    .map((file) => path.join(dir, file));
}

const integrationOrder = [
  'health.test.js',
  'auth.test.js',
  'rbac.test.js',
  'users.test.js',
  'approval-config.test.js',
  'approval-ux.test.js',
  'approval-workflow.test.js',
];

const integrationDir = path.join(projectRoot, 'tests', 'integration');
const integrationTests = integrationOrder
  .map((file) => path.join(integrationDir, file))
  .filter((file) => fs.existsSync(file));

const unitTests = collectTests(path.join(projectRoot, 'tests', 'unit'));
const contractTests = collectTests(path.join(projectRoot, 'tests', 'contract'));

const testFiles = [...unitTests, ...contractTests, ...integrationTests];

if (testFiles.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    '--test',
    '--test-concurrency=1',
    '--test-timeout=60000',
    '--import',
    pathToFileURL(teardownHook).href,
    ...testFiles,
  ],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
