from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api/wallet",
    tags=["wallet"]
)

@router.get("/{username}", response_model=schemas.WalletResponse)
def get_wallet(username: str, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.username == username).first()
    if not wallet:
        # Create default wallet for new users with $1,000 starting balance
        wallet = models.Wallet(username=username, balance=1000.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@router.post("/{username}/add_funds", response_model=schemas.WalletResponse)
def add_funds(username: str, request: schemas.AddFundsRequest, db: Session = Depends(get_db)):
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
        
    wallet = db.query(models.Wallet).filter(models.Wallet.username == username).first()
    if not wallet:
        wallet = models.Wallet(username=username, balance=1000.0)
        db.add(wallet)
    
    wallet.balance += request.amount
    
    # Optionally record this as a deposit transaction
    transaction = models.Transaction(
        buyer_name=username,
        seller_name="Bank Deposit",
        amount=request.amount,
        crop_name="Funds Deposit"
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(wallet)
    return wallet

@router.get("/{username}/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(username: str, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        (models.Transaction.buyer_name == username) | 
        (models.Transaction.seller_name == username)
    ).order_by(models.Transaction.timestamp.desc()).all()
    return transactions
