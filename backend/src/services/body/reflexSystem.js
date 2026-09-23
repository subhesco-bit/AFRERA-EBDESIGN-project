/**
 * Reflex System - Event-Driven Immediate Responses
 * No deliberation, instant action on events
 */

'use strict';

const EventEmitter = require('events');

class ReflexSystem extends EventEmitter {
  constructor(actionExecutor) {
    super();
    this.reflexes = new Map();
    this.actionExecutor = actionExecutor;
    this.logs = [];
  }

  registerReflex(event, reflex) {
    if (!this.reflexes.has(event)) {
      this.reflexes.set(event, []);
    }
    this.reflexes.get(event).push({
      id: reflex.id,
      action: reflex.action,
      handler: reflex.handler,
      createdAt: new Date(),
    });
    this.on(event, (data) => this._trigger(event, reflex, data));
  }

  async _trigger(event, reflex, data) {
    const log = {
      timestamp: new Date(),
      event,
      reflexId: reflex.id,
      action: reflex.action,
      triggered: true,
    };

    try {
      if (this.actionExecutor && reflex.action) {
        await this.actionExecutor.execute(reflex.action, data, {defer: false});
      } else if (reflex.handler) {
        await reflex.handler(data);
      }
      log.status = 'success';
    } catch (e) {
      log.status = 'failed';
      log.error = e.message;
    }

    this.logs.push(log);
    if (this.logs.length > 200) this.logs.shift();
  }

  trigger(event, data) {
    this.emit(event, data);
  }

  getLogs(event, limit = 50) {
    const filtered = event ? this.logs.filter(l => l.event === event) : this.logs;
    return filtered.slice(-limit);
  }

  getReflexCount() {
    let count = 0;
    for (const reflexes of this.reflexes.values()) {
      count += reflexes.length;
    }
    return count;
  }
}

module.exports = { ReflexSystem };
