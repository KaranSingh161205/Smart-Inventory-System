import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export default function PosCart({
  cart = [],
  products = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckingOut = false,
  checkoutError = null,
}) {
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percentage'
  const [discountValue, setDiscountValue] = useState(0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // Find corresponding product for stock validation
  const getProductForCartItem = (cartItem) => {
    return products.find((p) => p.id === cartItem.product_id);
  };

  // Calculations
  const subtotal = Number(
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
  );

  let discountAmount = 0;
  const numDiscountValue = Math.max(0, parseFloat(discountValue) || 0);

  if (discountType === 'percentage') {
    discountAmount = Number((subtotal * (Math.min(numDiscountValue, 100) / 100)).toFixed(2));
  } else {
    discountAmount = Number(Math.min(numDiscountValue, subtotal).toFixed(2));
  }

  const taxableAmount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const taxRate = 0.05; // 5% fixed tax
  const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
  const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCompleteCheckout = () => {
    if (cart.length === 0 || isCheckingOut) return;
    onCheckout({
      items: cart,
      discount_type: discountType,
      discount_value: numDiscountValue,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      grand_total: grandTotal,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      
      {/* POS Tray Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 m-0 leading-none">
              POS Checkout Tray
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live Cart ({totalItemsCount} {totalItemsCount === 1 ? 'unit' : 'units'})
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            title="Empty cart"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Your POS cart is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Click "Add to Cart" on any product in the inventory to begin checkout.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const product = getProductForCartItem(item);
            const currentStock = product ? product.stock : item.quantity;
            const isAtMaxStock = item.quantity >= currentStock;
            const itemLineTotal = Number((item.price * item.quantity).toFixed(2));

            return (
              <div
                key={item.product_id}
                className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono text-[11px] bg-slate-200/60 px-1.5 py-0.2 rounded font-medium">
                        {item.sku}
                      </span>
                      <span>•</span>
                      <span className="font-mono">{formatCurrency(item.price)} each</span>
                    </div>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-mono text-slate-900">
                      {formatCurrency(itemLineTotal)}
                    </p>
                    <button
                      onClick={() => onRemoveItem(item.product_id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 mt-0.5 cursor-pointer"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quantity Controls & Stock Warning */}
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    
                    <span className="w-8 text-center text-xs font-mono font-bold text-slate-800">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => {
                        if (!isAtMaxStock) {
                          onUpdateQuantity(item.product_id, item.quantity + 1);
                        }
                      }}
                      disabled={isAtMaxStock}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                        isAtMaxStock
                          ? 'opacity-40 text-slate-300 cursor-not-allowed'
                          : 'hover:bg-indigo-50 text-indigo-600'
                      }`}
                      title={isAtMaxStock ? 'Max available stock reached' : 'Increase quantity'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Stock validation badge / warning */}
                  <div className="text-right">
                    {isAtMaxStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        <span>Max stock ({currentStock})</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {currentStock - item.quantity} more available
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Calculations & Checkout Section */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 space-y-3.5">
        
        {/* Discount Input & Type Toggle */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              <span>Apply Discount</span>
            </span>
            
            {/* Toggle Pills */}
            <div className="flex rounded-md bg-slate-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDiscountType('fixed')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  discountType === 'fixed'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ Fixed
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percentage')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  discountType === 'percentage'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                % Percent
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : subtotal}
              step="any"
              value={discountValue === 0 ? '' : discountValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setDiscountValue(val >= 0 ? val : 0);
              }}
              placeholder={`Enter discount in ${discountType === 'fixed' ? '₹ (e.g. 50)' : '% (e.g. 10)'}`}
              className="w-full text-xs sm:text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-slate-800">{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>
                Discount ({discountType === 'percentage' ? `${numDiscountValue}%` : 'Fixed'})
              </span>
              <span className="font-mono font-medium">- {formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <span>GST / Tax (5%)</span>
            </span>
            <span className="font-mono font-medium text-slate-800">{formatCurrency(taxAmount)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">Grand Total</span>
            <span className="text-xl font-extrabold font-mono text-indigo-700">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Checkout Error Message if any */}
        {checkoutError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Complete Checkout Button */}
        <button
          onClick={handleCompleteCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
            cart.length === 0 || isCheckingOut
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200'
          }`}
        >
          {isCheckingOut ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing Sale...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Complete Checkout • {formatCurrency(grandTotal)}</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
}
