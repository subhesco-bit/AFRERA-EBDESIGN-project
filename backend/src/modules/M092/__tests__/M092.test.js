const m092Service = require('../service');

describe('M092', () => {
  test('should get all items', async () => {
    const result = await m092Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m092Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});