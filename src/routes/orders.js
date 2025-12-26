const router = require('express').Router();
const orderQueue = require('../queue/order.queue');
const { validateOrder } = require('../services/validation.service');

router.post('/', async (req, res) => {
  try {
    validateOrder(req.body);
    await orderQueue.add('order', req.body);
    res.status(202).json({ status: 'queued' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
