import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, IndianRupee, Tag, Box, Layers } from 'lucide-react';

export default function NewProductModal({ 
  onClose, 
  onCreate, 
  existingCategories = [], 
  isSubmitting = false,
  error = null 
}) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: existingCategories[0] || 'Stationery',
    customCategory: '',
    price: '',
    stock: '',
    min_threshold: '5',
  });

  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    const sku = formData.sku.trim().toUpperCase();
    const name = formData.name.trim();
    const category = useCustomCategory ? formData.customCategory.trim() : formData.category;
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock, 10);
    const min_threshold = parseInt(formData.min_threshold, 10);

    if (!sku) {
      setValidationError('Please enter a valid product SKU (e.g. CAT-107).');
      return;
    }
    if (!name) {
      setValidationError('Please enter the product name.');
      return;
    }
    if (!category) {
      setValidationError('Please select or specify a category.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setValidationError('Please enter a valid non-negative price.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setValidationError('Please enter a valid initial stock count.');
      return;
    }
    if (isNaN(min_threshold) || min_threshold < 0) {
      setValidationError('Please enter a valid minimum stock threshold.');
      return;
    }

    onCreate({
      sku,
      name,
      category,
      price,
      stock,
      min_threshold,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Create New Catalog Product
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a new inventory item in the system
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {(validationError || error) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* SKU & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CAT-107"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              {!useCustomCategory ? (
                <div className="space-y-1">
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setUseCustomCategory(true);
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {existingCategories
                      .filter((c) => c !== 'All')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    <option value="__NEW__">+ Custom Category...</option>
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomCategory(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Select from list"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Digital Multimeter with Probes"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Price, Stock, Threshold Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Price (₹) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Initial Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Initial Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Minimum Threshold */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="5"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          <p className="text-[11px] text-slate-400 italic">
            Items will automatically trigger a low-stock alert whenever their stock level reaches or drops below the minimum threshold.
          </p>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Product...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Save to Inventory</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
