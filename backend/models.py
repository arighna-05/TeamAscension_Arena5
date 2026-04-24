from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from .database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_username = Column(String, index=True)
    name = Column(String, index=True)
    type = Column(String)  # e.g., "crop", "seed", "fertilizer"
    quantity = Column(Float)
    unit = Column(String)  # e.g., "bu", "kg", "tons"
    status = Column(String) # e.g., "Good", "Needs Review"
    location = Column(String, nullable=True)

class MarketOffer(Base):
    __tablename__ = "market_offers"

    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String, index=True)
    offer_type = Column(String) # "Contract Offer", "Spot Market"
    price = Column(Float)
    unit = Column(String) # "bu"
    crop_name = Column(String)
    requirement_quantity = Column(Float)
    distance_km = Column(Float)
    location = Column(String, nullable=True) # e.g. "North Block, Sector 4"
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True) # False if sold

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    balance = Column(Float, default=1000000.0)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String, index=True)
    seller_name = Column(String, index=True)
    amount = Column(Float)
    crop_name = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
