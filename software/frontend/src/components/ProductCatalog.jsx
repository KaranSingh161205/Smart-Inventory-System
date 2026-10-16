import React from 'react';
import { 
  Search, 
  Plus, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

const CATEGORY_STYLES = {
  Stationery: 'bg-blue-50 text-blue-700 border-blue-200',
  Electronics: 'bg-purple-50 text-purple-700 border-purple-200',
  'Lab Components': 'bg-teal-50 text-teal-700 border-teal-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ProductCatalog({
  products = [],
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'All',
  onCategoryChange,
  categories = [],
  onAddToCart,
  onOpenRestock,
  onOpenNewProduct,
  cartItemCounts = {},
  isLoading = false,
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Top Toolbar: Search & Category Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 space-y-3.5">
        
        {/* Header row with count & New Product button on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Product Inventory Catalog</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200/70 text-slate-700">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by SKU or item name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Catalog Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-center">Stock Level</th>
              <th className="py-3 px-4 text-center">Reorder Limit</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No products match your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the search filter or add a new product</p>
                  <button
                    onClick={onOpenNewProduct}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Product</span>
                  </button>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.min_threshold;
                const inCartQty = cartItemCounts[product.id] || 0;
                const remainingAvailable = Math.max(0, product.stock - inCartQty);
                const categoryStyle = CATEGORY_STYLES[product.category] || CATEGORY_STYLES.default;

                return (
                  <tr 
                    key={product.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isLowStock ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {product.sku}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        {inCartQty > 0 && (
                          <span className="text-[11px] text-indigo-600 font-medium">
                            {inCartQty} in cart ({remainingAvailable} left)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryStyle}`}>
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </td>

                    {/* Stock Level Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>0 Out of Stock</span>
                        </span>
                      ) : isLowStock ? (
                        <span 
                          title={`Stock is at or below minimum threshold (${product.min_threshold})`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{product.stock} (Low Stock)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{product.stock} In Stock</span>
                        </span>
                      )}
                    </td>

                    {/* Reorder Limit */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-medium">
                        ≤ {product.min_threshold} units
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        
                        {/* + Restock Button */}
                        <button
                          onClick={() => onOpenRestock(product)}
                          title={`Restock ${product.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>Restock</span>
                        </button>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => onAddToCart(product)}
                          disabled={isOutOfStock || remainingAvailable <= 0}
                          title={
                            isOutOfStock 
                              ? 'Out of stock' 
                              : remainingAvailable <= 0 
                                ? 'All available stock is already in cart' 
                                : `Add ${product.name} to cart`
                          }
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isOutOfStock || remainingAvailable <= 0
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:bg-indigo-800'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Catalog Footer Info */}
      <div className="py-3 px-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Healthy Stock</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span>
          <span>Low Stock Alert</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span>
          <span>Out of Stock</span>
        </div>
        <div>
          <span>Showing {products.length} products</span>
        </div>
      </div>
    </div>
  );
}
