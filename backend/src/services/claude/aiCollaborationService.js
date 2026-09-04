/**
 * Devin-Claude AI Collaboration System
 * Enables bidirectional AI collaboration for project building
 */

const fs = require('fs');
const path = require('path');
const { getPostgreSQL } = require('../../database/connection');

class AICollaborationService {
  constructor() {
    this.collaborationPath = path.join(__dirname, '../../../../.ai');
    this.projectRoot = path.join(__dirname, '../../../../');
    this.ensureCollaborationDir();
  }

  ensureCollaborationDir() {
    if (!fs.existsSync(this.collaborationPath)) {
      fs.mkdirSync(this.collaborationPath, { recursive: true });
    }
  }

  /**
   * Get shared project context for both AIs
   */
  async getSharedContext() {
    try {
      const contextPath = path.join(this.collaborationPath, 'shared_context.json');
      
      if (fs.existsSync(contextPath)) {
        return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      }

      // Initialize default context
      const defaultContext = {
        project_name: 'Subhesco/EBDESIGN',
        project_root: this.projectRoot,
        last_updated: new Date().toISOString(),
        active_ai: 'both',
        collaboration_mode: 'mutual_support',
        shared_goals: [
          'Complete all skeleton modules to launch level',
          'Fix library catalog and integrate with AI',
          'Complete frontend/UI development',
          'Run database migrations',
          'Achieve launch readiness'
        ],
        devin_focus: [
          'Backend implementation',
          'Service development',
          'Database migrations',
          'API development'
        ],
        claude_focus: [
          'AI integration',
          'Library knowledge system',
          'Frontend components',
          'Architecture planning'
        ],
        work_history: []
      };

      fs.writeFileSync(contextPath, JSON.stringify(defaultContext, null, 2));
      return defaultContext;
    } catch (error) {
      console.error('Error getting shared context:', error);
      throw error;
    }
  }

  /**
   * Update shared context
   */
  async updateSharedContext(updates) {
    try {
      const context = await this.getSharedContext();
      const updatedContext = {
        ...context,
        ...updates,
        last_updated: new Date().toISOString()
      };

      const contextPath = path.join(this.collaborationPath, 'shared_context.json');
      fs.writeFileSync(contextPath, JSON.stringify(updatedContext, null, 2));

      return updatedContext;
    } catch (error) {
      console.error('Error updating shared context:', error);
      throw error;
    }
  }

  /**
   * Log work from either AI
   */
  async logWork(aiSource, workData) {
    try {
      const workLogPath = path.join(this.collaborationPath, 'work_log.json');
      
      let workLog = [];
      if (fs.existsSync(workLogPath)) {
        workLog = JSON.parse(fs.readFileSync(workLogPath, 'utf8'));
      }

      const workEntry = {
        id: `${aiSource}_${Date.now()}`,
        ai_source: aiSource, // 'devin' or 'claude'
        timestamp: new Date().toISOString(),
        ...workData
      };

      workLog.push(workEntry);

      // Keep only last 100 entries
      if (workLog.length > 100) {
        workLog = workLog.slice(-100);
      }

      fs.writeFileSync(workLogPath, JSON.stringify(workLog, null, 2));

      // Also sync to database
      await this.syncWorkToDatabase(workEntry);

      return workEntry;
    } catch (error) {
      console.error('Error logging work:', error);
      throw error;
    }
  }

  /**
   * Sync work log to database
   */
  async syncWorkToDatabase(workEntry) {
    try {
      const pool = await getPostgreSQL();
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_collaboration_log (
          id VARCHAR(255) PRIMARY KEY,
          ai_source VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          work_type VARCHAR(100),
          description TEXT,
          files_affected TEXT[],
          status VARCHAR(50),
          metadata JSONB
        )
      `);

      await pool.query(`
        INSERT INTO ai_collaboration_log (id, ai_source, timestamp, work_type, description, files_affected, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          timestamp = EXCLUDED.timestamp,
          work_type = EXCLUDED.work_type,
          description = EXCLUDED.description,
          files_affected = EXCLUDED.files_affected,
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata
      `, [
        workEntry.id,
        workEntry.ai_source,
        workEntry.timestamp,
        workEntry.work_type || 'general',
        workEntry.description || '',
        workEntry.files_affected || [],
        workEntry.status || 'completed',
        JSON.stringify(workEntry.metadata || {})
      ]);
    } catch (error) {
      console.error('Error syncing work to database:', error);
    }
  }

  /**
   * Get work history for specific AI
   */
  async getWorkHistory(aiSource, limit = 20) {
    try {
      const workLogPath = path.join(this.collaborationPath, 'work_log.json');
      
      if (!fs.existsSync(workLogPath)) {
        return [];
      }

      const workLog = JSON.parse(fs.readFileSync(workLogPath, 'utf8'));
      
      const filtered = workLog
        .filter(entry => entry.ai_source === aiSource)
        .slice(-limit);

      return filtered;
    } catch (error) {
      console.error('Error getting work history:', error);
      return [];
    }
  }

  /**
   * Get work that the other AI can continue
   */
  async getContinuableWork(currentAI) {
    try {
      const otherAI = currentAI === 'devin' ? 'claude' : 'devin';
      const otherAIWork = await this.getWorkHistory(otherAI, 10);
      
      const continuable = otherAIWork.filter(entry => 
        entry.status === 'in_progress' || 
        entry.status === 'partial' ||
        entry.requires_collaboration === true
      );

      return continuable;
    } catch (error) {
      console.error('Error getting continuable work:', error);
      return [];
    }
  }

  /**
   * Create handoff between AIs
   */
  async createHandoff(fromAI, toAI, workData) {
    try {
      const handoffPath = path.join(this.collaborationPath, 'handoffs.json');
      
      let handoffs = [];
      if (fs.existsSync(handoffPath)) {
        handoffs = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
      }

      const handoff = {
        id: `handoff_${Date.now()}`,
        from_ai: fromAI,
        to_ai: toAI,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...workData
      };

      handoffs.push(handoff);
      fs.writeFileSync(handoffPath, JSON.stringify(handoffs, null, 2));

      // Log the handoff
      await this.logWork(fromAI, {
        work_type: 'handoff',
        description: `Handing off work to ${toAI}`,
        handoff_id: handoff.id,
        ...workData
      });

      return handoff;
    } catch (error) {
      console.error('Error creating handoff:', error);
      throw error;
    }
  }

  /**
   * Accept handoff
   */
  async acceptHandoff(handoffId, acceptingAI) {
    try {
      const handoffPath = path.join(this.collaborationPath, 'handoffs.json');
      const handoffs = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
      
      const handoffIndex = handoffs.findIndex(h => h.id === handoffId);
      if (handoffIndex === -1) {
        throw new Error('Handoff not found');
      }

      handoffs[handoffIndex].status = 'accepted';
      handoffs[handoffIndex].accepted_at = new Date().toISOString();
      handoffs[handoffIndex].accepted_by = acceptingAI;

      fs.writeFileSync(handoffPath, JSON.stringify(handoffs, null, 2));

      // Log acceptance
      await this.logWork(acceptingAI, {
        work_type: 'handoff_acceptance',
        description: `Accepted handoff from ${handoffs[handoffIndex].from_ai}`,
        handoff_id: handoffId
      });

      return handoffs[handoffIndex];
    } catch (error) {
      console.error('Error accepting handoff:', error);
      throw error;
    }
  }

  /**
   * Get pending handoffs for AI
   */
  async getPendingHandoffs(forAI) {
    try {
      const handoffPath = path.join(this.collaborationPath, 'handoffs.json');
      
      if (!fs.existsSync(handoffPath)) {
        return [];
      }

      const handoffs = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
      
      return handoffs.filter(h => 
        h.to_ai === forAI && h.status === 'pending'
      );
    } catch (error) {
      console.error('Error getting pending handoffs:', error);
      return [];
    }
  }

  /**
   * Get collaboration statistics
   */
  async getCollaborationStats() {
    try {
      const workLogPath = path.join(this.collaborationPath, 'work_log.json');
      
      if (!fs.existsSync(workLogPath)) {
        return {
          total_work_entries: 0,
          devin_work: 0,
          claude_work: 0,
          handoffs: 0
        };
      }

      const workLog = JSON.parse(fs.readFileSync(workLogPath, 'utf8'));
      
      const stats = {
        total_work_entries: workLog.length,
        devin_work: workLog.filter(w => w.ai_source === 'devin').length,
        claude_work: workLog.filter(w => w.ai_source === 'claude').length,
        handoffs: 0
      };

      const handoffPath = path.join(this.collaborationPath, 'handoffs.json');
      if (fs.existsSync(handoffPath)) {
        const handoffs = JSON.parse(fs.readFileSync(handoffPath, 'utf8'));
        stats.handoffs = handoffs.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting collaboration stats:', error);
      return {};
    }
  }

  /**
   * Generate collaboration report
   */
  async generateCollaborationReport() {
    try {
      const context = await this.getSharedContext();
      const stats = await this.getCollaborationStats();
      const devinWork = await this.getWorkHistory('devin', 5);
      const claudeWork = await this.getWorkHistory('claude', 5);

      const report = {
        generated_at: new Date().toISOString(),
        project_context: context,
        collaboration_stats: stats,
        recent_devin_work: devinWork,
        recent_claude_work: claudeWork,
        recommendations: [
          'Continue mutual support on skeleton module development',
          'Coordinate on frontend component integration',
          'Sync on database migration execution',
          'Collaborate on AI integration testing'
        ]
      };

      const reportPath = path.join(this.collaborationPath, 'collaboration_report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      return report;
    } catch (error) {
      console.error('Error generating collaboration report:', error);
      throw error;
    }
  }
}

module.exports = new AICollaborationService();

