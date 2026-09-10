const m137Service = require('../service');

describe('M137', () => {
  test('should get all items', async () => {
    const result = await m137Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m137Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});