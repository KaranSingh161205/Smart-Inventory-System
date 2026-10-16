import React, { useState } from 'react';
import { X, ReceiptText, Search, Printer, Calendar, Clock, ShoppingBag } from 'lucide-react';

export default function OrderHistoryModal({ orders = [], onClose, onSelectOrderForReceipt }) {
  const [filterQuery, setFilterQuery] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const filteredOrders = orders.filter((o) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    const matchesInvoice = o.invoice_id.toLowerCase().includes(q);
    const matchesItem = o.items && o.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    return matchesInvoice || matchesItem;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Completed Orders & Receipts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {orders.length} total completed transactions recorded
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

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search past orders by invoice ID or item name..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No orders found</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed checkouts will automatically appear in this transaction ledger.
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const dt = ord.created_at ? new Date(ord.created_at) : new Date();
              const dateStr = dt.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = dt.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded">
                        {ord.invoice_id}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {dateStr}
                        <Clock className="w-3 h-3 text-slate-400 ml-1" />
                        {timeStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 mr-1.5">Grand Total:</span>
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {formatCurrency(ord.grand_total)}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectOrderForReceipt(ord)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        title="View & Print receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="mt-2.5 pt-1 space-y-1">
                    {ord.items && ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600">
                        <span className="truncate pr-2">
                          <span className="font-semibold text-slate-800">{it.quantity}x</span> {it.name}
                        </span>
                        <span className="font-mono text-slate-700 flex-shrink-0">
                          {formatCurrency(it.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Summary badges */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Subtotal: {formatCurrency(ord.subtotal)}
                      {ord.discount_amount > 0 && ` • Discount: -${formatCurrency(ord.discount_amount)}`}
                      {` • Tax: ${formatCurrency(ord.tax_amount)}`}
                    </span>
                    <span className="font-semibold text-emerald-700">PAID</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
