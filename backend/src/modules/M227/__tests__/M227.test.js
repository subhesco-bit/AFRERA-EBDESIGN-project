const m227Service = require('../service');

describe('M227', () => {
  test('should get all items', async () => {
    const result = await m227Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m227Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});