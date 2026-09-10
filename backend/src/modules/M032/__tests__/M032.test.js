const m032Service = require('../service');

describe('M032', () => {
  test('should get all items', async () => {
    const result = await m032Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m032Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});