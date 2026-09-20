/**
 * Library Knowledge Service (M645100)
 *
 * Indexes the real _EBDESIGN_LIBRARY layout plus plug-and-play modules and
 * exposes a Claude-compatible execute() contract for module discovery.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const orgChart = require('./orgChart');

const MODULE_ID = 'M645100_LIBRARYKNOWLEDGE';
const MODULE_NAME = 'Library Knowledge';
const TEXT_PREVIEW_BYTES = Number(process.env.LIBRARY_TEXT_PREVIEW_BYTES || 65536);
// Ledgers can hold hundreds of thousands of rows. Index a bounded head of them
// so a large .jsonl stays searchable without holding the whole file in memory.
const JSONL_MAX_RECORDS = Number(process.env.LIBRARY_JSONL_MAX_RECORDS || 500);

// Directories excluded from the whole-project sweep by default. node_modules
// is third-party code and .git is opaque object storage; neither is project
// content, and together they are four times the size of everything else.
// Set LIBRARY_INDEX_VENDOR=1 to map them too.
const VENDOR_DIRECTORIES = new Set(['node_modules', '.git']);

// Source files whose references can be read statically.
const WIRED_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

/**
 * A library catalogues the two-page journal as surely as the bound volume.
 * Reading only require() and import speaks one language - JavaScript's - and
 * everything written in another is filed as unconnected when in truth it was
 * never asked. Each material gets the rule that suits it.
 */
const WIRELINE_EXTENSIONS = {
  code: new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']),
  style: new Set(['.css', '.scss', '.less']),
  markup: new Set(['.html', '.htm', '.vue', '.svg']),
  doc: new Set(['.md', '.mdx', '.markdown', '.txt', '.rst']),
  schema: new Set(['.sql']),
  manifest: new Set(['.json', '.yml', '.yaml'])
};

/**
 * Which relationships mean "this file is part of that system".
 *
 * A document that names M041 is *about* M041; a manifest that describes its
 * directory says nothing about where its neighbours belong. Treating either as
 * membership pulls documentation into the module it discusses. Kept explicit
 * so a consumer asking "where does this belong" and one asking "what is
 * related to this" get different, correct answers.
 */
const MEMBERSHIP_KINDS = new Set(['code', 'style', 'markup', 'tests', 'discovers', 'schema', 'sequence']);

/** Relationships that state aboutness rather than membership. */
const REFERENCE_KINDS = new Set(['mention', 'describes', 'doc']);

function wirelineKindFor(extension) {
  for (const [kind, set] of Object.entries(WIRELINE_EXTENSIONS)) {
    if (set.has(extension)) return kind;
  }
  return 'other';
}

/** url(...) and @import in a stylesheet. */
function extractStyleReferences(source) {
  source = stripComments(source);
  const found = new Set();
  const patterns = [
    /url\(\s*['"]?([^'")]+)['"]?\s*\)/g,
    /@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) { found.add(match[1]); match = pattern.exec(source); }
  }
  return [...found];
}

/** src and href in markup. */
function extractMarkupReferences(source) {
  const found = new Set();
  const pattern = /(?:src|href)\s*=\s*['"]([^'"#?]+)['"]/g;
  let match = pattern.exec(source);
  while (match) { found.add(match[1]); match = pattern.exec(source); }
  return [...found];
}

/** Markdown links and inline code that names a path. */
function extractDocReferences(source) {
  const found = new Set();
  const patterns = [
    /\]\(\s*([^)\s]+?)\s*(?:"[^"]*")?\)/g,
    /^\s*\[[^\]]+\]:\s*(\S+)/gm
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) { found.add(match[1]); match = pattern.exec(source); }
  }
  return [...found];
}

/** Module identifiers a document names, so prose about M041 reaches M041. */
function extractModuleMentions(source) {
  const found = new Set();
  const pattern = /\bM\d{3,}(?:_[A-Z0-9_]+)?\b/g;
  let match = pattern.exec(source);
  while (match && found.size < 60) { found.add(match[0]); match = pattern.exec(source); }
  return [...found];
}

/**
 * Directories a file scans at runtime. This project mounts routes by reading a
 * directory rather than importing each file, so the mounted files have no
 * static importer and look unreferenced while being very much in use. Finding
 * the scan is what makes that linkage visible, and it is derived from the code
 * rather than hardcoded, so it holds wherever the pattern is used.
 */
function extractScannedDirectories(source) {
  const found = new Set();
  const patterns = [
    /readdirSync\(\s*(?:path\.(?:join|resolve)\(\s*)?([^)]*?)\)/g,
    /require\.context\(\s*['"`]([^'"`]+)['"`]/g
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) {
      // Keep the quoted fragments; a directory built from variables cannot be
      // resolved here and is skipped rather than guessed at.
      const literals = String(match[1]).match(/['"`]([^'"`]+)['"`]/g);
      if (literals) found.add(literals.map((piece) => piece.slice(1, -1)).join('/'));
      match = pattern.exec(source);
    }
  }
  return [...found];
}

/** The file a test is about: foo.test.js -> foo.js, __tests__/foo.js -> ../foo.js */
function subjectsUnderTest(relativePath, fileName) {
  const stem = fileName.replace(/\.(test|spec)\.[a-z]+$/i, '').replace(/\.[a-z]+$/i, '');
  if (!stem || stem === fileName) return [];
  return [stem];
}

function isTestFile(relativePath, fileName) {
  return /\.(test|spec)\.[a-z]+$/i.test(fileName) || /(^|\/)__tests__\//.test(relativePath);
}

/** Tables a migration creates, and tables it depends on. */
function extractSchemaReferences(source) {
  // -- line comments in SQL, and /* */ blocks.
  source = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
  const creates = new Set();
  const uses = new Set();

  const createPattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([A-Za-z0-9_.]+)["`']?/gi;
  let match = createPattern.exec(source);
  while (match) { creates.add(match[1].toLowerCase()); match = createPattern.exec(source); }

  const usePatterns = [
    /REFERENCES\s+["`']?([A-Za-z0-9_.]+)["`']?/gi,
    /(?:ALTER|DROP)\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`']?([A-Za-z0-9_.]+)["`']?/gi,
    /(?:FROM|JOIN|INTO|UPDATE)\s+["`']?([A-Za-z0-9_.]+)["`']?/gi,
    /CREATE\s+INDEX[^;]*?\sON\s+["`']?([A-Za-z0-9_.]+)["`']?/gi
  ];
  for (const pattern of usePatterns) {
    let hit = pattern.exec(source);
    while (hit) { uses.add(hit[1].toLowerCase()); hit = pattern.exec(source); }
  }

  for (const table of creates) uses.delete(table);
  return { creates: [...creates], uses: [...uses] };
}

// Suffixes tried when a reference omits the extension, in Node's own order.
const RESOLUTION_SUFFIXES = [
  '', '.js', '.jsx', '.ts', '.tsx', '.json', '.mjs', '.cjs',
  '/index.js', '/index.jsx', '/index.ts', '/index.tsx'
];

/**
 * Reference specifiers in one source file: require('x'), import ... from 'x',
 * import('x'), export ... from 'x'. Deliberately a scan rather than a parse -
 * this runs over tens of thousands of files, and a reference that a regex
 * misses costs a missing edge, while a parser that throws costs the whole file.
 */
/**
 * Remove comments before reading references.
 *
 * A commented-out require is not a dependency, and counting one reports a file
 * as depending on something absent when the code says the opposite. It was
 * reading `// const UserProfile = require('./UserProfile');` - under a heading
 * that says "to be created" - as thirteen models removed by mistake.
 *
 * Deliberately a scrub rather than a parse: the goal is to stop reading dead
 * lines, and a mangled string literal costs one edge where a thrown parser
 * costs the whole file. The ':' guard keeps http:// in a URL intact.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function extractReferences(source) {
  source = stripComments(source);
  const found = new Set();
  const patterns = [
    /require\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /import\s+[^;]*?from\s*['"`]([^'"`]+)['"`]/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /export\s+[^;]*?from\s*['"`]([^'"`]+)['"`]/g,
    /import\s*['"`]([^'"`]+)['"`]/g
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) {
      found.add(match[1]);
      match = pattern.exec(source);
    }
  }

  return [...found];
}

/**
 * Locate the repository root by walking up for the library directory itself.
 *
 * A fixed `path.resolve(__dirname, '../../..')` only works from one location,
 * and this module has already been moved once: from modules/ (where three
 * levels up is the repo root) into backend/src/modules/ (where it is
 * backend/src, so the library was never found and nothing got indexed).
 * Searching for the marker survives the next move too.
 */
/**
 * Zones: the project itself, plus any sibling directory that belongs to it.
 * A git worktree or a backup copy of this repository sits next to it rather
 * than inside it, so it is invisible to a sweep rooted at the project.
 */
function discoverSiblingRoots(projectRoot) {
  if (['0', 'false', 'off'].includes(String(process.env.LIBRARY_MAP_SIBLINGS || '').toLowerCase())) {
    return [];
  }

  const explicit = String(process.env.LIBRARY_EXTERNAL_ROOTS || '').trim();
  if (explicit) {
    return explicit.split(',').map((entry) => entry.trim()).filter(Boolean).map((dir, position) => ({
      id: `EXT${position + 1}`,
      path: path.resolve(dir)
    }));
  }

  const parent = path.dirname(projectRoot);
  const base = path.basename(projectRoot);
  const candidates = [
    { id: 'WORKTREES', path: path.join(parent, `${base}.worktrees`) },
    { id: 'BACKUPS', path: path.join(parent, `${base}.local-backups`) }
  ];

  return candidates.filter((candidate) => {
    try {
      return fs.statSync(candidate.path).isDirectory();
    } catch (error) {
      return false;
    }
  });
}

/**
 * A file's zone and path within it. Files under a sibling root are addressed
 * by that root's id, so nothing collides with the project's own tree.
 */
function locateInZones(filePath, projectRoot, externalRoots) {
  for (const root of externalRoots) {
    const relative = path.relative(root.path, filePath);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
      return { zone: root.id, relativePath: relative.split(path.sep).join('/') };
    }
  }

  const relative = path.relative(projectRoot, filePath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return { zone: 'PRJ', relativePath: relative.split(path.sep).join('/') };
}

/**
 * A stable call number, in the spirit of a shelf mark or a parking bay:
 *
 *   PRJ-BACKEND-1a2b3c4d
 *   |   |       |
 *   |   |       slot: first 8 hex of sha1(zone/path) - unique, collision-checked
 *   |   section: the top-level directory the file sits under
 *   zone: project, worktrees, backups
 *
 * It is derived only from the file's address, so it survives a rebuild, a
 * restart and a reindex unchanged - which is what makes it usable as a
 * durable handle for something else to store and come back with.
 */
function tidy(value, length) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, length);
}

/**
 * Which system owns this file, and which component of it the file is part of.
 *
 * A module identifier anywhere in the path is the strongest signal: under a
 * plug-and-play model the module is the unit that plugs in, so it owns
 * everything beneath it regardless of where the tree it sits in was checked
 * out. Without one, the system is the top-level area (backend, frontend, the
 * library section) and the component is the area below that.
 */
function systemOf(zone, relativePath) {
  const segments = relativePath.split('/').filter(Boolean);
  const moduleAt = segments.findIndex((segment) => /^M\d{3,}(_.+)?$/.test(segment));

  if (moduleAt >= 0) {
    const moduleId = segments[moduleAt];
    return {
      system: moduleId,
      systemKind: 'module',
      component: segments[moduleAt + 1] && moduleAt + 2 < segments.length
        ? segments[moduleAt + 1]
        : '(root)',
      componentPath: segments.slice(moduleAt + 1).join('/') || segments[segments.length - 1]
    };
  }

  if (segments[0] === '_EBDESIGN_LIBRARY') {
    return {
      system: segments[1] || '(root)',
      systemKind: 'library-section',
      component: segments.length > 3 ? segments[2] : '(section root)',
      componentPath: segments.slice(1).join('/')
    };
  }

  return {
    system: segments[0] || '(root)',
    systemKind: 'area',
    component: segments.length > 2 ? segments[1] : '(root)',
    componentPath: segments.slice(1).join('/') || segments[0] || ''
  };
}

/**
 * A call number that says where a file belongs, not merely where it sits:
 *
 *   PRJ.M645100.BACKEND.7f3a2b1c
 *   |   |        |       |
 *   |   |        |       slot: 8 hex of sha1(zone/path), collision-checked
 *   |   |        component within the system
 *   |   the system that owns it - the thing that plugs in
 *   zone: which checkout of the tree
 *
 * Reading left to right narrows from tree to system to component to file, so
 * a caller holding a number knows what it belongs to before resolving it, and
 * two systems that merely share a filename never share a prefix.
 */
function buildLocationId(zone, relativePath) {
  const owner = systemOf(zone, relativePath);
  const system = tidy(owner.system, 16) || 'ROOT';
  const component = tidy(owner.component, 10) || 'ROOT';
  const slot = crypto.createHash('sha1').update(`${zone}/${relativePath}`).digest('hex').slice(0, 8);
  return `${zone}.${system}.${component}.${slot}`;
}

function findProjectRoot(startDir = __dirname) {
  let dir = startDir;
  for (let i = 0; i < 10; i += 1) {
    if (fs.existsSync(path.join(dir, '_EBDESIGN_LIBRARY'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Nothing found — fall back to the historical guess so behaviour is
  // unchanged rather than throwing at require time.
  return path.resolve(startDir, '../../..');
}

function optionalDatabase() {
  try {
    return require('../../../database/connection').getPostgreSQL();
  } catch (error) {
    return null;
  }
}

function stripBom(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function readJson(filePath) {
  const content = stripBom(fs.readFileSync(filePath, 'utf8'));

  try {
    return JSON.parse(content);
  } catch (error) {
    return {
      name: path.basename(filePath),
      parseError: error.message,
      indexedWithWarning: true
    };
  }
}

/**
 * Parse a JSON Lines file: one JSON document per line.
 *
 * .jsonl was previously handed to readJson(), which JSON.parse()s the entire
 * file as a single document. Any ledger with more than one line therefore
 * failed outright and was indexed as a parse error with no usable data, so
 * every record in it was invisible to search — enterprise-file-activity-ledger
 * .jsonl among them. Parsing per line also means one malformed row no longer
 * hides the valid rows around it.
 */
function readJsonl(filePath) {
  const content = stripBom(fs.readFileSync(filePath, 'utf8'));
  const records = [];
  const lineErrors = [];

  content.split(/\r?\n/).forEach((line, offset) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      if (records.length < JSONL_MAX_RECORDS) {
        records.push(JSON.parse(trimmed));
      } else {
        JSON.parse(trimmed);
      }
    } catch (error) {
      if (lineErrors.length < 20) {
        lineErrors.push({ line: offset + 1, message: error.message });
      }
    }
  });

  const data = {
    name: path.basename(filePath),
    format: 'jsonl',
    recordCount: records.length,
    records
  };

  if (lineErrors.length > 0) {
    data.lineErrors = lineErrors;
    data.indexedWithWarning = true;
  }

  return data;
}

function parseCsvHeaderLine(line) {
  const columns = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  columns.push(value.trim());
  return columns;
}

function readCsvHeader(filePath) {
  const content = stripBom(fs.readFileSync(filePath, 'utf8'));
  const rows = content.split(/\r?\n/).filter(Boolean);
  const [header = ''] = rows;

  return {
    columns: parseCsvHeaderLine(header),
    rowCount: Math.max(rows.length - 1, 0)
  };
}

/**
 * Read the head of a text file without pulling the whole thing into memory.
 * The library holds multi-megabyte documents; only a preview is ever indexed.
 */
function readTextPreview(filePath, maxBytes = TEXT_PREVIEW_BYTES) {
  const stat = safeStat(filePath);
  if (!stat || stat.size === 0) return '';

  const bytesToRead = Math.min(stat.size, maxBytes);
  const buffer = Buffer.alloc(bytesToRead);
  const fd = fs.openSync(filePath, 'r');

  try {
    const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, 0);
    return stripBom(buffer.subarray(0, bytesRead).toString('utf8'));
  } finally {
    fs.closeSync(fd);
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    return null;
  }
}

class LibraryKnowledgeService {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || findProjectRoot();
    this.libraryRoot = options.libraryRoot || path.join(this.projectRoot, '_EBDESIGN_LIBRARY');
    this.modulesRoot = options.modulesRoot || path.join(this.projectRoot, 'modules');
    this.backendModulesRoot = options.backendModulesRoot || path.join(this.projectRoot, 'backend', 'src', 'modules');
    this.index = new Map();
    // Paths already indexed, so the untracked-file sweep can test membership in
    // O(1) instead of rescanning every entry per candidate file.
    this.indexedPaths = new Set();
    // Map everything the project owns, junk included, so nothing on disk is
    // invisible to the library. Bulk files are held at a metadata tier (path,
    // size, mtime, extension) with no content preview: 70k content previews
    // would cost gigabytes of memory, and /resolve reads content on demand.
    this.indexEverything = options.indexEverything !== false
      && !['0', 'false', 'off'].includes(String(process.env.LIBRARY_INDEX_ALL || '').toLowerCase());
    this.indexVendor = options.indexVendor === true
      || ['1', 'true', 'on'].includes(String(process.env.LIBRARY_INDEX_VENDOR || '').toLowerCase());
    // path -> keys, so removing a deleted file costs a lookup rather than a
    // scan of every entry in the index.
    this._pathToKeys = new Map();
    // Sibling checkouts and backups live beside the project, not inside it, so
    // a sweep of projectRoot alone never sees them. Each gets a zone id; keys
    // and location ids are namespaced by it so a file in a worktree can never
    // be confused with its twin in the project.
    this.externalRoots = options.externalRoots || discoverSiblingRoots(this.projectRoot);
    // locationId -> key, so a caller holding a call number resolves it in one
    // lookup instead of scanning the index.
    this.locationIndex = new Map();
    this.contentHashes = new Map();
    this.indexingWarnings = [];
    this.initialized = false;

    // Live indexing. The index is built once at initialize() and would then
    // drift from disk until a restart, so files added, changed, moved or
    // deleted afterwards were invisible to search. Watching the roots keeps it
    // current; changes are coalesced over a short window so a bulk copy or a
    // git checkout costs one update rather than thousands.
    this.watchDebounceMs = options.watchDebounceMs
      || Number(process.env.LIBRARY_WATCH_DEBOUNCE_MS)
      || 300;
    // Live by default. The index is only trustworthy if it matches disk, and
    // the server calls initialize() without asking for a watcher, so making
    // this opt-in meant the running platform served a snapshot that silently
    // aged. Set LIBRARY_WATCH=0 to disable (batch jobs, one-shot CLI runs).
    this.watchEnabled = options.watch === true
      || !['0', 'false', 'off'].includes(String(process.env.LIBRARY_WATCH || '').toLowerCase());
    this._watchers = [];
    this._watchTimer = null;
    this._pendingPaths = new Set();
    this._pendingFullReindex = false;
    this.watching = false;
    // Bumped on every index mutation so derived views (the org chart, the
    // manifest, the name lookup) know when they are stale without diffing.
    this.indexVersion = 0;
    this._chartCache = null;
    this._chartVersion = -1;
    this.watchStats = {
      events: 0,
      batches: 0,
      added: 0,
      updated: 0,
      removed: 0,
      fullReindexes: 0,
      lastChangeAt: null,
      lastError: null
    };
  }

  /** Roots whose contents are represented in the index. */
  watchRoots() {
    // One recursive watch on the project root covers every mapped file; the
    // narrower roots are only used when whole-project mapping is off.
    const roots = this.indexEverything
      ? [this.projectRoot, ...this.externalRoots.map((root) => root.path)]
      : [this.libraryRoot, this.modulesRoot, this.backendModulesRoot];
    return roots.filter((root) => root && fs.existsSync(root));
  }

  /**
   * Index (or re-index) a single library file, so a change to one file costs
   * one read instead of a full sweep of the library.
   */
  indexLibraryFileAt(filePath, options = {}) {
    const stat = safeStat(filePath);
    if (!stat || !stat.isFile()) return null;

    const relativePath = path.relative(this.libraryRoot, filePath).split(path.sep).join('/');
    if (relativePath.startsWith('..')) return null;

    const key = `LIBRARY:${relativePath}`;
    if (options.skipIfIndexed === true && (this.index.has(key) || this.indexedPaths.has(filePath))) {
      return null;
    }

    const name = path.basename(filePath);
    const extension = path.extname(name).toLowerCase();
    const data = {
      name,
      relativePath,
      extension,
      fileSize: stat.size
    };

    if (extension === '.jsonl') {
      Object.assign(data, readJsonl(filePath));
    } else if (extension === '.json') {
      Object.assign(data, readJson(filePath));
    } else if (['.md', '.txt', '.csv', '.yaml', '.yml', '.xml'].includes(extension)) {
      data.content = readTextPreview(filePath).slice(0, 12000);
    }

    this.indexFile(key, 'library-file', filePath, data);
    return key;
  }

  /** Drop every index entry that pointed at a path which no longer exists. */
  removeIndexedPath(filePath) {
    let removed = 0;
    for (const key of this._pathToKeys.get(filePath) || []) {
      // Read the call number before the entry goes, or the binding leaks and
      // the number stays pointing at a file that no longer exists.
      const entry = this.index.get(key);
      const locationId = entry && entry.data && entry.data.locationId;
      if (locationId) this.locationIndex.delete(locationId);
      if (this.index.delete(key)) removed += 1;
      this.contentHashes.delete(key);
    }
    this._pathToKeys.delete(filePath);
    this.indexedPaths.delete(filePath);
    if (removed > 0) this.indexVersion += 1;
    return removed;
  }

  /**
   * Rebuild the whole index without a restart. Content hashes are dropped so
   * they are recomputed on demand rather than served stale.
   */
  async reindex() {
    await this.buildIndex();
    this.contentHashes.clear();
    this.initialized = true;
    this.watchStats.fullReindexes += 1;
    return {
      success: true,
      moduleId: MODULE_ID,
      indexedItems: this.index.size,
      indexingWarnings: this.indexingWarnings.length,
      reindexedAt: new Date().toISOString()
    };
  }

  /**
   * Start watching the indexed roots. Node's recursive fs.watch is
   * best-effort (platform limits, network drives), so a failure to watch one
   * root is recorded and the others still run — the manual reindex() path is
   * always available as the fallback.
   */
  startWatching() {
    if (this.watching) return { success: true, alreadyWatching: true, roots: this.watchedRoots || [] };

    const watched = [];
    for (const root of this.watchRoots()) {
      try {
        const watcher = fs.watch(root, { recursive: true, persistent: false }, (eventType, filename) => {
          if (!filename) {
            // No name means the platform could not attribute the change;
            // fall back to a full rebuild rather than miss it.
            this._queueChange(null, true);
            return;
          }
          this._queueChange(path.join(root, filename.toString()), false);
        });
        watcher.on('error', (error) => { this.watchStats.lastError = error.message; });
        this._watchers.push(watcher);
        watched.push(root);
      } catch (error) {
        this.watchStats.lastError = `${root}: ${error.message}`;
      }
    }

    this.watching = this._watchers.length > 0;
    this.watchedRoots = watched;
    return { success: this.watching, roots: watched, debounceMs: this.watchDebounceMs };
  }

  stopWatching() {
    for (const watcher of this._watchers) {
      try { watcher.close(); } catch (error) { /* already closed */ }
    }
    this._watchers = [];
    if (this._watchTimer) { clearTimeout(this._watchTimer); this._watchTimer = null; }
    this._pendingPaths.clear();
    this._pendingFullReindex = false;
    this.watching = false;
    return { success: true, watching: false };
  }

  /** Record a change and (re)arm the debounce window. */
  _queueChange(filePath, forceFull) {
    this.watchStats.events += 1;
    this.watchStats.lastChangeAt = new Date().toISOString();

    if (forceFull) {
      this._pendingFullReindex = true;
    } else if (!this.indexVendor && this._isVendorPath(filePath)) {
      // Dependency and git-object churn is not project content; ignore it
      // rather than rebuilding the index for every npm write.
      this.watchStats.ignored = (this.watchStats.ignored || 0) + 1;
      return;
    } else if (this._isUnderLibraryRoot(filePath)
      || (this.indexEverything && locateInZones(filePath, this.projectRoot, this.externalRoots))) {
      // Every mapped file has a key derivable from its path, so a change to
      // any of them is applied incrementally. Without this a single edit
      // anywhere in the project would rebuild all 70k entries.
      this._pendingPaths.add(filePath);
    } else {
      // Module trees feed several catalogue-driven indexers whose keys are not
      // derivable from a path alone, so those changes need a full rebuild.
      this._pendingFullReindex = true;
    }

    if (this._watchTimer) clearTimeout(this._watchTimer);
    this._watchTimer = setTimeout(() => {
      this._watchTimer = null;
      this._flushChanges().catch((error) => { this.watchStats.lastError = error.message; });
    }, this.watchDebounceMs);
    if (typeof this._watchTimer.unref === 'function') this._watchTimer.unref();
  }

  _isVendorPath(filePath) {
    const relative = path.relative(this.projectRoot, filePath).split(path.sep);
    return relative.some((segment) => VENDOR_DIRECTORIES.has(segment));
  }

  _isUnderLibraryRoot(filePath) {
    const relative = path.relative(this.libraryRoot, filePath);
    return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Apply one coalesced batch of changes. A path that still exists is
   * re-indexed; one that does not is removed. A rename arrives as both, so
   * moves are handled without any special case.
   */
  async _flushChanges() {
    const paths = [...this._pendingPaths];
    const needsFull = this._pendingFullReindex;
    this._pendingPaths.clear();
    this._pendingFullReindex = false;
    this.watchStats.batches += 1;

    if (needsFull) {
      await this.reindex();
      return { fullReindex: true, indexedItems: this.index.size };
    }

    let added = 0;
    let updated = 0;
    let removed = 0;

    for (const filePath of paths) {
      const stat = safeStat(filePath);

      if (!stat) {
        removed += this.removeIndexedPath(filePath);
        continue;
      }
      if (stat.isDirectory()) {
        // A new or renamed directory can bring in many files at once.
        this._indexDirectoryTree(filePath);
        added += 1;
        continue;
      }

      const existed = this.indexedPaths.has(filePath);
      if (this.indexPathAt(filePath)) {
        if (existed) updated += 1; else added += 1;
      }
    }

    this.watchStats.added += added;
    this.watchStats.updated += updated;
    this.watchStats.removed += removed;
    return { fullReindex: false, added, updated, removed };
  }

  _indexDirectoryTree(directory) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) this._indexDirectoryTree(entryPath);
      else this.indexPathAt(entryPath);
    }
  }

  /**
   * The org chart, rebuilt only when the index has actually changed. Every
   * live add/change/delete bumps indexVersion, so the chart a caller sees is
   * never older than the last filesystem event.
   */
  orgChartData() {
    if (!this._chartCache || this._chartVersion !== this.indexVersion) {
      this._chartCache = orgChart.build(this.index);
      this._chartVersion = this.indexVersion;
    }
    return this._chartCache;
  }

  getOrgChart(options = {}) {
    return orgChart.toTree(this.orgChartData(), options);
  }

  /**
   * The manifest: every indexed file with its position, qualified name and
   * org path. Filterable so a controller or system can be pulled on its own.
   */
  getManifest(options = {}) {
    const chart = this.orgChartData();
    const limit = Math.min(Number(options.limit) || 200, 5000);
    const offset = Number(options.offset) || 0;

    let records = [...chart.manifest.values()];
    if (options.controller) records = records.filter((r) => r.controller === options.controller);
    if (options.system) records = records.filter((r) => r.system === options.system);
    if (options.module) records = records.filter((r) => r.module === options.module);
    if (options.ambiguousOnly === true) records = records.filter((r) => r.ambiguousName === true);

    return {
      project: orgChart.PROJECT,
      total: records.length,
      indexedItems: this.index.size,
      offset,
      limit,
      records: records.slice(offset, offset + limit)
    };
  }

  /** Names shared by more than one file, with each occurrence's org path. */
  getDuplicateNames(options = {}) {
    const chart = this.orgChartData();
    const limit = Math.min(Number(options.limit) || 50, 1000);
    return {
      total: chart.duplicates.length,
      duplicates: chart.duplicates.slice(0, limit)
    };
  }

  /**
   * Find files by name. Exact basename hits are O(1); a partial name falls
   * back to a scan. Context (controller/system/module) does not filter the
   * results, it ranks them, so a wrong hint degrades the order rather than
   * hiding the answer.
   */
  findFile(name, context = {}) {
    const chart = this.orgChartData();
    const needle = String(name || '').trim().toLowerCase();
    if (!needle) return { query: name, matchCount: 0, matches: [] };

    const keys = new Set(chart.byBasename.get(needle) || []);
    if (keys.size === 0) {
      // Partial match: filename contains the needle, or the org path does.
      for (const [basename, candidateKeys] of chart.byBasename) {
        if (basename.includes(needle)) candidateKeys.forEach((k) => keys.add(k));
      }
    }
    if (keys.size === 0) {
      for (const [key, record] of chart.manifest) {
        if (record.orgPath.toLowerCase().includes(needle)) keys.add(key);
      }
    }

    const scored = [...keys].map((key) => {
      const record = chart.manifest.get(key);
      let score = 0;
      if (record.file.toLowerCase() === needle) score += 100;
      else if (record.file.toLowerCase().startsWith(needle)) score += 40;
      else score += 10;
      if (context.controller && record.controller === context.controller) score += 30;
      if (context.system && record.system === context.system) score += 20;
      if (context.module && record.module === context.module) score += 25;
      return { ...record, score };
    }).sort((a, b) => b.score - a.score);

    return {
      query: name,
      context,
      matchCount: scored.length,
      ambiguous: scored.length > 1,
      matches: scored.slice(0, Number(context.limit) || 25)
    };
  }

  /**
   * Resolve one file and hand it over in a single call: position, org path and
   * content, so a system that needs a file does not have to find it, then read
   * it, then work out which of six same-named copies it got.
   */
  resolveFile(name, context = {}) {
    const found = this.findFile(name, context);
    if (found.matchCount === 0) {
      return { success: false, query: name, error: 'not_found', matches: [] };
    }

    const best = found.matches[0];
    const alternatives = found.matches.slice(1, 10);
    const result = {
      success: true,
      query: name,
      resolved: best,
      ambiguous: found.ambiguous,
      alternativeCount: found.matchCount - 1,
      alternatives
    };

    if (context.includeContent !== false) {
      const entry = this.index.get(best.key);
      const stat = safeStat(best.path);
      if (stat && stat.size <= (Number(context.maxContentBytes) || TEXT_PREVIEW_BYTES)) {
        try {
          result.content = stripBom(fs.readFileSync(best.path, 'utf8'));
          result.contentTruncated = false;
        } catch (error) {
          result.contentError = error.message;
        }
      } else if (stat) {
        result.content = readTextPreview(best.path);
        result.contentTruncated = true;
        result.fileSize = stat.size;
      }
      if (entry && entry.data) result.indexedData = entry.data;
    }

    return result;
  }

  getWatchStatus() {
    return {
      watching: this.watching,
      roots: this.watchedRoots || [],
      debounceMs: this.watchDebounceMs,
      pending: this._pendingPaths.size,
      indexedItems: this.index.size,
      ...this.watchStats
    };
  }

  async initialize(options = {}) {
    await this.buildIndex();

    // Hashing reads every byte of the library (~3 GB, ~20s warm and more cold).
    // Only syncToDatabase and verifyCatalogIntegrity consume the hashes, so a
    // search or discoverModules call should not pay for them. They are computed
    // on demand via ensureContentHashes(); pass hashContent to force it here.
    if (options.hashContent === true) {
      await this.computeContentHashes();
    }

    if (options.syncDatabase === true) {
      await this.syncToDatabase();
    }

    this.initialized = true;

    // Keep the index live from here on, unless the caller opted out.
    if (options.watch === true || (this.watchEnabled && options.watch !== false)) {
      this.startWatching();
    }

    return {
      success: true,
      moduleId: MODULE_ID,
      watching: this.watching,
      indexedItems: this.index.size,
      contentHashes: this.contentHashes.size,
      indexingWarnings: this.indexingWarnings.length
    };
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize({ syncDatabase: false });
    }
  }

  /** Compute content hashes if a caller actually needs them. */
  async ensureContentHashes() {
    await this.ensureInitialized();
    if (this.contentHashes.size === 0 && this.index.size > 0) {
      await this.computeContentHashes();
    }
    return this.contentHashes;
  }

  async buildIndex() {
    this.index.clear();
    this.indexedPaths.clear();
    this._pathToKeys.clear();
    this.locationIndex.clear();
    this.indexingWarnings = [];
    this.indexLibraryCatalogues();
    this.indexLibraryModuleCards();
    this.indexModularSystems();
    this.indexUntrackedLibraryFiles();
    this.indexRuntimeModules();
    this.indexBackendModules();
    // Last, so the richer indexers above keep ownership of the files they
    // already understand and this only picks up what they left behind.
    if (this.indexEverything) this.indexAllProjectFiles();
    this.indexVersion += 1;
    return this.index;
  }

  /**
   * Sweep the library root for files the catalogue-driven indexers did not
   * already pick up, so nothing in _EBDESIGN_LIBRARY is invisible to search
   * just because it is missing from a catalogue.
   */
  indexUntrackedLibraryFiles() {
    if (!fs.existsSync(this.libraryRoot)) return;

    const visit = (directory) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          visit(filePath);
          continue;
        }

        // Same per-file work the watcher does, so the sweep and the live
        // updates can never disagree about how a file is indexed.
        this.indexLibraryFileAt(filePath, { skipIfIndexed: true });
      }
    };

    visit(this.libraryRoot);
  }

  /**
   * Sweep the entire project and map every file the other indexers did not
   * already claim - including backup folders, merge scratch, stray copies and
   * anything else that would otherwise be invisible. Metadata only: no file is
   * read, so the cost is one stat per file rather than 6 GB of I/O.
   */
  indexAllProjectFiles() {
    const zones = [this.projectRoot, ...this.externalRoots.map((root) => root.path)]
      .filter((root) => root && fs.existsSync(root));
    if (zones.length === 0) return 0;

    let mapped = 0;
    const stack = [...zones];

    while (stack.length > 0) {
      const directory = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(directory, { withFileTypes: true });
      } catch (error) {
        continue;
      }

      for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) {
          if (!this.indexVendor && VENDOR_DIRECTORIES.has(entry.name)) continue;
          stack.push(entryPath);
          continue;
        }
        if (this.indexedPaths.has(entryPath)) continue;
        if (this.indexProjectFileAt(entryPath)) mapped += 1;
      }
    }

    return mapped;
  }

  /**
   * Map one file at the metadata tier. Returns the key, or null if the path
   * is not a readable file.
   */
  indexProjectFileAt(filePath) {
    const stat = safeStat(filePath);
    if (!stat || !stat.isFile()) return null;

    const located = locateInZones(filePath, this.projectRoot, this.externalRoots);
    if (!located) return null;

    const { zone, relativePath } = located;
    const key = zone === 'PRJ' ? `FILE:${relativePath}` : `FILE:@${zone}/${relativePath}`;
    const name = path.basename(filePath);
    const locationId = buildLocationId(zone, relativePath);

    const owner = systemOf(zone, relativePath);
    this.indexFile(key, 'project-file', filePath, {
      name,
      zone,
      relativePath,
      locationId,
      system: owner.system,
      systemKind: owner.systemKind,
      component: owner.component,
      componentPath: owner.componentPath,
      extension: path.extname(name).toLowerCase(),
      fileSize: stat.size,
      metadataOnly: true
    });
    this.registerLocation(locationId, key);
    return key;
  }

  /**
   * Bind a call number to an index key. A collision would make two files
   * answer to the same number, so it is recorded as a warning rather than
   * silently overwriting the earlier binding.
   */
  registerLocation(locationId, key) {
    const existing = this.locationIndex.get(locationId);
    if (existing && existing !== key) {
      this.indexingWarnings.push({
        key,
        type: 'location',
        warning: 'location_id_collision',
        message: `${locationId} already bound to ${existing}`
      });
      return false;
    }
    this.locationIndex.set(locationId, key);
    return true;
  }

  /**
   * Study the mapped files by content, so the difference between "the same
   * file twice" and "two files that drifted apart" is measured rather than
   * assumed.
   *
   * Only files whose size matches another file's are hashed - content that is
   * a different length cannot be identical - which turns 126,642 files into a
   * bounded read. Nothing is moved, renamed or deleted here: the output is
   * evidence for those decisions, not the decision itself.
   */
  async studyContent(options = {}) {
    await this.ensureInitialized();

    if (this._contentStudy && this._contentStudy.indexVersion === this.indexVersion && options.refresh !== true) {
      return this._contentStudy;
    }

    const maxBytes = Number(options.maxBytes) || 268435456; // 256MB
    const startedAt = Date.now();

    // 1. Group by size. A size seen once cannot have a twin.
    const bySize = new Map();
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file') continue;
      const size = entry.fileSize || 0;
      const bucket = bySize.get(size);
      if (bucket) bucket.push(entry);
      else bySize.set(size, [entry]);
    }

    const uniqueBySize = [];
    const candidates = [];
    for (const [, bucket] of bySize) {
      if (bucket.length === 1) uniqueBySize.push(bucket[0]);
      else candidates.push(...bucket);
    }

    // 2. Hash the candidates, yielding periodically so a study running on a
    //    live server does not stall every other request behind it.
    const byHash = new Map();
    let hashed = 0;
    let unreadable = 0;
    let skippedLarge = 0;

    for (let position = 0; position < candidates.length; position += 1) {
      const entry = candidates[position];

      if ((entry.fileSize || 0) > maxBytes) { skippedLarge += 1; continue; }

      let digest;
      try {
        digest = crypto.createHash('sha1').update(fs.readFileSync(entry.path)).digest('hex');
      } catch (error) {
        unreadable += 1;
        continue;
      }

      hashed += 1;
      const bucket = byHash.get(digest);
      if (bucket) bucket.push(entry);
      else byHash.set(digest, [entry]);

      if (position % 500 === 0) await new Promise((resolve) => setImmediate(resolve));
    }

    // 3. Split into identical sets and content that turned out to be unique.
    const identical = [];
    let uniqueByContent = uniqueBySize.length;
    let redundantCopies = 0;
    let reclaimableBytes = 0;

    for (const [digest, members] of byHash) {
      if (members.length === 1) { uniqueByContent += 1; continue; }
      redundantCopies += members.length - 1;
      reclaimableBytes += (members[0].fileSize || 0) * (members.length - 1);
      identical.push({
        contentHash: digest,
        fileSize: members[0].fileSize || 0,
        count: members.length,
        name: members[0].data && members[0].data.name,
        members: members.map((entry) => ({
          key: entry.key,
          locationId: entry.data && entry.data.locationId,
          zone: entry.data && entry.data.zone,
          relativePath: entry.data && entry.data.relativePath
        }))
      });
    }
    identical.sort((a, b) => (b.fileSize * (b.count - 1)) - (a.fileSize * (a.count - 1)));

    // 4. Same designation, different content: the files that must be merged
    //    rather than deduplicated, because each side holds something.
    const byName = new Map();
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file') continue;
      const name = ((entry.data && entry.data.name) || '').toLowerCase();
      if (!name) continue;
      const bucket = byName.get(name);
      if (bucket) bucket.push(entry);
      else byName.set(name, [entry]);
    }

    const hashOf = new Map();
    for (const [digest, members] of byHash) for (const entry of members) hashOf.set(entry.key, digest);
    // Retained in full: studySystems fingerprints every member of a system,
    // and a capped report would have it comparing placeholders instead of
    // content, which reads as "nothing is duplicated" rather than as an error.
    this._contentHashByKey = hashOf;

    const divergent = [];
    for (const [name, members] of byName) {
      if (members.length < 2) continue;
      const digests = new Set(members.map((entry) => hashOf.get(entry.key) || `size:${entry.fileSize}:${entry.key}`));
      if (digests.size < 2) continue;
      divergent.push({
        name,
        count: members.length,
        distinctVersions: digests.size,
        members: members.slice(0, 12).map((entry) => ({
          key: entry.key,
          locationId: entry.data && entry.data.locationId,
          zone: entry.data && entry.data.zone,
          fileSize: entry.fileSize,
          contentHash: hashOf.get(entry.key) || null
        }))
      });
    }
    divergent.sort((a, b) => b.distinctVersions - a.distinctVersions || b.count - a.count);

    const limit = Number(options.limit) || 100;
    this._contentStudy = {
      indexVersion: this.indexVersion,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      readOnly: true,
      totals: {
        studied: candidates.length + uniqueBySize.length,
        hashed,
        uniqueBySize: uniqueBySize.length,
        uniqueByContent,
        identicalGroups: identical.length,
        redundantCopies,
        reclaimableBytes,
        divergentNameGroups: divergent.length,
        unreadable,
        skippedLarge
      },
      identical: identical.slice(0, limit),
      divergent: divergent.slice(0, limit)
    };

    return this._contentStudy;
  }

  /**
   * Every file whose content appears exactly once: the set that cannot be
   * merged away and therefore has to be placed somewhere on its own merits.
   */
  async listUniqueFiles(options = {}) {
    const study = await this.studyContent(options);
    const duplicated = new Set();
    for (const group of study.identical) for (const member of group.members) duplicated.add(member.key);

    const unique = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file') continue;
      if (duplicated.has(entry.key)) continue;
      if (options.zone && (entry.data && entry.data.zone) !== options.zone) continue;
      unique.push({
        key: entry.key,
        locationId: entry.data && entry.data.locationId,
        zone: entry.data && entry.data.zone,
        relativePath: entry.data && entry.data.relativePath,
        fileSize: entry.fileSize
      });
    }

    const limit = Number(options.limit) || 200;
    return { total: unique.length, sampled: Math.min(limit, unique.length), files: unique.slice(0, limit) };
  }

  /**
   * Judge duplication at the level that can actually plug in: the system.
   *
   * Two files sharing a name in different systems are not copies of each
   * other - they are that system's own component, doing that system's work,
   * the way two branches each have their own sales executive. Comparing them
   * file by file reports tens of thousands of false duplicates and hides the
   * real one, which is an entire system existing twice.
   *
   * So each system is reduced to a fingerprint over its members - every
   * component path paired with its content hash - and systems are compared as
   * wholes. Identical fingerprint means the same system twice. A shared
   * member between otherwise different systems means nothing.
   */
  async studySystems(options = {}) {
    const study = await this.studyContent(options);

    const contentHashOf = this._contentHashByKey || new Map();

    // Group every mapped file under the system that owns it.
    const systems = new Map();
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      const zone = entry.data.zone || 'PRJ';
      const system = entry.data.system || '(root)';
      const id = `${zone}::${system}`;

      const bucket = systems.get(id)
        || systems.set(id, { id, zone, system, systemKind: entry.data.systemKind, members: [] }).get(id);
      bucket.members.push(entry);
    }

    // Fingerprint each system over its members, so the comparison is of the
    // whole rather than of any one file inside it.
    for (const bucket of systems.values()) {
      const lines = bucket.members
        .map((entry) => `${entry.data.componentPath}:${contentHashOf.get(entry.key) || 'u' + entry.key}`)
        .sort();
      bucket.fileCount = bucket.members.length;
      bucket.totalBytes = bucket.members.reduce((sum, entry) => sum + (entry.fileSize || 0), 0);
      bucket.fingerprint = crypto.createHash('sha1').update(lines.join('\n')).digest('hex');
      delete bucket.members;
    }

    const byFingerprint = new Map();
    for (const bucket of systems.values()) {
      const group = byFingerprint.get(bucket.fingerprint);
      if (group) group.push(bucket);
      else byFingerprint.set(bucket.fingerprint, [bucket]);
    }

    const duplicateSystems = [];
    let redundantSystems = 0;
    let reclaimableBytes = 0;
    for (const [fingerprint, group] of byFingerprint) {
      if (group.length < 2) continue;
      redundantSystems += group.length - 1;
      reclaimableBytes += group[0].totalBytes * (group.length - 1);
      duplicateSystems.push({
        fingerprint,
        copies: group.length,
        fileCount: group[0].fileCount,
        totalBytes: group[0].totalBytes,
        systems: group.map((bucket) => ({ zone: bucket.zone, system: bucket.system, kind: bucket.systemKind }))
      });
    }
    duplicateSystems.sort((a, b) => (b.totalBytes * (b.copies - 1)) - (a.totalBytes * (a.copies - 1)));

    const limit = Number(options.limit) || 50;
    return {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      totals: {
        systems: systems.size,
        distinctFingerprints: byFingerprint.size,
        duplicateSystemGroups: duplicateSystems.length,
        redundantSystems,
        reclaimableBytes
      },
      duplicateSystems: duplicateSystems.slice(0, limit)
    };
  }

  /** Everything one system owns, addressed by call number. */
  async getSystem(systemId, options = {}) {
    await this.ensureInitialized();
    const wanted = String(systemId || '').trim().toLowerCase();
    if (!wanted) return { success: false, error: 'A system id is required' };

    const members = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      if (String(entry.data.system || '').toLowerCase() !== wanted) continue;
      if (options.zone && entry.data.zone !== options.zone) continue;
      members.push({
        locationId: entry.data.locationId,
        zone: entry.data.zone,
        component: entry.data.component,
        componentPath: entry.data.componentPath,
        fileSize: entry.fileSize
      });
    }

    const limit = Number(options.limit) || 500;
    return {
      success: members.length > 0,
      system: systemId,
      fileCount: members.length,
      zones: [...new Set(members.map((member) => member.zone))],
      members: members.slice(0, limit)
    };
  }

  /**
   * Build the wiring layer: which file references which, what nothing
   * references, and what references something that is not there.
   *
   * The last of those is the point. A require() pointing at a path that no
   * longer exists is the fingerprint of a module removed while its callers
   * stayed behind - the residue worth recovering rather than tidying away.
   * And a file with no edges in either direction is not junk by that fact
   * alone; it is simply not yet connected, which is a task, not a verdict.
   *
   * Read-only: nothing is moved, rewritten or removed.
   */
  async buildWiring(options = {}) {
    await this.ensureInitialized();

    if (this._wiring && this._wiring.indexVersion === this.indexVersion && options.refresh !== true) {
      return this._wiring;
    }

    const startedAt = Date.now();

    // Absolute path -> index key, for resolving a reference to a mapped file.
    const keyForPath = new Map();
    for (const [filePath, keys] of this._pathToKeys) {
      const [first] = keys;
      if (first) keyForPath.set(path.normalize(filePath), first);
    }

    const sources = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      if (!WIRED_EXTENSIONS.has(entry.data.extension)) continue;
      sources.push(entry);
    }

    const outbound = new Map();   // key -> Set(key)
    const inbound = new Map();    // key -> Set(key)
    const dangling = new Map();   // key -> [specifier]
    let externalReferences = 0;
    let resolvedEdges = 0;
    let unreadable = 0;

    const link = (from, to) => {
      let out = outbound.get(from);
      if (!out) { out = new Set(); outbound.set(from, out); }
      out.add(to);
      let into = inbound.get(to);
      if (!into) { into = new Set(); inbound.set(to, into); }
      into.add(from);
      resolvedEdges += 1;
    };

    for (let position = 0; position < sources.length; position += 1) {
      const entry = sources[position];

      let source;
      try {
        source = fs.readFileSync(entry.path, 'utf8');
      } catch (error) {
        unreadable += 1;
        continue;
      }

      const directory = path.dirname(entry.path);
      for (const specifier of extractReferences(source)) {
        // A bare specifier is a package, not a file in this project.
        if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
          externalReferences += 1;
          continue;
        }

        const base = path.resolve(directory, specifier);
        let target = null;
        for (const suffix of RESOLUTION_SUFFIXES) {
          const candidate = keyForPath.get(path.normalize(base + suffix));
          if (candidate) { target = candidate; break; }
        }

        if (target) link(entry.key, target);
        else {
          const list = dangling.get(entry.key) || [];
          if (list.length < 25) list.push(specifier);
          dangling.set(entry.key, list);
        }
      }

      if (position % 400 === 0) await new Promise((resolve) => setImmediate(resolve));
    }

    // Anything with no edge in either direction is unconnected - including
    // files that are not source at all, which is why the whole index is
    // counted here and not just the files that could be parsed.
    const unconnected = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      if (outbound.has(entry.key) || inbound.has(entry.key)) continue;
      unconnected.push(entry);
    }

    const danglingList = [...dangling.entries()]
      .map(([key, specifiers]) => {
        const entry = this.index.get(key);
        return {
          key,
          locationId: entry && entry.data && entry.data.locationId,
          zone: entry && entry.data && entry.data.zone,
          system: entry && entry.data && entry.data.system,
          relativePath: entry && entry.data && entry.data.relativePath,
          missing: specifiers
        };
      })
      .sort((a, b) => b.missing.length - a.missing.length);

    const limit = Number(options.limit) || 100;
    this._wiring = {
      readOnly: true,
      indexVersion: this.indexVersion,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      totals: {
        sourceFiles: sources.length,
        mappedFiles: this.locationIndex.size,
        resolvedEdges,
        externalReferences,
        filesWithOutbound: outbound.size,
        filesWithInbound: inbound.size,
        filesWithDanglingRefs: dangling.size,
        danglingReferences: [...dangling.values()].reduce((sum, list) => sum + list.length, 0),
        unconnectedFiles: unconnected.length,
        unreadable
      },
      dangling: danglingList.slice(0, limit)
    };

    this._wiringGraph = { outbound, inbound };
    return this._wiring;
  }

  /**
   * Wirelines: every file connected by the rule that fits its material, and
   * then by containment regardless, so no file can fall out of the catalogue.
   *
   * A stylesheet is wired by url() and @import, markup by src and href, a
   * document by its links and by the module identifiers it names, a migration
   * by the tables it creates and the tables it depends on, a manifest by the
   * directory it describes. And every file, whatever it is, belongs to a
   * system - the shelf it sits on - which is a real relationship and the one
   * that guarantees complete coverage.
   *
   * Read-only.
   */
  async buildWirelines(options = {}) {
    await this.ensureInitialized();

    if (this._wirelines && this._wirelines.indexVersion === this.indexVersion && options.refresh !== true) {
      return this._wirelines;
    }

    const startedAt = Date.now();
    const maxBytes = Number(options.maxBytes) || 4194304; // 4MB: past this a file is data, not prose

    const keyForPath = new Map();
    for (const [filePath, keys] of this._pathToKeys) {
      const [first] = keys;
      if (first) keyForPath.set(path.normalize(filePath), first);
    }

    // Module id -> the keys that constitute it, so a document naming M041
    // reaches the module rather than a file that happens to share the string.
    const moduleKeys = new Map();
    // Table name -> the migration key that creates it.
    const tableCreator = new Map();

    const files = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      files.push(entry);
      const system = entry.data.system;
      if (system && /^M\d{3,}/.test(system)) {
        const bucket = moduleKeys.get(system) || [];
        if (bucket.length < 4) bucket.push(entry.key);
        moduleKeys.set(system, bucket);
      }
    }

    const edges = new Map();      // key -> Set(key)
    const reverse = new Map();    // key -> Set(key)
    const byKind = {};
    const dangling = new Map();
    let resolved = 0;
    let external = 0;
    let unreadable = 0;

    // from -> to -> kind. The kind was previously counted and discarded, so
    // every consumer of the graph saw an untyped edge and could not tell a
    // citation from a dependency.
    const edgeKind = new Map();
    const link = (from, to, kind) => {
      if (!to || from === to) return;
      let out = edges.get(from);
      if (!out) { out = new Set(); edges.set(from, out); }
      if (out.has(to)) return;
      out.add(to);
      let into = reverse.get(to);
      if (!into) { into = new Set(); reverse.set(to, into); }
      into.add(from);
      edgeKind.set(`${from}\u0000${to}`, kind);
      byKind[kind] = (byKind[kind] || 0) + 1;
      resolved += 1;
    };

    const resolvePath = (directory, specifier) => {
      if (!specifier || /^[a-z]+:/i.test(specifier)) return null;
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) return null;
      const base = path.resolve(directory, specifier);
      for (const suffix of RESOLUTION_SUFFIXES) {
        const candidate = keyForPath.get(path.normalize(base + suffix));
        if (candidate) return candidate;
      }
      return null;
    };

    // What sits in each directory, needed both by the runtime-scan wireline
    // below and by the manifest wireline further down.
    const directoryContents = new Map();
    for (const entry of files) {
      const directory = path.dirname(entry.path);
      const bucket = directoryContents.get(directory) || [];
      bucket.push(entry.key);
      directoryContents.set(directory, bucket);
    }

    // ---- first pass: which migration creates which table
    const migrations = files.filter((entry) => entry.data.extension === '.sql');
    for (let i = 0; i < migrations.length; i += 1) {
      const entry = migrations[i];
      if ((entry.fileSize || 0) > maxBytes) continue;
      let source;
      try { source = fs.readFileSync(entry.path, 'utf8'); } catch (error) { continue; }
      for (const table of extractSchemaReferences(source).creates) {
        if (!tableCreator.has(table)) tableCreator.set(table, entry.key);
      }
      if (i % 400 === 0) await new Promise((resolve) => setImmediate(resolve));
    }

    // ---- second pass: wire every file by its own material
    for (let i = 0; i < files.length; i += 1) {
      const entry = files[i];
      const extension = entry.data.extension || '';
      const kind = wirelineKindFor(extension);
      const directory = path.dirname(entry.path);

      if (kind !== 'other' && (entry.fileSize || 0) <= maxBytes) {
        let source;
        try { source = fs.readFileSync(entry.path, 'utf8'); } catch (error) { unreadable += 1; source = null; }

        if (source !== null) {
          let specifiers = [];
          if (kind === 'code') specifiers = extractReferences(source);
          else if (kind === 'style') specifiers = extractStyleReferences(source);
          else if (kind === 'markup') specifiers = extractMarkupReferences(source);
          else if (kind === 'doc') specifiers = extractDocReferences(source);
          else if (kind === 'manifest') specifiers = extractDocReferences(source);

          for (const specifier of specifiers) {
            if (!specifier.startsWith('.') && !specifier.startsWith('/')) { external += 1; continue; }
            const target = resolvePath(directory, specifier);
            if (target) link(entry.key, target, kind);
            else {
              const list = dangling.get(entry.key) || [];
              if (list.length < 25) list.push(specifier);
              dangling.set(entry.key, list);
            }
          }

          // A document that names a module is about that module.
          if (kind === 'doc') {
            for (const mention of extractModuleMentions(source)) {
              for (const target of moduleKeys.get(mention) || []) link(entry.key, target, 'mention');
            }
          }

          // A file that reads a directory at runtime reaches everything in it.
          // Checked here rather than in a pass of its own: re-reading all
          // 80,336 source files to find this cost four times the runtime of
          // the entire wireline build for a fraction of a percent of coverage.
          if (kind === 'code' && /readdirSync|require\.context/.test(source)) {
            for (const specifier of extractScannedDirectories(source)) {
              const scanned = path.resolve(directory, specifier);
              for (const mounted of directoryContents.get(scanned) || []) {
                link(entry.key, mounted, 'discovers');
              }
            }
          }

          // A migration depends on whatever created the tables it touches.
          if (kind === 'schema') {
            const schema = extractSchemaReferences(source);
            for (const table of schema.uses) {
              const creator = tableCreator.get(table);
              if (creator) link(entry.key, creator, 'schema');
            }
          }
        }
      }

      if (i % 400 === 0) await new Promise((resolve) => setImmediate(resolve));
    }

    // ---- code that is discovered, not imported.
    //
    // A test is never required by anything - a runner finds it - and a route
    // file mounted by a directory scan has no importer either. Both are in
    // active use, so filing them as unreached states something untrue about
    // the project. Each is linked to what actually reaches it.
    const byStem = new Map();
    for (const entry of files) {
      if (!WIRELINE_EXTENSIONS.code.has(entry.data.extension || '')) continue;
      const stem = path.parse(entry.data.name || '').name.toLowerCase();
      if (!stem) continue;
      const bucket = byStem.get(stem) || [];
      bucket.push(entry);
      byStem.set(stem, bucket);
    }

    for (const entry of files) {
      const name = entry.data.name || '';
      if (!isTestFile(entry.data.relativePath || '', name)) continue;
      const directory = path.dirname(entry.path);

      for (const stem of subjectsUnderTest(entry.data.relativePath || '', name)) {
        const candidates = byStem.get(stem.toLowerCase()) || [];
        // Prefer a subject beside the test, or one directory up from __tests__,
        // before falling back to any file of that name in the same system.
        const scored = candidates
          .filter((candidate) => candidate.key !== entry.key)
          .map((candidate) => {
            const candidateDir = path.dirname(candidate.path);
            let rank = 3;
            if (candidateDir === directory) rank = 0;
            else if (candidateDir === path.dirname(directory)) rank = 1;
            else if (candidate.data.system === entry.data.system) rank = 2;
            return { candidate, rank };
          })
          .sort((a, b) => a.rank - b.rank);
        if (scored.length > 0 && scored[0].rank < 3) link(entry.key, scored[0].candidate.key, 'tests');
      }
    }

    // ---- migrations run in order, and that order is a real dependency.
    // A migration that creates no foreign key still cannot run before the one
    // in front of it, so the sequence is the wireline for a standalone one.
    const migrationsByDirectory = new Map();
    for (const entry of migrations) {
      const directory = path.dirname(entry.path);
      const bucket = migrationsByDirectory.get(directory) || [];
      bucket.push(entry);
      migrationsByDirectory.set(directory, bucket);
    }
    for (const bucket of migrationsByDirectory.values()) {
      bucket.sort((a, b) => String(a.data.name).localeCompare(String(b.data.name), 'en', { numeric: true }));
      for (let i = 1; i < bucket.length; i += 1) {
        link(bucket[i].key, bucket[i - 1].key, 'sequence');
      }
    }

    // ---- a manifest describes the directory it sits in. module.json is the
    // discovery contract for everything beneath it, package.json the same for
    // its package, so the files around it are what it is about.
    for (const entry of files) {
      if (!WIRELINE_EXTENSIONS.manifest.has(entry.data.extension || '')) continue;
      const siblings = directoryContents.get(path.dirname(entry.path)) || [];
      // Bounded: a manifest beside a thousand files describes a directory, and
      // a thousand edges would say less than the first few dozen do.
      let issued = 0;
      for (const siblingKey of siblings) {
        if (issued >= 40) break;
        if (siblingKey === entry.key) continue;
        link(entry.key, siblingKey, 'describes');
        issued += 1;
      }
    }

    // ---- containment: the shelf a file sits on is a real relationship
    const shelves = new Map();
    for (const entry of files) {
      const shelf = `${entry.data.zone}::${entry.data.system}`;
      const bucket = shelves.get(shelf) || [];
      bucket.push(entry.key);
      shelves.set(shelf, bucket);
    }

    let semanticallyWired = 0;
    for (const entry of files) {
      if (edges.has(entry.key) || reverse.has(entry.key)) semanticallyWired += 1;
    }

    const kindCounts = {};
    for (const entry of files) {
      const k = wirelineKindFor(entry.data.extension || '');
      kindCounts[k] = kindCounts[k] || { total: 0, wired: 0 };
      kindCounts[k].total += 1;
      if (edges.has(entry.key) || reverse.has(entry.key)) kindCounts[k].wired += 1;
    }
    for (const value of Object.values(kindCounts)) {
      value.coverage = value.total ? +(100 * value.wired / value.total).toFixed(1) : 0;
    }

    this._wirelines = {
      readOnly: true,
      indexVersion: this.indexVersion,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      totals: {
        files: files.length,
        semanticEdges: resolved,
        edgesByKind: byKind,
        externalReferences: external,
        semanticallyWired,
        shelvedOnly: files.length - semanticallyWired,
        shelves: shelves.size,
        cataloguedFiles: files.length,
        uncatalogued: 0,
        danglingFiles: dangling.size,
        danglingReferences: [...dangling.values()].reduce((sum, list) => sum + list.length, 0),
        tablesCreated: tableCreator.size,
        unreadable
      },
      coverageByMaterial: kindCounts
    };

    this._wirelineGraph = { edges, reverse, shelves, tableCreator, edgeKind };
    return this._wirelines;
  }

  /** The relationship on one edge, or null if the two are not linked. */
  edgeKindBetween(from, to) {
    const graph = this._wirelineGraph;
    return graph ? (graph.edgeKind.get(`${from}\u0000${to}`) || null) : null;
  }

  /**
   * A file's neighbours, typed and filterable.
   *
   * @param key            the file
   * @param options.kinds  'membership' | 'reference' | 'all' (default all)
   * @param options.sameZone  ignore neighbours in another zone. A live file
   *                          linked to a backup copy of a migration is related
   *                          to it, but does not belong with it, and letting
   *                          that edge vote pulls live files into backups.
   */
  neighboursOf(key, options = {}) {
    const graph = this._wirelineGraph;
    if (!graph) return [];

    const entry = this.index.get(key);
    const zone = entry && entry.data ? entry.data.zone : null;
    const wanted = options.kinds === 'membership' ? MEMBERSHIP_KINDS
      : options.kinds === 'reference' ? REFERENCE_KINDS
        : null;

    const out = [];
    for (const other of graph.edges.get(key) || []) {
      const kind = this.edgeKindBetween(key, other);
      if (wanted && !wanted.has(kind)) continue;
      const otherEntry = this.index.get(other);
      if (options.sameZone && otherEntry && otherEntry.data && otherEntry.data.zone !== zone) continue;
      out.push({ key: other, kind, direction: 'out', entry: otherEntry });
    }
    for (const other of graph.reverse.get(key) || []) {
      const kind = this.edgeKindBetween(other, key);
      if (wanted && !wanted.has(kind)) continue;
      const otherEntry = this.index.get(other);
      if (options.sameZone && otherEntry && otherEntry.data && otherEntry.data.zone !== zone) continue;
      out.push({ key: other, kind, direction: 'in', entry: otherEntry });
    }
    return out;
  }

  /**
   * Where a file's wiring says it belongs, judged only on relationships that
   * mean membership and only within its own zone.
   *
   * Returns null when the evidence does not support an answer - no typed
   * neighbours, or a pull split across systems. A file used evenly by two
   * systems is shared infrastructure, and moving it would only change which
   * side is inconvenienced.
   */
  placementFor(key, options = {}) {
    const entry = this.index.get(key);
    if (!entry || !entry.data) return null;

    const neighbours = this.neighboursOf(key, { kinds: 'membership', sameZone: true });
    if (neighbours.length === 0) return { key, verdict: 'no-evidence', currentSystem: entry.data.system };

    const votes = new Map();
    for (const neighbour of neighbours) {
      const system = neighbour.entry && neighbour.entry.data ? neighbour.entry.data.system : null;
      if (system) votes.set(system, (votes.get(system) || 0) + 1);
    }
    if (votes.size === 0) return { key, verdict: 'no-evidence', currentSystem: entry.data.system };

    const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
    const [topSystem, topVotes] = ranked[0];
    const share = topVotes / neighbours.length;
    const minimumVotes = Number(options.minimumVotes) || 3;
    const minimumShare = Number(options.minimumShare) || 0.75;

    const base = {
      key,
      locationId: entry.data.locationId,
      currentSystem: entry.data.system,
      proposedSystem: topSystem,
      confidence: +(share * 100).toFixed(0),
      neighbours: neighbours.length,
      votes: ranked.slice(0, 3).map(([system, count]) => ({ system, count }))
    };

    if (topSystem === entry.data.system) return { ...base, verdict: 'in-place' };
    if (share < minimumShare || topVotes < minimumVotes) return { ...base, verdict: 'shared' };
    return { ...base, verdict: 'misplaced' };
  }

  /**
   * Every file's linkage, including the ones only their shelf reaches. A file
   * is never absent from this - that is the point of it.
   */
  async listShelvedOnly(options = {}) {
    await this.buildWirelines(options);
    const { edges, reverse } = this._wirelineGraph;

    const rows = [];
    const byExtension = {};
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      if (edges.has(entry.key) || reverse.has(entry.key)) continue;
      const extension = entry.data.extension || '(none)';
      byExtension[extension] = (byExtension[extension] || 0) + 1;
      if (options.extension && extension !== options.extension) continue;
      if (options.zone && entry.data.zone !== options.zone) continue;
      rows.push({
        locationId: entry.data.locationId,
        shelf: `${entry.data.zone}::${entry.data.system}`,
        relativePath: entry.data.relativePath,
        extension
      });
    }

    const limit = Number(options.limit) || 200;
    return { total: rows.length, byExtension, files: rows.slice(0, limit) };
  }

  /** Files nothing references and which reference nothing - work to be done. */
  async listUnconnected(options = {}) {
    await this.buildWiring(options);
    const { outbound, inbound } = this._wiringGraph;

    const rows = [];
    for (const entry of this.index.values()) {
      if (entry.type !== 'project-file' || !entry.data) continue;
      if (outbound.has(entry.key) || inbound.has(entry.key)) continue;
      if (options.zone && entry.data.zone !== options.zone) continue;
      if (options.extension && entry.data.extension !== options.extension) continue;
      rows.push({
        locationId: entry.data.locationId,
        zone: entry.data.zone,
        system: entry.data.system,
        relativePath: entry.data.relativePath,
        extension: entry.data.extension,
        fileSize: entry.fileSize
      });
    }

    // Group by extension so the shape of the unconnected set is visible at a
    // glance rather than needing to be read row by row.
    const byExtension = {};
    for (const row of rows) byExtension[row.extension || '(none)'] = (byExtension[row.extension || '(none)'] || 0) + 1;

    const limit = Number(options.limit) || 200;
    return { total: rows.length, byExtension, files: rows.slice(0, limit) };
  }

  /** What one file is wired to, in both directions. */
  async getConnections(target, options = {}) {
    await this.buildWiring(options);
    const { outbound, inbound } = this._wiringGraph;

    let key = target;
    if (!this.index.has(key)) {
      const byLocation = this.locationIndex.get(String(target || '').trim());
      if (byLocation) key = byLocation;
    }
    const entry = this.index.get(key);
    if (!entry) return { success: false, error: 'not_found', query: target };

    const describe = (otherKey, kind) => {
      const other = this.index.get(otherKey);
      return {
        key: otherKey,
        kind: kind || null,
        locationId: other && other.data && other.data.locationId,
        relativePath: other && other.data && other.data.relativePath
      };
    };

    return {
      success: true,
      key,
      locationId: entry.data && entry.data.locationId,
      system: entry.data && entry.data.system,
      uses: [...(outbound.get(key) || [])].map((other) => describe(other, this.edgeKindBetween(key, other))),
      usedBy: [...(inbound.get(key) || [])].map((other) => describe(other, this.edgeKindBetween(other, key))),
      danglingReferences: (this._wiring.dangling.find((row) => row.key === key) || {}).missing || []
    };
  }

  /** Resolve a call number straight to its entry. */
  getByLocationId(locationId) {
    const key = this.locationIndex.get(String(locationId || '').trim());
    if (!key) return null;
    const entry = this.index.get(key);
    return entry ? { ...entry, locationId } : null;
  }

  /**
   * Index a path with whichever tier owns it: the library keeps its rich
   * entries, everything else is mapped as a project file.
   */
  indexPathAt(filePath, options = {}) {
    if (this._isUnderLibraryRoot(filePath)) {
      const key = this.indexLibraryFileAt(filePath, options);
      if (key) return key;
    }
    if (options.skipIfIndexed === true && this.indexedPaths.has(filePath)) return null;
    return this.indexEverything ? this.indexProjectFileAt(filePath) : null;
  }

  indexFile(key, type, filePath, data = {}) {
    const stat = safeStat(filePath);
    if (!stat) return;

    if (data.parseError) {
      this.indexingWarnings.push({
        key,
        type,
        path: filePath,
        warning: 'invalid_json',
        message: data.parseError
      });
    } else if (Array.isArray(data.lineErrors) && data.lineErrors.length > 0) {
      // The file itself indexed fine; only some rows were unparseable, so the
      // valid records stay searchable and the bad rows are reported.
      this.indexingWarnings.push({
        key,
        type,
        path: filePath,
        warning: 'invalid_jsonl_lines',
        message: `${data.lineErrors.length} unparseable line(s); ${data.recordCount} record(s) indexed`
      });
    }

    this.index.set(key, {
      key,
      type,
      path: filePath,
      data,
      lastModified: stat.mtime.toISOString(),
      fileSize: stat.size
    });
    this.indexedPaths.add(filePath);
    const keysForPath = this._pathToKeys.get(filePath);
    if (keysForPath) keysForPath.add(key);
    else this._pathToKeys.set(filePath, new Set([key]));
    this.indexVersion += 1;
  }

  indexLibraryCatalogues() {
    const catalogueRoots = [
      path.join(this.libraryRoot, '00_CATALOG'),
      path.join(this.libraryRoot, '03_CATALOGUE')
    ];

    for (const root of catalogueRoots) {
      if (!fs.existsSync(root)) continue;
      for (const file of fs.readdirSync(root)) {
        const filePath = path.join(root, file);
        const stat = safeStat(filePath);
        if (!stat || !stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        const data = ext === '.json' ? readJson(filePath) : readCsvHeader(filePath);
        this.indexFile(`CATALOG:${file}`, 'catalogue', filePath, {
          name: file,
          extension: ext,
          ...data
        });
      }
    }
  }

  indexLibraryModuleCards() {
    const cardsRoot = path.join(this.libraryRoot, '01_MODULE_CARDS');
    if (!fs.existsSync(cardsRoot)) return;

    for (const file of fs.readdirSync(cardsRoot)) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(cardsRoot, file);
      const data = readJson(filePath);
      this.indexFile(data.moduleId || data.CardID || path.basename(file, '.json'), 'library-module-card', filePath, data);
    }
  }

  indexModularSystems() {
    const modularRoot = path.join(this.libraryRoot, '01_MODULES', 'MODULAR_SYSTEM');
    if (!fs.existsSync(modularRoot)) return;

    for (const file of fs.readdirSync(modularRoot)) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(modularRoot, file);
      const data = readJson(filePath);
      this.indexFile(data.systemId || data.moduleId || path.basename(file, '.json'), 'modular-system-card', filePath, data);
    }
  }

  indexRuntimeModules() {
    if (!fs.existsSync(this.modulesRoot)) return;

    for (const dir of fs.readdirSync(this.modulesRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const moduleJsonPath = path.join(this.modulesRoot, dir.name, 'module.json');
      if (!fs.existsSync(moduleJsonPath)) continue;

      const data = readJson(moduleJsonPath);
      this.indexFile(data.moduleId || dir.name, 'runtime-module', moduleJsonPath, {
        ...data,
        runtimePath: path.dirname(moduleJsonPath),
        hasBackend: fs.existsSync(path.join(this.modulesRoot, dir.name, 'backend', 'service.js')),
        hasApi: fs.existsSync(path.join(this.modulesRoot, dir.name, 'api', 'routes.js')),
        hasFrontend: fs.existsSync(path.join(this.modulesRoot, dir.name, 'frontend', 'index.jsx'))
      });
    }
  }

  indexBackendModules() {
    if (!fs.existsSync(this.backendModulesRoot)) return;

    for (const dir of fs.readdirSync(this.backendModulesRoot, { withFileTypes: true })) {
      if (!dir.isDirectory() || !/^M\d{3}$/.test(dir.name)) continue;
      const modulePath = path.join(this.backendModulesRoot, dir.name);
      const doc = this.readBackendModuleDoc(modulePath);
      this.indexFile(`BACKEND:${dir.name}`, 'backend-module', modulePath, {
        moduleId: dir.name,
        name: doc.title || this.inferBackendModuleName(dir.name),
        domain: doc.domain,
        description: doc.summary,
        docStatus: doc.status,
        hasBackend: fs.existsSync(path.join(modulePath, 'service.js')),
        hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
        hasController: fs.existsSync(path.join(modulePath, 'controller.js')),
        hasModel: fs.existsSync(path.join(modulePath, 'model.sql')),
        hasDocs: fs.existsSync(path.join(modulePath, 'README.md')),
        apiBase: `/api/v1/modules/${dir.name.toLowerCase()}`
      });
    }
  }

  /**
   * Read a backend module's README for its real title and declared domain.
   *
   * The directory name alone (M006) says nothing about what the module does,
   * so every bare module was unclassifiable and the org chart had to file 339
   * of them under Unassigned. The README states both: "# M006 - System
   * Administration" and "Domain: Platform Foundation".
   */
  readBackendModuleDoc(modulePath) {
    const readmePath = path.join(modulePath, 'README.md');
    if (!fs.existsSync(readmePath)) return {};

    const raw = readTextPreview(readmePath, 8192);

    // Some generated READMEs were written with literal "\n" escape sequences
    // instead of real newlines, so the whole document sits on one line. Left
    // as-is, the title match swallows the entire file and the module ends up
    // named after its own README body.
    const text = !raw.includes('\n') && raw.includes('\\n')
      ? raw.replace(/\\r\\n|\\n/g, '\n')
      : raw;

    const doc = {};

    const title = text.match(/^\uFEFF?#\s*M\d+\s*[-\u2013\u2014:]\s*(.+)$/m);
    if (title) doc.title = title[1].trim();

    const domain = text.match(/^Domain:\s*(.+)$/m);
    if (domain) {
      const value = domain[1].trim();
      // Some READMEs carry a placeholder or a wrapped sentence rather than a
      // label, so only a short, plausible value is taken as a real domain.
      if (value.length <= 60 && !/^TBD/i.test(value)) doc.domain = value;
    }

    const status = text.match(/^Status:\s*(.+)$/m);
    if (status) doc.status = status[1].trim();

    // First prose line, for keyword classification when no domain is declared.
    const prose = text.split(/\r?\n/).find((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#') && !/^(Domain|Status):/.test(trimmed);
    });
    if (prose) doc.summary = prose.trim().slice(0, 300);

    return doc;
  }

  inferBackendModuleName(moduleId) {
    const names = {
      M026: 'Farmer Skill Management',
      M027: 'Farmer Certification',
      M028: 'Farmer Advisory',
      M029: 'Farmer Health & Welfare',
      M030: 'Farmer Performance'
    };
    return names[moduleId] || moduleId;
  }

  async computeContentHashes() {
    this.contentHashes.clear();

    for (const [key, item] of this.index) {
      const stat = safeStat(item.path);
      if (!stat || !stat.isFile()) continue;
      const content = fs.readFileSync(item.path);
      this.contentHashes.set(key, {
        key,
        hash: crypto.createHash('sha256').update(content).digest('hex'),
        path: item.path,
        size: content.length,
        computedAt: new Date().toISOString()
      });
    }

    return this.contentHashes;
  }

  async syncToDatabase() {
    // Each row carries a content hash, so they must exist before writing.
    await this.ensureContentHashes();
    const pool = optionalDatabase();
    if (!pool) {
      return { success: false, skipped: true, reason: 'Database connection is not available' };
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_knowledge (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(80) NOT NULL,
        content_hash VARCHAR(64),
        data JSONB,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        last_modified TIMESTAMP,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const [key, item] of this.index) {
      const hashData = this.contentHashes.get(key);
      await pool.query(`
        INSERT INTO library_knowledge (key, type, content_hash, data, file_path, file_size, last_modified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (key) DO UPDATE SET
          type = EXCLUDED.type,
          content_hash = EXCLUDED.content_hash,
          data = EXCLUDED.data,
          file_path = EXCLUDED.file_path,
          file_size = EXCLUDED.file_size,
          last_modified = EXCLUDED.last_modified,
          indexed_at = CURRENT_TIMESTAMP
      `, [
        key,
        item.type,
        hashData ? hashData.hash : null,
        JSON.stringify(item.data),
        item.path,
        item.fileSize,
        item.lastModified
      ]);
    }

    return { success: true, synced: this.index.size };
  }

  async searchLibrary(query = '', filters = {}) {
    await this.ensureInitialized();
    const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
    const requestedType = filters.type;

    const results = [];
    for (const [key, item] of this.index) {
      if (requestedType && item.type !== requestedType) continue;
      const haystack = `${key} ${item.type} ${JSON.stringify(item.data)}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      if (terms.length === 0 || score > 0) {
        results.push({
          key,
          type: item.type,
          data: item.data,
          path: item.path,
          relevance: terms.length ? score / terms.length : 1
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance || a.key.localeCompare(b.key));
  }

  async listModules(filters = {}) {
    await this.ensureInitialized();
    const typeSet = new Set(['runtime-module', 'backend-module', 'library-module-card']);
    const modules = Array.from(this.index.values())
      .filter(item => typeSet.has(item.type))
      .filter(item => !filters.status || item.data.status === filters.status)
      .filter(item => !filters.category || item.data.category === filters.category)
      .map(item => ({
        moduleId: item.data.moduleId || item.data.module_id || item.key,
        name: item.data.name || item.data.ModuleName || item.key,
        type: item.type,
        status: item.data.status || item.data.Status || 'catalogued',
        category: item.data.category || item.data.domain || item.data.Domain || null,
        backend: Boolean(item.data.hasBackend),
        api: Boolean(item.data.hasApi || item.data.hasRoutes),
        frontend: Boolean(item.data.hasFrontend),
        path: item.path
      }));

    return modules;
  }

  async getModule(moduleId) {
    await this.ensureInitialized();
    const normalized = String(moduleId).toLowerCase();

    for (const item of this.index.values()) {
      const candidate = String(item.data.moduleId || item.data.module_id || item.key).toLowerCase();
      if (candidate === normalized || item.key.toLowerCase() === normalized) {
        return { success: true, module: item };
      }
    }

    return { success: false, error: `Module not found: ${moduleId}` };
  }

  /**
   * Module-shaped view of searchLibrary, for agents asking "what can do X?"
   * rather than searching raw library entries.
   */
  async discoverModules(query = '', context = {}) {
    const results = await this.searchLibrary(query, context);
    const modules = results
      .filter((result) => ['runtime-module', 'backend-module', 'library-module-card'].includes(result.type))
      .slice(0, 10)
      .map((result) => ({
        moduleId: result.data.moduleId || result.data.module_id || result.key,
        name: result.data.name || result.data.ModuleName || result.key,
        matchScore: result.relevance,
        capabilities: result.data.discovery?.capabilities || [],
        aiContext: result.data.discovery?.aiContext || '',
        dependencies: result.data.dependencies || { modules: [] },
        status: result.data.status || result.data.Status || 'catalogued',
        category: result.data.category || result.data.domain || null,
        isProductionReady: result.data.status === 'production'
      }));

    return {
      success: true,
      modules,
      metadata: {
        totalMatches: modules.length,
        queryProcessed: true
      }
    };
  }

  /**
   * Topologically order a module's dependencies. Returns a failure rather than
   * throwing when the graph contains a cycle, so a bad catalogue entry cannot
   * take down the caller.
   */
  async resolveDependencies(moduleId) {
    const moduleResult = await this.getModule(moduleId);
    if (!moduleResult.success) return moduleResult;

    const resolutionOrder = [];
    const visiting = new Set();
    const visited = new Set();

    const visit = async (candidateId) => {
      if (visited.has(candidateId)) return;
      if (visiting.has(candidateId)) throw new Error(`Circular dependency detected: ${candidateId}`);
      visiting.add(candidateId);

      const candidate = await this.getModule(candidateId);
      if (candidate.success) {
        const dependencies = candidate.module.data.dependencies?.modules || [];
        for (const dependency of dependencies) await visit(dependency);
      }

      visiting.delete(candidateId);
      visited.add(candidateId);
      resolutionOrder.push(candidateId);
    };

    try {
      await visit(moduleId);
      return { success: true, resolutionOrder, modules: resolutionOrder };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Context for a model, sized to actually be sent.
   *
   * This returned raw index entries. Twelve of them came to 47 MB for a single
   * query - because one entry can carry a 500-record ledger, a 12,000-character
   * preview or a parsed CSV - which no model can accept and no caller should
   * pay for. Each match is now projected to an excerpt plus the address needed
   * to fetch the rest on demand, and the whole payload is bounded.
   */
  async buildAIContext(query = '', context = {}) {
    const results = await this.searchLibrary(query, context);
    const limit = Number(context.limit) || 12;
    const excerptBytes = Number(context.excerptBytes) || 800;
    const budget = Number(context.maxBytes) || 120000;

    const excerptOf = (entry) => {
      const data = entry.data || {};
      if (typeof data.content === 'string' && data.content.trim()) return data.content.slice(0, excerptBytes);
      if (data.description) return String(data.description).slice(0, excerptBytes);
      if (data.aiContext) return String(data.aiContext).slice(0, excerptBytes);
      if (data.format === 'jsonl') return `${data.recordCount || 0} records; first: ${JSON.stringify(data.records && data.records[0] || {}).slice(0, excerptBytes)}`;
      // Last resort: a shallow shape of the object, never the object itself.
      return Object.keys(data).slice(0, 25).join(', ');
    };

    const matches = [];
    let used = 0;
    for (const entry of results.slice(0, limit)) {
      const match = {
        key: entry.key,
        type: entry.type,
        name: (entry.data && entry.data.name) || entry.key,
        locationId: entry.data && entry.data.locationId,
        relativePath: entry.data && entry.data.relativePath,
        relevance: entry.relevance,
        excerpt: excerptOf(entry)
      };
      const size = JSON.stringify(match).length;
      // Stop before the budget rather than after it, so the caller never
      // receives something larger than it asked for.
      if (used + size > budget && matches.length > 0) break;
      used += size;
      matches.push(match);
    }

    return {
      moduleId: MODULE_ID,
      query,
      context,
      matchCount: matches.length,
      totalCandidates: results.length,
      approxBytes: used,
      matches,
      retrieval: {
        note: 'Excerpts only. Fetch full content by key or locationId when needed.',
        operation: 'handover'
      },
      guardrails: {
        claudeCompatible: true,
        sourceAuthority: '_EBDESIGN_LIBRARY and runtime module manifests',
        noFileMutation: true
      }
    };
  }

  async verifyCatalogIntegrity() {
    // Integrity is checked against content hashes, so they must be present.
    await this.ensureContentHashes();
    const issues = [];

    for (const [key, item] of this.index) {
      if (!fs.existsSync(item.path)) {
        issues.push({ key, type: 'missing_file', path: item.path });
      }

      if (item.data?.parseError) {
        issues.push({
          key,
          type: 'invalid_json',
          path: item.path,
          message: item.data.parseError
        });
      }
    }

    return {
      verified: issues.length === 0,
      totalItems: this.index.size,
      hashedFiles: this.contentHashes.size,
      issues,
      warnings: this.indexingWarnings,
      verificationDate: new Date().toISOString()
    };
  }

  getStatistics() {
    const byType = {};
    for (const item of this.index.values()) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    return {
      moduleId: MODULE_ID,
      moduleName: MODULE_NAME,
      initialized: this.initialized,
      totalItems: this.index.size,
      contentHashes: this.contentHashes.size,
      indexingWarnings: this.indexingWarnings.length,
      byType,
      libraryRoot: this.libraryRoot,
      modulesRoot: this.modulesRoot,
      lastIndexed: new Date().toISOString()
    };
  }

  async healthCheck() {
    await this.ensureInitialized();
    return {
      status: 'healthy',
      moduleId: MODULE_ID,
      moduleName: MODULE_NAME,
      indexedItems: this.index.size,
      indexingWarnings: this.indexingWarnings.length,
      claudeCompatible: true
    };
  }

  async execute(operation, parameters = {}, context = {}) {
    try {
      switch (operation) {
        case 'initialize':
          return { success: true, data: await this.initialize(parameters) };
        case 'search':
        case 'discover':
          return { success: true, data: await this.searchLibrary(parameters.query || '', parameters) };
        case 'modules':
        case 'list':
          return { success: true, data: await this.listModules(parameters) };
        case 'getModule':
        case 'read':
          return await this.getModule(parameters.moduleId || parameters.id);
        case 'aiContext':
        case 'analyze':
          return { success: true, data: await this.buildAIContext(parameters.query || '', context) };
        case 'discoverModules':
          return await this.discoverModules(parameters.query || '', context);
        case 'resolveDependencies':
          return await this.resolveDependencies(parameters.moduleId || parameters.id);
        case 'verify':
          return { success: true, data: await this.verifyCatalogIntegrity() };
        case 'statistics':
          await this.ensureInitialized();
          return { success: true, data: this.getStatistics() };
        case 'orgChart':
          await this.ensureInitialized();
          return { success: true, data: this.getOrgChart(parameters) };
        case 'manifest':
          await this.ensureInitialized();
          return { success: true, data: this.getManifest(parameters) };
        case 'duplicateNames':
          await this.ensureInitialized();
          return { success: true, data: this.getDuplicateNames(parameters) };
        case 'findFile':
          await this.ensureInitialized();
          return { success: true, data: this.findFile(parameters.name || parameters.query, parameters) };
        case 'resolveFile':
          await this.ensureInitialized();
          return { success: true, data: this.resolveFile(parameters.name || parameters.query, parameters) };
        case 'placement':
          await this.buildWirelines(parameters);
          return { success: true, data: this.placementFor(parameters.key, parameters) };
        case 'neighbours':
          await this.buildWirelines(parameters);
          return { success: true, data: this.neighboursOf(parameters.key, parameters).map((n) => ({
            key: n.key, kind: n.kind, direction: n.direction,
            locationId: n.entry && n.entry.data && n.entry.data.locationId
          })) };
        case 'wirelines':
          return { success: true, data: await this.buildWirelines(parameters) };
        case 'shelvedOnly':
          return { success: true, data: await this.listShelvedOnly(parameters) };
        case 'wiring':
          return { success: true, data: await this.buildWiring(parameters) };
        case 'unconnected':
          return { success: true, data: await this.listUnconnected(parameters) };
        case 'connections':
          return await this.getConnections(parameters.key || parameters.locationId, parameters);
        case 'studySystems':
          return { success: true, data: await this.studySystems(parameters) };
        case 'getSystem':
          return await this.getSystem(parameters.system || parameters.systemId, parameters);
        case 'studyContent':
          return { success: true, data: await this.studyContent(parameters) };
        case 'uniqueFiles':
          return { success: true, data: await this.listUniqueFiles(parameters) };
        case 'byLocationId':
          return { success: true, data: this.getByLocationId(parameters.locationId) };
        case 'reindex':
          return { success: true, data: await this.reindex() };
        case 'startWatching':
          await this.ensureInitialized();
          return { success: true, data: this.startWatching() };
        case 'stopWatching':
          return { success: true, data: this.stopWatching() };
        case 'watchStatus':
          return { success: true, data: this.getWatchStatus() };
        case 'syncDatabase':
          await this.ensureInitialized();
          return { success: true, data: await this.syncToDatabase() };
        default:
          return { success: false, error: `Unsupported ${MODULE_ID} operation: ${operation}` };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIBRARY_MODULE_ERROR',
          message: error.message,
          operation,
          moduleId: MODULE_ID,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

module.exports = LibraryKnowledgeService;
module.exports.createService = (options) => new LibraryKnowledgeService(options);
module.exports.singleton = new LibraryKnowledgeService();
