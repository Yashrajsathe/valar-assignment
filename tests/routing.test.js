const { routeOrder } = require('../src/services/routing.service');

test('routes valid order', () => {
  const order = { sku: 'SKU-1', country: 'US' };
  const partner = routeOrder(order);
  expect(partner).toBeDefined();
});
