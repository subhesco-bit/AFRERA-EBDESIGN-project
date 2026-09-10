const m209Service = require('../service');

describe('M209', () => {
  test('should get all items', async () => {
    const result = await m209Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m209Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});