const m187Service = require('../service');

describe('M187', () => {
  test('should get all items', async () => {
    const result = await m187Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m187Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});