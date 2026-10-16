import { INITIAL_DEMO_PRODUCTS } from '../data/demoData';

const LOCAL_STORAGE_KEY_PRODUCTS = 'campus_hub_products_v1';
const LOCAL_STORAGE_KEY_ORDERS = 'campus_hub_orders_v1';

// Check if localStorage has products; if not, seed with demo products
function getLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PRODUCTS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
      return INITIAL_DEMO_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
      return INITIAL_DEMO_PRODUCTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading localStorage products:', err);
    return INITIAL_DEMO_PRODUCTS;
  }
}

function saveLocalProducts(products) {
  localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders) {
  localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));
}

// Local analytics calculation
function computeLocalAnalytics(products, orders) {
  const total_valuation = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
  const total_sales_today = todayOrders.reduce((acc, o) => acc + (o.grand_total || 0), 0);
  
  const critical_products = products.filter(p => p.stock <= p.min_threshold);
  
  return {
    total_valuation: Number(total_valuation.toFixed(2)),
    total_sales_today: Number(total_sales_today.toFixed(2)),
    critical_stock_count: critical_products.length,
    total_products: products.length,
    critical_products,
  };
}

let isBackendAvailable = null;

// Probe FastAPI backend
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      isBackendAvailable = true;
      return true;
    }
    isBackendAvailable = false;
    return false;
  } catch {
    isBackendAvailable = false;
    return false;
  }
}

export const apiService = {
  async isOnline() {
    if (isBackendAvailable === null) {
      return await checkBackendStatus();
    }
    return isBackendAvailable;
  },

  async getProducts(params = {}) {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.category && params.category !== 'All') query.append('category', params.category);
        const res = await fetch(`/api/products?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        const data = await res.json();
        return { data, source: 'FastAPI' };
      } catch (e) {
        console.warn('Backend fetch failed, falling back to local storage', e);
      }
    }

    // Local fallback
    let products = getLocalProducts();
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(
        p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    if (params.category && params.category !== 'All') {
      products = products.filter(
        p => p.category.toLowerCase() === params.category.toLowerCase()
      );
    }
    const withLowStock = products.map(p => ({
      ...p,
      is_low_stock: p.stock <= p.min_threshold,
    }));
    return { data: withLowStock, source: 'Offline Storage' };
  },

  async createProduct(productData) {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to create product');
        }
        return await res.json();
      } catch (e) {
        console.warn('FastAPI creation failed, trying local', e);
        if (e.message && e.message.includes('already exists')) throw e;
      }
    }

    // Local fallback
    const products = getLocalProducts();
    if (products.some(p => p.sku.toUpperCase() === productData.sku.toUpperCase().trim())) {
      throw new Error(`Product with SKU '${productData.sku}' already exists.`);
    }

    const newProduct = {
      id: Date.now(),
      sku: productData.sku.trim().toUpperCase(),
      name: productData.name.trim(),
      category: productData.category.trim(),
      price: Number(parseFloat(productData.price).toFixed(2)),
      stock: parseInt(productData.stock, 10),
      min_threshold: parseInt(productData.min_threshold, 10),
      is_low_stock: parseInt(productData.stock, 10) <= parseInt(productData.min_threshold, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    products.push(newProduct);
    saveLocalProducts(products);
    return newProduct;
  },

  async restockProduct(productId, amount) {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const res = await fetch(`/api/products/${productId}/restock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseInt(amount, 10) }),
        });
        if (!res.ok) throw new Error('Restock failed on server');
        return await res.json();
      } catch (e) {
        console.warn('Backend restock failed, falling back to local', e);
      }
    }

    // Local fallback
    const products = getLocalProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error('Product not found');

    products[idx].stock += parseInt(amount, 10);
    products[idx].updated_at = new Date().toISOString();
    products[idx].is_low_stock = products[idx].stock <= products[idx].min_threshold;
    saveLocalProducts(products);
    return products[idx];
  },

  async checkout({ items, discount_type = 'fixed', discount_value = 0 }) {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            discount_type,
            discount_value: parseFloat(discount_value) || 0,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Checkout failed on server');
        }
        return await res.json();
      } catch (e) {
        console.warn('Backend checkout failed, falling back to local', e);
        if (e.message && e.message.includes('Insufficient stock')) throw e;
      }
    }

    // Local fallback checkout
    const products = getLocalProducts();
    const orders = getLocalOrders();

    // 1. Validate stocks
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      if (!prod) throw new Error(`Product ID ${item.product_id} not found.`);
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for '${prod.name}'. Available: ${prod.stock}, Requested: ${item.quantity}`);
      }
    }

    // 2. Compute financial totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id);
      const line_total = Number((prod.price * item.quantity).toFixed(2));
      subtotal += line_total;
      prod.stock -= item.quantity;
      prod.updated_at = new Date().toISOString();
      prod.is_low_stock = prod.stock <= prod.min_threshold;

      orderItems.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        product_id: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        quantity: item.quantity,
        line_total,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const val = Math.max(0, parseFloat(discount_value) || 0);
    let discount_amount = 0;
    if (discount_type === 'percentage') {
      discount_amount = Number((subtotal * (Math.min(val, 100) / 100)).toFixed(2));
    } else {
      discount_amount = Number(Math.min(val, subtotal).toFixed(2));
    }

    const taxable_amount = Math.max(0, Number((subtotal - discount_amount).toFixed(2)));
    const tax_rate = 0.05; // 5%
    const tax_amount = Number((taxable_amount * tax_rate).toFixed(2));
    const grand_total = Number((taxable_amount + tax_amount).toFixed(2));

    const nextInvoiceNum = 1001 + orders.length;
    const invoice_id = `INV-${nextInvoiceNum}`;

    const newOrder = {
      id: Date.now(),
      invoice_id,
      subtotal,
      discount_type,
      discount_value: val,
      discount_amount,
      tax_rate,
      tax_amount,
      grand_total,
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    orders.unshift(newOrder);
    saveLocalProducts(products);
    saveLocalOrders(orders);

    return newOrder;
  },

  async getOrders() {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend orders fetch failed, reading local', e);
      }
    }
    return getLocalOrders();
  },

  async getAnalytics() {
    const online = await checkBackendStatus();
    if (online) {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend analytics fetch failed, calculating locally', e);
      }
    }
    const products = getLocalProducts();
    const orders = getLocalOrders();
    return computeLocalAnalytics(products, orders);
  },

  async resetDemo() {
    const online = await checkBackendStatus();
    if (online) {
      try {
        await fetch('/api/reset-demo', { method: 'POST' });
      } catch (e) {
        console.warn('Backend reset failed', e);
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_DEMO_PRODUCTS));
    localStorage.removeItem(LOCAL_STORAGE_KEY_ORDERS);
    return { success: true };
  },
};
