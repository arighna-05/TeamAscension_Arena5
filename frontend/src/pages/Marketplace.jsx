import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const { currentUser } = useAuth();

  // Role switcher: 'seller' uses the real logged-in username, 'buyer' uses a simulated buyer name
  const [role, setRole] = useState('seller'); // 'seller' or 'buyer'

  const realUsername = currentUser?.displayName || 'Anonymous Farmer';
  const buyerUsername = realUsername + '_buyer';
  const activeUsername = role === 'seller' ? realUsername : buyerUsername;

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'mine'
  const [showForm, setShowForm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsingVoice, setParsingVoice] = useState(false);

  // Inventory state for the SELL listing dropdown
  const [myInventory, setMyInventory] = useState([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  const [formData, setFormData] = useState({
    offer_type: 'SELL',
    crop_name: '',
    price: '',
    unit: 'kg',
    requirement_quantity: ''
  });

  // Fetch the user's inventory whenever the form opens
  const fetchMyInventory = async () => {
    try {
      const res = await fetch(`/api/inventory/${encodeURIComponent(realUsername)}`);
      const data = await res.json();
      const inv = Array.isArray(data) ? data.filter(i => i.quantity > 0) : [];
      setMyInventory(inv);
      return inv;
    } catch (err) {
      setMyInventory([]);
      return [];
    }
  };

  const fetchOffers = () => {
    setLoading(true);
    fetch('/api/marketplace/')
      .then(res => res.json())
      .then(data => { setOffers(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch marketplace offers', err); setLoading(false); });
  };

  useEffect(() => { fetchOffers(); }, []);

  // Open form and fetch inventory at the same time
  const openForm = () => {
    fetchMyInventory();
    setSelectedInventoryItem(null);
    setShowForm(true);
  };

  // When user picks an inventory item from the dropdown, auto-fill crop name + unit
  const handleInventorySelect = (itemId) => {
    const item = myInventory.find(i => i.id === parseInt(itemId));
    if (item) {
      setSelectedInventoryItem(item);
      setFormData(prev => ({
        ...prev,
        crop_name: item.name,
        unit: item.unit,
        requirement_quantity: ''
      }));
    } else {
      setSelectedInventoryItem(null);
      setFormData(prev => ({ ...prev, crop_name: '', unit: 'kg', requirement_quantity: '' }));
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech Recognition API is not supported in this browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setParsingVoice(true);
      try {
        const res = await fetch('/api/marketplace/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript })
        });
        if (res.ok) {
          const parsed = await res.json();
          let inventoryItemToSelect = null;
          
          if (parsed.offer_type === 'SELL') {
             const inv = await fetchMyInventory();
             inventoryItemToSelect = inv.find(i => 
               i.name.toLowerCase() === parsed.crop_name.toLowerCase() || 
               i.name.toLowerCase().includes(parsed.crop_name.toLowerCase()) || 
               parsed.crop_name.toLowerCase().includes(i.name.toLowerCase())
             );
          } else {
             fetchMyInventory();
          }

          setFormData({ 
            ...formData, 
            offer_type: parsed.offer_type, 
            crop_name: inventoryItemToSelect ? inventoryItemToSelect.name : parsed.crop_name, 
            unit: inventoryItemToSelect ? inventoryItemToSelect.unit : parsed.unit, 
            price: parsed.price, 
            requirement_quantity: parsed.quantity 
          });
          
          if (inventoryItemToSelect) {
            setSelectedInventoryItem(inventoryItemToSelect);
          } else {
            setSelectedInventoryItem(null);
          }
          setShowForm(true);
        } else { alert('Failed to parse voice input'); }
      } catch (err) { alert('Error parsing voice input'); }
      finally { setParsingVoice(false); }
    };
    recognition.onerror = (e) => { setIsListening(false); alert('Speech error: ' + e.error); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        buyer_name: activeUsername,
        offer_type: formData.offer_type,
        price: parseFloat(formData.price),
        unit: formData.unit,
        crop_name: formData.crop_name,
        requirement_quantity: parseFloat(formData.requirement_quantity),
        distance_km: Math.floor(Math.random() * 50) + 1,
        is_premium: false
      };
      const res = await fetch('/api/marketplace/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowForm(false);
        setFormData({ offer_type: 'SELL', crop_name: '', price: '', unit: 'kg', requirement_quantity: '' });
        fetchOffers();
        alert('Listing created successfully!');
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to create listing");
      }
    } catch (err) { console.error('Failed to create offer', err); }
  };

  const handleBuy = async (offer) => {
    if (!window.confirm(`Buy ${offer.requirement_quantity} ${offer.unit} of ${offer.crop_name} for $${(offer.price * offer.requirement_quantity).toFixed(2)}?`)) return;
    try {
      const res = await fetch(`/api/marketplace/${offer.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_name: activeUsername })
      });
      if (res.ok) { fetchOffers(); alert('✅ Purchase successful!'); }
      else { const e = await res.json(); alert(`❌ Failed to buy: ${e.detail || 'Unknown error'}`); }
    } catch (err) { alert('An error occurred during the purchase.'); }
  };

  const handleSellToBuyer = async (offer) => {
    if (!window.confirm(`Sell ${offer.requirement_quantity} ${offer.unit} of ${offer.crop_name} for $${(offer.price * offer.requirement_quantity).toFixed(2)}?`)) return;
    try {
      const res = await fetch(`/api/marketplace/${offer.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_name: activeUsername })
      });
      if (res.ok) { fetchOffers(); alert('✅ Sale successful!'); }
      else { const e = await res.json(); alert(`❌ Failed to sell: ${e.detail || 'Unknown error'}`); }
    } catch (err) { alert('An error occurred during the sale.'); }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      const res = await fetch(`/api/marketplace/${offerId}`, { method: 'DELETE' });
      if (res.ok) { fetchOffers(); alert('Listing deleted.'); }
      else { const e = await res.json(); alert(`Failed to delete: ${e.detail || 'Unknown error'}`); }
    } catch (err) { alert('An error occurred while deleting.'); }
  };

  // Tab filtering: browse = items you DID NOT list, mine = items you listed
  const myOffers = offers.filter(o => o.buyer_name === activeUsername);
  const browseOffers = offers.filter(o => o.buyer_name !== activeUsername);
  const filteredOffers = activeTab === 'browse' ? browseOffers : myOffers;

  const roleColor = role === 'seller' ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container';

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-bento-gap">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        <div>
          <h2 className="font-headline-lg text-on-surface tracking-tight">Marketplace</h2>
          <p className="font-body-md text-outline mt-1">Connect with local buyers and sellers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startVoiceRecognition} disabled={isListening || parsingVoice}
            className={`flex items-center justify-center p-2.5 rounded-xl transition-colors shadow-sm ${isListening ? 'bg-error text-white animate-pulse' : 'bg-secondary-container text-on-secondary-container hover:bg-secondary'}`}
            title="Create Listing by Voice">
            <span className="material-symbols-outlined text-[20px]">
              {isListening ? 'mic' : parsingVoice ? 'hourglass_empty' : 'mic_none'}
            </span>
          </button>
          <button onClick={openForm}
            className="bg-primary text-white font-label-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Listing
          </button>
        </div>
      </div>

      {/* Role Switcher Banner */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-primary">manage_accounts</span>
          <div>
            <p className="font-label-bold text-on-surface">Active Role</p>
            <p className="font-body-sm text-outline">
              Acting as: <span className="font-bold text-on-surface">{activeUsername}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surface-variant rounded-xl p-1">
          <button
            onClick={() => setRole('seller')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-bold text-sm transition-all ${role === 'seller' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            Seller
          </button>
          <button
            onClick={() => setRole('buyer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-bold text-sm transition-all ${role === 'buyer' ? 'bg-secondary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            Farmer/Buyer
          </button>
        </div>
      </div>

      {/* How-to hint */}
      <div className="flex items-start gap-2 bg-primary-container/40 border border-primary/20 rounded-xl px-4 py-3">
        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">tips_and_updates</span>
        <p className="font-body-sm text-on-surface-variant">
          <span className="font-bold text-on-surface">How to test:</span> Switch to <b>Seller</b> → create a listing. Then switch to <b>Farmer/Buyer</b> → browse &amp; buy that listing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        <button onClick={() => setActiveTab('browse')}
          className={`px-6 py-3 font-label-bold transition-colors flex items-center gap-2 ${activeTab === 'browse' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px]">explore</span>
          Browse & Trade
          {browseOffers.length > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{browseOffers.length}</span>}
        </button>
        <button onClick={() => setActiveTab('mine')}
          className={`px-6 py-3 font-label-bold transition-colors flex items-center gap-2 ${activeTab === 'mine' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          My Listings
          {myOffers.length > 0 && <span className="bg-outline text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{myOffers.length}</span>}
        </button>
      </div>

      {/* Empty state hint for browse tab */}
      {activeTab === 'browse' && !loading && browseOffers.length === 0 && (
        <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
          <p className="font-body-md text-on-surface-variant mb-2">No listings from others yet.</p>
          <p className="font-body-sm text-outline">Switch to <b>Seller</b> role → Create a listing → Switch back to <b>Farmer/Buyer</b> → Buy it here!</p>
        </div>
      )}

      {/* Offer Cards */}
      {loading ? (
        <div className="text-center py-10 flex flex-col items-center justify-center text-outline">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">sync</span>
          Loading marketplace offers...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-bento-gap">
          {filteredOffers.length === 0 && activeTab === 'mine' && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">add_circle</span>
              <p className="font-body-md text-on-surface-variant">You have no listings as <b>{activeUsername}</b>.</p>
              <p className="font-body-sm text-outline mt-1">Click "Create Listing" to add one.</p>
            </div>
          )}
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-0 overflow-hidden flex flex-col md:flex-row relative group hover:border-primary-container transition-colors duration-300">
              <div className={`w-full md:w-1.5 h-1.5 md:h-auto absolute top-0 left-0 md:bottom-0 ${offer.offer_type === 'BUY' ? 'bg-error' : 'bg-primary'}`}></div>
              <div className="p-6 flex-1 flex flex-col md:flex-row items-start md:items-center gap-6 z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-headline-md border border-outline-variant ${offer.is_premium ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-variant'}`}>
                    {offer.buyer_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-headline-md text-on-surface leading-tight">{offer.buyer_name}</h3>
                    <div className="flex items-center gap-1 text-outline mt-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="font-label-sm">{offer.distance_km} km away</span>
                      {offer.is_premium && <><span className="mx-1">•</span><span className="font-label-sm text-secondary">Premium</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex-1 hidden md:block"></div>
                <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                  <span className={`font-label-sm uppercase tracking-wider mb-1 px-2 py-0.5 rounded-md ${offer.offer_type === 'BUY' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                    {offer.offer_type === 'BUY' ? 'Wants to Buy' : 'Selling'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-headline-lg text-on-surface leading-none">${offer.price.toFixed(2)}</span>
                    <span className="font-body-md text-on-surface-variant">/ {offer.unit}</span>
                  </div>
                  <span className="font-label-bold text-on-surface-variant mt-1">{offer.crop_name}</span>
                  <span className="font-label-sm text-outline">Qty: {offer.requirement_quantity.toLocaleString()} {offer.unit}</span>
                  <span className="font-label-sm font-bold text-primary mt-1">Total: ${(offer.price * offer.requirement_quantity).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {activeTab === 'mine' ? (
                <div className="flex flex-col md:flex-row h-full">
                  <div onClick={() => handleDelete(offer.id)}
                    className="bg-error text-white md:w-32 flex flex-row md:flex-col items-center justify-center p-4 gap-2 cursor-pointer hover:bg-error-container hover:text-on-error-container transition-colors h-full">
                    <span className="material-symbols-outlined text-3xl">delete</span>
                    <span className="font-label-bold">Delete</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row h-full">
                  {offer.offer_type === 'SELL' ? (
                    <div onClick={() => handleBuy(offer)}
                      className="bg-primary text-white md:w-36 flex flex-row md:flex-col items-center justify-center p-4 gap-2 cursor-pointer hover:bg-primary-fixed-variant transition-colors h-full">
                      <span className="material-symbols-outlined text-3xl">shopping_cart_checkout</span>
                      <span className="font-label-bold text-center">Buy Now</span>
                    </div>
                  ) : (
                    <div onClick={() => handleSellToBuyer(offer)}
                      className="bg-secondary text-white md:w-36 flex flex-row md:flex-col items-center justify-center p-4 gap-2 cursor-pointer hover:bg-secondary-container hover:text-on-secondary-container transition-colors h-full">
                      <span className="material-symbols-outlined text-3xl">sell</span>
                      <span className="font-label-bold text-center">Sell Now</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-on-surface">Create Listing</h3>
                <p className="font-body-sm text-outline mt-0.5">Posting as <span className="font-bold text-primary">{activeUsername}</span></p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              <div>
                <label className="block font-label-bold text-on-surface-variant mb-1">Listing Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="offer_type" value="SELL" checked={formData.offer_type === 'SELL'} onChange={e => setFormData({...formData, offer_type: e.target.value})} className="text-primary focus:ring-primary" />
                    <span className="font-body-md">I want to Sell</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="offer_type" value="BUY" checked={formData.offer_type === 'BUY'} onChange={e => setFormData({...formData, offer_type: e.target.value})} className="text-primary focus:ring-primary" />
                    <span className="font-body-md">I want to Buy</span>
                  </label>
                </div>
              </div>

              {/* SELL: show inventory dropdown */}
              {formData.offer_type === 'SELL' ? (
                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-1">Select from Your Inventory</label>
                  {myInventory.length === 0 ? (
                    <div className="flex items-center gap-2 bg-error-container/40 border border-error/30 rounded-lg px-4 py-3">
                      <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                      <p className="font-body-sm text-on-error-container">No inventory items found. Add items via the <b>Inventory</b> page first.</p>
                    </div>
                  ) : (
                    <>
                      <select
                        required
                        value={selectedInventoryItem ? selectedInventoryItem.id : ''}
                        onChange={e => handleInventorySelect(e.target.value)}
                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary"
                      >
                        <option value="">— Pick a crop from your inventory —</option>
                        {myInventory.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.quantity} {item.unit} available)
                          </option>
                        ))}
                      </select>
                      {selectedInventoryItem && (
                        <p className="font-label-sm text-outline mt-1">
                          Available stock: <span className="font-bold text-primary">{selectedInventoryItem.quantity} {selectedInventoryItem.unit}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-1">Crop Name</label>
                  <input required type="text" value={formData.crop_name} onChange={e => setFormData({...formData, crop_name: e.target.value})}
                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" placeholder="e.g. Organic Tomatoes" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-1">Quantity</label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    max={formData.offer_type === 'SELL' && selectedInventoryItem ? selectedInventoryItem.quantity : undefined}
                    value={formData.requirement_quantity}
                    onChange={e => setFormData({...formData, requirement_quantity: e.target.value})}
                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary"
                    placeholder={formData.offer_type === 'SELL' && selectedInventoryItem ? `Max: ${selectedInventoryItem.quantity}` : 'e.g. 500'}
                  />
                  {formData.offer_type === 'SELL' && selectedInventoryItem && parseFloat(formData.requirement_quantity) > selectedInventoryItem.quantity && (
                    <p className="font-label-sm text-error mt-1">⚠ Exceeds available stock ({selectedInventoryItem.quantity} {selectedInventoryItem.unit})</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-bold text-on-surface-variant mb-1">Unit</label>
                  {/* Lock unit to inventory unit for SELL offers */}
                  {formData.offer_type === 'SELL' && selectedInventoryItem ? (
                    <div className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-outline">lock</span>
                      {selectedInventoryItem.unit}
                    </div>
                  ) : (
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}
                      className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary">
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                      <option value="lbs">lbs</option>
                      <option value="units">units</option>
                      <option value="bu">bu</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-label-bold text-on-surface-variant mb-1">Price per {formData.unit}</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-on-surface-variant">$</span>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-surface-variant border border-outline-variant rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary" placeholder="0.00" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setSelectedInventoryItem(null); }}
                  className="flex-1 py-3 font-label-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors border border-outline-variant">Cancel</button>
                <button
                  type="submit"
                  disabled={formData.offer_type === 'SELL' && myInventory.length === 0}
                  className="flex-1 py-3 font-label-bold text-white bg-primary hover:bg-primary-fixed-variant rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >Post Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
