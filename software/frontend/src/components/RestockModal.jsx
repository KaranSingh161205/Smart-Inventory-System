import React, { useState } from 'react';
import { X, Plus, Package, ArrowUpRight } from 'lucide-react';

export default function RestockModal({ product, onClose, onRestock, isSubmitting = false }) {
  if (!product) return null;

  const [amount, setAmount] = useState(10);

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(amount, 10);
    if (qty > 0) {
      onRestock(product.id, qty);
    }
  };

  const quickPresets = [5, 10, 20, 50, 100];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Restock Inventory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add stock to campus store catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Target Product Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {product.sku}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {product.category}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {product.name}
              </h4>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Current Stock</span>
              <span className={`font-mono text-base font-extrabold ${
                product.stock <= product.min_threshold ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {product.stock} units
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Units to Add:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                units
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Quick Presets:
            </span>
            <div className="flex gap-2">
              {quickPresets.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setAmount(qty)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    amount === qty
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* New Projected Stock */}
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>Projected New Stock:</span>
            </span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              {product.stock + (parseInt(amount, 10) || 0)} units
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Confirm Restock (+{amount})</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
