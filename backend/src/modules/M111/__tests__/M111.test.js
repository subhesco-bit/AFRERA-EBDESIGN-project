const m111Service = require('../service');

describe('M111', () => {
  test('should get all items', async () => {
    const result = await m111Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m111Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});