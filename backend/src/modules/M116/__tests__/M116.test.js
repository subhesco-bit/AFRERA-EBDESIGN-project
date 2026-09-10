const m116Service = require('../service');

describe('M116', () => {
  test('should get all items', async () => {
    const result = await m116Service.getAll();
    expect(result).toHaveProperty('data');
  });

  test('should create item', async () => {
    const result = await m116Service.create({ user_id: 'test' });
    expect(result).toHaveProperty('id');
  });
});