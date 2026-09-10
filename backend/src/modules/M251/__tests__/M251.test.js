const m251Service = require('../service');

describe('M251', () => {
  test('should get all items', async () => {
    const result = await m251Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m251Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});