const m202Service = require('../service');

describe('M202', () => {
  test('should get all items', async () => {
    const result = await m202Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m202Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});