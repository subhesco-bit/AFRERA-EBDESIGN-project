const m054Service = require('../service');

describe('M054', () => {
  test('should get all items', async () => {
    const result = await m054Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m054Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});