const m250Service = require('../service');

describe('M250', () => {
  test('should get all items', async () => {
    const result = await m250Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m250Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});