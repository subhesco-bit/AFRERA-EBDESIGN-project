const m188Service = require('../service');

describe('M188', () => {
  test('should get all items', async () => {
    const result = await m188Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m188Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});