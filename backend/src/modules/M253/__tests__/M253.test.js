const m253Service = require('../service');

describe('M253', () => {
  test('should get all items', async () => {
    const result = await m253Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m253Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});