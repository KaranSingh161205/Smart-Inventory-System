import React, { useState, useEffect } from 'react';
import { 
  Store, 
  RotateCcw, 
  ReceiptText, 
  PlusCircle, 
  Clock, 
  Wifi, 
  WifiOff, 
  Sparkles 
} from 'lucide-react';

export default function Header({ 
  onNewProduct, 
  onOpenHistory, 
  onResetDemo, 
  orderCount = 0,
  isOnline = false 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Store Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50">
              <Store className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0 leading-none">
                  Campus Hub Store
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  POS v2.4
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                <span>Smart Inventory & Point of Sale</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </p>
            </div>
          </div>

          {/* Center Connection / Offline Status Badge */}
          <div className="hidden md:flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FastAPI + SQLite Active</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline Local Storage Active</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemo}
              title="Reset items and stock to initial demo values"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {/* Orders History Button */}
            <button
              onClick={onOpenHistory}
              title="View past order receipts"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs relative cursor-pointer"
            >
              <ReceiptText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Orders</span>
              {orderCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {orderCount}
                </span>
              )}
            </button>

            {/* New Product Button */}
            <button
              onClick={onNewProduct}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
