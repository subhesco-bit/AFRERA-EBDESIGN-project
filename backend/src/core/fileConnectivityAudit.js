// EBDESIGN File Connectivity Audit - Claude Integration Analysis
// Maps all files and identifies which are connected to Claude project tree

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class FileConnectivityAudit {
  constructor() {
    this.files = {
      connected: [],
      orphaned: [],
      partial: [],
      total: 0
    };
    this.connections = new Map();
    this.claudeIntegrationPoints = [
      'core/index.js',
      'core/productionService.js',
      'core/enhancedServiceFramework.js',
      'index.js', // Main entry point
      'services/',
      'routes/',
      'middleware/',
      'database/'
    ];
  }

  /**
   * Scan all files and determine connectivity
   */
  async auditFileConnectivity(rootDir) {
    const report = {
      timestamp: new Date().toISOString(),
      rootDirectory: rootDir,
      summary: {
        totalFiles: 0,
        connectedFiles: 0,
        orphanedFiles: 0,
        partiallyConnectedFiles: 0,
        connectivityRate: 0
      },
      byCategory: {
        services: { total: 0, connected: 0, orphaned: 0 },
        routes: { total: 0, connected: 0, orphaned: 0 },
        middleware: { total: 0, connected: 0, orphaned: 0 },
        utilities: { total: 0, connected: 0, orphaned: 0 },
        database: { total: 0, connected: 0, orphaned: 0 },
        core: { total: 0, connected: 0, orphaned: 0 },
        config: { total: 0, connected: 0, orphaned: 0 },
        tests: { total: 0, connected: 0, orphaned: 0 },
        other: { total: 0, connected: 0, orphaned: 0 }
      },
      connected: [],
      orphaned: [],
      partial: [],
      claudeIntegrationPoints: this.claudeIntegrationPoints
    };

    try {
      const allFiles = this.getAllFiles(rootDir);
      report.summary.totalFiles = allFiles.length;

      for (const filePath of allFiles) {
        const connectivityStatus = await this.checkFileConnectivity(filePath, rootDir);
        const category = this.categorizeFile(filePath);

        // Update category stats
        report.byCategory[category].total++;

        if (connectivityStatus.isConnected) {
          report.connected.push({
            file: path.relative(rootDir, filePath),
            category,
            connectionPoints: connectivityStatus.connectionPoints,
            referencedBy: connectivityStatus.referencedBy
          });
          report.byCategory[category].connected++;
          report.summary.connectedFiles++;
        } else if (connectivityStatus.isPartial) {
          report.partial.push({
            file: path.relative(rootDir, filePath),
            category,
            connectionPoints: connectivityStatus.connectionPoints,
            missingConnections: connectivityStatus.missingConnections
          });
          report.byCategory[category].connected++;
          report.summary.partiallyConnectedFiles++;
        } else {
          report.orphaned.push({
            file: path.relative(rootDir, filePath),
            category,
            size: fs.statSync(filePath).size,
            lastModified: fs.statSync(filePath).mtime
          });
          report.byCategory[category].orphaned++;
          report.summary.orphanedFiles++;
        }
      }

      // Calculate connectivity rate
      report.summary.connectivityRate =
        ((report.summary.connectedFiles + report.summary.partiallyConnectedFiles) /
         report.summary.totalFiles * 100).toFixed(2) + '%';

      return report;
    } catch (error) {
      logger.error('Connectivity audit failed', error);
      throw error;
    }
  }

  /**
   * Check if a file is connected to Claude project
   */
  async checkFileConnectivity(filePath, rootDir) {
    const relativePath = path.relative(rootDir, filePath);
    const connectionPoints = [];
    const referencedBy = [];
    let isConnected = false;
    let isPartial = false;

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Check if file is in Claude integration points
      for (const point of this.claudeIntegrationPoints) {
        if (filePath.includes(point) || relativePath.includes(point)) {
          connectionPoints.push(point);
          isConnected = true;
        }
      }

      // Check if file imports/requires Claude core systems
      const claudeRequires = [
        'core/index',
        'core/errorHandler',
        'core/cache',
        'core/validation',
        'core/monitoring',
        'core/productionService',
        'core/enhancedServiceFramework'
      ];

      for (const requires of claudeRequires) {
        if (fileContent.includes(`require('${requires}`) ||
            fileContent.includes(`from '${requires}`)) {
          connectionPoints.push(`imports ${requires}`);
          isConnected = true;
        }
      }

      // Check if file is referenced by Claude core
      if (this.isCludeCoreDependency(filePath, rootDir)) {
        isConnected = true;
        connectionPoints.push('referenced-by-claude-core');
      }

      // Check for exports to Claude system
      if (fileContent.includes('module.exports') || fileContent.includes('export')) {
        if (this.isExportedFromClaude(filePath, rootDir)) {
          isConnected = true;
          connectionPoints.push('exported-from-claude');
        }
      }

      // Determine connectivity status
      if (connectionPoints.length >= 2) {
        isConnected = true;
      } else if (connectionPoints.length === 1) {
        isPartial = true;
      } else {
        isConnected = false;
      }

      return {
        isConnected,
        isPartial,
        connectionPoints,
        referencedBy
      };
    } catch (error) {
      logger.error(`Error checking connectivity for ${filePath}`, error);
      return {
        isConnected: false,
        isPartial: false,
        connectionPoints: [],
        referencedBy: []
      };
    }
  }

  /**
   * Categorize file by type
   */
  categorizeFile(filePath) {
    if (filePath.includes('/services/')) return 'services';
    if (filePath.includes('/routes/')) return 'routes';
    if (filePath.includes('/middleware/')) return 'middleware';
    if (filePath.includes('/utils/') || filePath.includes('/helpers/')) return 'utilities';
    if (filePath.includes('/database/')) return 'database';
    if (filePath.includes('/core/')) return 'core';
    if (filePath.includes('config') || filePath.includes('.env')) return 'config';
    if (filePath.includes('test') || filePath.includes('spec')) return 'tests';
    return 'other';
  }

  /**
   * Check if file is a Claude core dependency
   */
  isCludeCoreDependency(filePath, rootDir) {
    try {
      const coreDir = path.join(rootDir, 'src', 'core');
      if (fs.existsSync(coreDir)) {
        const coreFiles = fs.readdirSync(coreDir);
        const fileName = path.basename(filePath);
        return coreFiles.includes(fileName);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if file is exported from Claude
   */
  isExportedFromClaude(filePath, rootDir) {
    try {
      const indexPath = path.join(rootDir, 'src', 'core', 'index.js');
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        let fileName = path.basename(filePath, path.extname(filePath));
        return indexContent.includes(fileName);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all files recursively
   */
  getAllFiles(dir) {
    let files = [];
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        const filePath = path.join(dir, entry);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          files = files.concat(this.getAllFiles(filePath));
        } else if (entry.endsWith('.js') || entry.endsWith('.json') || entry.endsWith('.md')) {
          files.push(filePath);
        }
      }
    } catch (error) {
      logger.error(`Error reading directory ${dir}`, error);
    }
    return files;
  }

  /**
   * Generate detailed connectivity report
   */
  generateDetailedReport(auditResults) {
    let report = `# File Connectivity Audit Report\n`;
    report += `Generated: ${auditResults.timestamp}\n\n`;

    // Summary
    report += `## Summary\n`;
    report += `- Total Files: ${auditResults.summary.totalFiles}\n`;
    report += `- Connected: ${auditResults.summary.connectedFiles}\n`;
    report += `- Partially Connected: ${auditResults.summary.partiallyConnectedFiles}\n`;
    report += `- Orphaned: ${auditResults.summary.orphanedFiles}\n`;
    report += `- Connectivity Rate: ${auditResults.summary.connectivityRate}\n\n`;

    // By Category
    report += `## Connectivity by Category\n`;
    for (const [category, stats] of Object.entries(auditResults.byCategory)) {
      if (stats.total > 0) {
        const rate = ((stats.connected / stats.total) * 100).toFixed(1);
        report += `### ${category.toUpperCase()}\n`;
        report += `- Total: ${stats.total}\n`;
        report += `- Connected: ${stats.connected} (${rate}%)\n`;
        report += `- Orphaned: ${stats.orphaned}\n\n`;
      }
    }

    // Orphaned Files (if any)
    if (auditResults.orphaned.length > 0) {
      report += `## Orphaned Files (${auditResults.orphaned.length})\n`;
      for (const file of auditResults.orphaned.slice(0, 20)) {
        report += `- ${file.file} (${(file.size / 1024).toFixed(2)}KB)\n`;
      }
      if (auditResults.orphaned.length > 20) {
        report += `- ... and ${auditResults.orphaned.length - 20} more\n`;
      }
      report += `\n`;
    }

    // Partially Connected Files
    if (auditResults.partial.length > 0) {
      report += `## Partially Connected Files (${auditResults.partial.length})\n`;
      for (const file of auditResults.partial.slice(0, 10)) {
        report += `- ${file.file}\n`;
        report += `  Connections: ${file.connectionPoints.join(', ')}\n`;
      }
      report += `\n`;
    }

    // Claude Integration Points
    report += `## Claude Integration Points\n`;
    for (const point of auditResults.claudeIntegrationPoints) {
      report += `- ${point}\n`;
    }

    return report;
  }
}

module.exports = FileConnectivityAudit;
