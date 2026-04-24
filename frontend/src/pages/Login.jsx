import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WindowsLoader from '../components/WindowsLoader';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-api-key') {
         setError('Failed to log in. It looks like the Firebase config is missing API keys. Please update src/firebase.js');
      } else {
         setError('Failed to log in. Please check console for details.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-container/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDuration: '4s'}} />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDuration: '6s'}} />

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-6">
            <span className="material-symbols-outlined text-4xl text-white" style={{fontVariationSettings: "'FILL' 1"}}>
              eco
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#334f2b] font-headline-lg mb-2">
            AgriLink
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Your AI-powered farming co-pilot
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 border border-outline-variant/60 rounded-2xl p-8 shadow-xl shadow-stone-200/50" style={{backdropFilter: 'blur(20px)'}}>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm font-label-bold flex items-start gap-3 animate-fade-in">
              <span className="material-symbols-outlined text-error text-[20px] mt-0.5 flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-outline-variant/50 text-on-surface py-3.5 px-4 rounded-xl font-label-bold hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 disabled:opacity-50 group"
          >
            {loading ? (
              <WindowsLoader size="sm" label="Signing in..." />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign in with Google
              </>
            )}
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/50" />
            <span className="text-xs text-outline uppercase tracking-widest font-label-sm">Secure Login</span>
            <div className="flex-1 h-px bg-outline-variant/50" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-outline">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>lock</span>
              <span className="text-xs font-label-sm">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
              <span className="text-xs font-label-sm">Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>speed</span>
              <span className="text-xs font-label-sm">Instant</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-outline font-label-sm">
          By signing in, you agree to AgriLink's Terms of Service.
        </p>
      </div>
    </div>
  );
}
