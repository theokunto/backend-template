const auditRepository = require('../repositories/audit.repository');

async function log({ entityType, entityId, action, actorId, details, ipAddress }, connection) {
  return auditRepository.create(
    { entityType, entityId, action, actorId, details, ipAddress },
    connection
  );
}

async function getLogs(filters) {
  return auditRepository.findAll(filters);
}

module.exports = { log, getLogs };
