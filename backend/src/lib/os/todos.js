'use strict';
/** Derived work list. Classification is the TODO. Completion needs runtime.
 * Ported from pine-shadow src/lib/os/todos.ts */

const { OS_ITEMS } = require('./catalog');

function osTodos() {
  return OS_ITEMS.map((x) => ({ id: `todo-${x.id}`, itemId: x.id, stage: x.stage, title: x.name, status: x.todo, why: x.missing, exit: x.next }));
}

function remainingWork(limit = 12) {
  const rows = osTodos().filter((t) => t.status !== 'done');
  const open = rows.filter((t) => t.status === 'open');
  const blocked = rows.filter((t) => t.status === 'blocked');
  return [...open, ...blocked].sort((a, b) => a.stage - b.stage || a.itemId.localeCompare(b.itemId)).slice(0, limit);
}

function todosByStage(stage) {
  return osTodos().filter((t) => t.stage === stage);
}

function todoCounts(status) {
  const rows = status ? osTodos().filter((t) => t.status === status) : osTodos();
  return { total: rows.length, done: rows.filter((t) => t.status === 'done').length, open: rows.filter((t) => t.status === 'open').length, blocked: rows.filter((t) => t.status === 'blocked').length };
}

module.exports = { osTodos, remainingWork, todosByStage, todoCounts };
