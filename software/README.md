# Campus Hub Store — Smart Inventory & Order Management System

A production-ready, offline-first, single-page **Smart Inventory & Point of Sale (POS) Management System** built with **React**, **Tailwind CSS**, and **Python (FastAPI)** with **SQLite / SQLAlchemy** persistence and seamless client-side local fallback.

---

## 🌟 Key Features

### 1. Header & Live Analytics Bar
- **Total Inventory Valuation**: Real-time sum of `price × stock` across all products (starts at ₹19,460.00).
- **Total Sales Today**: Live accumulated POS revenue from all completed transactions.
- **Critical Stock Items**: Count and visual alert for any items where current stock is at or below the minimum threshold (`stock <= min_threshold`).
- **Connection Indicator**: Real-time badge showing status (`FastAPI + SQLite Active` or `Offline Local Storage Active`).
- **Orders History & Demo Reset**: Instant modal to view past receipts or 1-click reset to seed data.

### 2. Low-Stock Alert Banner
- Prominently displays low-stock warnings whenever any catalog item drops to or below threshold:
  > `⚠️ Low Stock Alert: [Item Name] is running low ([X] units remaining).`
- Includes direct **"+ Quick Restock"** action buttons right on the alert banner.

### 3. Left Section: Product Catalog & Restock Management
- **Product Table**: Displays SKU badge, Product Name, Category pill, Price (₹), Stock badge (Green healthy, Amber/Red low stock, Red out of stock), and Reorder Limit.
- **Real-Time Search**: Instant filtering across product names and SKUs.
- **Category Filter Pills**: Filter by `All`, `Stationery`, `Electronics`, `Lab Components`, or custom categories.
- **Quick Row Actions**:
  - `+ Restock`: Opens restock modal with preset pills (+5, +10, +20, +50, +100) or custom input.
  - `Add to Cart`: Increments POS cart count; automatically disables if stock is 0 or all available stock is in cart.
- **"New Product" Button**: Opens modal to register items with SKU, Name, Category, Price, Initial Stock, and Minimum Threshold.

### 4. Right Section: Point of Sale (POS) Checkout Tray
- **Live Cart List**: Displays item name, SKU, unit price, quantity increment/decrement controls, line total, and trash removal.
- **Stock Validation**: Live guard prevents increasing quantity beyond available stock, showing an inline warning: `Max stock (X)`.
- **Flexible Discount Input**: Toggle between **₹ Fixed Value** or **% Percentage**, with dynamic deduction calculation.
- **5% Tax (GST)**: Fixed 5% tax calculated on the discounted subtotal.
- **Grand Total**: Prominently formatted in Indian Rupees (₹).
- **Checkout Processing**: Atomically validates stock, decrements inventory, generates sequential invoice IDs (`INV-1001`, `INV-1002`, ...), records transaction, and updates analytics.

### 5. Printable Receipt Modal
- Automatically pops up immediately upon successful checkout.
- Styled like an authentic campus store receipt:
  - Store Name: **Campus Hub Store** (Student Activity Center, North Campus)
  - Invoice ID (e.g. `INV-1001`) and formatted Date & Time
  - Itemized table with quantities, unit prices, and line totals
  - Subtotal, Discount Applied, 5% Tax (GST), and Final Total
  - Simulated barcode graphic and thank-you note
  - **"Print / Save Receipt"** button triggering browser `window.print()` (with print-optimized CSS)
  - **"Close & New Sale"** button that resets cart for the next customer.

---

## 📦 Initial Pre-Seeded Demo Items

| SKU | Product Name | Category | Price (₹) | Initial Stock | Min Threshold | Initial Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **CAT-101** | Engineering Notebook (Ruled) | Stationery | ₹80.00 | 25 | 10 | Healthy |
| **CAT-102** | Scientific Calculator FX-991 | Electronics | ₹1,250.00 | 4 | 5 | ⚠️ Low Stock |
| **CAT-103** | Gel Pen (Blue, Pack of 5) | Stationery | ₹50.00 | 30 | 8 | Healthy |
| **CAT-104** | Breadboard & Jumper Wire Kit | Lab Components | ₹220.00 | 3 | 5 | ⚠️ Low Stock |
| **CAT-105** | Arduino Uno R3 Board | Lab Components | ₹650.00 | 8 | 3 | Healthy |
| **CAT-106** | A4 Printing Paper (500 Sheets) | Stationery | ₹340.00 | 15 | 5 | Healthy |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Single-Page React (Vite 8, React 19)
- **Styling**: Tailwind CSS v4 + Lucide React icons + Inter / JetBrains Mono typography
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, SQLite 3, Uvicorn
- **Offline Fallback**: Seamless client-side `localStorage` data engine mirroring the backend schema and business rules. The application can run purely offline without backend if needed, or fully synchronized with SQLite!

---

## 🚀 Quick Start Guide

### Option 1: One-Click Startup (Recommended)
Double-click `start_app.bat` to launch both backend and frontend servers:
- **Web App**: [http://localhost:5173](http://localhost:5173) (or [http://127.0.0.1:8000](http://127.0.0.1:8000))
- **API Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Option 2: Run Backend & Frontend Separately

**1. Backend (FastAPI + SQLite)**
```bash
# In project root:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**2. Frontend (Vite Dev Server)**
```bash
cd frontend
npm run dev
```

### Option 3: Run Full Stack from Single FastAPI Server
FastAPI automatically serves the built React SPA from `frontend/dist`:
```bash
cd frontend && npm run build && cd ..
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
# Open http://127.0.0.1:8000 in your browser
```

---

## 🧪 Running Automated Tests

Run the full end-to-end integration test suite verifying all 8 operations:
```bash
python tests/test_api.py
```
This tests:
1. Product retrieval & schema validation
2. Valuation & critical stock count calculation
3. Checkout & tax/discount math
4. Stock decrements in SQLite
5. Today's sales analytics updates
6. Restock increment & low-stock clearance
7. Insufficient stock guard validation
8. Demo data reset restoration
