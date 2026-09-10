const m221Service = require('../service');

describe('M221', () => {
  test('should get all items', async () => {
    const result = await m221Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m221Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});