/**
 * Logging Service
 * Centralized logging with audit trail tracking
 */

const logs = {
  api: [],
  errors: [],
  security: [],
  auth: [],
};

const MAX_LOGS = 1000;

function addLog(category, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (!logs[category]) {
    logs[category] = [];
  }

  logs[category].push(logEntry);

  // Keep only recent logs
  if (logs[category].length > MAX_LOGS) {
    logs[category] = logs[category].slice(-MAX_LOGS);
  }

  // In production: send to logging service (e.g., ELK, Datadog)
  if (category === 'errors' || category === 'security') {
    console.warn(`[${category.toUpperCase()}]`, logEntry);
  }
}

// Log API requests
function logAPIRequest(method, path, statusCode, duration, ip, userId = null) {
  addLog('api', {
    method,
    path,
    statusCode,
    duration,
    ip,
    userId,
  });
}

// Log authentication events
function logAuthEvent(event, email, ip, success = true, reason = null) {
  addLog('auth', {
    event, // 'login', 'register', 'logout', 'token_refresh', 'failed_login'
    email,
    ip,
    success,
    reason,
  });
}

// Log security events
function logSecurityEvent(event, details, severity = 'warning') {
  addLog('security', {
    event,
    details,
    severity, // 'info', 'warning', 'critical'
  });
}

// Log errors
function logError(error, context = {}) {
  addLog('errors', {
    message: error.message,
    stack: error.stack,
    context,
  });
}

// Get logs (filtered)
function getLogs(category, limit = 100) {
  if (!logs[category]) {
    return [];
  }

  return logs[category].slice(-limit);
}

// Clear old logs
function clearOldLogs(category, beforeDate) {
  if (!logs[category]) return;

  logs[category] = logs[category].filter(log => {
    return new Date(log.timestamp) >= beforeDate;
  });
}

// Export logs for analysis
function exportLogs(category) {
  return JSON.stringify(logs[category] || [], null, 2);
}

module.exports = {
  logAPIRequest,
  logAuthEvent,
  logSecurityEvent,
  logError,
  getLogs,
  clearOldLogs,
  exportLogs,
};
