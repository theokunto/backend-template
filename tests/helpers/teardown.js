const { after } = require('node:test');
const { closeTestEnvironment } = require('./setup');

// MySQL pool keeps the Node event loop alive; without this, the test run
// appears to hang after the first test file (often Maker-Approver workflow).
after(async () => {
  await closeTestEnvironment();
});
