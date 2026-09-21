const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const classification = JSON.parse(fs.readFileSync(path.join(root, 'registry', 'classification.json'), 'utf8'));
const capabilities = JSON.parse(fs.readFileSync(path.join(root, 'registry', 'capabilities.json'), 'utf8')).capabilities;
const workflows = JSON.parse(fs.readFileSync(path.join(root, 'registry', 'workflow-catalog.json'), 'utf8'));
const errors = [];
const ids = new Set();

for (const capability of capabilities) {
  if (ids.has(capability.id)) errors.push(`Duplicate capability id: ${capability.id}`);
  ids.add(capability.id);
  for (const field of ['id', 'name', 'domain', 'stage', 'status', 'priority', 'owner', 'dependsOn', 'outcome', 'evidenceHints', 'nextAction']) {
    if (capability[field] === undefined) errors.push(`${capability.id || 'unknown'} missing ${field}`);
  }
  if (!classification.statuses[capability.status]) errors.push(`${capability.id} uses invalid status ${capability.status}`);
}
for (const capability of capabilities) {
  for (const dependency of capability.dependsOn) {
    if (!ids.has(dependency)) errors.push(`${capability.id} has unknown dependency ${dependency}`);
  }
}
for (const workflow of workflows.workflows) {
  for (const field of workflows.requiredFields) {
    if (!Array.isArray(workflow[field]) || workflow[field].length === 0) errors.push(`${workflow.id} missing non-empty ${field}`);
  }
  const states = new Set(workflow.states);
  for (const transition of workflow.transitions) {
    const [from, to] = transition.split('->');
    if (!states.has(from) || !states.has(to)) errors.push(`${workflow.id} invalid transition ${transition}`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${capabilities.length} capabilities and ${workflows.workflows.length} professional workflow contracts.`);
