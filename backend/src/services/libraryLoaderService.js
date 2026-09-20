// Professional Library Loader Service
const fs = require('fs');
const path = require('path');

class LibraryLoaderService {
  constructor() {
    this.libraryPath = path.join(__dirname, '../library');
    this.indexPath = path.join(this.libraryPath, 'library_index.csv');
    this.dbPath = path.join(this.libraryPath, 'library_database.json');
    this.library = null;
    this.index = null;
    this.db = null;
  }

  async initialize() {
    try {
      // Load database
      const dbContent = fs.readFileSync(this.dbPath, 'utf8');
      this.db = JSON.parse(dbContent);

      // Load index
      this.index = fs.readFileSync(this.indexPath, 'utf8').split('\n');

      // Load library metadata
      const manifestPath = path.join(this.libraryPath, 'MANIFEST.md');
      const manifest = fs.readFileSync(manifestPath, 'utf8');

      console.log('✅ Professional library loaded');
      console.log(`   - Status: ${this.db.library.status}`);
      console.log(`   - Cards: ${this.db.library.total_cards}`);
      console.log(`   - Quality: ${this.db.library.quality}`);
      console.log(`   - Ready: ${this.db.library.perfect ? 'YES' : 'NO'}`);

      return true;
    } catch (error) {
      console.error('❌ Library load error:', error.message);
      return false;
    }
  }

  getLibraryStats() {
    return {
      status: this.db?.library?.status || 'unknown',
      quality: this.db?.library?.quality || 'unknown',
      total_cards: this.db?.library?.total_cards || 0,
      services: this.db?.services || {},
      production_ready: this.db?.library?.perfect || false
    };
  }

  searchByService(service) {
    return this.index.filter(line => line.includes(service));
  }

  getAll() {
    return {
      database: this.db,
      index: this.index,
      stats: this.getLibraryStats()
    };
  }
}

module.exports = new LibraryLoaderService();
