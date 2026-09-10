const m208Service = require('../service');

describe('M208', () => {
  test('should get all items', async () => {
    const result = await m208Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m208Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});