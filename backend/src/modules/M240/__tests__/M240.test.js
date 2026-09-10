const m240Service = require('../service');

describe('M240', () => {
  test('should get all items', async () => {
    const result = await m240Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m240Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});