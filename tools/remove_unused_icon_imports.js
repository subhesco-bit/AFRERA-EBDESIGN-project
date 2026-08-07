const fs = require('fs')
const path = require('path')

const pagesDir = path.resolve(__dirname, '..', 'frontend', 'src', 'pages')

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8')
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g
  let m
  let changed = false
  while ((m = importRegex.exec(src))) {
    const fullMatch = m[0]
    const imports = m[1].split(',').map(s => s.trim()).filter(Boolean)
    const unused = []
    for (const imp of imports) {
      const usageRegex = new RegExp('\\b' + imp + '\\b', 'g')
      // Count occurrences outside the import statement
      const occurrences = (src.slice(0, m.index) + src.slice(m.index + fullMatch.length)).match(usageRegex)
      if (!occurrences) unused.push(imp)
    }

    if (unused.length === imports.length) {
      // remove whole import line
      src = src.replace(fullMatch, '')
      changed = true
    } else if (unused.length > 0) {
      const remaining = imports.filter(i => !unused.includes(i))
      const newImport = `import { ${remaining.join(', ')} } from 'lucide-react'`
      src = src.replace(fullMatch, newImport)
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8')
    console.log('Updated', path.relative(process.cwd(), filePath))
  }
}

fs.readdirSync(pagesDir).forEach((f) => {
  if (f.endsWith('.jsx') || f.endsWith('.js')) {
    processFile(path.join(pagesDir, f))
  }
})

console.log('Done')
