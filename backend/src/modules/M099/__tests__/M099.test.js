const m099Service = require('../service');

describe('M099', () => {
  test('should get all items', async () => {
    const result = await m099Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m099Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});