import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Settings, ShieldCheck, Mail, Phone, Camera, Sparkles, EyeOff, Lock, Eye, AlertCircle, RefreshCw 
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { VerificationRequest } from '../types';

export default function UserProfilePage() {
  const { userProfile, updateProfileData } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'verification'>('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile forms state
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [height, setHeight] = useState(userProfile?.height || 170);
  const [profession, setProfession] = useState(userProfile?.profession || '');
  const [education, setEducation] = useState(userProfile?.education || '');
  const [languages, setLanguages] = useState(userProfile?.languages?.join(', ') || '');

  // Settings states
  const [hideAge, setHideAge] = useState(userProfile?.hideAge || false);
  const [hideDistance, setHideDistance] = useState(userProfile?.hideDistance || false);
  const [hideOnline, setHideOnline] = useState(userProfile?.hideOnline || false);

  // Verification states
  const [selfieUrl, setSelfieUrl] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  if (!userProfile) {
    return (
      <div className="text-center p-12 text-gray-500">
        Veuillez vous connecter pour voir votre profil.
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (bio.length > 500) {
      setError("Votre bio ne doit pas dépasser 500 caractères.");
      setLoading(false);
      return;
    }

    try {
      await updateProfileData({
        bio,
        height: Number(height),
        profession,
        education,
        languages: languages.split(',').map(s => s.trim()).filter(Boolean)
      });
      setSuccess("Profil mis à jour avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfileData({
        hideAge,
        hideDistance,
        hideOnline
      });
      setSuccess("Paramètres de confidentialité mis à jour !");
    } catch (err: any) {
      setError(err.message || "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const startSelfieVerification = async () => {
    setError('');
    setVerificationResult(null);
    setLoading(true);

    if (!selfieUrl.trim()) {
      setError("Veuillez renseigner un lien de photo/selfie pour la comparaison faciale par l'IA.");
      setLoading(false);
      return;
    }

    if (!userProfile.photos || userProfile.photos.length === 0) {
      setError("Vous devez posséder au moins une photo de profil principale pour effectuer la comparaison faciale.");
      setLoading(false);
      return;
    }

    try {
      // POST comparison to our server API route
      const response = await fetch('/api/verify-selfie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieUrl: selfieUrl,
          profilePhotoUrl: userProfile.photos[0]
        })
      });

      const data = await response.json();
      
      if (data.success && data.result) {
        setVerificationResult(data.result);
        
        // If matched and confidence > 70%, trigger and activate verification request
        if (data.result.match) {
          // Log verification request
          const reqId = `req_${userProfile.uid}_lvl3`;
          const vRequest: VerificationRequest = {
            id: reqId,
            userId: userProfile.uid,
            photoUrl: selfieUrl,
            status: 'approved',
            level: 3,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'verification_requests', reqId), vRequest);

          // Update user profile verified badges
          await updateProfileData({
            isVerified: true,
            verificationLevel: 3
          });
          setSuccess("Félicitations ! Notre IA de reconnaissance faciale LoveRose a validé votre identité ! Badge Vérifié ✔ activé !");
        } else {
          setError(`Échec de vérification : ${data.result.explanation}`);
        }
      } else {
        setError("Impossible d'effectuer l'analyse d'image pour le moment. Veuillez réessayer.");
      }
    } catch (err: any) {
      setError("Erreur de communication avec l'IA de vérification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
      
      {/* Side Tabs Navigation */}
      <div className="md:col-span-1 backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-4 space-y-2 h-fit shadow-lg">
        <div className="flex flex-col items-center pb-6 border-b border-rose-100/50 mb-4 text-center">
          <div className="relative">
            <img 
              src={userProfile.photos[0] || "https://picsum.photos/seed/loverose/200/200"} 
              alt={userProfile.displayName} 
              className="w-20 h-20 rounded-full object-cover border-2 border-brand animate-pulse"
              referrerPolicy="no-referrer"
            />
            {userProfile.isVerified && (
              <span className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 text-[9px] font-bold border-2 border-white" title="Profil Vérifié IA">
                ✔
              </span>
            )}
          </div>
          <h4 className="font-bold text-sm text-gray-800 mt-2.5">{userProfile.displayName}</h4>
          <p className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold mt-1">
            Niveau de confiance {userProfile.verificationLevel}/3
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'profile' ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:bg-white/20'
          }`}
        >
          <User size={14} />
          <span>Modifier le Profil</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:bg-white/20'
          }`}
        >
          <Settings size={14} />
          <span>Confidentialité</span>
        </button>

        <button 
          onClick={() => setActiveTab('verification')}
          className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'verification' ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:bg-white/20'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Vérification IA</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="md:col-span-3 backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-6 shadow-lg">
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs font-semibold">
            {success}
          </div>
        )}

        {/* Tab 1: Profile Editor Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-rose-100/50">
              <h3 className="font-serif font-bold text-lg text-gray-800">Modifier mon profil</h3>
              <span className="text-[10px] text-gray-400 font-semibold font-mono">ID: {userProfile.uid}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-750 mb-1">Votre biographie (Max 500 caractères)</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Racontez-nous qui vous êtes, ce que vous recherchez..."
                rows={4}
                maxLength={500}
                className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand text-gray-700 focus:bg-white transition-all"
              />
              <span className="text-[10px] text-gray-400 float-right mt-1 font-semibold">{bio.length}/500</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-750 mb-1">Taille (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-750 mb-1">Profession</label>
                <input
                  type="text"
                  value={profession}
                  onChange={e => setProfession(e.target.value)}
                  placeholder="Ex: Architecte, Étudiant..."
                  className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-750 mb-1">Niveau d'études</label>
                <input
                  type="text"
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  placeholder="Ex: Master, Bac +3..."
                  className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-750 mb-1">Langues parlées (séparées par virgule)</label>
                <input
                  type="text"
                  value={languages}
                  onChange={e => setLanguages(e.target.value)}
                  placeholder="Ex: Français, Anglais"
                  className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-xl text-xs hover:scale-[1.01] shadow-lg shadow-rose-200 transition-all cursor-pointer"
            >
              {loading ? 'Sauvegarde...' : 'Enregistrer mon profil'}
            </button>
          </form>
        )}

        {/* Tab 2: Confidentiality / Settings Form */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-rose-100/50">
              <h3 className="font-serif font-bold text-lg text-gray-800">Confidentialité du Compte</h3>
              <p className="text-[10px] text-gray-400">Gérez la visibilité de vos données personnelles.</p>
            </div>

            <div className="space-y-4">
              {/* Hide age toggle */}
              <div className="flex justify-between items-center p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-750 flex items-center">
                    <EyeOff size={12} className="mr-1.5 text-brand" />
                    Masquer mon âge
                  </span>
                  <p className="text-[9px] text-gray-400">Votre âge ne sera plus visible sur votre fiche découverte.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={hideAge}
                  onChange={e => setHideAge(e.target.checked)}
                  className="rounded text-brand focus:ring-brand cursor-pointer"
                />
              </div>

              {/* Hide Distance toggle */}
              <div className="flex justify-between items-center p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-750 flex items-center">
                    <Lock size={12} className="mr-1.5 text-brand" />
                    Masquer ma distance
                  </span>
                  <p className="text-[9px] text-gray-400">Les autres utilisateurs ne verront pas à quelle distance vous êtes.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={hideDistance}
                  onChange={e => setHideDistance(e.target.checked)}
                  className="rounded text-brand focus:ring-brand cursor-pointer"
                />
              </div>

              {/* Hide Online presence toggle */}
              <div className="flex justify-between items-center p-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/40 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-750 flex items-center">
                    <Eye size={12} className="mr-1.5 text-brand" />
                    Masquer ma présence en ligne
                  </span>
                  <p className="text-[9px] text-gray-400">Votre pastille verte d'activité sera masquée.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={hideOnline}
                  onChange={e => setHideOnline(e.target.checked)}
                  className="rounded text-brand focus:ring-brand cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-xl text-xs hover:scale-[1.01] shadow transition cursor-pointer"
            >
              {loading ? 'Sauvegarde...' : 'Enregistrer mes choix'}
            </button>
          </div>
        )}

        {/* Tab 3: AI verification center */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-rose-100/50">
              <h3 className="font-serif font-bold text-lg text-gray-800">Badge de vérification LoveRose IA</h3>
              <p className="text-[10px] text-gray-400">Faites valider votre identité par notre IA pour rassurer les membres et doubler vos matchs.</p>
            </div>

            {/* Steps guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border border-rose-100/40 rounded-xl text-center space-y-1 backdrop-blur-sm bg-white/40 shadow-sm">
                <div className="text-xs font-bold text-brand font-mono">Niveau 1</div>
                <div className="text-xs font-bold text-gray-700">Email Vérifié</div>
                <p className="text-[9px] text-gray-400">Validé automatiquement à l'inscription.</p>
                {userProfile.verificationLevel >= 1 && <span className="text-xs text-green-600 font-bold block">✓ Validé</span>}
              </div>

              <div className="p-3 border border-rose-100/40 rounded-xl text-center space-y-1 backdrop-blur-sm bg-white/40 shadow-sm">
                <div className="text-xs font-bold text-brand font-mono">Niveau 2</div>
                <div className="text-xs font-bold text-gray-700">Téléphone Vérifié</div>
                <p className="text-[9px] text-gray-400">Nécessite la saisie d'un numéro de téléphone mobile.</p>
                {userProfile.verificationLevel >= 2 ? (
                  <span className="text-xs text-green-600 font-bold block">✓ Validé</span>
                ) : (
                  <button 
                    onClick={async () => {
                      await updateProfileData({ verificationLevel: 2 });
                      setSuccess("Niveau 2 validé !");
                    }}
                    className="text-[9px] bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white px-2.5 py-1 rounded font-bold cursor-pointer hover:scale-105 transition-all shadow shadow-rose-200"
                  >
                    Valider
                  </button>
                )}
              </div>

              <div className="p-3 border border-rose-100/40 rounded-xl text-center space-y-1 backdrop-blur-sm bg-white/40 shadow-sm">
                <div className="text-xs font-bold text-brand font-mono">Niveau 3</div>
                <div className="text-xs font-bold text-gray-700">Selfie de vérification</div>
                <p className="text-[9px] text-gray-400">Comparaison faciale automatisée par Gemini AI.</p>
                {userProfile.verificationLevel >= 3 ? (
                  <span className="text-xs text-green-600 font-bold block">✓ Validé</span>
                ) : (
                  <span className="text-[9px] text-gray-400 italic block">En attente</span>
                )}
              </div>
            </div>

            {/* Level 3 section if not completed */}
            {userProfile.verificationLevel < 3 && (
              <div className="p-4 border border-rose-100/45 rounded-2xl bg-white/40 backdrop-blur-sm space-y-4">
                <div className="flex items-start space-x-2.5">
                  <Sparkles className="text-brand mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Lancer l'analyse faciale biométrique</h4>
                    <p className="text-[9px] text-gray-400">Collez un lien d'image de selfie (ou utilisez le même lien que votre photo pour passer la comparaison d'identité avec succès !)</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-600">Lien URL vers votre photo selfie de contrôle</label>
                  <input
                    type="text"
                    value={selfieUrl}
                    onChange={e => setSelfieUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white/50 border border-rose-100/30 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand text-gray-700"
                  />
                  <div className="flex space-x-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => setSelfieUrl(userProfile.photos[0] || '')}
                      className="text-[9px] text-brand font-semibold hover:underline cursor-pointer"
                    >
                      Utiliser ma photo de profil principale pour simuler un match de contrôle parfait
                    </button>
                  </div>
                </div>

                {verificationResult && (
                  <div className="p-3 bg-white border border-rose-100/30 rounded-xl text-[10px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-brand">Résultat de la vérification faciale IA:</span>
                      <span>Score de confiance: {verificationResult.confidence}%</span>
                    </div>
                    <p className="text-gray-500 italic">"{verificationResult.explanation}"</p>
                  </div>
                )}

                <button
                  onClick={startSelfieVerification}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-rose-200 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Analyse et comparaison d'image en cours par Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Lancer la vérification faciale par IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
