const m283Service = require('../service');

describe('M283', () => {
  test('should get all items', async () => {
    const result = await m283Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m283Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});