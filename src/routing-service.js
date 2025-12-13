/**
 * Routing Service for SnapFulfil Assignment
 *
 * Implements the core business logic for routing orders to fulfillment partners
 * based on currency, SKUs, item count, and volume caps.
 */

class RoutingService {
  constructor() {
    // F3 refill SKUs (single item, quantity 1 only)
    this.f3Skus = ['REFILL-001', 'REFILL-002', 'REFILL-003'];

    // US SKUs (route to F-US)
    this.usSkus = ['US-STARTER-001', 'US-REFILL-001'];

    // Volume caps (configurable)
    this.volumeCaps = {
      F2: parseInt(process.env.F2_DAILY_CAP) || 100,
      F3: parseInt(process.env.F3_DAILY_CAP) || 50,
      F1: process.env.F1_DAILY_CAP === 'unlimited' ? Infinity : parseInt(process.env.F1_DAILY_CAP) || Infinity,
      'F-US': process.env.F_US_DAILY_CAP === 'unlimited' ? Infinity : parseInt(process.env.F_US_DAILY_CAP) || Infinity
    };

    // Redis client will be initialized later
    this.redis = null;
  }

  /**
   * Set Redis client for volume tracking
   * @param {Object} redisClient - Redis client instance
   */
  setRedisClient(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Determine which partner should fulfill an order
   * @param {Object} orderData - Shopify order data
   * @returns {Object} - { partner: string, reason: string }
   */
  async determinePartner(orderData) {
    try {
      // Validate input
      if (!orderData || !orderData.line_items || !Array.isArray(orderData.line_items)) {
        throw new Error('Invalid order data: missing or invalid line_items');
      }

      // 1. Check if US order (USD currency AND contains US SKUs)
      if (this.isUSOrder(orderData)) {
        return { partner: 'F-US', reason: 'us_order' };
      }

      // 2. Check if single F3 refill SKU
      if (this.isF3Order(orderData)) {
        return { partner: 'F3', reason: 'refill_sku' };
      }

      // 3. Check if multi-item order
      if (this.isMultiItemOrder(orderData)) {
        return { partner: 'F1', reason: 'multi_item' };
      }

      // 4. Default to F2 for single UK/EU items
      return { partner: 'F2', reason: 'single_item_default' };

    } catch (error) {
      console.error('Routing error:', error);
      return { partner: 'F1', reason: 'error_fallback' };
    }
  }

  /**
   * Check if order is a US order (USD currency + US SKUs)
   * @param {Object} orderData - Order data
   * @returns {boolean}
   */
  isUSOrder(orderData) {
    // Check currency
    if (orderData.presentment_currency !== 'USD') {
      return false;
    }

    // Check if any line item has US SKU
    return orderData.line_items.some(item =>
      this.usSkus.includes(item.sku)
    );
  }

  /**
   * Check if order is a single F3 refill SKU
   * @param {Object} orderData - Order data
   * @returns {boolean}
   */
  isF3Order(orderData) {
    // Must be single item
    if (orderData.line_items.length !== 1) {
      return false;
    }

    const item = orderData.line_items[0];

    // Must be F3 SKU and quantity 1
    return this.f3Skus.includes(item.sku) && item.quantity === 1;
  }

  /**
   * Check if order has multiple items
   * @param {Object} orderData - Order data
   * @returns {boolean}
   */
  isMultiItemOrder(orderData) {
    return orderData.line_items.length > 1;
  }

  /**
   * Check if partner is at volume capacity
   * @param {string} partner - Partner name
   * @returns {boolean}
   */
  async isAtCapacity(partner) {
    if (!this.redis) {
      return false; // No Redis, assume not at capacity
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `volume:${partner}:${today}`;

      const currentVolume = await this.redis.get(key);
      const volume = currentVolume ? parseInt(currentVolume) : 0;

      return volume >= this.volumeCaps[partner];
    } catch (error) {
      console.error('Volume check error:', error);
      return false; // On error, assume not at capacity
    }
  }

  /**
   * Increment volume counter for partner
   * @param {string} partner - Partner name
   */
  async incrementVolume(partner) {
    if (!this.redis) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `volume:${partner}:${today}`;

      await this.redis.incr(key);
    } catch (error) {
      console.error('Volume increment error:', error);
    }
  }

  /**
   * Get current volume for partner
   * @param {string} partner - Partner name
   * @returns {number}
   */
  async getCurrentVolume(partner) {
    if (!this.redis) {
      return 0;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `volume:${partner}:${today}`;

      const volume = await this.redis.get(key);
      return volume ? parseInt(volume) : 0;
    } catch (error) {
      console.error('Volume get error:', error);
      return 0;
    }
  }
}

module.exports = {
  RoutingService
};
