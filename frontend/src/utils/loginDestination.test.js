import { loginDestination } from './loginDestination';

describe('post-login destination', () => {
  test('preserves the service, query and selected section', () => {
    expect(loginDestination('/farmer-sell?crop=rice#listing')).toBe('/farmer-sell?crop=rice#listing');
    expect(loginDestination({ pathname: '/farmer-field', search: '?id=2', hash: '#soil' })).toBe('/farmer-field?id=2#soil');
  });
  test.each([undefined, null, {}, 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com', '/login', '/login/?next=x', '/register#form'])('rejects unsafe or looping destination %s', target => {
    expect(loginDestination(target, '/farmer-portal')).toBe('/farmer-portal');
  });
});
