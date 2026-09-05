/**
 * Knowledge Service
 * 
 * Enterprise-grade knowledge management service providing comprehensive features
 * including knowledge articles, wikis, document repositories, taxonomies,
 * version control, search, AI-powered recommendations, and analytics.
 */

class KnowledgeService {
  constructor() {
    // Knowledge articles
    this.articles = new Map();
    
    // Wiki pages
    this.wikiPages = new Map();
    
    // Document repository
    this.documents = new Map();
    
    // Taxonomy/categories
    this.taxonomies = new Map();
    
    // Knowledge tags
    this.tags = new Map();
    
    // Version history
    this.versionHistory = new Map();
    
    // Search index
    this.searchIndex = new Map();
    
    // AI recommendations
    this.aiRecommendations = new Map();
    
    // Access control
    this.accessControl = new Map();
    
    // Feedback/ratings
    this.feedback = new Map();
    
    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default knowledge data
   */
  initializeDefaultData() {
    // Sample taxonomies
    this.taxonomies.set('tax-001', {
      id: 'tax-001',
      name: 'Agricultural Practices',
      description: 'Best practices for agricultural operations',
      parentId: null,
      level: 1,
      order: 1,
      articleCount: 25,
      color: '#10B981',
      createdAt: '2024-01-01T00:00:00Z'
    });

    this.taxonomies.set('tax-002', {
      id: 'tax-002',
      name: 'Crop Management',
      description: 'Crop cultivation and management techniques',
      parentId: 'tax-001',
      level: 2,
      order: 1,
      articleCount: 15,
      color: '#3B82F6',
      createdAt: '2024-01-01T00:00:00Z'
    });

    // Sample articles
    this.articles.set('article-001', {
      id: 'article-001',
      title: 'Soil Health Management Guide',
      content: 'Comprehensive guide to maintaining soil health...',
      summary: 'Essential practices for maintaining optimal soil health',
      taxonomyId: 'tax-002',
      authorId: 'user-001',
      status: 'published',
      version: 2,
      tags: ['soil', 'health', 'agriculture', 'sustainability'],
      language: 'en',
      readTime: 8,
      viewCount: 1250,
      likeCount: 85,
      helpfulCount: 72,
      featured: true,
      publishedAt: '2024-02-15T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
      createdAt: '2024-01-15T00:00:00Z'
    });

    // Sample wiki pages
    this.wikiPages.set('wiki-001', {
      id: 'wiki-001',
      title: 'Irrigation Systems',
      content: '# Irrigation Systems\n\n## Overview\nIrrigation systems are essential...',
      slug: 'irrigation-systems',
      parentId: null,
      authorId: 'user-001',
      status: 'published',
      version: 5,
      viewCount: 3400,
      editCount: 12,
      lastEditedBy: 'user-002',
      lastEditedAt: '2024-06-15T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    });
  }

  /**
   * Create a knowledge article
   */
  createArticle(articleData) {
    const articleId = articleData.id || `article-${Date.now()}`;
    
    const article = {
      id: articleId,
      title: articleData.title,
      content: articleData.content,
      summary: articleData.summary || this.generateSummary(articleData.content),
      taxonomyId: articleData.taxonomyId,
      authorId: articleData.authorId,
      status: articleData.status || 'draft',
      version: 1,
      tags: articleData.tags || [],
      language: articleData.language || 'en',
      readTime: this.calculateReadTime(articleData.content),
      viewCount: 0,
      likeCount: 0,
      helpfulCount: 0,
      featured: articleData.featured || false,
      publishedAt: articleData.status === 'published' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      metadata: articleData.metadata || {}
    };

    this.articles.set(articleId, article);
    
    // Index for search
    this.indexForSearch(articleId, article);
    
    // Update taxonomy count
    if (articleData.taxonomyId) {
      const taxonomy = this.taxonomies.get(articleData.taxonomyId);
      if (taxonomy) {
        taxonomy.articleCount = (taxonomy.articleCount || 0) + 1;
        this.taxonomies.set(articleData.taxonomyId, taxonomy);
      }
    }
    
    // Save initial version
    this.saveVersion(articleId, article, 'created');
    
    return article;
  }

  /**
   * Get all articles
   */
  getArticles(filters = {}) {
    let articles = Array.from(this.articles.values());

    if (filters.status) {
      articles = articles.filter(a => a.status === filters.status);
    }

    if (filters.taxonomyId) {
      articles = articles.filter(a => a.taxonomyId === filters.taxonomyId);
    }

    if (filters.authorId) {
      articles = articles.filter(a => a.authorId === filters.authorId);
    }

    if (filters.featured === 'true') {
      articles = articles.filter(a => a.featured === true);
    }

    if (filters.tag) {
      articles = articles.filter(a => a.tags.includes(filters.tag));
    }

    if (filters.language) {
      articles = articles.filter(a => a.language === filters.language);
    }

    // Sort by published date or updated date
    if (filters.sortBy === 'published') {
      articles.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    } else if (filters.sortBy === 'popular') {
      articles.sort((a, b) => b.viewCount - a.viewCount);
    } else {
      articles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    return articles;
  }

  /**
   * Get a specific article
   */
  getArticle(articleId) {
    let article = this.articles.get(articleId);
    if (article) {
      article.viewCount = (article.viewCount || 0) + 1;
      this.articles.set(articleId, article);
    }
    return article;
  }

  /**
   * Update article
   */
  updateArticle(articleId, updates) {
    let article = this.articles.get(articleId);
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    const oldArticle = { ...article };
    const updatedArticle = {
      ...article,
      ...updates,
      version: article.version + 1,
      updatedAt: new Date().toISOString()
    };

    if (updates.status === 'published' && !article.publishedAt) {
      updatedArticle.publishedAt = new Date().toISOString();
    }

    if (updates.content) {
      updatedArticle.summary = this.generateSummary(updates.content);
      updatedArticle.readTime = this.calculateReadTime(updates.content);
    }

    this.articles.set(articleId, updatedArticle);
    
    // Reindex for search
    this.indexForSearch(articleId, updatedArticle);
    
    // Save version
    this.saveVersion(articleId, updatedArticle, 'updated', oldArticle);
    
    return updatedArticle;
  }

  /**
   * Delete article
   */
  deleteArticle(articleId) {
    let article = this.articles.get(articleId);
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    this.articles.delete(articleId);
    this.searchIndex.delete(articleId);
    
    // Update taxonomy count
    if (article.taxonomyId) {
      let taxonomy = this.taxonomies.get(article.taxonomyId);
      if (taxonomy) {
        taxonomy.articleCount = Math.max(0, (taxonomy.articleCount || 0) - 1);
        this.taxonomies.set(article.taxonomyId, taxonomy);
      }
    }
    
    return { success: true, message: `Article ${articleId} deleted` };
  }

  /**
   * Create a wiki page
   */
  createWikiPage(wikiData) {
    const wikiId = wikiData.id || `wiki-${Date.now()}`;
    const slug = wikiData.slug || this.generateSlug(wikiData.title);
    
    const wikiPage = {
      id: wikiId,
      title: wikiData.title,
      content: wikiData.content,
      slug: slug,
      parentId: wikiData.parentId || null,
      authorId: wikiData.authorId,
      status: wikiData.status || 'draft',
      version: 1,
      viewCount: 0,
      editCount: 0,
      lastEditedBy: wikiData.authorId,
      lastEditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.wikiPages.set(wikiId, wikiPage);
    
    // Save initial version
    this.saveVersion(wikiId, wikiPage, 'created');
    
    return wikiPage;
  }

  /**
   * Get all wiki pages
   */
  getWikiPages(filters = {}) {
    let pages = Array.from(this.wikiPages.values());

    if (filters.status) {
      pages = pages.filter(p => p.status === filters.status);
    }

    if (filters.parentId !== undefined) {
      pages = pages.filter(p => p.parentId === filters.parentId);
    }

    if (filters.authorId) {
      pages = pages.filter(p => p.authorId === filters.authorId);
    }

    return pages.sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Get wiki page by slug
   */
  getWikiPageBySlug(slug) {
    return Array.from(this.wikiPages.values()).find(p => p.slug === slug);
  }

  /**
   * Update wiki page
   */
  updateWikiPage(wikiId, updates) {
    const page = this.wikiPages.get(wikiId);
    if (!page) {
      throw new Error(`Wiki page ${wikiId} not found`);
    }

    const oldPage = { ...page };
    const updatedPage = {
      ...page,
      ...updates,
      version: page.version + 1,
      editCount: (page.editCount || 0) + 1,
      lastEditedAt: new Date().toISOString()
    };

    if (updates.title) {
      updatedPage.slug = this.generateSlug(updates.title);
    }

    this.wikiPages.set(wikiId, updatedPage);
    
    // Save version
    this.saveVersion(wikiId, updatedPage, 'edited', oldPage);
    
    return updatedPage;
  }

  /**
   * Create taxonomy/category
   */
  createTaxonomy(taxonomyData) {
    const taxonomyId = taxonomyData.id || `tax-${Date.now()}`;
    
    let taxonomy = {
      id: taxonomyId,
      name: taxonomyData.name,
      description: taxonomyData.description,
      parentId: taxonomyData.parentId || null,
      level: taxonomyData.level || 1,
      order: taxonomyData.order || 0,
      articleCount: 0,
      color: taxonomyData.color || '#6B7280',
      icon: taxonomyData.icon || null,
      createdAt: new Date().toISOString()
    };

    this.taxonomies.set(taxonomyId, taxonomy);
    return taxonomy;
  }

  /**
   * Get all taxonomies
   */
  getTaxonomies(filters = {}) {
    let taxonomies = Array.from(this.taxonomies.values());

    if (filters.parentId !== undefined) {
      taxonomies = taxonomies.filter(t => t.parentId === filters.parentId);
    }

    if (filters.level) {
      taxonomies = taxonomies.filter(t => t.level === filters.level);
    }

    return taxonomies.sort((a, b) => a.order - b.order);
  }

  /**
   * Get taxonomy tree
   */
  getTaxonomyTree(rootId = null) {
    const buildTree = (parentId) => {
      const children = this.getTaxonomies({ parentId }).map(taxonomy => ({
        ...taxonomy,
        children: buildTree(taxonomy.id)
      }));
      return children;
    };

    return buildTree(rootId);
  }

  /**
   * Search knowledge base
   */
  searchKnowledge(query, filters = {}) {
    const results = {
      articles: [],
      wikiPages: [],
      documents: []
    };

    const queryLower = query.toLowerCase();

    // Search articles
    if (!filters.type || filters.type === 'articles') {
      results.articles = Array.from(this.articles.values())
        .filter(a => a.status === 'published')
        .filter(a => 
          a.title.toLowerCase().includes(queryLower) ||
          a.content.toLowerCase().includes(queryLower) ||
          a.summary.toLowerCase().includes(queryLower) ||
          a.tags.some(t => t.toLowerCase().includes(queryLower))
        )
        .map(a => ({
          ...a,
          relevance: this.calculateRelevance(query, a)
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);
    }

    // Search wiki pages
    if (!filters.type || filters.type === 'wiki') {
      results.wikiPages = Array.from(this.wikiPages.values())
        .filter(p => p.status === 'published')
        .filter(p => 
          p.title.toLowerCase().includes(queryLower) ||
          p.content.toLowerCase().includes(queryLower)
        )
        .map(p => ({
          ...p,
          relevance: this.calculateRelevance(query, p)
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10);
    }

    return results;
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(query, item) {
    let queryLower = query.toLowerCase();
    let score = 0;

    if (item.title.toLowerCase().includes(queryLower)) score += 10;
    if (item.content.toLowerCase().includes(queryLower)) score += 5;
    if (item.summary && item.summary.toLowerCase().includes(queryLower)) score += 3;
    if (item.tags && item.tags.some(t => t.toLowerCase().includes(queryLower))) score += 7;

    return score;
  }

  /**
   * Index content for search
   */
  indexForSearch(id, item) {
    const index = {
      id: id,
      title: item.title,
      content: item.content,
      summary: item.summary,
      tags: item.tags,
      type: item.taxonomyId ? 'article' : 'wiki'
    };
    this.searchIndex.set(id, index);
  }

  /**
   * Generate summary from content
   */
  generateSummary(content) {
    if (!content) return '';
    const words = content.split(' ');
    return words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
  }

  /**
   * Calculate read time
   */
  calculateReadTime(content) {
    if (!content) return 0;
    let words = content.split(' ').length;
    return Math.ceil(words / 200); // Average reading speed: 200 words per minute
  }

  /**
   * Generate slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Save version history
   */
  saveVersion(itemId, item, action, previousItem = null) {
    const versionId = `version-${itemId}-${item.version}`;
    
    const version = {
      id: versionId,
      itemId: itemId,
      version: item.version,
      action: action,
      data: { ...item },
      previousData: previousItem ? { ...previousItem } : null,
      changedBy: item.authorId || item.lastEditedBy,
      changedAt: new Date().toISOString()
    };

    if (!this.versionHistory.has(itemId)) {
      this.versionHistory.set(itemId, []);
    }
    this.versionHistory.get(itemId).push(version);
  }

  /**
   * Get version history for an item
   */
  getVersionHistory(itemId) {
    return this.versionHistory.get(itemId) || [];
  }

  /**
   * Restore version
   */
  restoreVersion(itemId, versionNumber) {
    const history = this.versionHistory.get(itemId);
    if (!history) {
      throw new Error(`No version history found for ${itemId}`);
    }

    let version = history.find(v => v.version === versionNumber);
    if (!version) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    // Determine if it's an article or wiki page
    if (this.articles.has(itemId)) {
      return this.updateArticle(itemId, version.data);
    } else if (this.wikiPages.has(itemId)) {
      return this.updateWikiPage(itemId, version.data);
    }

    throw new Error(`Item ${itemId} not found`);
  }

  /**
   * Set access control
   */
  setAccessControl(controlData) {
    const controlId = controlData.id || `acl-${Date.now()}`;
    
    const control = {
      id: controlId,
      resourceId: controlData.resourceId,
      resourceType: controlData.resourceType || 'article',
      userId: controlData.userId,
      roleId: controlData.roleId || null,
      permission: controlData.permission || 'read',
      grantedBy: controlData.grantedBy,
      expiresAt: controlData.expiresAt || null,
      createdAt: new Date().toISOString()
    };

    this.accessControl.set(controlId, control);
    return control;
  }

  /**
   * Check access permission
   */
  checkAccess(resourceId, userId, requiredPermission = 'read') {
    const controls = Array.from(this.accessControl.values())
      .filter(c => c.resourceId === resourceId);
    
    // Check direct user permissions
    const userControl = controls.find(c => c.userId === userId);
    if (userControl && this.hasPermission(userControl.permission, requiredPermission)) {
      return true;
    }

    // Check role-based permissions (simplified)
    const roleControls = controls.filter(c => c.roleId);
    // In a real implementation, you would check user's roles here
    
    return false;
  }

  /**
   * Check if permission level is sufficient
   */
  hasPermission(granted, required) {
    const levels = { read: 1, write: 2, admin: 3 };
    return levels[granted] >= levels[required];
  }

  /**
   * Submit feedback
   */
  submitFeedback(feedbackData) {
    const feedbackId = feedbackData.id || `feedback-${Date.now()}`;
    
    const feedback = {
      id: feedbackId,
      resourceId: feedbackData.resourceId,
      resourceType: feedbackData.resourceType || 'article',
      userId: feedbackData.userId,
      rating: feedbackData.rating,
      comment: feedbackData.comment || '',
      helpful: feedbackData.helpful || false,
      createdAt: new Date().toISOString()
    };

    this.feedback.set(feedbackId, feedback);
    
    // Update item stats
    if (feedbackData.resourceType === 'article') {
      let article = this.articles.get(feedbackData.resourceId);
      if (article) {
        if (feedbackData.helpful) {
          article.helpfulCount = (article.helpfulCount || 0) + 1;
        }
        if (feedbackData.rating) {
          article.likeCount = (article.likeCount || 0) + feedbackData.rating;
        }
        this.articles.set(feedbackData.resourceId, article);
      }
    }
    
    return feedback;
  }

  /**
   * Get feedback for a resource
   */
  getFeedback(resourceId) {
    return Array.from(this.feedback.values())
      .filter(f => f.resourceId === resourceId);
  }

  /**
   * Generate AI recommendations
   */
  async generateAIRecommendations(userId, context) {
    const recommendations = {
      userId: userId,
      context: context,
      recommendations: [],
      confidence: null,
      implemented: false,
      reason: 'No real recommendation model is connected — relevance scores below are not yet computed.',
      generatedAt: new Date().toISOString()
    };

    if (context.type === 'related_articles') {
      const articles = this.getArticles({ status: 'published' });
      recommendations.recommendations = articles.slice(0, 5).map(article => ({
        articleId: article.id,
        title: article.title,
        relevance: null,
        reason: 'Based on your reading history and interests'
      }));
    } else if (context.type === 'trending_topics') {
      let articles = this.getArticles({ status: 'published' });
      const trending = articles
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);
      
      recommendations.recommendations = trending.map(article => ({
        articleId: article.id,
        title: article.title,
        views: article.viewCount,
        reason: 'Most viewed articles this week'
      }));
    } else if (context.type === 'knowledge_gaps') {
      recommendations.recommendations = [
        {
          topic: 'Advanced Soil Analysis',
          reason: 'No comprehensive articles found on this topic',
          priority: 'high'
        },
        {
          topic: 'Sustainable Pest Management',
          reason: 'Limited coverage in current knowledge base',
          priority: 'medium'
        }
      ];
    }

    this.aiRecommendations.set(`${userId}-${context.type}-${Date.now()}`, recommendations);
    return recommendations;
  }

  /**
   * Get knowledge analytics
   */
  getAnalytics() {
    let articles = Array.from(this.articles.values());
    const wikiPages = Array.from(this.wikiPages.values());
    const taxonomies = Array.from(this.taxonomies.values());
    let feedback = Array.from(this.feedback.values());

    return {
      content: {
        totalArticles: articles.length,
        publishedArticles: articles.filter(a => a.status === 'published').length,
        totalWikiPages: wikiPages.length,
        totalTaxonomies: taxonomies.length,
        totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0) +
                     wikiPages.reduce((sum, w) => sum + (w.viewCount || 0), 0)
      },
      engagement: {
        totalLikes: articles.reduce((sum, a) => sum + (a.likeCount || 0), 0),
        totalHelpful: articles.reduce((sum, a) => sum + (a.helpfulCount || 0), 0),
        totalFeedback: feedback.length,
        averageRating: feedback.length > 0 ? 
          feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length : 0
      },
      activity: {
        totalVersions: Array.from(this.versionHistory.values())
          .reduce((sum, history) => sum + history.length, 0),
        articlesThisMonth: articles.filter(a => {
          const created = new Date(a.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length
      },
      distribution: {
        byTaxonomy: this.groupByTaxonomy(articles),
        byLanguage: this.groupByLanguage(articles),
        byStatus: this.groupByStatus(articles)
      }
    };
  }

  /**
   * Group articles by taxonomy
   */
  groupByTaxonomy(articles) {
    const grouped = {};
    articles.forEach(article => {
      const taxId = article.taxonomyId || 'uncategorized';
      let taxonomy = this.taxonomies.get(taxId);
      const name = taxonomy ? taxonomy.name : 'Uncategorized';
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group articles by language
   */
  groupByLanguage(articles) {
    let grouped = {};
    articles.forEach(article => {
      const lang = article.language || 'unknown';
      grouped[lang] = (grouped[lang] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group articles by status
   */
  groupByStatus(articles) {
    let grouped = {};
    articles.forEach(article => {
      const status = article.status || 'unknown';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      articles: this.articles.size,
      wikiPages: this.wikiPages.size,
      documents: this.documents.size,
      taxonomies: this.taxonomies.size,
      tags: this.tags.size,
      versionHistory: this.versionHistory.size,
      searchIndex: this.searchIndex.size,
      accessControl: this.accessControl.size,
      feedback: this.feedback.size,
      aiRecommendations: this.aiRecommendations.size
    };
  }
}

// Export singleton instance
const knowledgeService = new KnowledgeService();

module.exports = knowledgeService;


