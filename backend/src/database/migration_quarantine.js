const fs = require('fs');
const path = require('path');

function isMechanicallyCertainTypeError(error) {
  return error && (
    error.code === '42804' ||
    error.code === '42830' ||
    /foreign key constraint cannot be implemented|incompatible types|are of incompatible types/i.test(error.message || '')
  );
}

function quarantineMigration(migrationsDir, filename, error) {
  const quarantineDir = path.join(migrationsDir, 'quarantined');
  fs.mkdirSync(quarantineDir, { recursive: true });
  const markerPath = path.join(quarantineDir, `${filename}.json`);
  fs.writeFileSync(markerPath, JSON.stringify({
    filename,
    reason: 'mechanically-certain foreign-key or datatype incompatibility',
    postgresCode: error.code || null,
    message: error.message,
    quarantinedAt: new Date().toISOString()
  }, null, 2) + '\n', 'utf8');
  return markerPath;
}

module.exports = { isMechanicallyCertainTypeError, quarantineMigration };
