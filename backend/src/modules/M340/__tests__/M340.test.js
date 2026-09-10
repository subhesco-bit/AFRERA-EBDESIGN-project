const m340Service = require('../service');

describe('M340', () => {
  test('should get all items', async () => {
    const result = await m340Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m340Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});