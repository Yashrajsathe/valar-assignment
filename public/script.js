// API Configuration
const API_BASE = 'http://localhost:3000';

// Store recent orders
let recentOrders = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkServiceStatus();
    loadPartners();
    setupFormHandler();
    
    // Refresh status every 5 seconds
    setInterval(checkServiceStatus, 5000);
    // Refresh partners every 10 seconds
    setInterval(loadPartners, 10000);
});

// Check service health
async function checkServiceStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        updateStatusUI(true, data);
    } catch (error) {
        updateStatusUI(false, null);
        console.error('Health check failed:', error);
    }
}

// Update status UI
function updateStatusUI(isHealthy, data) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const uptime = document.getElementById('uptime');
    const serviceStatus = document.getElementById('serviceStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (isHealthy) {
        statusDot.classList.remove('inactive');
        statusDot.classList.add('active');
        statusText.textContent = 'Service Running';
        serviceStatus.textContent = '✓ UP';
        serviceStatus.style.color = '#28a745';
        
        if (data && data.uptime) {
            uptime.textContent = formatUptime(data.uptime);
        }
    } else {
        statusDot.classList.remove('active');
        statusDot.classList.add('inactive');
        statusText.textContent = 'Service Unavailable';
        serviceStatus.textContent = '✗ DOWN';
        serviceStatus.style.color = '#dc3545';
        uptime.textContent = '--';
    }
    
    lastUpdate.textContent = new Date().toLocaleTimeString();
}

// Format uptime
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Load partners
async function loadPartners() {
    const container = document.getElementById('partnersContainer');
    
    try {
        // Mock partners data (in real app, you'd fetch from API)
        const partners = [
            {
                id: 'partner-us',
                name: 'Partner US',
                countries: ['US'],
                skus: ['SKU-1', 'SKU-2'],
                capacity: 100,
                load: 10
            },
            {
                id: 'partner-in',
                name: 'Partner India',
                countries: ['IN'],
                skus: ['SKU-2', 'SKU-3'],
                capacity: 80,
                load: 20
            }
        ];
        
        container.innerHTML = partners.map(partner => {
            const loadPercent = (partner.load / partner.capacity) * 100;
            const capacityStatus = loadPercent > 80 ? 'critical' : loadPercent > 50 ? 'warning' : 'healthy';
            
            return `
                <div class="partner-card">
                    <h3>${partner.name}</h3>
                    <div class="partner-info">
                        <div>🌍 ${partner.countries.join(', ')}</div>
                        <div>📦 ${partner.skus.join(', ')}</div>
                        <div style="margin-top: 10px;">
                            <div style="font-size: 12px; margin-bottom: 5px;">
                                Load: ${partner.load}/${partner.capacity}
                            </div>
                            <div class="partner-bar">
                                <div class="partner-bar-fill" style="width: ${loadPercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('activePartners').textContent = partners.length;
        
    } catch (error) {
        console.error('Error loading partners:', error);
        container.innerHTML = '<p class="empty-state">Error loading partners</p>';
    }
}

// Setup form handler
function setupFormHandler() {
    const form = document.getElementById('orderForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const order = {
            orderId: document.getElementById('orderId').value,
            sku: document.getElementById('sku').value,
            country: document.getElementById('country').value,
            quantity: parseInt(document.getElementById('quantity').value),
            email: document.getElementById('email').value,
            timestamp: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });
            
            if (response.ok) {
                const result = await response.json();
                showSuccess(`Order ${order.orderId} submitted successfully!`);
                addRecentOrder(order);
                form.reset();
            } else {
                const error = await response.json();
                showError(`Error: ${error.error}`);
            }
        } catch (error) {
            showError(`Failed to submit order: ${error.message}`);
            console.error('Order submission error:', error);
        }
    });
}

// Show success message
function showSuccess(message) {
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = '✓ ' + message;
    successMsg.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 5000);
}

// Show error message
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = '✗ ' + message;
    errorMsg.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 5000);
}

// Add recent order
function addRecentOrder(order) {
    recentOrders.unshift({
        ...order,
        status: 'queued'
    });
    
    if (recentOrders.length > 10) {
        recentOrders.pop();
    }
    
    updateOrdersList();
}

// Update orders list
function updateOrdersList() {
    const container = document.getElementById('ordersContainer');
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<p class="empty-state">No orders yet</p>';
        document.getElementById('queuedOrders').textContent = '0';
        return;
    }
    
    container.innerHTML = recentOrders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <span class="order-id">${order.orderId}</span>
                <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <div class="order-detail-item">
                    <span class="order-detail-label">SKU:</span>
                    <span>${order.sku}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Country:</span>
                    <span>${order.country}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Qty:</span>
                    <span>${order.quantity}</span>
                </div>
                <div class="order-detail-item">
                    <span class="order-detail-label">Time:</span>
                    <span>${new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('queuedOrders').textContent = recentOrders.filter(o => o.status === 'queued').length;
}

// Initial load
loadPartners();
