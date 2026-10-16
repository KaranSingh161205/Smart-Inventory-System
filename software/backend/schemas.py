from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(..., description="Unique product SKU")
    name: str = Field(..., description="Product name")
    category: str = Field(..., description="Product category")
    price: float = Field(..., ge=0, description="Product price in INR (₹)")
    stock: int = Field(..., ge=0, description="Current stock count")
    min_threshold: int = Field(5, ge=0, description="Minimum threshold for low stock alert")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    min_threshold: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: int
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RestockRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Amount to add to stock")


class CartItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    discount_type: Literal["fixed", "percentage"] = "fixed"
    discount_value: float = Field(0.0, ge=0)


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    sku: str
    name: str
    price: float
    quantity: int
    line_total: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    invoice_id: str
    subtotal: float
    discount_type: str
    discount_value: float
    discount_amount: float
    tax_rate: float
    tax_amount: float
    grand_total: float
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_valuation: float
    total_sales_today: float
    critical_stock_count: int
    total_products: int
    critical_products: List[ProductResponse]
