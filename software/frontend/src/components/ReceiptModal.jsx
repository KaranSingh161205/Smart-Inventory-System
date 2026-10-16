import React from 'react';
import { Printer, Check, X, Store, Receipt, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // Format date
  const orderDate = order.created_at ? new Date(order.created_at) : new Date();
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 transition-all transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Success Banner (Hidden during print) */}
        <div className="no-print bg-emerald-600 px-6 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span className="font-bold text-sm">Payment Received Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 bg-white font-mono text-slate-800 text-xs sm:text-sm">
          
          {/* Receipt Store Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-800 mb-2">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight m-0">
              Campus Hub Store
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Student Activity Center, North Campus
            </p>
            <p className="text-[10px] text-slate-400 font-sans">
              GSTIN: 07AAACH1234F1Z8 • Phone: +91 98765 43210
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-slate-600 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice ID:</span>
              <span className="font-bold text-slate-900">{order.invoice_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{formattedDate}, {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">PAID (POS)</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2">
              <span>Item & Description</span>
              <span>Total</span>
            </div>

            <div className="space-y-2">
              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span className="font-semibold">- {formatCurrency(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax (5% GST):</span>
              <span className="font-semibold">{formatCurrency(order.tax_amount)}</span>
            </div>

            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-slate-900">
              <span className="text-sm font-bold font-sans">Final Total:</span>
              <span className="text-lg font-black font-mono text-indigo-700">
                {formatCurrency(order.grand_total)}
              </span>
            </div>
          </div>

          {/* Simulated Barcode & Footer Note */}
          <div className="pt-4 text-center space-y-2">
            {/* Barcode Graphic */}
            <div className="flex justify-center items-center gap-[2px] h-8 opacity-80 overflow-hidden px-4">
              {[4,2,3,1,4,2,1,3,2,4,1,3,2,1,4,3,2,1,3,4,2,1,4,2,3,1,2,4,3,1,2,4,1,3].map((w, i) => (
                <div 
                  key={i} 
                  className="bg-slate-900 h-full" 
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              *{order.invoice_id}*
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Thank you for supporting Campus Hub!
              <br />
              Please retain this invoice for your records.
            </p>
          </div>

        </div>

        {/* Modal Actions (Hidden in print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Close & New Sale
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
