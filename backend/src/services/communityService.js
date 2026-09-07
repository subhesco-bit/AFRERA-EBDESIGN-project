/**
 * Community Service
 * 
 * Enterprise-grade community management service providing comprehensive features
 * including user management, forums, discussions, events, groups, moderation,
 * gamification, analytics, and AI-powered community insights.
 */

class CommunityService {
  constructor() {
    // Community members
    this.members = new Map();
    
    // Forum categories
    this.categories = new Map();
    
    // Discussion threads
    this.threads = new Map();
    
    // Posts/replies
    this.posts = new Map();
    
    // Community groups
    this.groups = new Map();
    
    // Events
    this.events = new Map();
    
    // Moderation queue
    this.moderationQueue = new Map();
    
    // Gamification system
    this.gamification = new Map();
    
    // AI insights
    this.aiInsights = new Map();
    
    // Activity feed
    this.activityFeed = new Map();
    
    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default community data
   */
  initializeDefaultData() {
    // Sample categories
    this.categories.set('cat-001', {
      id: 'cat-001',
      name: 'General Discussion',
      description: 'General community discussions',
      icon: 'chat',
      color: '#3B82F6',
      order: 1,
      threadCount: 45,
      postCount: 320,
      status: 'active',
      permissions: {
        read: 'all',
        post: 'members',
        moderate: 'moderators'
      },
      createdAt: '2024-01-01T00:00:00Z'
    });

    this.categories.set('cat-002', {
      id: 'cat-002',
      name: 'Technical Support',
      description: 'Get help with technical issues',
      icon: 'support',
      color: '#10B981',
      order: 2,
      threadCount: 120,
      postCount: 890,
      status: 'active',
      permissions: {
        read: 'all',
        post: 'members',
        moderate: 'moderators'
      },
      createdAt: '2024-01-01T00:00:00Z'
    });

    // Sample members
    this.members.set('user-001', {
      id: 'user-001',
      username: 'agriculture_expert',
      email: 'expert@community.com',
      displayName: 'Dr. Sarah Johnson',
      avatar: '/assets/avatars/user-001.jpg',
      bio: 'Agricultural scientist with 15+ years of experience',
      role: 'moderator',
      status: 'active',
      joinedAt: '2024-01-15T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
      stats: {
        threadsCreated: 25,
        postsMade: 150,
        likesReceived: 450,
        reputation: 1250
      },
      badges: ['expert', 'helpful', 'top-contributor'],
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        timezone: 'UTC+5:30'
      }
    });
  }

  /**
   * Register a new community member
   */
  registerMember(memberData) {
    const memberId = memberData.id || `user-${Date.now()}`;
    
    const member = {
      id: memberId,
      username: memberData.username,
      email: memberData.email,
      displayName: memberData.displayName || memberData.username,
      avatar: memberData.avatar || null,
      bio: memberData.bio || '',
      role: memberData.role || 'member',
      status: memberData.status || 'active',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      stats: {
        threadsCreated: 0,
        postsMade: 0,
        likesReceived: 0,
        reputation: 0
      },
      badges: memberData.badges || [],
      preferences: memberData.preferences || {
        emailNotifications: true,
        pushNotifications: false,
        timezone: 'UTC'
      },
      metadata: memberData.metadata || {}
    };

    this.members.set(memberId, member);
    this.logActivity('member_joined', memberId, null);
    return member;
  }

  /**
   * Get all members
   */
  getMembers(filters = {}) {
    let members = Array.from(this.members.values());

    if (filters.status) {
      members = members.filter(m => m.status === filters.status);
    }

    if (filters.role) {
      members = members.filter(m => m.role === filters.role);
    }

    if (filters.badge) {
      members = members.filter(m => m.badges.includes(filters.badge));
    }

    // Sort by reputation or last active
    if (filters.sortBy === 'reputation') {
      members.sort((a, b) => b.stats.reputation - a.stats.reputation);
    } else {
      members.sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
    }

    return members;
  }

  /**
   * Get a specific member
   */
  getMember(memberId) {
    return this.members.get(memberId);
  }

  /**
   * Update member profile
   */
  updateMember(memberId, updates) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const updatedMember = {
      ...member,
      ...updates,
      lastActiveAt: new Date().toISOString()
    };

    this.members.set(memberId, updatedMember);
    return updatedMember;
  }

  /**
   * Create a forum category
   */
  createCategory(categoryData) {
    const categoryId = categoryData.id || `cat-${Date.now()}`;
    
    const category = {
      id: categoryId,
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon || 'folder',
      color: categoryData.color || '#6B7280',
      order: categoryData.order || 0,
      threadCount: 0,
      postCount: 0,
      status: categoryData.status || 'active',
      permissions: categoryData.permissions || {
        read: 'all',
        post: 'members',
        moderate: 'moderators'
      },
      parentId: categoryData.parentId || null,
      createdAt: new Date().toISOString()
    };

    this.categories.set(categoryId, category);
    return category;
  }

  /**
   * Get all categories
   */
  getCategories(filters = {}) {
    let categories = Array.from(this.categories.values());

    if (filters.status) {
      categories = categories.filter(c => c.status === filters.status);
    }

    if (filters.parentId !== undefined) {
      categories = categories.filter(c => c.parentId === filters.parentId);
    }

    return categories.sort((a, b) => a.order - b.order);
  }

  /**
   * Create a discussion thread
   */
  createThread(threadData) {
    const threadId = threadData.id || `thread-${Date.now()}`;
    
    const thread = {
      id: threadId,
      title: threadData.title,
      content: threadData.content,
      categoryId: threadData.categoryId,
      authorId: threadData.authorId,
      tags: threadData.tags || [],
      status: threadData.status || 'open',
      isPinned: threadData.isPinned || false,
      isLocked: threadData.isLocked || false,
      viewCount: 0,
      replyCount: 0,
      likeCount: 0,
      lastReplyAt: null,
      lastReplyBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.threads.set(threadId, thread);
    
    // Update category stats
    const category = this.categories.get(threadData.categoryId);
    if (category) {
      category.threadCount = (category.threadCount || 0) + 1;
      this.categories.set(threadData.categoryId, category);
    }
    
    // Update author stats
    const author = this.members.get(threadData.authorId);
    if (author) {
      author.stats.threadsCreated = (author.stats.threadsCreated || 0) + 1;
      this.members.set(threadData.authorId, author);
    }
    
    this.logActivity('thread_created', threadId, threadData.authorId);
    return thread;
  }

  /**
   * Get all threads
   */
  getThreads(filters = {}) {
    let threads = Array.from(this.threads.values());

    if (filters.status) {
      threads = threads.filter(t => t.status === filters.status);
    }

    if (filters.categoryId) {
      threads = threads.filter(t => t.categoryId === filters.categoryId);
    }

    if (filters.authorId) {
      threads = threads.filter(t => t.authorId === filters.authorId);
    }

    if (filters.tag) {
      threads = threads.filter(t => t.tags.includes(filters.tag));
    }

    if (filters.isPinned !== undefined) {
      threads = threads.filter(t => t.isPinned === filters.isPinned);
    }

    // Sort by pinned first, then by last reply
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.lastReplyAt ? new Date(a.lastReplyAt) : new Date(a.createdAt);
      const dateB = b.lastReplyAt ? new Date(b.lastReplyAt) : new Date(b.createdAt);
      return dateB - dateA;
    });

    return threads;
  }

  /**
   * Get a specific thread
   */
  getThread(threadId) {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.viewCount = (thread.viewCount || 0) + 1;
      this.threads.set(threadId, thread);
    }
    return thread;
  }

  /**
   * Create a post/reply
   */
  createPost(postData) {
    const postId = postData.id || `post-${Date.now()}`;
    
    const post = {
      id: postId,
      content: postData.content,
      threadId: postData.threadId,
      authorId: postData.authorId,
      parentPostId: postData.parentPostId || null,
      isEdited: false,
      editedAt: null,
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.posts.set(postId, post);
    
    // Update thread stats
    const thread = this.threads.get(postData.threadId);
    if (thread) {
      thread.replyCount = (thread.replyCount || 0) + 1;
      thread.lastReplyAt = post.createdAt;
      thread.lastReplyBy = postData.authorId;
      this.threads.set(postData.threadId, thread);
    }
    
    // Update category stats
    if (thread) {
      const category = this.categories.get(thread.categoryId);
      if (category) {
        category.postCount = (category.postCount || 0) + 1;
        this.categories.set(thread.categoryId, category);
      }
    }
    
    // Update author stats
    const author = this.members.get(postData.authorId);
    if (author) {
      author.stats.postsMade = (author.stats.postsMade || 0) + 1;
      this.members.set(postData.authorId, author);
    }
    
    this.logActivity('post_created', postId, postData.authorId);
    return post;
  }

  /**
   * Get posts for a thread
   */
  getPosts(threadId) {
    const posts = Array.from(this.posts.values())
      .filter(p => p.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return posts;
  }

  /**
   * Like a post or thread
   */
  likeItem(itemId, itemType, userId) {
    if (itemType === 'thread') {
      const thread = this.threads.get(itemId);
      if (thread) {
        thread.likeCount = (thread.likeCount || 0) + 1;
        this.threads.set(itemId, thread);
        
        // Update author reputation
        const author = this.members.get(thread.authorId);
        if (author) {
          author.stats.likesReceived = (author.stats.likesReceived || 0) + 1;
          author.stats.reputation = (author.stats.reputation || 0) + 5;
          this.members.set(thread.authorId, author);
        }
        
        return thread;
      }
    } else if (itemType === 'post') {
      const post = this.posts.get(itemId);
      if (post) {
        post.likeCount = (post.likeCount || 0) + 1;
        this.posts.set(itemId, post);
        
        // Update author reputation
        const author = this.members.get(post.authorId);
        if (author) {
          author.stats.likesReceived = (author.stats.likesReceived || 0) + 1;
          author.stats.reputation = (author.stats.reputation || 0) + 2;
          this.members.set(post.authorId, author);
        }
        
        return post;
      }
    }
    
    throw new Error(`Item ${itemId} of type ${itemType} not found`);
  }

  /**
   * Create a community group
   */
  createGroup(groupData) {
    const groupId = groupData.id || `group-${Date.now()}`;
    
    const group = {
      id: groupId,
      name: groupData.name,
      description: groupData.description,
      type: groupData.type || 'public',
      ownerId: groupData.ownerId,
      members: [groupData.ownerId],
      moderators: [groupData.ownerId],
      avatar: groupData.avatar || null,
      coverImage: groupData.coverImage || null,
      rules: groupData.rules || [],
      tags: groupData.tags || [],
      memberCount: 1,
      postCount: 0,
      status: groupData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.groups.set(groupId, group);
    this.logActivity('group_created', groupId, groupData.ownerId);
    return group;
  }

  /**
   * Get all groups
   */
  getGroups(filters = {}) {
    let groups = Array.from(this.groups.values());

    if (filters.status) {
      groups = groups.filter(g => g.status === filters.status);
    }

    if (filters.type) {
      groups = groups.filter(g => g.type === filters.type);
    }

    if (filters.memberId) {
      groups = groups.filter(g => g.members.includes(filters.memberId));
    }

    return groups.sort((a, b) => b.memberCount - a.memberCount);
  }

  /**
   * Join a group
   */
  joinGroup(groupId, userId) {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      group.memberCount = group.members.length;
      group.updatedAt = new Date().toISOString();
      this.groups.set(groupId, group);
      this.logActivity('group_joined', groupId, userId);
    }

    return group;
  }

  /**
   * Create a community event
   */
  createEvent(eventData) {
    const eventId = eventData.id || `event-${Date.now()}`;
    
    const event = {
      id: eventId,
      title: eventData.title,
      description: eventData.description,
      type: eventData.type || 'online',
      location: eventData.location || null,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      organizerId: eventData.organizerId,
      attendees: [eventData.organizerId],
      capacity: eventData.capacity || null,
      status: eventData.status || 'upcoming',
      coverImage: eventData.coverImage || null,
      tags: eventData.tags || [],
      agenda: eventData.agenda || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.set(eventId, event);
    this.logActivity('event_created', eventId, eventData.organizerId);
    return event;
  }

  /**
   * Get all events
   */
  getEvents(filters = {}) {
    let events = Array.from(this.events.values());

    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }

    return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }

  /**
   * Register for an event
   */
  registerForEvent(eventId, userId) {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    if (event.capacity && event.attendees.length >= event.capacity) {
      throw new Error('Event is at full capacity');
    }

    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
      event.updatedAt = new Date().toISOString();
      this.events.set(eventId, event);
      this.logActivity('event_registered', eventId, userId);
    }

    return event;
  }

  /**
   * Add item to moderation queue
   */
  addToModerationQueue(itemData) {
    const queueId = itemData.id || `mod-${Date.now()}`;
    
    const queueItem = {
      id: queueId,
      itemType: itemData.itemType,
      itemId: itemData.itemId,
      reporterId: itemData.reporterId,
      reason: itemData.reason,
      description: itemData.description,
      status: 'pending',
      priority: itemData.priority || 'medium',
      assignedTo: null,
      reviewedAt: null,
      actionTaken: null,
      actionReason: null,
      createdAt: new Date().toISOString()
    };

    this.moderationQueue.set(queueId, queueItem);
    return queueItem;
  }

  /**
   * Get moderation queue
   */
  getModerationQueue(filters = {}) {
    let items = Array.from(this.moderationQueue.values());

    if (filters.status) {
      items = items.filter(i => i.status === filters.status);
    }

    if (filters.priority) {
      items = items.filter(i => i.priority === filters.priority);
    }

    if (filters.assignedTo) {
      items = items.filter(i => i.assignedTo === filters.assignedTo);
    }

    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || 
             new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  /**
   * Process moderation item
   */
  processModeration(queueId, actionData) {
    const item = this.moderationQueue.get(queueId);
    if (!item) {
      throw new Error(`Moderation item ${queueId} not found`);
    }

    item.status = 'processed';
    item.assignedTo = actionData.assignedTo;
    item.actionTaken = actionData.actionTaken;
    item.actionReason = actionData.actionReason;
    item.reviewedAt = new Date().toISOString();

    this.moderationQueue.set(queueId, item);

    // Execute action
    if (actionData.actionTaken === 'delete') {
      if (item.itemType === 'thread') {
        this.threads.delete(item.itemId);
      } else if (item.itemType === 'post') {
        this.posts.delete(item.itemId);
      }
    } else if (actionData.actionTaken === 'hide') {
      if (item.itemType === 'thread') {
        const thread = this.threads.get(item.itemId);
        if (thread) {
          thread.status = 'hidden';
          this.threads.set(item.itemId, thread);
        }
      } else if (item.itemType === 'post') {
        const post = this.posts.get(item.itemId);
        if (post) {
          post.status = 'hidden';
          this.posts.set(item.itemId, post);
        }
      }
    }

    return item;
  }

  /**
   * Award badge to member
   */
  awardBadge(memberId, badge) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    if (!member.badges.includes(badge)) {
      member.badges.push(badge);
      member.stats.reputation = (member.stats.reputation || 0) + 50;
      this.members.set(memberId, member);
      this.logActivity('badge_awarded', memberId, null, { badge });
    }

    return member;
  }

  /**
   * Generate AI community insights
   */
  async generateAIInsights(insightType) {
    const insights = {
      type: insightType,
      generatedAt: new Date().toISOString(),
      insights: []
    };

    if (insightType === 'engagement') {
      const members = Array.from(this.members.values());
      const threads = Array.from(this.threads.values());
      
      insights.insights = [
        {
          metric: 'Active Members',
          value: members.filter(m => {
            const lastActive = new Date(m.lastActiveAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastActive > weekAgo;
          }).length,
          trend: 'increasing',
          recommendation: 'Continue engagement programs to maintain momentum'
        },
        {
          metric: 'Average Thread Engagement',
          value: threads.length > 0 ? 
            threads.reduce((sum, t) => sum + (t.replyCount || 0), 0) / threads.length : 0,
          trend: 'stable',
          recommendation: 'Encourage more discussion starters in low-engagement categories'
        }
      ];
    } else if (insightType === 'content') {
      const threads = Array.from(this.threads.values());
      
      insights.insights = [
        {
          metric: 'Trending Topics',
          value: this.getTrendingTags(threads),
          trend: 'dynamic',
          recommendation: 'Create dedicated categories for trending topics'
        },
        {
          metric: 'Content Quality',
          value: 'high',
          trend: 'improving',
          recommendation: 'Recognize high-quality contributors with badges'
        }
      ];
    }

    this.aiInsights.set(`${insightType}-${Date.now()}`, insights);
    return insights;
  }

  /**
   * Get trending tags
   */
  getTrendingTags(threads) {
    const tagCounts = {};
    threads.forEach(thread => {
      (thread.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Log activity
   */
  logActivity(action, resourceId, userId, metadata = {}) {
    const logId = `activity-${Date.now()}`;
    
    const log = {
      id: logId,
      action: action,
      resourceId: resourceId,
      userId: userId,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };

    if (!this.activityFeed.has('global')) {
      this.activityFeed.set('global', []);
    }
    this.activityFeed.get('global').unshift(log);
    
    // Keep only last 1000 activities
    const feed = this.activityFeed.get('global');
    if (feed.length > 1000) {
      feed.pop();
    }
  }

  /**
   * Get activity feed
   */
  getActivityFeed(filters = {}) {
    let activities = this.activityFeed.get('global') || [];
    
    if (filters.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }

    if (filters.action) {
      activities = activities.filter(a => a.action === filters.action);
    }

    if (filters.limit) {
      activities = activities.slice(0, filters.limit);
    }

    return activities;
  }

  /**
   * Get community analytics
   */
  getAnalytics() {
    const members = Array.from(this.members.values());
    const threads = Array.from(this.threads.values());
    const posts = Array.from(this.posts.values());
    const groups = Array.from(this.groups.values());
    const events = Array.from(this.events.values());

    return {
      members: {
        total: members.length,
        active: members.filter(m => m.status === 'active').length,
        newThisWeek: members.filter(m => {
          const joined = new Date(m.joinedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return joined > weekAgo;
        }).length,
        byRole: this.groupByRole(members)
      },
      content: {
        categories: this.categories.size,
        threads: threads.length,
        posts: posts.length,
        totalViews: threads.reduce((sum, t) => sum + (t.viewCount || 0), 0),
        totalLikes: threads.reduce((sum, t) => sum + (t.likeCount || 0), 0) +
                    posts.reduce((sum, p) => sum + (p.likeCount || 0), 0)
      },
      engagement: {
        groups: groups.length,
        totalGroupMembers: groups.reduce((sum, g) => sum + g.memberCount, 0),
        events: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        totalEventAttendees: events.reduce((sum, e) => sum + e.attendees.length, 0)
      },
      moderation: {
        pendingItems: Array.from(this.moderationQueue.values()).filter(i => i.status === 'pending').length,
        processedToday: Array.from(this.moderationQueue.values()).filter(i => {
          if (i.reviewedAt) {
            const reviewed = new Date(i.reviewedAt);
            const today = new Date();
            return reviewed.toDateString() === today.toDateString();
          }
          return false;
        }).length
      }
    };
  }

  /**
   * Group members by role
   */
  groupByRole(members) {
    const grouped = {};
    members.forEach(m => {
      const role = m.role || 'member';
      grouped[role] = (grouped[role] || 0) + 1;
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
      members: this.members.size,
      categories: this.categories.size,
      threads: this.threads.size,
      posts: this.posts.size,
      groups: this.groups.size,
      events: this.events.size,
      moderationQueue: this.moderationQueue.size,
      aiInsights: this.aiInsights.size
    };
  }
}

// Export singleton instance
const communityService = new CommunityService();

module.exports = communityService;
