/**
 * Library Catalog Batch Update System
 * Generates library cards for all 185 migrated modules
 * Updates library catalog with modular system additions
 */

const fs = require('fs');
const path = require('path');

class LibraryCatalogUpdater {
  constructor() {
    this.modulesDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\modules';
    this.libraryDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\_EBDESIGN_LIBRARY\\01_MODULES';
    this.catalogDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\_EBDESIGN_LIBRARY\\00_CATALOG';
    this.updateStats = {
      totalModules: 0,
      cardsGenerated: 0,
      catalogUpdated: false,
      failed: 0
    };
  }

  /**
   * Get all migrated modules
   */
  getMigratedModules() {
    const modules = [];
    const dirs = fs.readdirSync(this.modulesDir);
    
    for (const dir of dirs) {
      const dirPath = path.join(this.modulesDir, dir);
      if (fs.statSync(dirPath).isDirectory() && dir.match(/^M\d+/)) {
        const moduleJsonPath = path.join(dirPath, 'module.json');
        if (fs.existsSync(moduleJsonPath)) {
          try {
            const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
            modules.push({
              id: dir,
              path: dirPath,
              json: moduleJson
            });
          } catch (error) {
            console.log(`Failed to read module.json for ${dir}: ${error.message}`);
          }
        }
      }
    }
    
    return modules;
  }

  /**
   * Generate library card for module
   */
  generateLibraryCard(module) {
    const card = {
      CardID: module.id,
      EntityType: 'MODULE',
      Name: module.json.name,
      ModuleName: module.id,
      Status: module.json.status,
      SourceArea: 'MODULAR_SYSTEM',
      OriginalPath: `modules/${module.id}/`,
      EvidenceSource: 'MIGRATION_SYSTEM',
      Disposition: 'PRESERVE',
      Confidence: 'HIGH',
      Files: this.countModuleFiles(module.path),
      TotalBytes: this.calculateModuleSize(module.path),
      UniqueHashes: 1,
      Services: module.json.completeness.backend ? 1 : 0,
      Routes: module.json.completeness.routes ? 1 : 0,
      Controllers: 0,
      ModelsSchemas: 0,
      Tests: 0,
      Notes: `Migrated from legacy Devin service | ${module.json.completeness.backend ? 'Backend complete' : 'Backend skeleton'} | ${module.json.completeness.frontend ? 'Frontend complete' : 'Frontend skeleton'} | ${module.json.completeness.routes ? 'Routes complete' : 'Routes skeleton'}`,
      Description: module.json.description,
      Category: module.json.category,
      Capabilities: module.json.discovery?.capabilities || [],
      Dependencies: module.json.dependencies,
      IntegrationPoints: module.json.cables?.outgoing || [],
      Documentation: module.json.documentation?.readme,
      LastUpdated: module.json.metadata?.updatedAt || new Date().toISOString(),
      Version: module.json.version,
      Tags: this.generateTags(module.json),
      Migration: module.json.migration
    };

    return card;
  }

  /**
   * Count module files
   */
  countModuleFiles(modulePath) {
    let count = 0;
    const countFiles = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          countFiles(itemPath);
        } else {
          count++;
        }
      }
    };
    countFiles(modulePath);
    return count;
  }

  /**
   * Calculate module size
   */
  calculateModuleSize(modulePath) {
    let size = 0;
    const calculateSize = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          calculateSize(itemPath);
        } else {
          size += fs.statSync(itemPath).size;
        }
      }
    };
    calculateSize(modulePath);
    return size;
  }

  /**
   * Generate tags for module
   */
  generateTags(moduleJson) {
    const tags = [];
    
    // Add category tag
    tags.push(moduleJson.category);
    
    // Add capability tags
    if (moduleJson.discovery?.capabilities) {
      tags.push(...moduleJson.discovery.capabilities.slice(0, 3));
    }
    
    // Add completeness tags
    if (moduleJson.completeness?.backend) tags.push('backend-ready');
    if (moduleJson.completeness?.frontend) tags.push('frontend-ready');
    if (moduleJson.completeness?.routes) tags.push('routes-ready');
    
    // Add AI capability tag
    if (moduleJson.aiCapabilities?.decisionMaking) tags.push('ai-enabled');
    
    return tags;
  }

  /**
   * Save library card
   */
  saveLibraryCard(card) {
    const categoryDir = path.join(this.libraryDir, this.getCategoryDirectory(card.Category));
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    const cardPath = path.join(categoryDir, `${card.CardID}.json`);
    fs.writeFileSync(cardPath, JSON.stringify(card, null, 2));
    
    return cardPath;
  }

  /**
   * Get category directory
   */
  getCategoryDirectory(category) {
    const categories = {
      'platform': 'PLATFORM_MODULES',
      'domain': 'DOMAIN_MODULES', 
      'enterprise': 'ENTERPRISE_MODULES',
      'erp': 'ERP_MODULES',
      'ai': 'AI_MODULES'
    };
    return categories[category] || 'OTHER_MODULES';
  }

  /**
   * Update master catalog CSV
   */
  updateMasterCatalog(modules) {
    const csvHeader = '"CardID","EntityType","Name","ModuleName","Status","SourceArea","OriginalPath","EvidenceSource","Disposition","Confidence","Files","TotalBytes","UniqueHashes","Services","Routes","Controllers","ModelsSchemas","Tests","Notes"';
    
    const csvRows = [csvHeader];
    
    for (const module of modules) {
      const card = this.generateLibraryCard(module);
      const csvRow = `"${card.CardID}","${card.EntityType}","${card.Name}","${card.ModuleName}","${card.Status}","${card.SourceArea}","${card.OriginalPath}","${card.EvidenceSource}","${card.Disposition}","${card.Confidence}","${card.Files}","${card.TotalBytes}","${card.UniqueHashes}","${card.Services}","${card.Routes}","${card.Controllers}","${card.ModelsSchemas}","${card.Tests}","${card.Notes.replace(/"/g, '""')}"`;
      csvRows.push(csvRow);
    }
    
    const csvContent = csvRows.join('\n');
    const csvPath = path.join(this.catalogDir, 'MODULE_BATCH_UPDATE.csv');
    fs.writeFileSync(csvPath, csvContent);
    
    return csvPath;
  }

  /**
   * Update library manifest
   */
  updateLibraryManifest(totalModules) {
    const manifestPath = path.join(this.catalogDir, 'LIBRARY_MANIFEST.json');
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Update counts
      manifest.Cards = manifest.Cards + totalModules;
      manifest.Modules = manifest.Modules + totalModules;
      manifest.Generated.DateTime = new Date().toISOString();
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      this.updateStats.catalogUpdated = true;
      console.log(`Updated library manifest: Cards=${manifest.Cards}, Modules=${manifest.Modules}`);
      
    } catch (error) {
      console.error(`Failed to update library manifest: ${error.message}`);
    }
  }

  /**
   * Execute library update
   */
  async executeUpdate() {
    console.log('Starting Library Catalog Batch Update...');
    console.log('Modules Directory:', this.modulesDir);
    console.log('Library Directory:', this.libraryDir);

    const modules = this.getMigratedModules();
    this.updateStats.totalModules = modules.length;

    console.log(`Found ${modules.length} migrated modules`);

    for (const module of modules) {
      try {
        const card = this.generateLibraryCard(module);
        this.saveLibraryCard(card);
        this.updateStats.cardsGenerated++;
        console.log(`✅ Generated card: ${module.id}`);
      } catch (error) {
        this.updateStats.failed++;
        console.error(`❌ Failed: ${module.id} - ${error.message}`);
      }
    }

    // Update master catalog CSV
    this.updateMasterCatalog(modules);
    
    // Update library manifest
    this.updateLibraryManifest(modules.length);

    this.printUpdateStats();
  }

  /**
   * Print update statistics
   */
  printUpdateStats() {
    console.log('\n=== LIBRARY CATALOG UPDATE STATISTICS ===');
    console.log(`Total Modules Processed: ${this.updateStats.totalModules}`);
    console.log(`Cards Generated: ${this.updateStats.cardsGenerated}`);
    console.log(`Catalog Updated: ${this.updateStats.catalogUpdated ? 'Yes' : 'No'}`);
    console.log(`Failed: ${this.updateStats.failed}`);
    console.log('=========================================\n');
  }
}

// Execute update
const updater = new LibraryCatalogUpdater();
updater.executeUpdate().catch(console.error);

module.exports = LibraryCatalogUpdater;