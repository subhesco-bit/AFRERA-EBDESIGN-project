const m298Service = require('../service');

describe('M298', () => {
  test('should get all items', async () => {
    const result = await m298Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m298Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});