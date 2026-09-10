const m095Service = require('../service');

describe('M095', () => {
  test('should get all items', async () => {
    const result = await m095Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m095Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});