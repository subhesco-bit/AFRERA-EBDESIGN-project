const m254Service = require('../service');

describe('M254', () => {
  test('should get all items', async () => {
    const result = await m254Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m254Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});