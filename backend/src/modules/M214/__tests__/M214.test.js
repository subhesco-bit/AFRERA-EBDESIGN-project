const m214Service = require('../service');

describe('M214', () => {
  test('should get all items', async () => {
    const result = await m214Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m214Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});