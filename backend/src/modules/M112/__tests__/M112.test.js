const m112Service = require('../service');

describe('M112', () => {
  test('should get all items', async () => {
    const result = await m112Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m112Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});