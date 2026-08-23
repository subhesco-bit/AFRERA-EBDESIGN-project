/**
 * Platform Detector & Abstraction Layer
 * Handles OS detection, capability discovery, and feature availability
 * Supports: Windows, Linux, macOS, iOS, Android
 */

class PlatformDetector {
  static PLATFORMS = {
    WINDOWS: 'windows',
    LINUX: 'linux',
    MACOS: 'macos',
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web',
  };

  static OS_FAMILIES = {
    DESKTOP: 'desktop',
    MOBILE: 'mobile',
    IOT: 'iot',
    WEB: 'web',
  };

  /**
   * Detect current platform from runtime environment
   * @returns {Object} Platform information
   */
  static detectPlatform() {
    const userAgent = typeof globalThis.navigator !== 'undefined' ? globalThis.navigator.userAgent : '';
    const platform = typeof globalThis.navigator !== 'undefined' ? globalThis.navigator.platform : '';

    // Mobile detection
    if (/android/i.test(userAgent)) {
      return {
        name: this.PLATFORMS.ANDROID,
        family: this.OS_FAMILIES.MOBILE,
        version: this._getAndroidVersion(userAgent),
      };
    }

    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return {
        name: this.PLATFORMS.IOS,
        family: this.OS_FAMILIES.MOBILE,
        version: this._getIOSVersion(userAgent),
      };
    }

    // Desktop detection
    if (/win/i.test(platform)) {
      return {
        name: this.PLATFORMS.WINDOWS,
        family: this.OS_FAMILIES.DESKTOP,
        version: this._getWindowsVersion(userAgent),
      };
    }

    if (/mac/i.test(platform)) {
      return {
        name: this.PLATFORMS.MACOS,
        family: this.OS_FAMILIES.DESKTOP,
        version: this._getMacOSVersion(userAgent),
      };
    }

    if (/linux/i.test(platform)) {
      return {
        name: this.PLATFORMS.LINUX,
        family: this.OS_FAMILIES.DESKTOP,
        version: this._getLinuxVersion(userAgent),
      };
    }

    return {
      name: this.PLATFORMS.WEB,
      family: this.OS_FAMILIES.WEB,
      version: 'unknown',
    };
  }

  /**
   * Get platform capabilities
   * @param {string} platform - Platform name
   * @returns {Object} Capabilities map
   */
  static getCapabilities(platform) {
    const capabilityMap = {
      [this.PLATFORMS.WINDOWS]: {
        fileSystem: true,
        nativeNotifications: true,
        clipboard: true,
        systemTray: true,
        offlineSyncDbType: 'sqlite',
        maxStorageGB: 10,
        supportsAutoUpdate: true,
        nativeIntegration: true,
      },
      [this.PLATFORMS.LINUX]: {
        fileSystem: true,
        nativeNotifications: true,
        clipboard: true,
        systemTray: true,
        offlineSyncDbType: 'sqlite',
        maxStorageGB: 10,
        supportsAutoUpdate: true,
        nativeIntegration: true,
      },
      [this.PLATFORMS.MACOS]: {
        fileSystem: true,
        nativeNotifications: true,
        clipboard: true,
        systemTray: true,
        offlineSyncDbType: 'sqlite',
        maxStorageGB: 10,
        supportsAutoUpdate: true,
        nativeIntegration: true,
        keychainIntegration: true,
      },
      [this.PLATFORMS.IOS]: {
        fileSystem: false,
        nativeNotifications: true,
        clipboard: true,
        systemTray: false,
        offlineSyncDbType: 'watermelon-db',
        maxStorageGB: 2,
        supportsAutoUpdate: false,
        nativeIntegration: true,
        biometricAuth: true,
        qrScanning: true,
        cameraAccess: true,
        locationServices: true,
      },
      [this.PLATFORMS.ANDROID]: {
        fileSystem: true,
        nativeNotifications: true,
        clipboard: true,
        systemTray: false,
        offlineSyncDbType: 'watermelon-db',
        maxStorageGB: 5,
        supportsAutoUpdate: true,
        nativeIntegration: true,
        biometricAuth: true,
        qrScanning: true,
        cameraAccess: true,
        locationServices: true,
      },
      [this.PLATFORMS.WEB]: {
        fileSystem: false,
        nativeNotifications: true,
        clipboard: true,
        systemTray: false,
        offlineSyncDbType: 'indexeddb',
        maxStorageGB: 0.05,
        supportsAutoUpdate: false,
        nativeIntegration: false,
        qrScanning: false,
      },
    };

    return capabilityMap[platform] || {};
  }

  /**
   * Check if feature is available on platform
   * @param {string} platform - Platform name
   * @param {string} feature - Feature name
   * @returns {boolean} Feature availability
   */
  static hasFeature(platform, feature) {
    const capabilities = this.getCapabilities(platform);
    return capabilities[feature] === true;
  }

  /**
   * Get recommended offline DB type for platform
   * @param {string} platform - Platform name
   * @returns {string} Database type
   */
  static getOfflineDbType(platform) {
    const capabilities = this.getCapabilities(platform);
    return capabilities.offlineSyncDbType || 'indexeddb';
  }

  /**
   * Get maximum storage capacity for platform
   * @param {string} platform - Platform name
   * @returns {number} Storage in GB
   */
  static getMaxStorage(platform) {
    const capabilities = this.getCapabilities(platform);
    return capabilities.maxStorageGB || 0.05;
  }

  /**
   * Get platform-specific configuration
   * @param {string} platform - Platform name
   * @returns {Object} Platform config
   */
  static getPlatformConfig(platform) {
    const configs = {
      [this.PLATFORMS.WINDOWS]: {
        defaultPort: 3000,
        certPath: '%APPDATA%\\afrera\\certs',
        logPath: '%APPDATA%\\afrera\\logs',
        dataPath: '%APPDATA%\\afrera\\data',
      },
      [this.PLATFORMS.LINUX]: {
        defaultPort: 3000,
        certPath: '~/.afrera/certs',
        logPath: '~/.afrera/logs',
        dataPath: '~/.afrera/data',
      },
      [this.PLATFORMS.MACOS]: {
        defaultPort: 3000,
        certPath: '~/Library/Application Support/afrera/certs',
        logPath: '~/Library/Logs/afrera',
        dataPath: '~/Library/Application Support/afrera/data',
      },
      [this.PLATFORMS.IOS]: {
        defaultPort: null,
        certPath: 'Library/afrera/certs',
        logPath: 'Library/Logs/afrera',
        dataPath: 'Documents/afrera',
      },
      [this.PLATFORMS.ANDROID]: {
        defaultPort: null,
        certPath: 'files/afrera/certs',
        logPath: 'files/afrera/logs',
        dataPath: 'files/afrera/data',
      },
    };

    return configs[platform] || {};
  }

  // Version parsing helpers
  static _getAndroidVersion(userAgent) {
    const match = userAgent.match(/Android\s([0-9.]*)/i);
    return match ? match[1] : 'unknown';
  }

  static _getIOSVersion(userAgent) {
    const match = userAgent.match(/OS\s([0-9_]*)\s/i);
    return match ? match[1].replace(/_/g, '.') : 'unknown';
  }

  static _getWindowsVersion(userAgent) {
    if (/Windows NT 10.0/.test(userAgent)) return '10+';
    if (/Windows NT 6.3/.test(userAgent)) return '8.1';
    if (/Windows NT 6.2/.test(userAgent)) return '8';
    return 'unknown';
  }

  static _getMacOSVersion(userAgent) {
    const match = userAgent.match(/Mac OS X\s([0-9._]*)/i);
    return match ? match[1].replace(/_/g, '.') : 'unknown';
  }

  static _getLinuxVersion(userAgent) {
    const match = userAgent.match(/Linux\s([^;]*)/i);
    return match ? match[1] : 'unknown';
  }
}

module.exports = PlatformDetector;
