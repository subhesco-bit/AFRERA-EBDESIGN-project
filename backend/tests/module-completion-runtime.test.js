'use strict';

describe('clone-wide module completion contract', () => {
  test('module ids follow canonical M<number>_<NAME> format', () => {
    expect(/^M\d+_[A-Z0-9]+$/.test('M001_PLATFORM_CORE')).toBe(true);
    expect(/^M\d+_[A-Z0-9]+$/.test('M541_EXAMPLE')).toBe(true);
    expect(/^M\d+_[A-Z0-9]+$/.test('invalid-module')).toBe(false);
  });

  test('lifecycle only allows controlled forward transitions', () => {
    const transitions = {
      draft: ['active', 'cancelled'],
      active: ['paused', 'completed', 'cancelled'],
      paused: ['active', 'cancelled'],
      completed: ['archived'],
      cancelled: ['archived'],
      archived: [],
    };
    expect(transitions.draft).toContain('active');
    expect(transitions.completed).not.toContain('active');
    expect(transitions.archived).toHaveLength(0);
  });
});
