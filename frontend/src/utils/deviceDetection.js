/**
 * Device Detection & Validation Utility
 * Handles Capacitor-based device-level detection and runtime checks
 */

// Conditional imports for Capacitor (only available in native builds)
let Capacitor, Device, ScreenOrientation;
try {
  const capacitorCore = require('@capacitor/core');
  const capacitorDevice = require('@capacitor/device');
  const capacitorScreenOrientation = require('@capacitor/screen-orientation');
  Capacitor = capacitorCore;
  Device = capacitorDevice;
  ScreenOrientation = capacitorScreenOrientation;
} catch (error) {
  // Capacitor not available - will use web fallback
  console.warn('Capacitor not available, using web fallback for device detection');
}

class DeviceDetectionService {
  constructor() {
    this.deviceInfo = null;
    this.isNative = Capacitor ? Capacitor.isNativePlatform() : false;
    this.platform = Capacitor ? Capacitor.getPlatform() : 'web';
    this.initialized = false;
  }

  /**
   * Initialize device detection
   */
  async initialize() {
    if (this.initialized) return this.deviceInfo;

    try {
      if (this.isNative) {
        await this._initializeNativeDevice();
      } else {
        this._initializeWebDevice();
      }
      this.initialized = true;
      return this.deviceInfo;
    } catch (error) {
      console.error('Device initialization failed:', error);
      this.deviceInfo = this._getFallbackDeviceInfo();
      return this.deviceInfo;
    }
  }

  /**
   * Initialize native device (iOS/Android)
   */
  async _initializeNativeDevice() {
    try {
      const deviceInfo = await Device.getInfo();
      const orientation = await ScreenOrientation.orientation();

      this.deviceInfo = {
        isNative: true,
        platform: this.platform,
        os: deviceInfo.operatingSystem,
        osVersion: deviceInfo.osVersion,
        manufacturer: deviceInfo.manufacturer,
        model: deviceInfo.model,
        webViewVersion: deviceInfo.webViewVersion,
        orientation: orientation.type,
        isTablet: await this._detectTablet(deviceInfo),
        viewport: this._getViewportSize(),
        capabilities: {
          camera: true,
          geolocation: true,
          microphone: true,
          filesystem: true,
          notifications: true,
          biometric: true,
        },
      };
    } catch (error) {
      console.error('Native device initialization failed:', error);
      // Fall back to web detection if Capacitor fails
      this._initializeWebDevice();
    }
  }

  /**
   * Initialize web device detection
   */
  _initializeWebDevice() {
    const ua = navigator.userAgent;
    const isTablet = this._detectWebTablet(ua);
    const isMobile = this._detectWebMobile(ua);

    this.deviceInfo = {
      isNative: false,
      platform: 'web',
      os: this._detectOS(ua),
      osVersion: this._detectOSVersion(ua),
      manufacturer: this._detectBrowser(ua),
      model: navigator.platform,
      webViewVersion: navigator.appVersion,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isMobile,
      isTablet,
      viewport: this._getViewportSize(),
      capabilities: {
        camera: Boolean(navigator.mediaDevices?.getUserMedia),
        geolocation: Boolean(navigator.geolocation),
        microphone: Boolean(navigator.mediaDevices?.getUserMedia),
        filesystem: 'webkitdirectory' in HTMLInputElement.prototype,
        notifications: 'Notification' in window,
        biometric: 'BiometricPrompt' in window,
      },
    };
  }

  /**
   * Detect if device is tablet (native)
   */
  async _detectTablet(deviceInfo) {
    if (this.platform === 'ios') {
      return deviceInfo.model.includes('iPad');
    }
    if (this.platform === 'android') {
      // Check screen density and size
      const width = window.innerWidth;
      const height = window.innerHeight;
      const diagonal = Math.sqrt(width * width + height * height) / window.devicePixelRatio;
      return diagonal >= 6.5;
    }
    return false;
  }

  /**
   * Detect if device is tablet (web)
   */
  _detectWebTablet(ua) {
    const tabletPatterns = [
      /iPad/i,
      /Android(?!.*Mobile)/i,
      /tablet/i,
      /Kindle/i,
      /Nexus 7/i,
      /Nexus 10/i,
      /Pixel Tablet/i,
    ];
    return tabletPatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Detect if device is mobile (web)
   */
  _detectWebMobile(ua) {
    const mobilePatterns = [
      /Mobile/i,
      /Android/i,
      /iPhone/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
    ];
    return mobilePatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Detect operating system
   */
  _detectOS(ua) {
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    if (/Android/i.test(ua)) return 'Android';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  _detectBrowser(ua) {
    if (/Edg/i.test(ua)) return 'Edge';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Trident/i.test(ua)) return 'IE';
    return 'Unknown';
  }

  /**
   * Detect OS version
   */
  _detectOSVersion(ua) {
    const patterns = [
      /OS (\d+(_\d+)*)/i,
      /Android (\d+(\.\d+)*)/i,
      /Windows NT ([\d.]+)/i,
      /Mac OS X ([\d_.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = ua.match(pattern);
      if (match) return match[1] || match[0];
    }
    return 'Unknown';
  }

  /**
   * Get viewport size
   */
  _getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Get fallback device info
   */
  _getFallbackDeviceInfo() {
    return {
      isNative: false,
      platform: 'web',
      os: 'Unknown',
      osVersion: 'Unknown',
      manufacturer: 'Unknown',
      model: 'Unknown',
      viewport: this._getViewportSize(),
      capabilities: {
        camera: false,
        geolocation: false,
        microphone: false,
        filesystem: false,
        notifications: false,
        biometric: false,
      },
    };
  }

  /**
   * Get device type (mobile, tablet, desktop)
   */
  getDeviceType() {
    if (!this.deviceInfo) return 'web';

    if (this.deviceInfo.isMobile) return 'mobile';
    if (this.deviceInfo.isTablet) return 'tablet';
    return 'desktop';
  }

  /**
   * Get viewport category
   */
  getViewportCategory() {
    const width = this.deviceInfo?.viewport?.width || window.innerWidth;

    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  }

  /**
   * Check if capability is available
   */
  hasCapability(capability) {
    return this.deviceInfo?.capabilities?.[capability] || false;
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    return this.deviceInfo;
  }

  /**
   * Is running on native platform
   */
  isRunningNative() {
    return this.isNative;
  }

  /**
   * Get platform (ios, android, web)
   */
  getPlatform() {
    return this.platform;
  }

  /**
   * Handle orientation change
   */
  onOrientationChange(callback) {
    window.addEventListener('orientationchange', () => {
      this.deviceInfo.orientation =
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      this.deviceInfo.viewport = this._getViewportSize();
      callback(this.deviceInfo);
    });

    return () => window.removeEventListener('orientationchange', callback);
  }

  /**
   * Handle viewport change
   */
  onViewportChange(callback) {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.deviceInfo.viewport = this._getViewportSize();
        callback(this.deviceInfo);
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }

  /**
   * Validate app can run on this device
   */
  validateAppRequirements() {
    const issues = [];

    // Check minimum viewport
    const width = this.deviceInfo?.viewport?.width || window.innerWidth;
    if (width < 320) {
      issues.push('Device width below minimum supported (320px)');
    }

    // Check browser capabilities
    const requiredCapabilities = ['geolocation'];
    for (const cap of requiredCapabilities) {
      if (!this.hasCapability(cap)) {
        issues.push(`Device missing required capability: ${cap}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      deviceInfo: this.deviceInfo,
    };
  }
}

// Export singleton instance
export const deviceDetection = new DeviceDetectionService();

export default deviceDetection;
