const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'frontend', 'src')

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8')
  const importLineRegex = /(^|\n)\s*import\s+([^;]+)\s+from\s+['"][^'"]+['"];?/g
  let m
  let changed = false
  while ((m = importLineRegex.exec(src))) {
    const full = m[0]
    const importsPart = m[2].trim()
    // collect identifiers from importsPart
    const ids = []
    // default import
    const defaultMatch = importsPart.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/)
    if (defaultMatch) ids.push(defaultMatch[1])
    // named imports
    const namedMatch = importsPart.match(/\{([^}]+)\}/)
    if (namedMatch) {
      namedMatch[1].split(',').forEach(s => {
        const id = s.split('as')[0].trim()
        if (id) ids.push(id)
      })
    }
    // namespace import (import * as X)
    const nsMatch = importsPart.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/)
    if (nsMatch) ids.push(nsMatch[1])

    if (ids.length === 0) continue

    // check usage excluding the import itself
    const before = src.slice(0, m.index)
    const after = src.slice(m.index + full.length)
    let anyUsed = false
    for (const id of ids) {
      const re = new RegExp('\\b' + id + '\\b', 'g')
      if ((before + after).match(re)) { anyUsed = true; break }
    }

    if (!anyUsed) {
      src = src.replace(full, '')
      changed = true
    } else {
      // remove only unused named imports from the line
      const named = importsPart.match(/\{([^}]+)\}/)
      if (named) {
        const parts = named[1].split(',').map(s => s.trim()).filter(Boolean)
        const unused = parts.filter(p => {
          const id = p.split('as')[0].trim()
          const before2 = src.slice(0, m.index)
          const after2 = src.slice(m.index + full.length)
          return !(new RegExp('\\b' + id + '\\b', 'g').test(before2 + after2))
        })
        if (unused.length === parts.length) {
          src = src.replace(full, '')
          changed = true
        } else if (unused.length > 0) {
          const remaining = parts.filter(p => !unused.includes(p))
          const newImportsPart = importsPart.replace(named[0], `{ ${remaining.join(', ')} }`)
          const newLine = full.replace(importsPart, newImportsPart)
          src = src.replace(full, newLine)
          changed = true
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8')
    console.log('Cleaned', path.relative(process.cwd(), filePath))
  }
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p)
    else if (p.endsWith('.js') || p.endsWith('.jsx')) processFile(p)
  }
}

walk(root)
console.log('Done')
