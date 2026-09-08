/**
 * Enterprise-Grade Route Analytics Tracker
 *
 * Production-ready route analytics with:
 * - Automatic page view tracking
 * - Route change detection
 * - Performance metrics
 * - User journey tracking
 * - Custom event tracking
 * - Integration with analytics providers
 */

import { useEffect } from 'react';

import { useLocation, useNavigationType } from 'react-router-dom';
import analytics from '../utils/analytics';
import monitoring from '../utils/monitoring';

/**
 * Route Analytics Component
 * Automatically tracks route changes and page views
 */
export function RouteAnalytics({ routeConfig }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Track page view
    const trackPageView = () => {
      const path = location.pathname;
      const route = routeConfig?.getRouteByPath(path);

      // Track with analytics
      analytics.trackPageView(route?.title || path, {
        path,
        navigationType: navigationType === 'POP' ? 'back' : navigationType === 'REPLACE' ? 'replace' : 'navigate',
        referrer: document.referrer,
      });

      // Track with monitoring
      monitoring.trackPageView(route?.title || path, {
        path,
        navigationType,
      });

      // Update document title for SEO
      if (route?.title) {
        document.title = route.title;
      }

      // Update meta description
      if (route?.description) {
        updateMetaDescription(route.description);
      }

      // Update meta keywords
      if (route?.keywords) {
        updateMetaKeywords(route.keywords);
      }
    };

    trackPageView();

    // Track navigation performance
    const performance = monitoring.performance.measurePageLoad();
    if (performance) {
      monitoring.trackPerformance('page_load', performance.pageLoadTime, {
        path: location.pathname,
        domReady: performance.domReadyTime,
      });
    }
  }, [location, navigationType, routeConfig]);

  return null;
}

/**
 * Update meta description tag
 */
function updateMetaDescription(description) {
  let metaTag = document.querySelector('meta[name="description"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.name = 'description';
    document.head.appendChild(metaTag);
  }
  metaTag.content = description;
}

/**
 * Update meta keywords tag
 */
function updateMetaKeywords(keywords) {
  let metaTag = document.querySelector('meta[name="keywords"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.name = 'keywords';
    document.head.appendChild(metaTag);
  }
  metaTag.content = keywords;
}

/**
 * Update canonical URL
 */
function updateCanonicalUrl(url) {
  let linkTag = document.querySelector('link[rel="canonical"]');
  if (!linkTag) {
    linkTag = document.createElement('link');
    linkTag.rel = 'canonical';
    document.head.appendChild(linkTag);
  }
  linkTag.href = url;
}

/**
 * Update Open Graph tags
 */
function updateOpenGraphTags(title, description, image, url) {
  const ogTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'website' },
  ];

  ogTags.forEach(({ property, content }) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    metaTag.content = content;
  });
}

/**
 * Update Twitter Card tags
 */
function updateTwitterCardTags(title, description, image) {
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];

  twitterTags.forEach(({ name, content }) => {
    let metaTag = document.querySelector(`meta[name="${name}"]`);
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = name;
      document.head.appendChild(metaTag);
    }
    metaTag.content = content;
  });
}

/**
 * Route Metadata Component
 * Updates SEO metadata based on route configuration
 */
export function RouteMetadata({ route }) {
  useEffect(() => {
    if (!route) return;

    const url = `${window.location.origin}${route.path}`;

    // Update basic meta tags
    if (route.title) {
      document.title = route.title;
    }

    if (route.description) {
      updateMetaDescription(route.description);
    }

    if (route.keywords) {
      updateMetaKeywords(route.keywords);
    }

    // Update canonical URL
    updateCanonicalUrl(url);

    // Update Open Graph tags
    if (route.title || route.description) {
      updateOpenGraphTags(
        route.title,
        route.description,
        route.image || '/og-image.png',
        url,
      );
    }

    // Update Twitter Card tags
    if (route.title || route.description) {
      updateTwitterCardTags(
        route.title,
        route.description,
        route.image || '/twitter-image.png',
      );
    }

    // Add noindex if specified
    if (route.noIndex) {
      let metaTag = document.querySelector('meta[name="robots"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'robots';
        document.head.appendChild(metaTag);
      }
      metaTag.content = 'noindex, nofollow';
    }
  }, [route]);

  return null;
}

/**
 * User Journey Tracker
 * Tracks user's navigation path through the application
 */
export function UserJourneyTracker() {
  let location = useLocation();

  useEffect(() => {
    // Track user journey in localStorage
    const journey = JSON.parse(localStorage.getItem('user_journey') || '[]');

    // Add current path to journey
    journey.push({
      path: location.pathname,
      timestamp: Date.now(),
    });

    // Keep only last 50 entries
    if (journey.length > 50) {
      journey.shift();
    }

    localStorage.setItem('user_journey', JSON.stringify(journey));

    // Track funnel events
    trackFunnelEvents(location.pathname);
  }, [location]);

  return null;
}

/**
 * Track funnel events based on route patterns
 */
function trackFunnelEvents(path) {
  // Marketplace funnel
  if (path === '/marketplace') {
    analytics.trackEvent('marketplace_view', { category: 'funnel' });
  } else if (path.startsWith('/products/')) {
    analytics.trackEvent('product_view', { category: 'funnel' });
  } else if (path === '/cart') {
    analytics.trackEvent('cart_view', { category: 'funnel' });
  } else if (path === '/checkout') {
    analytics.trackEvent('checkout_start', { category: 'funnel' });
  }

  // Farmer onboarding funnel
  if (path === '/farmer-entrance') {
    analytics.trackEvent('farmer_portal_entry', { category: 'funnel' });
  } else if (path === '/farmer-entrance/sell') {
    analytics.trackEvent('sell_door_entry', { category: 'funnel' });
  } else if (path === '/farmer-entrance/field') {
    analytics.trackEvent('field_door_entry', { category: 'funnel' });
  }
}

/**
 * Scroll Tracker
 * Tracks scroll depth on pages
 */
export function ScrollTracker() {
  useEffect(() => {
    let maxScroll = 0;

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
      );

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;

        // Track scroll depth milestones
        if (maxScroll === 25) {
          analytics.trackEvent('scroll_25', { category: 'engagement' });
        } else if (maxScroll === 50) {
          analytics.trackEvent('scroll_50', { category: 'engagement' });
        } else if (maxScroll === 75) {
          analytics.trackEvent('scroll_75', { category: 'engagement' });
        } else if (maxScroll === 100) {
          analytics.trackEvent('scroll_100', { category: 'engagement' });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}

/**
 * Engagement Tracker
 * Tracks user engagement metrics
 */
export function EngagementTracker() {
  useEffect(() => {
    let startTime = Date.now();
    let isActive = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        const duration = Date.now() - startTime;
        analytics.trackEvent('page_engagement', {
          category: 'engagement',
          value: Math.round(duration / 1000), // seconds
        });
      } else {
        isActive = true;
        startTime = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      if (isActive) {
        let duration = Date.now() - startTime;
        analytics.trackEvent('page_duration', {
          category: 'engagement',
          value: Math.round(duration / 1000),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
