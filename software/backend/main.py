from datetime import datetime, date, time
from typing import List, Optional
import os
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db
from .models import Product, Order, OrderItem
from .schemas import (
    ProductCreate,
    ProductResponse,
    RestockRequest,
    CheckoutRequest,
    OrderResponse,
    AnalyticsResponse,
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Inventory & Order Management System API",
    version="1.0.0",
    description="Campus Hub Store Inventory & POS Checkout Engine"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INITIAL_DEMO_PRODUCTS = [
    {
        "sku": "CAT-101",
        "name": "Engineering Notebook (Ruled)",
        "category": "Stationery",
        "price": 80.0,
        "stock": 25,
        "min_threshold": 10,
    },
    {
        "sku": "CAT-102",
        "name": "Scientific Calculator FX-991",
        "category": "Electronics",
        "price": 1250.0,
        "stock": 4,
        "min_threshold": 5,  # Low stock trigger
    },
    {
        "sku": "CAT-103",
        "name": "Gel Pen (Blue, Pack of 5)",
        "category": "Stationery",
        "price": 50.0,
        "stock": 30,
        "min_threshold": 8,
    },
    {
        "sku": "CAT-104",
        "name": "Breadboard & Jumper Wire Kit",
        "category": "Lab Components",
        "price": 220.0,
        "stock": 3,
        "min_threshold": 5,  # Low stock trigger
    },
    {
        "sku": "CAT-105",
        "name": "Arduino Uno R3 Board",
        "category": "Lab Components",
        "price": 650.0,
        "stock": 8,
        "min_threshold": 3,
    },
    {
        "sku": "CAT-106",
        "name": "A4 Printing Paper (500 Sheets)",
        "category": "Stationery",
        "price": 340.0,
        "stock": 15,
        "min_threshold": 5,
    },
]


def seed_demo_data(db: Session, force: bool = False):
    """Seed initial demo data if empty or forced."""
    if force:
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Product).delete()
        db.commit()

    existing_count = db.query(Product).count()
    if existing_count == 0:
        for item in INITIAL_DEMO_PRODUCTS:
            db_product = Product(
                sku=item["sku"],
                name=item["name"],
                category=item["category"],
                price=float(item["price"]),
                stock=int(item["stock"]),
                min_threshold=int(item["min_threshold"]),
            )
            db.add(db_product)
        db.commit()


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_demo_data(db, force=False)
    finally:
        db.close()


def format_product_response(product: Product) -> dict:
    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "stock": product.stock,
        "min_threshold": product.min_threshold,
        "is_low_stock": product.stock <= product.min_threshold,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Smart Inventory & POS API"}


@app.get("/api/products", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search query by name or SKU"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | (Product.sku.ilike(search_pattern))
        )
    if category and category.lower() != "all":
        query = query.filter(Product.category.ilike(category.strip()))

    products = query.order_by(Product.id.asc()).all()
    return [format_product_response(p) for p in products]


@app.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Check if SKU already exists
    existing = db.query(Product).filter(Product.sku.ilike(product_in.sku.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists."
        )

    db_product = Product(
        sku=product_in.sku.strip().upper(),
        name=product_in.name.strip(),
        category=product_in.category.strip(),
        price=round(product_in.price, 2),
        stock=product_in.stock,
        min_threshold=product_in.min_threshold,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return format_product_response(db_product)


@app.post("/api/products/{product_id}/restock", response_model=ProductResponse)
def restock_product(product_id: int, restock: RestockRequest, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product.stock += restock.amount
    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return format_product_response(product)


@app.post("/api/checkout", response_model=OrderResponse)
def checkout(order_in: CheckoutRequest, db: Session = Depends(get_db)):
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty. Add products before completing checkout."
        )

    # Validate stock for all items atomically
    products_to_update = {}
    subtotal = 0.0
    order_items_data = []

    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found."
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock}, Requested: {item.quantity}"
            )
        
        line_total = round(product.price * item.quantity, 2)
        subtotal += line_total
        products_to_update[product] = item.quantity
        order_items_data.append({
            "product_id": product.id,
            "sku": product.sku,
            "name": product.name,
            "price": product.price,
            "quantity": item.quantity,
            "line_total": line_total
        })

    subtotal = round(subtotal, 2)

    # Calculate discount
    discount_amount = 0.0
    if order_in.discount_type == "percentage":
        discount_amount = round(subtotal * (min(max(order_in.discount_value, 0.0), 100.0) / 100.0), 2)
    else:
        discount_amount = round(min(max(order_in.discount_value, 0.0), subtotal), 2)

    taxable_amount = max(0.0, round(subtotal - discount_amount, 2))
    tax_rate = 0.05  # 5% fixed tax
    tax_amount = round(taxable_amount * tax_rate, 2)
    grand_total = round(taxable_amount + tax_amount, 2)

    # Generate sequential Invoice ID
    last_order = db.query(Order).order_by(Order.id.desc()).first()
    next_num = 1001 if not last_order else last_order.id + 1001
    invoice_id = f"INV-{next_num}"

    # Decrement stock
    for product, qty in products_to_update.items():
        product.stock -= qty
        product.updated_at = datetime.utcnow()

    # Save order
    db_order = Order(
        invoice_id=invoice_id,
        subtotal=subtotal,
        discount_type=order_in.discount_type,
        discount_value=order_in.discount_value,
        discount_amount=discount_amount,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        grand_total=grand_total,
        created_at=datetime.utcnow()
    )
    db.add(db_order)
    db.flush()

    for item_data in order_items_data:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            sku=item_data["sku"],
            name=item_data["name"],
            price=item_data["price"],
            quantity=item_data["quantity"],
            line_total=item_data["line_total"]
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order


@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(limit: int = 50, db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(limit).all()
    return orders


@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_valuation = round(sum(p.price * p.stock for p in products), 2)
    
    critical_products = [
        format_product_response(p)
        for p in products
        if p.stock <= p.min_threshold
    ]
    critical_stock_count = len(critical_products)

    # Total Sales Today (all orders created since 00:00:00 of today)
    today_start = datetime.combine(date.today(), time.min)
    today_orders = db.query(Order).filter(Order.created_at >= today_start).all()
    total_sales_today = round(sum(o.grand_total for o in today_orders), 2)

    return {
        "total_valuation": total_valuation,
        "total_sales_today": total_sales_today,
        "critical_stock_count": critical_stock_count,
        "total_products": len(products),
        "critical_products": critical_products,
    }


@app.post("/api/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    seed_demo_data(db, force=True)
    return {"message": "Demo data successfully re-seeded."}


# Mount built frontend SPA if available
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE_PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_PROJECT_DIR, "frontend", "dist")

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend not built yet. Run 'npm run build' in frontend folder."}

