from backend.database import SessionLocal, engine
from backend import models

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if data already exists
if db.query(models.InventoryItem).count() == 0:
    items = [
        models.InventoryItem(owner_username="Anonymous Farmer", name="Hard Red Winter Wheat", type="crop", quantity=42500, unit="bu", status="Good", location="Silo A"),
        models.InventoryItem(owner_username="Anonymous Farmer", name="Non-GMO Soybeans", type="crop", quantity=18200, unit="bu", status="Needs Review", location="Silo B"),
        models.InventoryItem(owner_username="Anonymous Farmer", name="Yellow Corn", type="crop", quantity=85000, unit="bu", status="Good", location="Silo C"),
        models.InventoryItem(owner_username="Anonymous Farmer", name="Nitrogen Fertilizer", type="fertilizer", quantity=4.5, unit="tons", status="Good", location="Warehouse 1"),
        models.InventoryItem(owner_username="Anonymous Farmer", name="Organic Pesticide", type="chemical", quantity=120, unit="gal", status="Needs Review", location="Warehouse 2")
    ]
    db.add_all(items)

if db.query(models.MarketOffer).count() == 0:
    offers = [
        models.MarketOffer(buyer_name="Midwest Mills", offer_type="BUY", price=6.45, unit="bu", crop_name="Hard Red Winter Wheat", requirement_quantity=5000, distance_km=24, is_premium=False),
        models.MarketOffer(buyer_name="Apex Processing", offer_type="SELL", price=12.80, unit="bu", crop_name="Non-GMO Soybeans", requirement_quantity=2000, distance_km=42, is_premium=True),
        models.MarketOffer(buyer_name="Valley Organics", offer_type="BUY", price=5.90, unit="bu", crop_name="Yellow Corn", requirement_quantity=10000, distance_km=18, is_premium=False)
    ]
    db.add_all(offers)

if db.query(models.Wallet).count() == 0:
    wallet = models.Wallet(username="Anonymous Farmer", balance=1000000.0)
    db.add(wallet)

db.commit()
db.close()

print("Database seeded successfully with 'Anonymous Farmer' data!")
