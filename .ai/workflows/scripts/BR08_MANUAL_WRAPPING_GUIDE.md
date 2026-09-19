# BR-08 Manual Transaction Wrapping Guide

**Status:** Ready for manual implementation  
**Priority:** High (money/identity/sync/lifecycle operations)  
**Total functions:** 7 high-priority  
**Approach:** Manual wrapping (not automated, for safety)

## Why manual?

Transaction wrapping is critical for data consistency. Automated scripts can break function signatures or miss context-specific concerns. For only 7 functions, manual review + wrapping is safer and faster.

## The Pattern

**Before:**
```javascript
async transferFunds(fromId, toId, amount) {
  const debitQuery = `UPDATE accounts SET balance = balance - $1 WHERE id = $2`;
  await this.pool.query(debitQuery, [amount, fromId]);
  
  const creditQuery = `UPDATE accounts SET balance = balance + $1 WHERE id = $2`;
  await this.pool.query(creditQuery, [amount, toId]);
}
```

**After (with withTransaction):**
```javascript
async transferFunds(fromId, toId, amount) {
  return withTransaction(async (client) => {
    const debitQuery = `UPDATE accounts SET balance = balance - $1 WHERE id = $2`;
    await client.query(debitQuery, [amount, fromId]);
    
    const creditQuery = `UPDATE accounts SET balance = balance + $1 WHERE id = $2`;
    await client.query(creditQuery, [amount, toId]);
  });
}
```

**Key points:**
1. Wrap the function BODY (not the signature)
2. The `withTransaction()` helper handles BEGIN/COMMIT/ROLLBACK
3. Pass `client` parameter or use via closure (check `core/withTransaction.js` for API)
4. Replace all `this.pool.query()` calls with `client.query()` within the transaction block
5. Keep return statements as-is; transaction wrapper handles the result

## Functions to Wrap (in priority order)

### 1. `src/services/paymentService.js` :: `transferFunds()`
- **Lines:** ~170-199
- **Queries:** 2 (debit, credit)
- **Category:** MONEY (critical)
- **Risk:** High — double-entry bookkeeping must be atomic

### 2. `src/services/commerce/bulkOrderService.js` :: `createBulkOrderRequest()`
- **Lines:** ~18-78
- **Queries:** 2+ (product lookup, order creation)
- **Category:** LIFECYCLE (medium)
- **Risk:** Medium — order state must be consistent

### 3. `src/services/commerce/bulkOrderService.js` :: `convertQuotationToOrder()`
- **Lines:** ~339-394
- **Queries:** 3+ (quotation update, order insert, inventory check)
- **Category:** LIFECYCLE (medium)
- **Risk:** Medium — quotation-to-order transition must be atomic

### 4. `src/services/legacy/bulkOrderService.js` :: `createBulkOrderRequest()`
- **Lines:** ~18-78
- **Queries:** 2+ (duplicate of #2, different file)
- **Category:** LIFECYCLE (medium)
- **Risk:** Medium — same as #2

### 5. `src/services/legacy/bulkOrderService.js` :: `convertQuotationToOrder()`
- **Lines:** ~356-411
- **Queries:** 3+ (duplicate of #3, different file)
- **Category:** LIFECYCLE (medium)
- **Risk:** Medium — same as #3

### 6. `src/services/legacy/identityManagementService.js` :: `list()`
- **Lines:** ~60-87
- **Queries:** 2 (count, select)
- **Category:** IDENTITY (low-medium)
- **Risk:** Low — count/list is typically okay without transaction, but may be updating state

### 7. `src/services/userManagementService.js` :: `getUsers()`
- **Lines:** ~82-144
- **Queries:** 2+ (possibly filtering + status updates)
- **Category:** IDENTITY (low-medium)
- **Risk:** Low — depends on what the 2+ queries are doing

## Implementation Steps

For each function:

1. **Open the file** and locate the function
2. **Read the entire function** to understand what the queries are doing
3. **Verify:** Are all queries logically dependent? (If some can fail independently, maybe don't wrap)
4. **Check:** Does the function already use `withTransaction`? If yes, skip.
5. **Wrap:** Replace `this.pool.query()` with `client.query()` inside the `withTransaction()` closure
6. **Verify imports:** Ensure `withTransaction` is imported from `core/withTransaction.js`
7. **Test:** Run `npm test` (if tests exist) or `node -c` to verify syntax

## Verification Checklist

After wrapping each function:

- [ ] Syntax check: `node -c src/services/XXX.js`
- [ ] Import check: Does the file import `withTransaction`?
- [ ] Closure check: Are all dependent queries inside the transaction block?
- [ ] Bootstrap check: Does backend boot? `timeout 8 node -e "require('./src/index.js')"`
- [ ] No duplicates: Are there two copies (flat + legacy/)? Wrap both or prefer one?

## Notes

- **Flat vs. Legacy duplicates:** Functions #2/#4 and #3/#5 are duplicates (flat + legacy/). Consider which one is actually live via grep. If both are live, wrap both. If only one, wrap just that one.
- **Transaction scope:** Keep transactions small. Only include the queries that MUST be atomic together.
- **Error handling:** `withTransaction` handles rollback on error, but callers still need to handle the error result.

## Commit Message Template

```
fix: wrap high-priority multi-statement writes in transactions (BR-08)

Applied withTransaction() wrapper to 7 functions:
- paymentService.transferFunds() [money]
- bulkOrderService.createBulkOrderRequest() x2 [lifecycle]
- bulkOrderService.convertQuotationToOrder() x2 [lifecycle]
- identityManagementService.list() [identity]
- userManagementService.getUsers() [identity]

Each function now wraps multi-statement writes that must be atomic.
Tested: backend boots clean, syntax check passed, spot-verified wrapping.

Co-Authored-By: [Your name] <email>
```
