// Real regression tests for H2 (IDOR fix): product mutation and form mutation
// must reject a non-owner, non-admin caller. Written because the pre-existing
// "unit" tests for these services (src/tests/unit/*.test.js,
// src/tests/marketplace.test.js) never actually call the real service code -
// they assert hardcoded objects against themselves. See FIXES.md C4.
const fs = require('fs');
const path = require('path');

describe('productService ownership enforcement (H2)', () => {
  let pgMock;

  beforeEach(() => {
    jest.resetModules();
    pgMock = { query: jest.fn() };
    jest.doMock('../database/connection', () => ({
      getPostgreSQL: () => pgMock
    }));
  });

  afterEach(() => {
    jest.dontMock('../database/connection');
  });

  function loadProductService() {
    return require('../services/productService');
  }

  it('rejects update from a user who does not own the product', async () => {
    pgMock.query.mockResolvedValueOnce({ rows: [{ created_by: 'owner-1' }] });
    const { updateProduct } = loadProductService();

    await expect(
      updateProduct('prod-1', { name: 'Hacked' }, { id: 'attacker-2', role: 'consumer' })
    ).rejects.toMatchObject({ status: 403 });

    // Only the ownership SELECT should have run - the UPDATE must never fire.
    expect(pgMock.query).toHaveBeenCalledTimes(1);
  });

  it('rejects update with no authenticated user at all', async () => {
    pgMock.query.mockResolvedValueOnce({ rows: [{ created_by: 'owner-1' }] });
    const { updateProduct } = loadProductService();

    await expect(
      updateProduct('prod-1', { name: 'Hacked' }, undefined)
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns 404 when the product does not exist', async () => {
    pgMock.query.mockResolvedValueOnce({ rows: [] });
    const { updateProduct } = loadProductService();

    await expect(
      updateProduct('does-not-exist', { name: 'X' }, { id: 'owner-1', role: 'consumer' })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('allows update from the actual owner', async () => {
    pgMock.query
      .mockResolvedValueOnce({ rows: [{ created_by: 'owner-1' }] }) // ownership check
      .mockResolvedValueOnce({ rows: [{ id: 'prod-1', name: 'Updated' }] }); // the UPDATE
    const { updateProduct } = loadProductService();

    const result = await updateProduct('prod-1', { name: 'Updated' }, { id: 'owner-1', role: 'consumer' });
    expect(result.name).toBe('Updated');
    expect(pgMock.query).toHaveBeenCalledTimes(2);
  });

  it('allows an admin to update a product they do not own', async () => {
    pgMock.query.mockResolvedValueOnce({ rows: [{ id: 'prod-1', name: 'Updated by admin' }] });
    const { updateProduct } = loadProductService();

    const result = await updateProduct('prod-1', { name: 'Updated by admin' }, { id: 'admin-1', role: 'admin' });
    expect(result.name).toBe('Updated by admin');
    // Admin path skips the ownership SELECT entirely - only the UPDATE runs.
    expect(pgMock.query).toHaveBeenCalledTimes(1);
  });

  it('rejects delete from a non-owner', async () => {
    pgMock.query.mockResolvedValueOnce({ rows: [{ created_by: 'owner-1' }] });
    const { deleteProduct } = loadProductService();

    await expect(
      deleteProduct('prod-1', { id: 'attacker-2', role: 'consumer' })
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('formService ownership enforcement (H2)', () => {
  const storePath = path.join(__dirname, '..', 'database', 'form_store.json');
  let formService;

  beforeEach(() => {
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
    jest.resetModules();
    // Force the file-store path (no Postgres) so this test is self-contained,
    // matching how formService.test.js already exercises it.
    jest.doMock('../database/connection', () => ({
      getPostgreSQL: () => null
    }));
    formService = require('../services/formService');
  });

  afterEach(() => {
    jest.dontMock('../database/connection');
    if (fs.existsSync(storePath)) {
      fs.unlinkSync(storePath);
    }
  });

  it('records the creator server-side, ignoring any client-supplied owner', async () => {
    const form = await formService.createForm(
      { title: 'T', metadata: { owner: 'spoofed-owner' } },
      { id: 'user-1', role: 'consumer' }
    );
    expect(form.metadata.createdByUserId).toBe('user-1');
  });

  it('rejects update from a user who did not create the form', async () => {
    const form = await formService.createForm({ title: 'T' }, { id: 'user-1', role: 'consumer' });

    await expect(
      formService.updateForm(form.id, { title: 'Hacked' }, { id: 'user-2', role: 'consumer' })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows update from the creator', async () => {
    const form = await formService.createForm({ title: 'T' }, { id: 'user-1', role: 'consumer' });

    const updated = await formService.updateForm(form.id, { title: 'Updated' }, { id: 'user-1', role: 'consumer' });
    expect(updated.title).toBe('Updated');
  });

  it('allows an admin to delete a form they did not create', async () => {
    const form = await formService.createForm({ title: 'T' }, { id: 'user-1', role: 'consumer' });

    const result = await formService.deleteForm(form.id, { id: 'admin-1', role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('fails closed (admin-only) for a legacy form with no recorded owner', async () => {
    const form = await formService.createForm({ title: 'Legacy' }, undefined);
    expect(form.metadata.createdByUserId).toBeNull();

    await expect(
      formService.deleteForm(form.id, { id: 'user-1', role: 'consumer' })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('returns 404 for a form that does not exist', async () => {
    await expect(
      formService.updateForm('no-such-form', { title: 'X' }, { id: 'user-1', role: 'consumer' })
    ).rejects.toMatchObject({ status: 404 });
  });
});
