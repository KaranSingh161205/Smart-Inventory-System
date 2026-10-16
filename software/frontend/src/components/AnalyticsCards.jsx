import React from 'react';
import { IndianRupee, TrendingUp, AlertTriangle, PackageCheck } from 'lucide-react';

export default function AnalyticsCards({ 
  totalValuation = 0, 
  totalSalesToday = 0, 
  criticalStockCount = 0,
  totalProducts = 0
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Total Inventory Valuation */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inventory Valuation
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatCurrency(totalValuation)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>{totalProducts} total catalog products</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <IndianRupee className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 2. Total Sales Today */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sales Today
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatCurrency(totalSalesToday)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live POS revenue</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Critical Stock Items */}
      <div className={`rounded-xl border p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden group ${
        criticalStockCount > 0 
          ? 'bg-rose-50/40 border-rose-200/90' 
          : 'bg-white border-slate-200/80'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          criticalStockCount > 0 ? 'bg-rose-500' : 'bg-slate-300'
        }`}></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Critical Stock Items
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-2xl font-bold font-mono tracking-tight ${
                criticalStockCount > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}>
                {criticalStockCount}
              </h3>
              <span className="text-xs text-slate-500">
                {criticalStockCount === 1 ? 'item requires restock' : 'items require restock'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Stock ≤ minimum threshold limit
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
            criticalStockCount > 0 
              ? 'bg-rose-100 text-rose-600 animate-pulse' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

    </div>
  );
}
