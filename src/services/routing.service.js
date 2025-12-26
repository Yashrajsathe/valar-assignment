const partners = require('../config/partners');

function routeOrder(order) {
  const available = partners.filter(p =>
    p.countries.includes(order.country) &&
    p.skus.includes(order.sku) &&
    p.load < p.capacity
  );

  if (!available.length) {
    throw new Error('No eligible fulfillment partner');
  }

  return available.sort((a, b) => a.load - b.load)[0];
}

module.exports = { routeOrder };
