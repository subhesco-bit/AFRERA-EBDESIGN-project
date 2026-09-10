const m163Service = require('../service');

describe('M163', () => {
  test('should get all items', async () => {
    const result = await m163Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m163Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});