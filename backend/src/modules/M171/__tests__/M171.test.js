const m171Service = require('../service');

describe('M171', () => {
  test('should get all items', async () => {
    const result = await m171Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m171Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});