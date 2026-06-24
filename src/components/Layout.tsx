import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import { 
  Heart, MessageCircle, User, Settings, ShieldAlert, 
  Sparkles, Wifi, WifiOff, Phone, Video, X, Mic, MicOff, Camera, CameraOff, LogOut, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuth();
  const { isOffline, setIsOffline, activeCall, acceptCall, endCall } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // PWA Installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Audio/Video call toggles
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    // Online / Offline tracking
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not already installed
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation Outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPwaBanner(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg pb-16 md:pb-0 relative overflow-hidden">
      
      {/* Decorative Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-brand/15"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] bg-brand-light/20"></div>
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}></div>
      </div>

      {/* Offline Status Bar */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-50 bg-gray-800 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center space-x-2 font-mono shadow-md"
          >
            <WifiOff size={12} className="animate-pulse text-red-400" />
            <span>Mode Hors Connexion Activé. Les données seront synchronisées.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Premium Installation Banner */}
      <AnimatePresence>
        {showPwaBanner && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-gradient-to-r from-brand to-pink-600 text-white p-4 text-sm font-semibold shadow-lg flex justify-between items-center z-50 sticky top-0"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌹</span>
              <div>
                <p className="font-bold">Installer LoveRose sur votre écran</p>
                <p className="text-xs text-pink-100 font-normal">Accès rapide, hors-ligne, notifications premium et fluide</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleInstallPwa}
                className="bg-white text-brand px-4 py-1.5 rounded-full text-xs font-bold hover:bg-pink-50 transition shadow cursor-pointer"
              >
                Installer
              </button>
              <button onClick={() => setShowPwaBanner(false)} className="p-1 text-white hover:text-pink-200 cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header - Glassmorphic */}
      <header className="relative z-40 border-b border-rose-100/50 backdrop-blur-md bg-white/40 py-3.5 px-6 sticky top-0 hidden md:block shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] shadow-lg shadow-rose-200 group-hover:scale-105 transition-transform duration-300">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-brand">
              LoveRose
            </span>
          </Link>

          {userProfile && (
            <nav className="flex items-center space-x-6 font-semibold text-gray-600">
              <Link to="/discovery" className={`hover:text-brand transition ${isActive('/discovery') ? 'text-brand' : ''}`}>
                Découverte
              </Link>
              <Link to="/messages" className={`hover:text-brand transition ${isActive('/messages') ? 'text-brand' : ''}`}>
                Messagerie
              </Link>
              <Link to="/premium" className={`hover:text-brand transition flex items-center space-x-1 ${isActive('/premium') ? 'text-brand' : ''}`}>
                <Sparkles size={16} className="text-brand-gold fill-brand-gold animate-bounce" />
                <span className="text-brand-gold">Devenir Premium</span>
              </Link>
              {userProfile.role === 'admin' && (
                <Link to="/admin" className={`hover:text-red-500 transition flex items-center space-x-1 ${isActive('/admin') ? 'text-red-500' : ''}`}>
                  <ShieldAlert size={16} />
                  <span>Admin</span>
                </Link>
              )}
              <Link to="/profile" className={`hover:text-brand transition flex items-center space-x-1.5 ${isActive('/profile') ? 'text-brand font-bold' : ''}`}>
                <div className="w-7 h-7 rounded-full border border-brand/40 overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img 
                    src={userProfile.photos?.[0] || "https://picsum.photos/seed/loverose/200/200"} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-xs">{userProfile.displayName?.split(' ')[0]}</span>
              </Link>
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition cursor-pointer">
                <LogOut size={18} />
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content stage */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar - Glassmorphic */}
      {userProfile && (
        <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-white/60 border-t border-rose-100/50 py-2.5 px-6 flex justify-between items-center md:hidden z-40 shadow-lg">
          <Link to="/discovery" className={`flex flex-col items-center space-y-1 ${isActive('/discovery') ? 'text-brand' : 'text-gray-400'}`}>
            <Heart size={22} fill={isActive('/discovery') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Découverte</span>
          </Link>
          <Link to="/messages" className={`flex flex-col items-center space-y-1 ${isActive('/messages') ? 'text-brand' : 'text-gray-400'}`}>
            <MessageCircle size={22} fill={isActive('/messages') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Messages</span>
          </Link>
          <Link to="/premium" className={`flex flex-col items-center space-y-1 ${isActive('/premium') ? 'text-brand-gold' : 'text-gray-400'}`}>
            <Sparkles size={22} fill={isActive('/premium') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Premium</span>
          </Link>
          {userProfile.role === 'admin' && (
            <Link to="/admin" className={`flex flex-col items-center space-y-1 ${isActive('/admin') ? 'text-red-500' : 'text-gray-400'}`}>
              <ShieldAlert size={22} />
              <span className="text-[10px] font-bold">Admin</span>
            </Link>
          )}
          <Link to="/profile" className={`flex flex-col items-center space-y-1 ${isActive('/profile') ? 'text-brand' : 'text-gray-400'}`}>
            <User size={22} fill={isActive('/profile') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Profil</span>
          </Link>
        </nav>
      )}

      {/* WebRTC Video/Audio Calling Overlay popup modal */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl w-full max-w-md p-6 flex flex-col items-center text-center relative overflow-hidden shadow-2xl"
            >
              
              {/* Pulsing call waves */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center space-x-2 text-xs bg-brand/20 text-brand px-3 py-1 rounded-full mb-6 border border-brand/30">
                {activeCall.isVideo ? <Video size={12} /> : <Phone size={12} />}
                <span className="font-semibold uppercase tracking-wider">
                  Appel {activeCall.isVideo ? 'Vidéo' : 'Audio'} Premium
                </span>
              </div>

              {/* Avatar placeholder with heart rings */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-brand/20 ring-4 ring-zinc-800">
                  {activeCall.callerName?.substring(0, 2).toUpperCase() || 'LR'}
                </div>
                <div className="absolute inset-0 rounded-full border border-brand/30 animate-ping" />
              </div>

              <h3 className="text-xl font-bold font-serif mb-1">{activeCall.callerName}</h3>
              
              <p className="text-zinc-400 text-sm mb-8 font-mono">
                {activeCall.status === 'incoming' && 'Appel entrant...'}
                {activeCall.status === 'outgoing' && 'Appel en cours...'}
                {activeCall.status === 'connected' && 'Appel connecté — Flux WebRTC actif'}
              </p>

              {/* Active WebRTC fake video stream feed */}
              {activeCall.status === 'connected' && activeCall.isVideo && camOn && (
                <div className="w-full aspect-video bg-zinc-800 rounded-2xl mb-8 relative overflow-hidden border border-zinc-700">
                  <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400')` }} referrerPolicy="no-referrer" />
                  <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Caméra de {activeCall.callerName}</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {activeCall.status === 'incoming' ? (
                  <>
                    <button 
                      onClick={acceptCall}
                      className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition shadow-lg shadow-green-500/20 cursor-pointer"
                    >
                      <Phone size={24} />
                    </button>
                    <button 
                      onClick={endCall}
                      className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/20 cursor-pointer"
                    >
                      <X size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setMicOn(!micOn)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition cursor-pointer ${
                        micOn ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-red-500/20 border-red-500 text-red-500'
                      }`}
                    >
                      {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>

                    {activeCall.isVideo && (
                      <button 
                        onClick={() => setCamOn(!camOn)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border transition cursor-pointer ${
                          camOn ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-red-500/20 border-red-500 text-red-500'
                        }`}
                      >
                        {camOn ? <Camera size={20} /> : <CameraOff size={20} />}
                      </button>
                    )}

                    <button 
                      onClick={endCall}
                      className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/20 cursor-pointer"
                    >
                      <X size={24} />
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
