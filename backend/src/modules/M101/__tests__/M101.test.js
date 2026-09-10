const m101Service = require('../service');

describe('M101', () => {
  test('should get all items', async () => {
    const result = await m101Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m101Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});