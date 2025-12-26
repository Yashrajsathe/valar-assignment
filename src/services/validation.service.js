function validateOrder(order) {
  if (!order.id || !order.sku || !order.country) {
    throw new Error('Invalid order payload');
  }
}

module.exports = { validateOrder };
