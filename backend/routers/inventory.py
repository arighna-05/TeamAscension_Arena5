from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import re

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"]
)

@router.get("/{username}", response_model=List[schemas.InventoryItemResponse])
def read_inventory(username: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.InventoryItem).filter(models.InventoryItem.owner_username == username).offset(skip).limit(limit).all()
    return items

@router.post("/", response_model=schemas.InventoryItemResponse)
def create_inventory_item(item: schemas.InventoryItemCreate, db: Session = Depends(get_db)):
    db_item = models.InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

class InventoryUpdateRequest(BaseModel):
    owner_username: str
    name: str
    quantity_delta: float  # positive = add, negative = remove
    unit: str

@router.post("/voice-update")
def voice_update_inventory(req: InventoryUpdateRequest, db: Session = Depends(get_db)):
    """Adds or removes quantity from an existing inventory item, or creates a new one."""
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.owner_username == req.owner_username,
        models.InventoryItem.name.ilike(req.name)
    ).first()

    if item:
        item.quantity += req.quantity_delta
        if item.quantity < 0:
            item.quantity = 0
    else:
        if req.quantity_delta > 0:
            item = models.InventoryItem(
                owner_username=req.owner_username,
                name=req.name,
                type="crop",
                quantity=req.quantity_delta,
                unit=req.unit,
                status="Good",
                location="Warehouse"
            )
            db.add(item)
        else:
            raise HTTPException(status_code=404, detail=f"Item '{req.name}' not found in inventory")

    db.commit()
    db.refresh(item)
    return {"message": "Inventory updated", "item": item.name, "new_quantity": item.quantity, "unit": item.unit}


class VoiceInventoryParseRequest(BaseModel):
    text: str

class VoiceInventoryParseResponse(BaseModel):
    action: str          # "add" or "remove"
    crop_name: str
    quantity: float
    unit: str
    confidence: str      # "high" or "low"

@router.post("/parse-voice-inventory", response_model=VoiceInventoryParseResponse)
def parse_voice_inventory(req: VoiceInventoryParseRequest):
    """Parse a natural-language inventory update command (multi-language supported)."""
    text = req.text.lower().strip()

    # ─── Action detection ────────────────────────────────────────────────────
    remove_keywords = [
        # English
        "remove", "sold", "sell", "used", "consumed", "reduce", "decrease", "subtracted", "take out", "took out",
        # Hindi
        "nikala", "nikalo", "nikali", "becha", "becho", "hatao", "ghata", "ghatao", "upyog kiya",
        "निकाल", "निकालो", "बेचा", "बेचो", "हटाओ", "घटाओ", "उपयोग",
        # Tamil
        "vittathen", "kondupoi", "kuraichu",
        "நீக்கு", "எடுத்தேன்", "விற்றேன்", "குறை",
        # Telugu
        "teesaanu", "ammaanu", "teeyandi",
        "తీసే", "అమ్మిన", "తగ్గించు",
        # Kannada
        "maarida", "tagondi", "kammi",
        "ತೆಗೆ", "మారిద", "కమ్మి",
        # Marathi
        "vikle", "kadhle", "vaprale",
        "काढले", "विकले", "वापरले",
        # Bengali
        "becheci", "sariye", "niye geci",
        "সরিয়ে", "বেচেছি", "নিয়ে",
        # Gujarati
        "vecyu", "kadhyu", "vaparyun",
        "કાઢ્યું", "વેચ્યું", "વાપર્યું",
        # Punjabi
        "vichiya", "kaddha", "ghataiya",
        "ਕੱਢੋ", "ਵੇਚੋ", "ਘਟਾਓ",
        # Malayalam
        "vitathu", "eduthu", "kuracchathu",
        "എടുത്തു", "വിറ്റു", "കുറച്ചു"
    ]
    add_keywords = [
        # English
        "add", "added", "harvest", "harvested", "received", "got", "bought", "increase", "more", "put", "stored", "stock",
        # Hindi
        "joda", "jodo", "mila", "mile", "aaya", "aaye", "rakha", "barha", "barho", "store kiya",
        "जोड़", "जोड़ो", "मिला", "आया", "रखा", "बढ़ाओ",
        # Tamil
        "seerththa", "serntha", "vaanginen", "kootti",
        "சேர்", "சேர்த்தேன்", "வாங்கினேன்", "கூட்டு",
        # Telugu
        "vesaanu", "pettaanu", "kosuku",
        "వేయి", "పెట్టు", "కొను",
        # Kannada
        "hakkondi", "hogisida", "serisi",
        "ಸೇರಿಸು", "ಹಾকু", "ತಂದೆ",
        # Marathi
        "takle", "milale", "jevale",
        "टाकले", "मिळाले", "जोडले",
        # Bengali
        "rakheci", "pechi", "jogyar",
        "রাখুন", "পেয়েছি", "যোগ",
        # Gujarati
        "muku", "rakhu", "laavu",
        "મૂકો", "રાખ્યું", "લાવ્યું",
        # Punjabi
        "rakho", "paaya", "vadhaya",
        "ਰੱਖੋ", "ਪਾਇਆ", "ਵਧਾਓ",
        # Malayalam
        "vecchathu", "kittichathu", "koottiyathu",
        "വെച്ചു", "കിട്ടി", "കൂട്ടി"
    ]

    action = "add"  # default
    for kw in remove_keywords:
        if kw in text:
            action = "remove"
            break
    if action == "add":
        for kw in add_keywords:
            if kw in text:
                action = "add"
                break

    # ─── Quantity & Unit ─────────────────────────────────────────────────────
    unit_map = {
        "kg": ["kg", "kilo", "kilogram", "kilograms", "किलो", "கிலோ", "కిలో"],
        "tons": ["ton", "tons", "tonne", "tonnes", "टन"],
        "lbs": ["lb", "lbs", "pound", "pounds"],
        "bu": ["bu", "bushel", "bushels"],
        "units": ["unit", "units", "piece", "pieces", "pcs"],
        "liters": ["liter", "liters", "litre", "litres", "l"],
    }

    quantity = 0.0
    unit = "kg"

    # Try unit-attached pattern: "50 kg", "100 tons"
    for unit_key, unit_variants in unit_map.items():
        for uv in unit_variants:
            match = re.search(rf'(\d+(?:\.\d+)?)\s*{re.escape(uv)}\b', text)
            if match:
                quantity = float(match.group(1))
                unit = unit_key
                break
        if quantity > 0:
            break

    # Fallback: just grab first number
    if quantity == 0:
        nums = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        if nums:
            quantity = float(nums[0])

    # ─── Crop name ────────────────────────────────────────────────────────────
    stop_words = set([
        "i", "have", "has", "just", "now", "please", "the", "a", "an", "of", "my",
        "add", "added", "remove", "removed", "sold", "sell", "used", "received", "harvested",
        "harvest", "got", "bought", "increase", "more", "put", "store", "stored", "stock",
        "reduce", "decrease", "take", "out", "from", "to", "and", "for", "with",
        # units
        "kg", "kilo", "kilogram", "ton", "tons", "lbs", "lb", "bu", "bushel", "unit", "units", "liter", "litre",
        # Hindi stop words
        "mera", "meri", "mere", "ki", "ke", "ka", "hai", "hain", "se", "ko", "ne",
        "joda", "jodo", "mila", "becha", "nikala", "hatao", "rakha",
    ])

    words = re.sub(r'[^\w\s]', '', text).split()
    crop_words = [w.capitalize() for w in words if w.isalpha() and w not in stop_words and len(w) > 2]
    # Remove numeric strings that slipped through
    crop_name = " ".join(crop_words).strip() or "Unknown Crop"

    confidence = "high" if quantity > 0 and crop_name != "Unknown Crop" else "low"

    if action == "remove":
        quantity = -abs(quantity)

    return VoiceInventoryParseResponse(
        action=action,
        crop_name=crop_name,
        quantity=abs(quantity),
        unit=unit,
        confidence=confidence
    )
