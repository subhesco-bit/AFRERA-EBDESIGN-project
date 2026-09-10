const m091Service = require('../service');

describe('M091', () => {
  test('should get all items', async () => {
    const result = await m091Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m091Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});