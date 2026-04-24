import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';export default function Scanner() {
  const [scanStatus, setScanStatus] = useState('idle'); // idle, requesting, active, scanning, result
  const [scanResult, setScanResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setScanStatus('requesting');
    setImagePreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanStatus('active');
    } catch (err) {
      console.error("Camera access denied or failed", err);
      alert("Failed to access camera. Please allow permissions or use file upload.");
      setScanStatus('idle');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setScanStatus('active');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setScanStatus('active');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const startScan = async () => {
    setScanStatus('scanning');
    
    let imageData = imagePreview;

    // If no image preview but camera is active, capture frame from video
    if (!imageData && streamRef.current && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      imageData = canvas.toDataURL('image/jpeg');
      setImagePreview(imageData);
    }

    if (!imageData) {
      alert("Please capture an image or upload one first.");
      setScanStatus('active');
      return;
    }

    try {
      const res = await fetch('/api/scanner/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData })
      });
      const data = await res.json();
      
      const newResult = {
        ...data,
        timestamp: new Date().toLocaleString()
      };
      
      setScanResult(newResult);
      setScanHistory(prev => [newResult, ...prev]);
      setScanStatus('result');
      stopCamera();
    } catch (err) {
      console.error(err);
      alert('Failed to analyze image.');
      setScanStatus('active');
    }
  };

  const resetScanner = () => {
    setScanStatus('idle');
    setScanResult(null);
    setImagePreview(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-bento-gap h-[calc(100vh-140px)]">
      <div className="mb-4 flex-shrink-0">
        <h2 className="font-headline-lg text-on-surface tracking-tight">Crop Scanner</h2>
        <p className="font-body-md text-outline mt-1">Diagnose diseases using AI vision.</p>
      </div>

      <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-outline-variant shadow-sm bg-surface-container-lowest flex flex-col">
        
        {scanStatus === 'idle' && (
          <div 
            className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors ${isDragging ? 'bg-primary/10 border-2 border-dashed border-primary m-4 rounded-2xl' : 'bg-surface-container-lowest'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="material-symbols-outlined text-6xl text-primary mb-4">document_scanner</span>
            <h3 className="font-headline-md text-on-surface mb-2">Ready to Scan</h3>
            <p className="font-body-md text-on-surface-variant mb-8 max-w-md">
              Use your device's camera or upload a photo of the affected plant to receive an instant diagnostic report.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mb-8">
              <button 
                onClick={startCamera}
                className="flex-1 bg-primary hover:bg-primary-fixed-variant text-white font-label-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Open Camera
              </button>
              <button 
                onClick={triggerUpload}
                className="flex-1 bg-surface-variant hover:bg-surface-container-highest text-on-surface font-label-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors border border-outline-variant"
              >
                <span className="material-symbols-outlined">upload_file</span>
                Upload Image
              </button>
            </div>
            
            {scanHistory.length > 0 && (
              <div className="w-full max-w-2xl text-left mt-4 border-t border-outline-variant pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-label-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">history</span>
                    Recent Scans
                  </h4>
                  <button onClick={() => setScanHistory([])} className="text-xs font-label-bold text-outline hover:text-error transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">delete</span> Clear
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {scanHistory.map((scan, i) => (
                    <div key={i} className="flex justify-between items-center bg-surface-variant/50 p-3 rounded-xl border border-outline-variant hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setScanResult(scan); setScanStatus('result'); }}>
                      <div>
                        <p className="font-label-bold text-on-surface">{scan.disease}</p>
                        <p className="font-body-sm text-outline">{scan.crop_name} • {scan.timestamp}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${scan.disease === 'Healthy Crop' ? 'bg-primary-container text-primary' : 'bg-error-container text-error'}`}>
                        {Math.round(scan.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
          </div>
        )}

        {(scanStatus === 'requesting' || scanStatus === 'active' || scanStatus === 'scanning') && (
          <div className="relative flex-1 bg-stone-900 group flex items-center justify-center overflow-hidden">
            {scanStatus === 'requesting' && (
              <div className="absolute z-10 flex flex-col items-center justify-center text-white">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4">sync</span>
                <p className="font-label-bold">Requesting camera access...</p>
              </div>
            )}
            
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className={`w-full h-full object-cover opacity-80 ${scanStatus === 'scanning' ? 'scale-105 blur-sm' : ''} transition-all duration-700`} />
            ) : (
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                className={`w-full h-full object-cover opacity-80 ${scanStatus === 'scanning' ? 'scale-105 blur-sm' : ''} transition-all duration-700`} 
              />
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
              <div className="bg-stone-950/60 backdrop-blur-md px-6 py-3 rounded-full text-white font-label-bold text-sm border border-white/10 shadow-lg mt-4 transition-transform duration-300 transform translate-y-0 group-hover:-translate-y-2">
                {scanStatus === 'scanning' ? 'Analyzing tissue patterns...' : 'Center leaf within frame'}
              </div>

              <div className="relative w-64 h-64 md:w-80 md:h-80 my-auto pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                
                {scanStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/40 to-transparent w-full h-8 opacity-75 blur-md animate-[scan_2s_ease-in-out_infinite]"></div>
                )}
              </div>

              <div className="w-full max-w-md flex flex-col gap-4 mb-4 pointer-events-auto">
                <div className="flex gap-4 items-center justify-center">
                  <button 
                    onClick={resetScanner}
                    disabled={scanStatus === 'scanning'}
                    className="w-12 h-12 rounded-full bg-stone-800/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <button 
                    onClick={startScan}
                    disabled={scanStatus === 'scanning'}
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white flex items-center justify-center hover:bg-white/40 hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <div className={`w-14 h-14 rounded-full bg-white shadow-inner ${scanStatus === 'scanning' ? 'animate-pulse' : ''}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {scanStatus === 'result' && scanResult && (
          <div className="flex-1 bg-surface-container-lowest p-6 md:p-10 overflow-y-auto animate-fade-in">
            <button onClick={resetScanner} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 transition-colors font-label-bold">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Scanner
            </button>

            {/* Header: crop name + disease + confidence */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                scanResult.disease === 'Healthy Crop' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'
              }`}>
                <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings:"'FILL' 1"}}>
                  {scanResult.disease === 'Healthy Crop' ? 'eco' : 'coronavirus'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-outline uppercase tracking-wider mb-0.5">{scanResult.crop_name}</p>
                <h3 className="font-headline-lg text-on-surface leading-tight">{scanResult.disease}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`font-label-bold px-2 py-0.5 rounded-md text-sm ${
                    scanResult.disease === 'Healthy Crop' ? 'text-primary bg-primary/10' : 'text-error bg-error/10'
                  }`}>
                    {Math.round(scanResult.confidence * 100)}% Confidence
                  </span>
                  <span className="font-label-sm text-outline">AI Diagnostic Report</span>
                </div>
              </div>
            </div>

            {/* Quality Score Bar */}
            {scanResult.quality_score !== undefined && (() => {
              const qs = scanResult.quality_score;
              const ql = scanResult.quality_label || 'Fair';
              const barColor = qs >= 90 ? '#22c55e' : qs >= 70 ? '#84cc16' : qs >= 50 ? '#eab308' : qs >= 30 ? '#f97316' : '#ef4444';
              const labelColor = qs >= 90 ? 'text-green-600 bg-green-50 border-green-200' : qs >= 70 ? 'text-lime-600 bg-lime-50 border-lime-200' : qs >= 50 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : qs >= 30 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-red-600 bg-red-50 border-red-200';
              return (
                <div className="mb-6 bg-surface-variant rounded-xl p-5 border border-outline-variant">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-headline-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{fontVariationSettings:"'FILL' 1"}}>monitor_heart</span>
                      Crop Quality Score
                    </h4>
                    <span className={`font-label-bold text-sm px-3 py-1 rounded-full border ${labelColor}`}>{ql}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-outline-variant/30 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-4 rounded-full transition-all duration-1000"
                        style={{ width: `${qs}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="font-headline-md text-on-surface w-14 text-right" style={{color: barColor}}>{qs}/100</span>
                  </div>
                  {scanResult.color_analysis && (
                    <p className="font-body-sm text-outline mt-2 italic">{scanResult.color_analysis}</p>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-variant rounded-xl p-5 border border-outline-variant">
                <h4 className="font-headline-sm text-on-surface flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  Key Symptoms
                </h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  {scanResult.symptoms}
                </p>
              </div>

              <div className="bg-surface-variant rounded-xl p-5 border border-outline-variant">
                <h4 className="font-headline-sm text-on-surface flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-error">trending_down</span>
                  Estimated Impact
                </h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  {scanResult.impact}
                </p>
              </div>

              <div className="bg-primary-container rounded-xl p-5 md:col-span-2 border border-primary/20">
                <h4 className="font-headline-sm text-on-primary-container flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">medical_services</span>
                  Recommended Treatment Protocol
                </h4>
                <p className="font-body-md text-on-primary-container leading-relaxed">
                  {scanResult.treatment}
                </p>
                <div className="mt-4 flex gap-3">
                  <Link to="/inventory" className="bg-primary text-white font-label-bold px-5 py-2 rounded-lg hover:bg-primary-fixed-variant transition-colors shadow-sm inline-block text-center">
                    Log in Inventory
                  </Link>
                  <Link to="/marketplace" className="bg-surface-container-lowest text-primary font-label-bold px-5 py-2 rounded-lg hover:bg-surface-variant transition-colors border border-primary/20 inline-block text-center">
                    Find Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; transform: translateY(-100%); }
          100% { top: 0%; }
        }
      `}} />
    </div>
  );
}
