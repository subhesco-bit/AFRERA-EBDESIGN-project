const m172Service = require('../service');

describe('M172', () => {
  test('should get all items', async () => {
    const result = await m172Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m172Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});