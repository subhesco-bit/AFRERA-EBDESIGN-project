const m242Service = require('../service');

describe('M242', () => {
  test('should get all items', async () => {
    const result = await m242Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m242Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});