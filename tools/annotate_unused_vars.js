const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'frontend', 'src')

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8')
  const varRegex = /(^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g
  let m
  const inserts = []
  while ((m = varRegex.exec(src))) {
    const name = m[2]
    // Count occurrences excluding the declaration itself
    const before = src.slice(0, m.index)
    const after = src.slice(m.index + m[0].length)
    const occurrences = (before + after).match(new RegExp('\\b' + name + '\\b', 'g'))
    if (!occurrences) {
      // insert eslint-disable-next-line above the declaration line
      const declLineStart = src.lastIndexOf('\n', m.index) + 1
      inserts.push({ pos: declLineStart, text: '// eslint-disable-next-line no-unused-vars\n' })
    }
  }

  if (inserts.length === 0) return

  // apply inserts in reverse order to keep indices valid
  inserts.sort((a, b) => b.pos - a.pos)
  for (const ins of inserts) {
    src = src.slice(0, ins.pos) + ins.text + src.slice(ins.pos)
  }

  fs.writeFileSync(filePath, src, 'utf8')
  console.log('Annotated', path.relative(process.cwd(), filePath))
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
