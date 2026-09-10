const m296Service = require('../service');

describe('M296', () => {
  test('should get all items', async () => {
    const result = await m296Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m296Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});