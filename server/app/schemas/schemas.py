from pydantic import BaseModel, validator, EmailStr
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from enum import Enum
from jose import jwt
from passlib.context import CryptContext

# --- Configuration & Security ---
SECRET_KEY = "this-is-my-secret-key-123456789012"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Enums ---
class UserRole(str, Enum):
    admin = "admin"
    user = "user"

class DiscountType(str, Enum):
    percentage = "percentage"
    fixed = "fixed"

class OrderStatus(str, Enum):
    Pending = "Pending"
    Processing = "Processing"
    Shipped = "Shipped"
    In_Transit = "In Transit"
    Delivered = "Delivered"
    Cancelled = "Cancelled"
    Returned = "Returned"

class PaymentStatus(str, Enum):
    Paid = "Paid"
    Unpaid = "Unpaid"
    Pending = "Pending"
    COD = "COD"
    Refunded = "Refunded"

class PaymentMethod(str, Enum):
    Credit_Card = "Credit Card"
    Debit_Card = "Debit Card"
    UPI = "UPI"
    Net_Banking = "Net Banking"
    Wallet = "Wallet"
    COD = "COD"

class ShippingProvider(str, Enum):
    Self_Delivery = "Self-Delivery"
    BlueDart = "BlueDart"
    Delhivery = "Delhivery"
    DTDC = "DTDC"

class StockStatus(str, Enum):
    In_Stock = "In Stock"
    Low_Stock = "Low Stock"
    Out_of_Stock = "Out of Stock"

class MediaType(str, Enum):
    image = "image"
    video = "video"

# --- User Schemas (Fixed Ordering) ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.user

class UserCreate(UserBase):
    password: str
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# --- Product Schemas ---
class ProductImageResponse(BaseModel):
    id: int
    media_url: str
    media_type: MediaType
    class Config:
        from_attributes = True

class ProductImageCreate(BaseModel):
    media_url: str
    media_type: MediaType = MediaType.image

class ProductBase(BaseModel):
    name: str
    sku: str
    stock_quantity: int
    description: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    reorder_level: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = 0.0
    last_restocked: Optional[datetime] = None

class ProductCreate(ProductBase):
    images: List[ProductImageCreate] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    reorder_level: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    gst_rate: Optional[float] = None
    last_restocked: Optional[datetime] = None
    images: Optional[List[ProductImageCreate]] = None

class Product(ProductBase):
    id: int
    images: List[ProductImageResponse] = []
    status: StockStatus
    class Config:
        from_attributes = True

# --- Vehicle Schemas ---
class VehicleBase(BaseModel):
    vehicle_number: str
    driver_name: str
    latitude: float
    longitude: float
    status: str = "Idle"
    live_temp: float = 25.0
    orders_count: int = 0
    fuel_level: float = 100.0

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: int
    class Config:
        from_attributes = True

# --- Order & Item Schemas ---
class ItemProductDetail(BaseModel):
    name: str
    sku: str
    class Config:
        from_attributes = True

class ItemProductDetailWithPrice(BaseModel):
    name: str
    sku: str
    selling_price: float
    gst_rate: float
    class Config:
        from_attributes = True

class ItemInOrderResponse(BaseModel):
    quantity: int
    product: ItemProductDetailWithPrice
    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    phone_number: Optional[str] = None
    shipping_address: str
    subtotal: float
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    total_gst: float
    shipping_charges: Optional[float] = 0.0
    total_amount: float
    payment_status: PaymentStatus = PaymentStatus.Unpaid
    payment_method: PaymentMethod
    status: OrderStatus = OrderStatus.Pending
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    phone_number: Optional[str] = None
    shipping_address: str
    payment_method: PaymentMethod
    payment_status: Optional[PaymentStatus] = None
    status: Optional[OrderStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None
    discount_value: Optional[float] = 0.0
    discount_type: Optional[DiscountType] = None
    shipping_charges: Optional[float] = 0.0
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    shipping_provider: Optional[ShippingProvider] = None
    tracking_id: Optional[str] = None
    vehicle_id: Optional[int] = None

    @validator("shipping_provider", pre=True)
    def empty_str_to_none(cls, v):
        if v == "": return None
        return v

class Order(OrderBase):
    id: int
    order_date: datetime
    items: List[ItemInOrderResponse]
    class Config:
        from_attributes = True

# --- Analytics & Forecast Schemas ---
class KpiCard(BaseModel):
    title: str
    value: str
    change: str

class TopProduct(BaseModel):
    name: str
    value: int

class DeliveryStatusChart(BaseModel):
    on_time: int
    delayed: int

class OrderStatusBreakdownItem(BaseModel):
    status: str
    value: int

class AnalyticsSummary(BaseModel):
    kpi_cards: List[KpiCard]
    top_selling_products: List[TopProduct]
    delivery_status: DeliveryStatusChart
    order_status_breakdown: List[OrderStatusBreakdownItem]
    class Config:
        from_attributes = True

class ForecastDataPoint(BaseModel):
    date: str
    value: int

class DemandForecast(BaseModel):
    forecast: List[ForecastDataPoint]

# --- App Settings ---
class AppSetting(BaseModel):
    setting_key: str
    setting_value: str
    class Config:
        from_attributes = True

class AppSettingsUpdate(BaseModel):
    settings: List[AppSetting]

# --- Helper Functions ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)