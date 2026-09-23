'use strict';
class AppDataError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppDataError';
    this.code = code;
  }
}

class ReadinessError extends AppDataError {
  constructor(message) {
    super(message, 'READINESS_ERROR');
    this.name = 'ReadinessError';
  }
}

class LoginError extends AppDataError {
  constructor(message) {
    super(message, 'LOGIN_ERROR');
    this.name = 'LoginError';
  }
}

class StateError extends AppDataError {
  constructor(message) {
    super(message, 'STATE_ERROR');
    this.name = 'StateError';
  }
}

module.exports = { AppDataError, ReadinessError, LoginError, StateError };
