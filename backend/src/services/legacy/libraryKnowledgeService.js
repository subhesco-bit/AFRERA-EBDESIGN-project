/**
 * Enhanced Library Knowledge Service with AI Integration
 * Complete catalog system with content hashing and AI search
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getPostgreSQL } = require('../../database/connection');

class LibraryKnowledgeService {
  constructor() {
    // Point to the real modules/ directory instead of non-existent _EBDESIGN_LIBRARY
    // Need to go up to the project root then into modules/
    this.libraryRoot = path.join(__dirname, '../../../../modules');
    this.modulesPath = this.libraryRoot;
    this.index = new Map();
    this.contentHashes = new Map();
  }

  /**
   * Initialize library indexing
   */
  async initialize() {
    try {
      await this.buildIndex();
      await this.computeContentHashes();
      await this.syncToDatabase();
      console.log('Library Knowledge Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize library service:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive library index from modules/ directory
   */
  async buildIndex() {
    console.log('Building library index from modules/ directory...');

    if (!fs.existsSync(this.modulesPath)) {
      console.warn('Modules directory does not exist:', this.modulesPath);
      return;
    }

    // Index all module directories
    const moduleDirs = fs.readdirSync(this.modulesPath).filter(f => {
      const modulePath = path.join(this.modulesPath, f);
      return fs.statSync(modulePath).isDirectory() && f.startsWith('M');
    });

    for (const moduleDir of moduleDirs) {
      const moduleJsonPath = path.join(this.modulesPath, moduleDir, 'module.json');
      if (fs.existsSync(moduleJsonPath)) {
        try {
          const content = fs.readFileSync(moduleJsonPath, 'utf8');
          const moduleData = JSON.parse(content);

          this.index.set(moduleDir, {
            type: 'module',
            data: moduleData,
            path: moduleJsonPath,
            lastModified: fs.statSync(moduleJsonPath).mtime,
          });
        } catch (error) {
          console.warn(`Failed to parse ${moduleJsonPath}:`, error.message);
        }
      }
    }

    console.log(`Indexed ${this.index.size} modules from modules/ directory`);
  }

  /**
   * Compute SHA256 content hashes for all library files
   */
  async computeContentHashes() {
    console.log('Computing content hashes...');

    for (const [filename, item] of this.index) {
      const content = fs.readFileSync(item.path, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      this.contentHashes.set(filename, {
        hash,
        path: item.path,
        size: Buffer.byteLength(content),
        computedAt: new Date().toISOString(),
      });
    }

    console.log(`Computed ${this.contentHashes.size} content hashes`);
  }

  /**
   * Sync library data to database
   */
  async syncToDatabase() {
    try {
      const pool = await getPostgreSQL();

      if (!pool) {
        console.warn('PostgreSQL not available, skipping database sync');
        return;
      }

      // Create library_knowledge table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS library_knowledge (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          data JSONB,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          last_modified TIMESTAMP,
          indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create library_content_hashes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS library_content_hashes (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert/update library items
      for (const [filename, item] of this.index) {
        const hashData = this.contentHashes.get(filename);

        await pool.query(`
          INSERT INTO library_knowledge (filename, type, content_hash, data, file_path, file_size, last_modified)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (filename) DO UPDATE SET
            type = EXCLUDED.type,
            content_hash = EXCLUDED.content_hash,
            data = EXCLUDED.data,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            last_modified = EXCLUDED.last_modified,
            indexed_at = CURRENT_TIMESTAMP
        `, [
          filename,
          item.type,
          hashData.hash,
          JSON.stringify(item.data),
          item.path,
          hashData.size,
          item.lastModified,
        ]);
      }

      // Insert/update content hashes
      for (const [filename, hashData] of this.contentHashes) {
        await pool.query(`
          INSERT INTO library_content_hashes (filename, content_hash, file_path, file_size, computed_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (filename) DO UPDATE SET
            content_hash = EXCLUDED.content_hash,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            computed_at = EXCLUDED.computed_at
        `, [
          filename,
          hashData.hash,
          hashData.path,
          hashData.size,
          hashData.computedAt,
        ]);
      }

      console.log('Library data synced to database');
    } catch (error) {
      console.error('Failed to sync to database:', error);
      // Don't throw - allow service to work without database
      console.warn('Continuing without database sync');
    }
  }

  /**
   * Parse module data from JSON (already parsed in buildIndex)
   * This method is kept for compatibility but module data is already JSON
   */
  parseModuleCard(content) {
    // Content is already parsed as JSON in buildIndex
    return content;
  }

  /**
   * Parse component data (not used in current implementation)
   * Kept for compatibility
   */
  parseComponentCard(content) {
    return content;
  }

  /**
   * Search library by keyword
   */
  async searchLibrary(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [moduleId, item] of this.index) {
      const moduleData = item.data;
      const searchableText = [
        moduleData.moduleId || '',
        moduleData.name || '',
        moduleData.description || '',
        moduleData.category || '',
        JSON.stringify(moduleData.discovery || {}),
        JSON.stringify(moduleData.capabilities || [])
      ].join(' ').toLowerCase();

      if (searchableText.includes(lowerQuery)) {
        results.push({
          moduleId,
          type: item.type,
          data: moduleData,
          relevance: this.calculateRelevance(searchableText, lowerQuery),
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevance(content, query) {
    const words = query.split(' ');
    let score = 0;

    for (const word of words) {
      const occurrences = (content.match(new RegExp(word, 'g')) || []).length;
      score += occurrences * 10;
    }

    return score;
  }

  /**
   * Get library statistics
   */
  async getStatistics() {
    const stats = {
      totalItems: this.index.size,
      modules: 0,
      components: 0,
      totalHashes: this.contentHashes.size,
      lastIndexed: new Date().toISOString(),
      categories: {},
      statusDistribution: {},
    };

    for (const [, item] of this.index) {
      if (item.type === 'module') {
        stats.modules++;
        const category = item.data.category || 'unknown';
        stats.categories[category] = (stats.categories[category] || 0) + 1;

        const status = item.data.status || 'unknown';
        stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
      }
      if (item.type === 'component') stats.components++;
    }

    return stats;
  }

  /**
   * Verify catalog integrity
   */
  async verifyCatalogIntegrity() {
    const issues = [];

    for (const [filename, hashData] of this.contentHashes) {
      if (!fs.existsSync(hashData.path)) {
        issues.push({
          type: 'missing_file',
          filename,
          path: hashData.path,
        });
        continue;
      }

      const currentContent = fs.readFileSync(hashData.path, 'utf8');
      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');

      if (currentHash !== hashData.hash) {
        issues.push({
          type: 'hash_mismatch',
          filename,
          path: hashData.path,
          expected: hashData.hash,
          actual: currentHash,
        });
      }
    }

    return {
      verified: issues.length === 0,
      totalFiles: this.contentHashes.size,
      issues,
      verificationDate: new Date().toISOString(),
    };
  }
}

module.exports = new LibraryKnowledgeService();

