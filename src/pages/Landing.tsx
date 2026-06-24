import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, ShieldCheck, Sparkles, Star, Smartphone, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const { currentUser, login, registerUser } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          
          <div className="inline-flex items-center space-x-2 backdrop-blur-sm bg-white/50 border border-rose-100/50 text-brand px-3.5 py-1.5 rounded-full text-xs font-bold w-max shadow-sm">
            <Sparkles size={12} className="animate-pulse" />
            <span>Premium PWA Matchmaker Afrique & International</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-gray-800 leading-tight">
            L'amour commence par une <span className="text-brand">Rose</span> 🌹
          </h1>

          <p className="text-gray-500 text-sm md:text-base max-w-xl">
            Découvrez LoveRose, la première application de rencontre PWA premium, ultra-rapide et sécurisée. Conçue pour concurrencer Tinder, Badoo et Meetic avec une expérience locale enrichie.
          </p>

          {/* Core values cards */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
            <div className="p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-2xl text-center space-y-1.5 shadow-sm hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🛡️</span>
              <h4 className="text-xs font-bold text-gray-700">Sécurité IA</h4>
            </div>
            <div className="p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-2xl text-center space-y-1.5 shadow-sm hover:scale-105 transition-transform duration-300">
              <span className="text-xl">💳</span>
              <h4 className="text-xs font-bold text-gray-700">Money Fusion</h4>
            </div>
            <div className="p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-2xl text-center space-y-1.5 shadow-sm hover:scale-105 transition-transform duration-300">
              <span className="text-xl">📱</span>
              <h4 className="text-xs font-bold text-gray-700">PWA Install</h4>
            </div>
          </div>

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
