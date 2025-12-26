module.exports = [
  {
    id: 'partner-us',
    countries: ['US'],
    skus: ['SKU-1', 'SKU-2'],
    capacity: 100,
    load: 10,
    endpoint: 'http://localhost:4000/partner-us'
  },
  {
    id: 'partner-in',
    countries: ['IN'],
    skus: ['SKU-2', 'SKU-3'],
    capacity: 80,
    load: 20,
    endpoint: 'http://localhost:4000/partner-in'
  }
];

