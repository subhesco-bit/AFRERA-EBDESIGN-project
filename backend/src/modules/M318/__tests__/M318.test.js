const m318Service = require('../service');

describe('M318', () => {
  test('should get all items', async () => {
    const result = await m318Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m318Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});