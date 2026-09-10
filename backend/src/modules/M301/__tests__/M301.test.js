const m301Service = require('../service');

describe('M301', () => {
  test('should get all items', async () => {
    const result = await m301Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m301Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});