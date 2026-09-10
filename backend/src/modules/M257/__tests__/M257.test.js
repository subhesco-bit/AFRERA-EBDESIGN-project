const m257Service = require('../service');

describe('M257', () => {
  test('should get all items', async () => {
    const result = await m257Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m257Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});