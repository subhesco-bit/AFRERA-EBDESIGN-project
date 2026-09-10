const m173Service = require('../service');

describe('M173', () => {
  test('should get all items', async () => {
    const result = await m173Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m173Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});