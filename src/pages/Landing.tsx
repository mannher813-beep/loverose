import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ShieldCheck, Sparkles, Star, Smartphone, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const { currentUser, login, registerUser, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/discovery');
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Google");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithApple();
      navigate('/discovery');
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Apple");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await registerUser(email, password);
        // Redirige vers le parcours d'inscription
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate('/discovery');
      }
    } catch (err: any) {
      setError(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center select-none py-6">
      
      {/* Hero content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left side: Premium Branding description */}
        <div className="lg:col-span-7 space-y-4 text-center lg:text-left py-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-gray-800 leading-tight">
            L'amour commence par une <span className="text-brand">Rose</span> 🌹
          </h1>
        </div>

        {/* Right side: Login & Registration Forms Card */}
        <div className="lg:col-span-5 backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-3xl p-6 md:p-8 shadow-xl">
          
          {currentUser ? (
            <div className="text-center space-y-4 py-8">
              <span className="text-4xl">👋</span>
              <h3 className="text-xl font-bold text-gray-800">Ravi de vous revoir !</h3>
              <p className="text-xs text-gray-400">
                Vous êtes connecté sous {currentUser.email}. Vous pouvez directement accéder aux découvertes de célibataires.
              </p>
              <button
                onClick={() => navigate('/discovery')}
                className="w-full py-3.5 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-2xl hover:scale-[1.02] shadow-lg shadow-rose-200 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Accéder aux profils</span>
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-lg font-bold text-gray-800">
                  {isSignUp ? 'Rejoindre LoveRose' : 'Connexion à votre espace'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isSignUp ? 'Créez votre profil et trouvez votre moitié' : 'Entrez vos identifiants de sécurité'}
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50/70 text-red-600 border border-red-150 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="clara@example.com"
                    className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white text-gray-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-2xl hover:scale-[1.01] shadow-lg shadow-rose-200 transition-all text-xs mt-2 cursor-pointer"
              >
                {loading ? 'Traitement en cours...' : isSignUp ? "S'inscrire" : 'Se connecter'}
              </button>

              {/* Social Login buttons */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-150"></div>
                </div>
                <span className="relative bg-[#ffffff]/90 px-3 text-[10px] uppercase text-gray-400 font-bold tracking-wider">Ou continuer avec</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 backdrop-blur-sm bg-white/60 border border-gray-150 rounded-xl text-xs font-semibold text-gray-700 hover:bg-white transition cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.353 0 3.393 2.72 1.511 6.67l3.755 3.095Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M16.04 15.34c-1.047.7-2.42 1.16-4.04 1.16a7.077 7.077 0 0 1-6.734-4.856L1.511 14.74C3.393 18.69 7.353 21.41 12 21.41c2.99 0 5.824-1.09 7.91-3.04l-3.87-3.03Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 11.644a7.03 7.03 0 0 1 0-1.879L1.511 6.67A11.94 11.94 0 0 0 0 12c0 1.93.456 3.753 1.266 5.385l4-3.741Z"
                    />
                    <path
                      fill="#34A853"
                      d="M23.49 12.275c0-.832-.074-1.633-.21-2.408H12v4.618h6.463c-.278 1.488-1.12 2.748-2.385 3.593l3.871 3.03a11.908 11.908 0 0 0 3.541-8.833Z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 backdrop-blur-sm bg-white/60 border border-gray-150 rounded-xl text-xs font-semibold text-gray-700 hover:bg-white transition cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.73-1.2 1.87-1.05 2.98 1.12.09 2.27-.55 3-1.42z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              <div className="text-center text-xs text-gray-400 pt-3 border-t border-gray-50">
                <span>{isSignUp ? 'Déjà membre ?' : 'Nouveau sur LoveRose ?'}</span>{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-brand font-bold hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Se connecter' : 'Créer un compte'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* SEO & Legal footnotes footer */}
      <div className="mt-16 pt-8 border-t border-pink-50 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium space-y-4 md:space-y-0">
        <p>© 2026 LoveRose — PWA Premium Dating. Tous droits réservés.</p>
        <div className="flex space-x-4">
          <Link to="/terms" className="hover:text-brand transition">CGU</Link>
          <Link to="/privacy" className="hover:text-brand transition">Politique de Confidentialité</Link>
          <Link to="/contact" className="hover:text-brand transition">Contact & Support</Link>
        </div>
      </div>

    </div>
  );
}
