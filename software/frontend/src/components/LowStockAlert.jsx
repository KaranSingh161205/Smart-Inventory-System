import React from 'react';
import { AlertTriangle, PlusCircle, ArrowRight } from 'lucide-react';

export default function LowStockAlert({ criticalProducts = [], onRestockClick }) {
  if (!criticalProducts || criticalProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-900 tracking-tight">
                ⚠️ Low Stock Alert ({criticalProducts.length} {criticalProducts.length === 1 ? 'item' : 'items'})
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 font-medium">
                Action Required
              </span>
            </div>
            
            {/* List the low stock message(s) */}
            <div className="mt-1 space-y-1">
              {criticalProducts.map((item) => (
                <div key={item.id} className="text-sm text-amber-800 flex items-center flex-wrap gap-x-2 gap-y-1">
                  <span>
                    <strong className="font-semibold text-amber-950">{item.name}</strong> is running low (
                    <span className="font-mono font-bold text-rose-700">{item.stock}</span> units remaining, min limit: {item.min_threshold}).
                  </span>
                  <button
                    onClick={() => onRestockClick(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer ml-1"
                  >
                    <span>+ Quick Restock</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {criticalProducts.length > 1 && (
          <div className="flex-shrink-0 self-end sm:self-center">
            <button
              onClick={() => onRestockClick(criticalProducts[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Restock First Item</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
