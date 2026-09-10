const m325Service = require('../service');

describe('M325', () => {
  test('should get all items', async () => {
    const result = await m325Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m325Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});