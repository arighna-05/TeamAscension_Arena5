from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import re

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/marketplace",
    tags=["marketplace"]
)

def get_or_create_wallet(db: Session, username: str, default_balance: float = 1000.0):
    """Get existing wallet or create one with the given default balance."""
    wallet = db.query(models.Wallet).filter(models.Wallet.username == username).first()
    if not wallet:
        wallet = models.Wallet(username=username, balance=default_balance)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def update_inventory(db: Session, username: str, crop_name: str, quantity: float, unit: str):
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.owner_username == username,
        models.InventoryItem.name == crop_name
    ).first()
    if item:
        item.quantity += quantity
    else:
        if quantity > 0:
            new_item = models.InventoryItem(
                owner_username=username,
                name=crop_name,
                type="crop",
                quantity=quantity,
                unit=unit,
                status="Good",
                location="Warehouse"
            )
            db.add(new_item)

@router.get("/", response_model=List[schemas.MarketOfferResponse])
def read_marketplace_offers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    offers = db.query(models.MarketOffer).filter(models.MarketOffer.is_active == True).order_by(models.MarketOffer.distance_km).offset(skip).limit(limit).all()
    return offers

@router.post("/", response_model=schemas.MarketOfferResponse)
def create_market_offer(offer: schemas.MarketOfferCreate, db: Session = Depends(get_db)):
    wallet = get_or_create_wallet(db, offer.buyer_name)

    if offer.offer_type == "BUY":
        cost = offer.price * offer.requirement_quantity
        if wallet.balance < cost:
            raise HTTPException(status_code=400, detail=f"Not enough money in wallet (balance: ${wallet.balance:.2f}, cost: ${cost:.2f})")
        wallet.balance -= cost

    if offer.offer_type == "SELL":
        # Reserve (deduct) inventory when listing is created
        inv = db.query(models.InventoryItem).filter(
            models.InventoryItem.owner_username == offer.buyer_name,
            models.InventoryItem.name == offer.crop_name
        ).first()
        if inv:
            if inv.quantity < offer.requirement_quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock (have {inv.quantity} {inv.unit}, listing {offer.requirement_quantity})")
            inv.quantity -= offer.requirement_quantity

    db_offer = models.MarketOffer(**offer.model_dump())
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer

# ── IMPORTANT: /parse-voice MUST be registered BEFORE /{offer_id}/... routes ──
@router.post("/parse-voice", response_model=schemas.VoiceParseResponse)
def parse_voice_input(request: schemas.VoiceParseRequest):
    text = request.text.lower()

    # 1. Offer Type
    sell_keywords = ["sell", "bechna", "bechni", "bechna hai", "sale"]
    buy_keywords = ["buy", "purchase", "kharidna", "kharidni", "kharidna hai", "need"]
    
    offer_type = "SELL"
    if any(k in text for k in buy_keywords):
        offer_type = "BUY"
    elif any(k in text for k in sell_keywords):
        offer_type = "SELL"

    # 2. Price (Support currency symbols and Indian phrasing)
    price = 0.0
    price_match = re.search(r'(?:for|at|rs\.?|rupees|inr|₹)\s*(\d+(?:\.\d+)?)', text)
    if price_match:
        price = float(price_match.group(1))

    # 3. Quantity and Unit
    quantity = 0.0
    unit = "kg"

    qty_match = re.search(r'(\d+(?:\.\d+)?)\s*(kg|kilo|tons|tonnes|quintal|quintals|bags|units|grams|g|lb)', text)
    if qty_match:
        quantity = float(qty_match.group(1))
        unit_str = qty_match.group(2)
        if "kg" in unit_str or "kilo" in unit_str:
            unit = "kg"
        elif "ton" in unit_str:
            unit = "tons"
        elif "lb" in unit_str or "pound" in unit_str:
            unit = "lbs"
        else:
            unit = "units"
    else:
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        if len(numbers) >= 1:
            quantity = float(numbers[0])

    # 4. Crop Name
    stop_words = ["i", "want", "to", "sell", "buy", "need", "purchase", "for", "at", "dollars", "dollar", "bucks", "of", "a", "an", "the", "some", "my"]
    words = text.split()
    crop_words = []

    for w in words:
        w = re.sub(r'[^\w\s]', '', w)
        if w.isalpha() and w not in stop_words and w not in ["kg", "kilograms", "kilo", "tons", "tonnes", "lbs", "pounds", "units"]:
            crop_words.append(w.capitalize())

    crop_name = " ".join(crop_words)
    if not crop_name:
        crop_name = "Unknown Crop"

    return schemas.VoiceParseResponse(
        offer_type=offer_type,
        crop_name=crop_name,
        quantity=quantity,
        unit=unit,
        price=price
    )

class BuyRequest(BaseModel):
    buyer_name: str

@router.post("/{offer_id}/buy")
def buy_offer(offer_id: int, request: BuyRequest, db: Session = Depends(get_db)):
    offer = db.query(models.MarketOffer).filter(models.MarketOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if not offer.is_active:
        raise HTTPException(status_code=400, detail="Offer is no longer active")
    if offer.offer_type != "SELL":
        raise HTTPException(status_code=400, detail="Can only buy SELL offers")

    # Get buyer and seller wallets (seller is stored as buyer_name in the offer)
    buyer_wallet = get_or_create_wallet(db, request.buyer_name)
    seller_wallet = get_or_create_wallet(db, offer.buyer_name)

    cost = offer.price * offer.requirement_quantity

    if buyer_wallet.balance < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient balance (have ${buyer_wallet.balance:.2f}, need ${cost:.2f})")

    # Execute transaction
    buyer_wallet.balance -= cost
    seller_wallet.balance += cost
    offer.is_active = False

    # Update inventory
    update_inventory(db, request.buyer_name, offer.crop_name, offer.requirement_quantity, offer.unit)
    update_inventory(db, offer.buyer_name, offer.crop_name, -offer.requirement_quantity, offer.unit)

    transaction = models.Transaction(
        buyer_name=request.buyer_name,
        seller_name=offer.buyer_name,
        amount=cost,
        crop_name=offer.crop_name
    )
    db.add(transaction)
    db.commit()

    return {"message": "Transaction successful", "cost": cost}

@router.delete("/{offer_id}")
def delete_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(models.MarketOffer).filter(models.MarketOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.is_active:
        # Refund wallet for cancelled BUY offers
        if offer.offer_type == "BUY":
            wallet = db.query(models.Wallet).filter(models.Wallet.username == offer.buyer_name).first()
            if wallet:
                wallet.balance += offer.price * offer.requirement_quantity
        # Restore inventory for cancelled SELL offers
        if offer.offer_type == "SELL":
            update_inventory(db, offer.buyer_name, offer.crop_name, offer.requirement_quantity, offer.unit)

    db.delete(offer)
    db.commit()
    return {"message": "Offer deleted successfully"}

class SellRequest(BaseModel):
    seller_name: str

@router.post("/{offer_id}/sell")
def sell_offer(offer_id: int, request: SellRequest, db: Session = Depends(get_db)):
    offer = db.query(models.MarketOffer).filter(models.MarketOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if not offer.is_active:
        raise HTTPException(status_code=400, detail="Offer is no longer active")
    if offer.offer_type != "BUY":
        raise HTTPException(status_code=400, detail="Can only sell to BUY offers")

    seller_wallet = get_or_create_wallet(db, request.seller_name)
    buyer_wallet = get_or_create_wallet(db, offer.buyer_name)

    cost = offer.price * offer.requirement_quantity

    # Buyer's balance was already deducted when they created the BUY offer.
    # Therefore, we only credit the seller.
    seller_wallet.balance += cost
    offer.is_active = False

    # Update inventory
    update_inventory(db, offer.buyer_name, offer.crop_name, offer.requirement_quantity, offer.unit)
    update_inventory(db, request.seller_name, offer.crop_name, -offer.requirement_quantity, offer.unit)

    transaction = models.Transaction(
        buyer_name=offer.buyer_name,
        seller_name=request.seller_name,
        amount=cost,
        crop_name=offer.crop_name
    )
    db.add(transaction)
    db.commit()

    return {"message": "Transaction successful", "cost": cost}
