const m259Service = require('../service');

describe('M259', () => {
  test('should get all items', async () => {
    const result = await m259Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m259Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});