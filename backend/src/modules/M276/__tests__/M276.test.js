const m276Service = require('../service');

describe('M276', () => {
  test('should get all items', async () => {
    const result = await m276Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m276Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});