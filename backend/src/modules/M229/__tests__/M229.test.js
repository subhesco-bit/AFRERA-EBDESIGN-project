const m229Service = require('../service');

describe('M229', () => {
  test('should get all items', async () => {
    const result = await m229Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m229Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});