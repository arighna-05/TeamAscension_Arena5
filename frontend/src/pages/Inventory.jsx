import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
];

function CoPilotVoice({ username, onInventoryUpdated }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'info', message }
  const [parsing, setParsing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const recognitionRef = useRef(null);

  const processTranscript = async (text) => {
    if (!text || text === 'Listening...') return;
    setParsing(true);
    setStatus({ type: 'info', message: `Processing: "${text}"` });

    try {
      // 1. Parse the voice command
      const parseRes = await fetch('/api/inventory/parse-voice-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!parseRes.ok) throw new Error('Parse failed');
      const parsed = await parseRes.json();

      if (parsed.confidence === 'low') {
        setStatus({ type: 'error', message: `⚠️ Couldn't understand clearly. Try: "Add 50 kg wheat" or "Sold 20 kg tomatoes"` });
        setParsing(false);
        return;
      }

      const quantityDelta = parsed.action === 'remove' ? -parsed.quantity : parsed.quantity;

      // 2. Apply the update
      const updateRes = await fetch('/api/inventory/voice-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_username: username,
          name: parsed.crop_name,
          quantity_delta: quantityDelta,
          unit: parsed.unit
        })
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.detail || 'Update failed');
      }

      const result = await updateRes.json();
      const verb = parsed.action === 'remove' ? 'Removed' : 'Added';
      setLastUpdate({
        action: parsed.action,
        crop: result.item,
        quantity: parsed.quantity,
        unit: result.unit,
        newQty: result.new_quantity
      });
      setStatus({
        type: 'success',
        message: `✅ ${verb} ${parsed.quantity} ${result.unit} of ${result.item}. New stock: ${result.new_quantity} ${result.unit}`
      });

      // 3. Refresh the inventory list in parent
      if (onInventoryUpdated) onInventoryUpdated();

    } catch (err) {
      setStatus({ type: 'error', message: `❌ ${err.message}` });
    } finally {
      setParsing(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => { setIsListening(true); setTranscript('Listening...'); setStatus(null); };
    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) current += event.results[i][0].transcript;
      setTranscript(current);
    };
    recognition.onerror = (e) => { setIsListening(false); setStatus({ type: 'error', message: 'Speech error: ' + e.error }); };
    recognition.onend = () => {
      setIsListening(false);
      // Auto-process when speech ends
      setTranscript(prev => {
        if (prev && prev !== 'Listening...') processTranscript(prev);
        return prev;
      });
    };

    recognition.start();
  };

  const statusColors = {
    success: 'bg-primary-container border-primary/30 text-on-primary-container',
    error: 'bg-error-container border-error/30 text-on-error-container',
    info: 'bg-secondary-container border-secondary/30 text-on-secondary-container'
  };

  return (
    <div className="w-full bg-primary rounded-2xl relative overflow-hidden mb-8 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-container/20 via-primary to-[#1a2e15] pointer-events-none"></div>

      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-20 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 px-3 py-1.5 flex items-center gap-2">
        <span className="material-symbols-outlined text-white/70 text-[18px]">language</span>
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
          disabled={isListening}
          className="bg-transparent text-white/90 text-sm font-label-bold focus:outline-none appearance-none cursor-pointer disabled:opacity-50 max-w-[160px]"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code} className="bg-stone-800 text-white">{l.flag} {l.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined text-white/50 text-[16px] pointer-events-none">expand_more</span>
      </div>

      <div className="relative z-10 p-8 flex flex-col items-center gap-6">
        <div className="text-center space-y-1">
          <h2 className="font-headline-lg text-white tracking-tight">Inventory Co-Pilot</h2>
          <p className="font-body-md text-primary-fixed-dim/80">Speak your inventory update in your language.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {[
              'Add 50 kg wheat',
              'Tomato 20 kg uthara',  // Tamil: "remove"
              '30 किलो चावल जोड़ा',   // Hindi: added 30 kg rice
              'Maize 100 kg adda',    // Telugu
            ].map(ex => (
              <span key={ex} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-mono">{ex}</span>
            ))}
          </div>
        </div>

        {/* Mic Button */}
        <button onClick={toggleListen} disabled={parsing} aria-label="Microphone toggle" className="relative group cursor-pointer disabled:opacity-60">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-[#4A6741] opacity-40 blur-xl scale-125 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary-fixed/30 scale-110 animate-ping" style={{ animationDuration: '2s' }}></div>
            </>
          )}
          <div className={`relative w-28 h-28 rounded-full bg-[#4A6741] flex items-center justify-center shadow-[0_0_40px_rgba(74,103,65,0.8)] ring-4 ring-[#4A6741]/50 border border-white/10 z-10 transition-transform ${isListening ? 'scale-95' : 'hover:scale-105 active:scale-95'}`}>
            {parsing
              ? <span className="material-symbols-outlined text-[48px] text-white animate-spin">autorenew</span>
              : <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{isListening ? 'mic' : 'mic_none'}</span>
            }
          </div>
        </button>
        <p className="text-white/60 text-sm">{isListening ? 'Tap to stop' : 'Tap to speak'}</p>

        {/* Live transcript */}
        {(isListening || transcript) && transcript !== '' && (
          <div className="w-full max-w-xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-white/90 font-body-lg leading-relaxed">"{transcript}"</p>
            {isListening && (
              <div className="flex justify-center gap-1.5 mt-3">
                {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${d}ms` }}></div>)}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {status && (
          <div className={`w-full max-w-xl border rounded-2xl p-4 text-center font-body-md ${statusColors[status.type]}`}>
            {status.message}
          </div>
        )}

        {/* Last update summary */}
        {lastUpdate && !status?.message.includes('Processing') && (
          <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <span className={`material-symbols-outlined text-3xl ${lastUpdate.action === 'remove' ? 'text-error' : 'text-primary-fixed'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {lastUpdate.action === 'remove' ? 'remove_circle' : 'add_circle'}
            </span>
            <div>
              <p className="font-label-bold text-white">{lastUpdate.crop}</p>
              <p className="text-white/60 text-sm">
                {lastUpdate.action === 'remove' ? '−' : '+'}{lastUpdate.quantity} {lastUpdate.unit} → now <b>{lastUpdate.newQty} {lastUpdate.unit}</b>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Inventory() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = currentUser?.displayName || 'Anonymous Farmer';

  const fetchInventory = useCallback(() => {
    fetch(`/api/inventory/${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch inventory', err); setLoading(false); });
  }, [username]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-bento-gap">
      <CoPilotVoice username={username} onInventoryUpdated={fetchInventory} />

      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-on-surface tracking-tight">Farm Inventory</h2>
          <p className="font-body-md text-outline mt-1">Real-time status of your silos and warehouses.</p>
        </div>
        <button onClick={fetchInventory} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-variant transition-colors font-label-bold text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-outline flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">inventory_2</span>
          <p className="font-body-md text-on-surface-variant">No inventory yet. Use the Co-Pilot above to add items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
          {items.map(item => (
            <div key={item.id} className="bento-card rounded-xl p-6 flex flex-col group relative overflow-hidden transition-all duration-300 hover:border-primary-container hover:shadow-md">
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${item.status === 'Good' ? 'bg-primary' : 'bg-error'}`}></div>

              <div className="flex justify-between items-start mb-4 z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-on-primary-container shadow-sm border border-outline-variant/30 ${item.status === 'Good' ? 'bg-primary-container' : 'bg-error-container text-error'}`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {item.type === 'crop' ? 'grass' : item.type === 'fertilizer' ? 'science' : 'water_drop'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-on-surface leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-1 text-outline mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="font-label-sm">{item.location || 'Warehouse'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto z-10 pt-4 border-t border-outline-variant/30 flex items-end justify-between">
                <div>
                  <span className="font-label-sm text-outline uppercase tracking-wider mb-1 block">Current Stock</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-xl text-on-surface tracking-tight leading-none">{item.quantity.toLocaleString()}</span>
                    <span className="font-body-md text-on-surface-variant font-medium">{item.unit}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${item.status === 'Good' ? 'bg-secondary-container/50 border-secondary-container text-on-secondary-container' : 'bg-error-container/50 border-error-container text-error'}`}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.status === 'Good' ? 'check_circle' : 'warning'}
                  </span>
                  <span className="font-label-bold text-xs">{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
