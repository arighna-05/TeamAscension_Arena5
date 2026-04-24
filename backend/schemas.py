from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    owner_username: str
    name: str
    type: str
    quantity: float
    unit: str
    status: str
    location: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int

    class Config:
        from_attributes = True

class MarketOfferBase(BaseModel):
    buyer_name: str
    offer_type: str
    price: float
    unit: str
    crop_name: str
    requirement_quantity: float
    distance_km: float
    location: Optional[str] = None
    is_premium: bool = False
    is_active: bool = True

class MarketOfferCreate(MarketOfferBase):
    pass

class MarketOfferResponse(MarketOfferBase):
    id: int

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    buyer_name: str
    seller_name: str
    amount: float
    crop_name: str

class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class WalletBase(BaseModel):
    username: str
    balance: float

class WalletResponse(WalletBase):
    id: int

    class Config:
        from_attributes = True

class AddFundsRequest(BaseModel):
    amount: float

class VoiceParseRequest(BaseModel):
    text: str

class VoiceParseResponse(BaseModel):
    offer_type: str
    crop_name: str
    quantity: float
    unit: str
    price: float
    confidence: str = "low"   # "high" | "low"
    inventory_hint: str = ""  # normalised crop name hint for fuzzy matching
