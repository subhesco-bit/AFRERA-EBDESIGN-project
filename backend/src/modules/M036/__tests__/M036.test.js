const m036Service = require('../service');

describe('M036', () => {
  test('should get all items', async () => {
    const result = await m036Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m036Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});