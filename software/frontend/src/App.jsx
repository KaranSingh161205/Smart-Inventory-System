import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import AnalyticsCards from './components/AnalyticsCards';
import LowStockAlert from './components/LowStockAlert';
import ProductCatalog from './components/ProductCatalog';
import PosCart from './components/PosCart';
import ReceiptModal from './components/ReceiptModal';
import RestockModal from './components/RestockModal';
import NewProductModal from './components/NewProductModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import { apiService, checkBackendStatus } from './services/api';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  // Main Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_valuation: 0,
    total_sales_today: 0,
    critical_stock_count: 0,
    total_products: 0,
    critical_products: [],
  });

  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cart State (Persisted in session/local so refreshing doesn't lose current POS transaction)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('campus_hub_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Triggers
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [restockProductTarget, setRestockProductTarget] = useState(null);
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);

  // Async States
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductError, setNewProductError] = useState(null);

  // Toast Notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Save Cart Changes
  useEffect(() => {
    localStorage.setItem('campus_hub_cart', JSON.stringify(cart));
  }, [cart]);

  // Load Data
  const refreshAllData = useCallback(async () => {
    try {
      const onlineStatus = await checkBackendStatus();
      setIsOnline(onlineStatus);

      const [prodsRes, analyticsRes, ordersRes] = await Promise.all([
        apiService.getProducts(),
        apiService.getAnalytics(),
        apiService.getOrders(),
      ]);

      setProducts(prodsRes.data || []);
      setAnalytics(analyticsRes || {});
      setOrders(ordersRes || []);
    } catch (err) {
      console.error('Error refreshing data:', err);
      showToast('Error syncing with data source', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshAllData();
    // Poll backend health periodically to react to backend launch
    const interval = setInterval(async () => {
      const status = await checkBackendStatus();
      setIsOnline(status);
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory =
        selectedCategory === 'All' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart item counts mapped by product ID
  const cartItemCounts = useMemo(() => {
    const map = {};
    for (const item of cart) {
      map[item.product_id] = item.quantity;
    }
    return map;
  }, [cart]);

  // CART HANDLERS
  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more. Max stock (${product.stock}) reached for ${product.name}.`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ];
      }
    });

    setCheckoutError(null);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      showToast(`Only ${product.stock} units available in stock.`, 'warning');
      newQuantity = product.stock;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    setCheckoutError(null);
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
    setCheckoutError(null);
  };

  const handleClearCart = () => {
    setCart([]);
    setCheckoutError(null);
  };

  // CHECKOUT HANDLER
  const handleCheckout = async (checkoutPayload) => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const order = await apiService.checkout(checkoutPayload);
      
      // Update data immediately
      await refreshAllData();

      // Show receipt modal
      setActiveReceipt(order);

      // Clear cart
      setCart([]);
      localStorage.removeItem('campus_hub_cart');

      showToast(`Order ${order.invoice_id} completed successfully!`, 'success');
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Checkout failed. Please check stock levels.');
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // RESTOCK HANDLER
  const handleRestock = async (productId, amount) => {
    setIsRestocking(true);
    try {
      const updated = await apiService.restockProduct(productId, amount);
      await refreshAllData();
      setRestockProductTarget(null);
      showToast(`Restocked ${updated.name} by +${amount} units!`, 'success');
    } catch (err) {
      console.error('Restock error:', err);
      showToast(err.message || 'Failed to restock item', 'error');
    } finally {
      setIsRestocking(false);
    }
  };

  // NEW PRODUCT HANDLER
  const handleCreateProduct = async (productData) => {
    setIsCreatingProduct(true);
    setNewProductError(null);
    try {
      const created = await apiService.createProduct(productData);
      await refreshAllData();
      setIsNewProductOpen(false);
      showToast(`Added ${created.name} (${created.sku}) to catalog!`, 'success');
    } catch (err) {
      console.error('Create product error:', err);
      setNewProductError(err.message || 'Failed to create product');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // RESET DEMO DATA HANDLER
  const handleResetDemoData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the system to the initial 6 demo items? This will reset all inventory counts and clear past order history.'
    );
    if (!confirmed) return;

    try {
      await apiService.resetDemo();
      setCart([]);
      localStorage.removeItem('campus_hub_cart');
      await refreshAllData();
      showToast('System reset to original 6 demo products and stock levels.', 'success');
    } catch (err) {
      console.error('Reset error:', err);
      showToast('Failed to reset demo data', 'error');
    }
  };

  // Close receipt and start new sale
  const handleCloseReceipt = () => {
    setActiveReceipt(null);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-['Inter',sans-serif]">
      
      {/* Toast Notification Bar */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <Info className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header & Navigation */}
      <Header
        onNewProduct={() => {
          setNewProductError(null);
          setIsNewProductOpen(true);
        }}
        onOpenHistory={() => setIsOrderHistoryOpen(true)}
        onResetDemo={handleResetDemoData}
        orderCount={orders.length}
        isOnline={isOnline}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 1. Quick Analytics Bar (3 live metric cards) */}
        <AnalyticsCards
          totalValuation={analytics.total_valuation}
          totalSalesToday={analytics.total_sales_today}
          criticalStockCount={analytics.critical_stock_count}
          totalProducts={products.length}
        />

        {/* 5. Low-Stock Alert Banner */}
        <LowStockAlert
          criticalProducts={analytics.critical_products}
          onRestockClick={(prod) => setRestockProductTarget(prod)}
        />

        {/* Core 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Section: Product Catalog & Restock Management (col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            <ProductCatalog
              products={filteredProducts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              onAddToCart={handleAddToCart}
              onOpenRestock={(prod) => setRestockProductTarget(prod)}
              onOpenNewProduct={() => {
                setNewProductError(null);
                setIsNewProductOpen(true);
              }}
              cartItemCounts={cartItemCounts}
              isLoading={isLoading}
            />
          </div>

          {/* Right Section: Point of Sale (POS) Checkout Tray (col-span-4) */}
          <div className="lg:col-span-4 sticky top-24">
            <PosCart
              cart={cart}
              products={products}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
              checkoutError={checkoutError}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Campus Hub Store. Offline-first Smart Inventory & POS System.</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Zero External Cloud Dependencies • Local Offline Mode Active</span>
          </p>
        </div>
      </footer>

      {/* MODALS */}

      {/* 4. Receipt Modal (Triggered on Checkout or from History) */}
      {activeReceipt && (
        <ReceiptModal
          order={activeReceipt}
          onClose={handleCloseReceipt}
        />
      )}

      {/* Restock Modal */}
      {restockProductTarget && (
        <RestockModal
          product={restockProductTarget}
          onClose={() => setRestockProductTarget(null)}
          onRestock={handleRestock}
          isSubmitting={isRestocking}
        />
      )}

      {/* New Product Modal */}
      {isNewProductOpen && (
        <NewProductModal
          onClose={() => setIsNewProductOpen(false)}
          onCreate={handleCreateProduct}
          existingCategories={categories}
          isSubmitting={isCreatingProduct}
          error={newProductError}
        />
      )}

      {/* Order History Modal */}
      {isOrderHistoryOpen && (
        <OrderHistoryModal
          orders={orders}
          onClose={() => setIsOrderHistoryOpen(false)}
          onSelectOrderForReceipt={(order) => {
            setIsOrderHistoryOpen(false);
            setActiveReceipt(order);
          }}
        />
      )}

    </div>
  );
}
