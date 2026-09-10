const m222Service = require('../service');

describe('M222', () => {
  test('should get all items', async () => {
    const result = await m222Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m222Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});