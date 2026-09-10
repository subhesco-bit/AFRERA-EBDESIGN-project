const m164Service = require('../service');

describe('M164', () => {
  test('should get all items', async () => {
    const result = await m164Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m164Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});