const m126Service = require('../service');

describe('M126', () => {
  test('should get all items', async () => {
    const result = await m126Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m126Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});