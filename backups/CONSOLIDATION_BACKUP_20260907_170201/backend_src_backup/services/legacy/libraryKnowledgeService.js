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
    this.libraryRoot = path.join(__dirname, '../../../../_EBDESIGN_LIBRARY');
    this.catalogPath = path.join(this.libraryRoot, '00_CATALOG');
    this.modulesPath = path.join(this.libraryRoot, '01_MODULES');
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
   * Build comprehensive library index
   */
  async buildIndex() {
    console.log('Building library index...');
    
    // Index module cards
    const modulesDir = path.join(this.modulesPath, 'Module_Cards');
    if (fs.existsSync(modulesDir)) {
      const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.md'));
      
      for (const file of moduleFiles) {
        const filePath = path.join(modulesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const moduleData = this.parseModuleCard(content);
        
        this.index.set(file, {
          type: 'module',
          data: moduleData,
          path: filePath,
          lastModified: fs.statSync(filePath).mtime
        });
      }
    }

    // Index component cards
    const componentsDir = path.join(this.modulesPath, 'Component_Cards');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.md'));
      
      for (const file of componentFiles) {
        const filePath = path.join(componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const componentData = this.parseComponentCard(content);
        
        this.index.set(file, {
          type: 'component',
          data: componentData,
          path: filePath,
          lastModified: fs.statSync(filePath).mtime
        });
      }
    }

    console.log(`Indexed ${this.index.size} library items`);
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
        computedAt: new Date().toISOString()
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
          item.lastModified
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
          hashData.computedAt
        ]);
      }

      console.log('Library data synced to database');
    } catch (error) {
      console.error('Failed to sync to database:', error);
      throw error;
    }
  }

  /**
   * Parse module card from markdown
   */
  parseModuleCard(content) {
    const moduleData = {
      id: '',
      name: '',
      domain: '',
      status: '',
      implementation: '',
      components: []
    };

    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Module ID:')) {
        moduleData.id = line.replace('# Module ID:', '').trim();
      } else if (line.startsWith('# Module Name:')) {
        moduleData.name = line.replace('# Module Name:', '').trim();
      } else if (line.startsWith('# Domain:')) {
        moduleData.domain = line.replace('# Domain:', '').trim();
      } else if (line.startsWith('# Status:')) {
        moduleData.status = line.replace('# Status:', '').trim();
      } else if (line.startsWith('# Implementation:')) {
        moduleData.implementation = line.replace('# Implementation:', '').trim();
      }
    }

    return moduleData;
  }

  /**
   * Parse component card from markdown
   */
  parseComponentCard(content) {
    const componentData = {
      id: '',
      name: '',
      type: '',
      module: '',
      status: ''
    };

    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Component ID:')) {
        componentData.id = line.replace('# Component ID:', '').trim();
      } else if (line.startsWith('# Component Name:')) {
        componentData.name = line.replace('# Component Name:', '').trim();
      } else if (line.startsWith('# Type:')) {
        componentData.type = line.replace('# Type:', '').trim();
      } else if (line.startsWith('# Module:')) {
        componentData.module = line.replace('# Module:', '').trim();
      } else if (line.startsWith('# Status:')) {
        componentData.status = line.replace('# Status:', '').trim();
      }
    }

    return componentData;
  }

  /**
   * Search library by keyword
   */
  async searchLibrary(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [filename, item] of this.index) {
      const content = JSON.stringify(item.data).toLowerCase();
      if (content.includes(lowerQuery)) {
        results.push({
          filename,
          type: item.type,
          data: item.data,
          relevance: this.calculateRelevance(content, lowerQuery)
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
      lastIndexed: new Date().toISOString()
    };

    for (const [, item] of this.index) {
      if (item.type === 'module') stats.modules++;
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
          path: hashData.path
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
          actual: currentHash
        });
      }
    }

    return {
      verified: issues.length === 0,
      totalFiles: this.contentHashes.size,
      issues,
      verificationDate: new Date().toISOString()
    };
  }
}

module.exports = new LibraryKnowledgeService();
