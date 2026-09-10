const m161Service = require('../service');

describe('M161', () => {
  test('should get all items', async () => {
    const result = await m161Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m161Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});