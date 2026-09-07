/**
 * Enterprise-Grade Analytics and User Tracking
 * 
 * Production-ready analytics with:
 * - Event tracking
 * - Page view tracking
 * - User property tracking
 * - Custom dimensions
 * - E-commerce tracking
 * - Campaign tracking
 * - Privacy controls
 * - Multiple provider support
 * - Consent management
 */

import config from '../config/env'


/**
 * Analytics providers
 */
const AnalyticsProvider = {
  GOOGLE_ANALYTICS: 'google_analytics',
  MIXPANEL: 'mixpanel',
  AMPLITUDE: 'amplitude',
  CUSTOM: 'custom'
}

/**
 * Event categories
 */
const EventCategory = {
  USER: 'user',
  NAVIGATION: 'navigation',
  ENGAGEMENT: 'engagement',
  COMMERCE: 'commerce',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  FEATURE: 'feature'
}

/**
 * Initialize analytics
 */
function initAnalytics() {
  if (!config.ANALYTICS_ID) {
    
    return false
  }

  // Initialize Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('js', new Date())
    window.gtag('config', config.ANALYTICS_ID, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: true,
      cookie_flags: 'SameSite=Lax;Secure'
    })
  }

  return true
}

/**
 * Check if analytics is enabled
 */
function isAnalyticsEnabled() {
  return config.ENABLE_ANALYTICS && config.ANALYTICS_ID
}

/**
 * Check if user has consented to analytics
 */
function hasConsent() {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('analytics_consent')
  if (consent === 'granted') return true
  if (consent === 'denied') return false
  
  // Default to denied if not set
  return false
}

/**
 * Grant analytics consent
 */
function grantConsent() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('analytics_consent', 'granted')
    
    // Update Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }
}

/**
 * Deny analytics consent
 */
function denyConsent() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('analytics_consent', 'denied')
    
    // Update Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  }
}

/**
 * Track page view
 */
function trackPageView(pageName, properties = {}) {
  if (!isAnalyticsEnabled() || !hasConsent()) return

  const pageData = {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...properties
  }

  if (window.gtag) {
    window.gtag('event', 'page_view', pageData)
  }
}

/**
 * Track custom event
 */
function trackEvent(eventName, properties = {}) {
  if (!isAnalyticsEnabled() || !hasConsent()) return

  const eventData = {
    event_category: properties.category || EventCategory.ENGAGEMENT,
    event_label: properties.label,
    value: properties.value,
    ...properties
  }

  if (window.gtag) {
    window.gtag('event', eventName, eventData)
  }
}

/**
 * Track user action
 */
function trackUserAction(action, properties = {}) {
  trackEvent(action, {
    category: EventCategory.USER,
    ...properties
  })
}

/**
 * Track navigation
 */
function trackNavigation(from, to, properties = {}) {
  trackEvent('navigation', {
    category: EventCategory.NAVIGATION,
    label: `${from} -> ${to}`,
    ...properties
  })
}

/**
 * Track feature usage
 */
function trackFeatureUsage(featureName, properties = {}) {
  trackEvent('feature_used', {
    category: EventCategory.FEATURE,
    label: featureName,
    ...properties
  })
}

/**
 * Track error
 */
function trackError(error, properties = {}) {
  trackEvent('error', {
    category: EventCategory.ERROR,
    label: error.message || 'Unknown error',
    error_name: error.name,
    error_message: error.message,
    ...properties
  })
}

/**
 * Track performance metric
 */
function trackPerformance(metricName, value, properties = {}) {
  trackEvent('performance', {
    category: EventCategory.PERFORMANCE,
    label: metricName,
    value,
    ...properties
  })
}

/**
 * E-commerce tracking
 */
const ecommerce = {
  /**
   * Track product view
   */
  viewProduct(product) {
    trackEvent('view_item', {
      category: EventCategory.COMMERCE,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1
      }]
    })
  },

  /**
   * Track add to cart
   */
  addToCart(product, quantity = 1) {
    trackEvent('add_to_cart', {
      category: EventCategory.COMMERCE,
      currency: 'INR',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity
      }]
    })
  },

  /**
   * Track remove from cart
   */
  removeFromCart(product, quantity = 1) {
    trackEvent('remove_from_cart', {
      category: EventCategory.COMMERCE,
      currency: 'INR',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity
      }]
    })
  },

  /**
   * Track checkout start
   */
  beginCheckout(items, total) {
    trackEvent('begin_checkout', {
      category: EventCategory.COMMERCE,
      currency: 'INR',
      value: total,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    })
  },

  /**
   * Track purchase
   */
  purchase(order) {
    trackEvent('purchase', {
      category: EventCategory.COMMERCE,
      transaction_id: order.id,
      currency: 'INR',
      value: order.total,
      items: order.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    })
  }
}

/**
 * User property tracking
 */
function setUserProperty(propertyName, value) {
  if (!isAnalyticsEnabled() || !hasConsent()) return

  if (window.gtag) {
    window.gtag('set', 'user_properties', {
      [propertyName]: value
    })
  }
}

/**
 * Set user ID
 */
function setUserId(userId) {
  if (!isAnalyticsEnabled() || !hasConsent()) return

  if (window.gtag) {
    window.gtag('config', config.ANALYTICS_ID, {
      user_id: userId
    })
  }
}

/**
 * Campaign tracking
 */
function trackCampaign(campaignId, source, medium) {
  if (!isAnalyticsEnabled() || !hasConsent()) return

  if (window.gtag) {
    window.gtag('event', 'campaign_click', {
      campaign_id: campaignId,
      campaign_source: source,
      campaign_medium: medium
    })
  }
}

/**
 * Track search
 */
function trackSearch(query, resultCount) {
  trackEvent('search', {
    category: EventCategory.ENGAGEMENT,
    label: query,
    value: resultCount
  })
}

/**
 * Track form submission
 */
function trackFormSubmission(formName, success = true) {
  trackEvent('form_submit', {
    category: EventCategory.ENGAGEMENT,
    label: formName,
    value: success ? 1 : 0
  })
}

/**
 * Track button click
 */
function trackButtonClick(buttonName, location) {
  trackEvent('button_click', {
    category: EventCategory.ENGAGEMENT,
    label: buttonName,
    location
  })
}

/**
 * Track content engagement
 */
function trackContentEngagement(contentType, contentId, duration) {
  trackEvent('content_engagement', {
    category: EventCategory.ENGAGEMENT,
    label: `${contentType}_${contentId}`,
    value: duration
  })
}

/**
 * Session tracking
 */
const session = {
  /**
   * Track session start
   */
  start() {
    trackEvent('session_start', {
      category: EventCategory.USER,
      timestamp: Date.now()
    })
  },

  /**
   * Track session end
   */
  end(duration) {
    trackEvent('session_end', {
      category: EventCategory.USER,
      value: duration
    })
  }
}

/**
 * Custom event builder
 */
function buildEvent(category, action, label, value) {
  return {
    event_category: category,
    event_action: action,
    event_label: label,
    value
  }
}

/**
 * Batch events for performance
 */
const eventQueue = []
let queueTimeout = null

function queueEvent(eventName, properties) {
  eventQueue.push({ eventName, properties, timestamp: Date.now() })

  // Flush queue after 1 second or when it reaches 10 events
  if (eventQueue.length >= 10) {
    flushEventQueue()
  } else if (!queueTimeout) {
    queueTimeout = setTimeout(flushEventQueue, 1000)
  }
}

function flushEventQueue() {
  if (eventQueue.length === 0) return

  eventQueue.forEach(({ eventName, properties }) => {
    trackEvent(eventName, properties)
  })

  eventQueue.length = 0
  queueTimeout = null
}

/**
 * Analytics API
 */
const analytics = {
  AnalyticsProvider,
  EventCategory,
  init: initAnalytics,
  isEnabled: isAnalyticsEnabled,
  hasConsent,
  grantConsent,
  denyConsent,
  trackPageView,
  trackEvent,
  trackUserAction,
  trackNavigation,
  trackFeatureUsage,
  trackError,
  trackPerformance,
  ecommerce,
  setUserProperty,
  setUserId,
  trackCampaign,
  trackSearch,
  trackFormSubmission,
  trackButtonClick,
  trackContentEngagement,
  session,
  buildEvent,
  queueEvent,
  flushEventQueue
}

export default analytics
