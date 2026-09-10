const m062Service = require('../service');

describe('M062', () => {
  test('should get all items', async () => {
    const result = await m062Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m062Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});