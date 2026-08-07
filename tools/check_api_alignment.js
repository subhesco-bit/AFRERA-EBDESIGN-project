const fs = require('fs')
const path = require('path')

const frontendApiPath = path.resolve(__dirname, '..', 'frontend', 'src', 'services', 'api.js')
const backendOpenApiPath = path.resolve(__dirname, '..', 'backend', 'openapi.json')

const frontend = fs.readFileSync(frontendApiPath, 'utf8')
const openapi = JSON.parse(fs.readFileSync(backendOpenApiPath, 'utf8'))

// extract strings passed to api.get/post/put/delete
const regex = /api\.(get|post|put|delete)\s*\(\s*`?['"]([^`'"\)]+)`?/g
let m
const endpoints = new Set()
while ((m = regex.exec(frontend))) {
  endpoints.add(m[2])
}

const missing = []
const present = []

for (const ep of endpoints) {
  const full = `/api/v1${ep.startsWith('/') ? '' : '/'}${ep}`.replace(/\/\/+/, '/')
  if (openapi.paths && openapi.paths[full]) {
    present.push(full)
  } else {
    missing.push(full)
  }
}

console.log('Checked', endpoints.size, 'endpoints from frontend')
console.log('Present in OpenAPI:', present.length)
console.log('Missing in OpenAPI:', missing.length)
if (missing.length) {
  console.log('\nMissing endpoints:')
  missing.forEach((s) => console.log('-', s))
}
else {
  console.log('\nAll frontend endpoints present in backend OpenAPI.')
}

// Exit code non-zero if missing found
process.exit(missing.length ? 2 : 0)
