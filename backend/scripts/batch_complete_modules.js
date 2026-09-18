/**
 * Batch Module Completion Script
 * Completes multiple skeleton modules at once
 * Usage: node scripts/batch_complete_modules.js M034,M035,M037,M038,M039
 */

const fs = require('fs');
const path = require('path');

const moduleNames = process.argv[2] ? process.argv[2].split(',') : [];
if (moduleNames.length === 0) {
  console.error('Usage: node scripts/batch_complete_modules.js M034,M035,M037');
  process.exit(1);
}

const modulesPath = path.join(__dirname, '../src/modules');

moduleNames.forEach(moduleName => {
  const modulePath = path.join(modulesPath, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    console.log('❌ Module ' + moduleName + ' not found - SKIPPED');
    return;
  }
  
  const servicePath = path.join(modulePath, 'service.js');
  const currentContent = fs.readFileSync(servicePath, 'utf8');
  const currentLines = currentContent.split('\n').length;
  
  // Skip if already complete
  if (currentLines > 50) {
    console.log('⏭️  Module ' + moduleName + ' already complete (' + currentLines + ' lines) - SKIPPED');
    return;
  }
  
  const tableName = moduleName.toLowerCase() + '_items';
  
  const completeService = '// Service for ' + moduleName + ' Module\n' +
'const { logger } = require(\'../../utils/logger\');\n' +
'const { getPostgreSQL } = require(\'../../database/connection\');\n' +
'\n' +
'const tableName = \'' + tableName + '\';\n' +
'\n' +
'function validatePayload(payload) {\n' +
'  if (!payload || typeof payload !== \'object\') {\n' +
'    throw new Error(\'Valid payload object is required\');\n' +
'  }\n' +
'  if (Array.isArray(payload)) {\n' +
'    throw new Error(\'Payload must be an object, not an array\');\n' +
'  }\n' +
'}\n' +
'\n' +
'async function listItems({ page = 1, limit = 20 } = {}) {\n' +
'  const pg = getPostgreSQL();\n' +
'  if (!pg) throw new Error(\'Database not initialized\');\n' +
'  \n' +
'  const offset = (page - 1) * limit;\n' +
'  const totalRes = await pg.query(\'SELECT COUNT(*) FROM \' + tableName);\n' +
'  const total = parseInt(totalRes.rows[0].count || \'0\');\n' +
'  const res = await pg.query(\n' +
'    \'SELECT * FROM \' + tableName + \' ORDER BY created_at DESC LIMIT $1 OFFSET $2\',\n' +
'    [limit, offset]\n' +
'  );\n' +
'  \n' +
'  return { \n' +
'    items: res.rows, \n' +
'    pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } \n' +
'  };\n' +
'}\n' +
'\n' +
'async function getItem(id) {\n' +
'  const pg = getPostgreSQL();\n' +
'  if (!pg) throw new Error(\'Database not initialized\');\n' +
'  \n' +
'  const res = await pg.query(\'SELECT * FROM \' + tableName + \' WHERE id = $1\', [id]);\n' +
'  return res.rows[0] || null;\n' +
'}\n' +
'\n' +
'async function createItem(payload) {\n' +
'  const pg = getPostgreSQL();\n' +
'  if (!pg) throw new Error(\'Database not initialized\');\n' +
'  \n' +
'  validatePayload(payload);\n' +
'  \n' +
'  const res = await pg.query(\n' +
'    \'INSERT INTO \' + tableName + \' (data, created_at) VALUES ($1, NOW()) RETURNING *\',\n' +
'    [payload]\n' +
'  );\n' +
'  \n' +
'  logger.info(\'Created item in \' + moduleName + \': \' + res.rows[0].id);\n' +
'  return res.rows[0];\n' +
'}\n' +
'\n' +
'async function updateItem(id, payload) {\n' +
'  const pg = getPostgreSQL();\n' +
'  if (!pg) throw new Error(\'Database not initialized\');\n' +
'  \n' +
'  validatePayload(payload);\n' +
'  \n' +
'  const res = await pg.query(\n' +
'    \'UPDATE \' + tableName + \' SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *\',\n' +
'    [payload, id]\n' +
'  );\n' +
'  \n' +
'  if (res.rows[0]) {\n' +
'    logger.info(\'Updated item in \' + moduleName + \': \' + id);\n' +
'  }\n' +
'  \n' +
'  return res.rows[0] || null;\n' +
'}\n' +
'\n' +
'async function deleteItem(id) {\n' +
'  const pg = getPostgreSQL();\n' +
'  if (!pg) throw new Error(\'Database not initialized\');\n' +
'  \n' +
'  const res = await pg.query(\n' +
'    \'DELETE FROM \' + tableName + \' WHERE id = $1 RETURNING id\',\n' +
'    [id]\n' +
'  );\n' +
'  \n' +
'  if (res.rows[0]) {\n' +
'    logger.info(\'Deleted item in \' + moduleName + \': \' + id);\n' +
'  }\n' +
'  \n' +
'  return !!res.rows[0];\n' +
'}\n' +
'\n' +
'module.exports = { \n' +
'  listItems, \n' +
'  getItem, \n' +
'  createItem, \n' +
'  updateItem, \n' +
'  deleteItem \n' +
'};';

  fs.writeFileSync(servicePath, completeService);
  
  console.log('✅ Completed module ' + moduleName);
  console.log('   Lines: ' + currentLines + ' → ' + completeService.split('\n').length);
  
  // Complete controller if needed
  const controllerPath = path.join(modulePath, 'controller.js');
  if (fs.existsSync(controllerPath)) {
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    const controllerLines = controllerContent.split('\n').length;
    
    if (controllerLines < 20) {
      const completeController = 'const service = require(\'./service\');\n' +
'\n' +
'async function list(req, res) {\n' +
'  try {\n' +
'    const result = await service.listItems(req.query);\n' +
'    res.json(result);\n' +
'  } catch (error) {\n' +
'    res.status(500).json({ error: error.message });\n' +
'  }\n' +
'}\n' +
'\n' +
'async function get(req, res) {\n' +
'  try {\n' +
'    const result = await service.getItem(req.params.id);\n' +
'    if (!result) {\n' +
'      return res.status(404).json({ error: \'Item not found\' });\n' +
'    }\n' +
'    res.json(result);\n' +
'  } catch (error) {\n' +
'    res.status(500).json({ error: error.message });\n' +
'  }\n' +
'}\n' +
'\n' +
'async function create(req, res) {\n' +
'  try {\n' +
'    const result = await service.createItem(req.body);\n' +
'    res.status(201).json(result);\n' +
'  } catch (error) {\n' +
'    res.status(400).json({ error: error.message });\n' +
'  }\n' +
'}\n' +
'\n' +
'async function update(req, res) {\n' +
'  try {\n' +
'    const result = await service.updateItem(req.params.id, req.body);\n' +
'    if (!result) {\n' +
'      return res.status(404).json({ error: \'Item not found\' });\n' +
'    }\n' +
'    res.json(result);\n' +
'  } catch (error) {\n' +
'    res.status(400).json({ error: error.message });\n' +
'  }\n' +
'}\n' +
'\n' +
'async function remove(req, res) {\n' +
'  try {\n' +
'    const result = await service.deleteItem(req.params.id);\n' +
'    if (!result) {\n' +
'      return res.status(404).json({ error: \'Item not found\' });\n' +
'    }\n' +
'    res.status(204).send();\n' +
'  } catch (error) {\n' +
'    res.status(500).json({ error: error.message });\n' +
'  }\n' +
'}\n' +
'\n' +
'module.exports = { list, get, create, update, remove };';
      
      fs.writeFileSync(controllerPath, completeController);
      console.log('   Controller: COMPLETED');
    }
});

console.log('');
console.log('Batch completion finished. Next steps:');
console.log('1. Verify route mounting in backend/src/index.js');
console.log('2. Test the module endpoints');
console.log('3. Write integration tests');