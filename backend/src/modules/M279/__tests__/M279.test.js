const m279Service = require('../service');

describe('M279', () => {
  test('should get all items', async () => {
    const result = await m279Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m279Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});