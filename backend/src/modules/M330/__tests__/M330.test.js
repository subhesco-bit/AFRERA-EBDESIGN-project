const m330Service = require('../service');

describe('M330', () => {
  test('should get all items', async () => {
    const result = await m330Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m330Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});