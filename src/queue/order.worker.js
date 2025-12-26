require('dotenv').config();
const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { routeOrder } = require('../services/routing.service');
const axios = require('axios');

new Worker(
  'order-queue',
  async job => {
    const partner = routeOrder(job.data);
    await axios.post(partner.endpoint, job.data);
    return { partner: partner.id };
  },
  { connection: redis }
);
