const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'frontend', 'src')
const targets = ["lucide-react", "react-router-dom"]

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8')
  let changed = false

  for (const pkg of targets) {
    const importRegex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${pkg}['"];?`, 'g')
    let m
    while ((m = importRegex.exec(src))) {
      const fullMatch = m[0]
      const imports = m[1].split(',').map(s => s.trim()).filter(Boolean)
      const unused = []
      for (const imp of imports) {
        const usageRegex = new RegExp('\\b' + imp + '\\b', 'g')
        const occurrences = (src.slice(0, m.index) + src.slice(m.index + fullMatch.length)).match(usageRegex)
        if (!occurrences) unused.push(imp)
      }

      if (unused.length === imports.length) {
        src = src.replace(fullMatch, '')
        changed = true
      } else if (unused.length > 0) {
        const remaining = imports.filter(i => !unused.includes(i))
        const newImport = `import { ${remaining.join(', ')} } from '${pkg}'`
        src = src.replace(fullMatch, newImport)
        changed = true
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8')
    console.log('Updated', path.relative(process.cwd(), filePath))
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
