const m210Service = require('../service');

describe('M210', () => {
  test('should get all items', async () => {
    const result = await m210Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m210Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});