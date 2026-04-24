import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WindowsLoader from '../components/WindowsLoader';

export default function Settings() {
  const { currentUser, logout, updateUserProfile } = useAuth();
  
  const [farmName, setFarmName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFarmName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({ displayName: farmName });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-bento-gap relative">
      <div className="mb-4">
        <h2 className="font-headline-lg text-on-surface tracking-tight">Settings</h2>
        <p className="font-body-md text-outline mt-1">Manage your farm profile and preferences.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <h3 className="font-headline-md text-on-surface mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block font-label-bold text-on-surface-variant mb-1">Farm Name</label>
            <input 
              type="text" 
              className="w-full bg-surface-variant border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors" 
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-label-bold text-on-surface-variant mb-1">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-surface-container-highest border border-outline-variant rounded-md px-3 py-2 text-on-surface opacity-60 cursor-not-allowed focus:outline-none" 
              value={email}
              readOnly
              disabled
            />
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <h3 className="font-headline-md text-on-surface mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" 
              checked={weatherAlerts}
              onChange={(e) => setWeatherAlerts(e.target.checked)}
            />
            <span className="font-body-md text-on-surface">Weather Alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" 
              checked={marketAlerts}
              onChange={(e) => setMarketAlerts(e.target.checked)}
            />
            <span className="font-body-md text-on-surface">Market Price Changes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" 
              checked={dailyReport}
              onChange={(e) => setDailyReport(e.target.checked)}
            />
            <span className="font-body-md text-on-surface">Daily Summary Report</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between mt-4 items-center">
        <button 
          onClick={handleLogout}
          className="text-error font-label-bold hover:bg-error-container/50 px-4 py-2 rounded-lg transition-colors"
        >
          Log Out
        </button>

        <div className="flex items-center gap-4">
          {showSuccess && (
            <span className="text-primary font-label-bold flex items-center gap-1 animate-fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Settings saved!
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary-fixed-variant disabled:opacity-70 text-white font-label-bold px-6 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <WindowsLoader size="sm" white />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
