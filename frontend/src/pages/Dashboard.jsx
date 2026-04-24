import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const username = currentUser?.displayName || 'Anonymous Farmer';

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, invRes, mktRes] = await Promise.all([
        fetch(`/api/wallet/${encodeURIComponent(username)}`),
        fetch(`/api/wallet/${encodeURIComponent(username)}/transactions`),
        fetch(`/api/inventory/${encodeURIComponent(username)}`),
        fetch('/api/marketplace/')
      ]);
      
      const [walletData, txData, invData, mktData] = await Promise.all([
        walletRes.json(),
        txRes.json(),
        invRes.json(),
        mktRes.json()
      ]);

      setWallet(walletData);
      setTransactions(txData);
      setInventory(invData);
      setOffers(mktData);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleQuickBuy = async (offer) => {
    try {
      const payload = { buyer_name: username };
      const res = await fetch(`/api/marketplace/${offer.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
        alert('Quick Purchase successful!');
      } else {
        const errData = await res.json();
        alert(`Failed to buy: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSell = async (offer) => {
    try {
      const payload = { seller_name: username };
      const res = await fetch(`/api/marketplace/${offer.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
        alert('Quick Sale successful!');
      } else {
        const errData = await res.json();
        alert(`Failed to sell: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">sync</span>
        <p className="font-label-bold text-on-surface-variant">Gathering farm intelligence...</p>
      </div>
    );
  }

  // Derived metrics
  const recentTx = transactions.slice(0, 3);
  const activeMarketOffers = offers.slice(0, 4);
  const totalInventoryQuantity = inventory.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-bento-gap pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-1">Command Dashboard</h1>
          <p className="font-body-md text-on-surface-variant">Live overview of your farm's operations and market status.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/inventory" className="bg-surface-variant text-on-surface hover:bg-surface-container-high transition-colors px-4 py-2 rounded-xl font-label-bold flex items-center gap-2 border border-outline-variant">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            Manage Inventory
          </Link>
          <Link to="/marketplace" className="bg-primary text-white hover:bg-primary-fixed-variant transition-colors px-4 py-2 rounded-xl font-label-bold flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            Go to Market
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-bento-gap auto-rows-min">
        {/* Wallet & Financials */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:col-span-7 flex flex-col justify-between hover:border-primary/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          <div className="z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                Financial Overview
              </h2>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Live
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div>
                <p className="font-label-sm text-outline uppercase tracking-wider mb-1">Available Balance</p>
                <p className="font-display-sm text-on-surface">${wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
              </div>
              <div className="sm:border-l border-outline-variant sm:pl-6">
                <p className="font-label-sm text-outline uppercase tracking-wider mb-1">Total Transactions</p>
                <p className="font-headline-lg text-on-surface">{transactions.length}</p>
              </div>
            </div>
          </div>

          <div className="z-10">
            <h3 className="font-label-bold text-on-surface-variant mb-3 border-b border-outline-variant/50 pb-2">Recent Activity</h3>
            {recentTx.length > 0 ? (
              <div className="space-y-3">
                {recentTx.map(tx => {
                  const isBuyer = tx.buyer_name === username;
                  return (
                    <div key={tx.id} className="flex justify-between items-center group/item hover:bg-surface-variant/50 p-2 -mx-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuyer ? 'bg-error-container text-error' : 'bg-primary-container text-primary'}`}>
                          <span className="material-symbols-outlined text-[18px]">{isBuyer ? 'shopping_cart' : 'payments'}</span>
                        </div>
                        <div>
                          <p className="font-label-bold text-on-surface">{tx.crop_name}</p>
                          <p className="font-body-sm text-outline">{new Date(tx.timestamp).toLocaleDateString()} • {isBuyer ? `Bought from ${tx.seller_name}` : `Sold to ${tx.buyer_name}`}</p>
                        </div>
                      </div>
                      <span className={`font-label-bold ${isBuyer ? 'text-error' : 'text-primary'}`}>
                        {isBuyer ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-outline text-sm italic">No recent transactions.</p>
            )}
            <Link to="/wallet" className="inline-block mt-4 text-primary font-label-bold hover:underline text-sm flex items-center gap-1">View full wallet history <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:col-span-5 flex flex-col hover:border-secondary/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          <div className="z-10 flex-1 flex flex-col">
            <h2 className="font-headline-md flex items-center gap-2 text-on-surface mb-6">
              <span className="material-symbols-outlined text-secondary">warehouse</span>
              Storage Overview
            </h2>
            
            <div className="flex items-end gap-2 mb-6">
              <span className="font-display-sm text-on-surface">{totalInventoryQuantity.toLocaleString()}</span>
              <span className="font-body-md text-outline pb-1.5">Total Units in Stock</span>
            </div>

            <div className="flex-1">
              <h3 className="font-label-bold text-on-surface-variant mb-3 border-b border-outline-variant/50 pb-2">Top Products</h3>
              {inventory.length > 0 ? (
                <div className="space-y-4 pt-1">
                  {inventory.slice(0, 4).map(item => (
                    <div key={item.id}>
                      <div className="flex justify-between font-label-sm text-on-surface-variant mb-1.5">
                        <span className="font-bold text-on-surface">{item.name}</span>
                        <span className="font-bold text-primary">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full ${item.status === 'Needs Review' ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min((item.quantity / (totalInventoryQuantity || 1)) * 100 + 10, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-outline-variant rounded-xl bg-surface-variant/30 mt-4">
                  <p className="text-on-surface-variant font-body-sm">Your inventory is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weather & Environment Widget */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:col-span-4 flex flex-col hover:border-info/30 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          <div className="z-10 flex-1 flex flex-col">
            <h2 className="font-headline-md flex items-center gap-2 text-on-surface mb-6">
              <span className="material-symbols-outlined text-blue-500">routine</span>
              Environment
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <span className="material-symbols-outlined text-5xl text-blue-400">partly_cloudy_day</span>
              <div>
                <div className="font-display-sm text-on-surface">24°C</div>
                <div className="font-body-md text-outline">Partly Cloudy</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-outline uppercase">Soil Moisture</span>
                <span className="font-label-bold text-primary">42% (Optimal)</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-label-sm text-outline uppercase">Humidity</span>
                <span className="font-label-bold text-blue-500">65%</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Tasks Widget */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:col-span-8 flex flex-col hover:border-primary/30 transition-colors group relative overflow-hidden">
          <div className="z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-md flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary">checklist</span>
                Daily Tasks
              </h2>
              <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2 py-1 rounded-md">3 Pending</span>
            </div>
            <div className="space-y-3">
              {[
                { id: 1, title: 'Water tomatoes in Sector B', time: '08:00 AM', priority: 'High', done: false },
                { id: 2, title: 'Inspect wheat for rust symptoms', time: '10:30 AM', priority: 'Medium', done: false },
                { id: 3, title: 'Refill silo 2 with fertilizer', time: '02:00 PM', priority: 'Low', done: true },
                { id: 4, title: 'Review new market offers', time: '05:00 PM', priority: 'Medium', done: false }
              ].map(task => (
                <div key={task.id} className={`flex items-center gap-4 p-3 rounded-xl border ${task.done ? 'bg-surface-variant/30 border-transparent opacity-60' : 'bg-surface-container border-outline-variant hover:border-primary/50'} transition-colors`}>
                  <button className={`w-6 h-6 rounded-md flex items-center justify-center border ${task.done ? 'bg-primary border-primary text-white' : 'border-outline text-transparent hover:border-primary'} transition-colors`}>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>
                  <div className="flex-1">
                    <p className={`font-label-bold ${task.done ? 'line-through text-outline' : 'text-on-surface'}`}>{task.title}</p>
                    <p className="font-body-sm text-outline">{task.time}</p>
                  </div>
                  {!task.done && (
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${task.priority === 'High' ? 'bg-error-container text-error' : task.priority === 'Medium' ? 'bg-secondary-container text-secondary' : 'bg-surface-variant text-outline'}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Marketplace Activity */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:col-span-12 hover:border-error/30 transition-colors">
          <div className="flex justify-between items-center border-b border-outline-variant/50 pb-4 mb-4">
            <h2 className="font-headline-md flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-error animate-pulse">campaign</span>
              Live Market Opportunities
            </h2>
            <Link to="/marketplace" className="text-primary font-label-bold text-sm hover:underline flex items-center gap-1">See all <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeMarketOffers.length > 0 ? (
              activeMarketOffers.map(offer => (
                <div key={offer.id} className="border border-outline-variant rounded-xl p-4 flex flex-col justify-between hover:border-primary-container hover:shadow-sm transition-all bg-surface-variant/10 group">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider ${offer.offer_type === 'BUY' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                        {offer.offer_type === 'BUY' ? 'Wants to Buy' : 'Selling'}
                      </span>
                      <span className="font-label-sm text-outline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{offer.distance_km}km</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-xs font-bold">
                        {offer.buyer_name.substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="font-headline-sm text-on-surface truncate">{offer.buyer_name}</h3>
                    </div>
                    <p className="font-label-bold text-on-surface mt-2">{offer.crop_name}</p>
                    <p className="font-body-sm text-on-surface-variant mb-4">{offer.requirement_quantity} {offer.unit} <span className="mx-1">•</span> <span className="font-bold text-on-surface">${offer.price}/{offer.unit}</span></p>
                  </div>
                  
                  {offer.offer_type === 'SELL' ? (
                    <button onClick={() => handleQuickBuy(offer)} className="w-full bg-primary text-white py-2 rounded-lg font-label-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-sm group-hover:-translate-y-0.5">
                      <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span> Quick Buy
                    </button>
                  ) : (
                    <button onClick={() => handleQuickSell(offer)} className="w-full bg-surface-container-high border border-outline-variant text-on-surface py-2 rounded-lg font-label-bold text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:border-primary transition-colors group-hover:-translate-y-0.5">
                      <span className="material-symbols-outlined text-[16px]">sell</span> Quick Sell
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-on-surface-variant bg-surface-variant/30 rounded-xl border border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-4xl mb-2 text-outline">store_off</span>
                <p className="font-body-md">No active local market offers currently available.</p>
                <Link to="/marketplace" className="inline-block mt-4 text-primary font-label-bold hover:underline">Create the first listing</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
