const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE;
const PRODUCT_BASE = process.env.NEXT_PUBLIC_PRODUCT_BASE;
const ORDER_BASE = process.env.NEXT_PUBLIC_ORDER_BASE;

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function apiRequest(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }

  return data;
}

export const api = {
  // Product endpoints
  async getProducts() {
    return apiRequest(`${PRODUCT_BASE}/products/`);
  },

  async getProduct(id: number) {
    return apiRequest(`${PRODUCT_BASE}/products/${id}`);
  },

  async createProduct(product: any) {
    return apiRequest(`${PRODUCT_BASE}/products/`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: number, product: any) {
    return apiRequest(`${PRODUCT_BASE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: number) {
    return apiRequest(`${PRODUCT_BASE}/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Order endpoints
  async getMyOrders() {
    return apiRequest(`${ORDER_BASE}/orders/`);
  },

  async getAllOrders() {
    return apiRequest(`${ORDER_BASE}/orders/all`);
  },

  async getOrder(id: number) {
    return apiRequest(`${ORDER_BASE}/orders/${id}`);
  },

  async placeOrder(items: any[]) {
    return apiRequest(`${ORDER_BASE}/orders/`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async cancelOrder(id: number) {
    return apiRequest(`${ORDER_BASE}/orders/${id}/cancel`, {
      method: 'PUT',
    });
  },

  async updateOrderStatus(id: number, status: string) {
    return apiRequest(`${ORDER_BASE}/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Analytics endpoints
  async getSalesSummary(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/sales-summary?${params}`);
  },

  async getTopProducts(window = 30, limit = 10, metric: 'revenue' | 'quantity' = 'revenue') {
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/top-products?window=${window}&limit=${limit}&metric=${metric}`);
  },

  async getConversionFunnel(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/conversion-funnel?${params}`);
  },

  async getForecast(horizon = 14) {
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/forecast?horizon=${horizon}`);
  },

  async rebuildForecast(horizon = 14, lookback = 30) {
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/forecast/rebuild?horizon=${horizon}&lookback=${lookback}`, {
      method: 'POST'
    });
  },

  async getSalesReport(group: 'day' | 'week' | 'month', from?: string, to?: string) {
    const params = new URLSearchParams();
    params.set('group', group);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/reports/sales?${params}`);
  },

  async getStockStatus(lowThreshold = 5, window = 30) {
    return apiRequest(`${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/stock/status?low_threshold=${lowThreshold}&window=${window}`);
  },

  // CSV export URL
  getSalesReportCSV(group: 'day' | 'week' | 'month', from?: string, to?: string) {
    const params = new URLSearchParams();
    params.set('group', group);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return `${process.env.NEXT_PUBLIC_ANALYTICS_BASE}/analytics/reports/sales.csv?${params}`;
  }
};