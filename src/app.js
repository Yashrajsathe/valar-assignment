const express = require('express');
const path = require('path');
const orderRoutes = require('./routes/orders');
const healthRoutes = require('./routes/health');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/orders', orderRoutes);
app.use('/health', healthRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
