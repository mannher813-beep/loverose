import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Check, Mail, Heart, Sparkles, Image as ImageIcon, MapPin, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INTERESTS_LIST = [
  'Voyage', 'Musique', 'Sport', 'Business', 'Lecture', 
  'Cuisine', 'Cinéma', 'Technologie', 'Mode', 'Fitness', 'Entrepreneuriat'
];

export default function Onboarding() {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local step state
  const [formData, setFormData] = useState({
    displayName: '',
    birthDate: '',
    gender: 'Homme' as 'Homme' | 'Femme',
    orientation: 'Femme' as 'Homme' | 'Femme' | 'Les deux',
    city: '',
    country: '',
    photos: [] as string[],
    interests: [] as string[]
  });

  // Load from firestore profile if already filled partially
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        birthDate: userProfile.birthDate || '',
        gender: userProfile.gender || 'Homme',
        orientation: userProfile.orientation || 'Femme',
        city: userProfile.city || '',
        country: userProfile.country || '',
        photos: userProfile.photos || [],
        interests: userProfile.interests || []
      });
      // Skip steps if details already filled
      if (userProfile.displayName && userProfile.displayName !== 'Nouveau membre') {
        setStep(2);
      }
      if (userProfile.birthDate) {
        setStep(3);
      }
      if (userProfile.gender) {
        setStep(4);
      }
      if (userProfile.orientation) {
        setStep(5);
      }
      if (userProfile.city) {
        setStep(6);
      }
      if (userProfile.photos && userProfile.photos.length > 0) {
        setStep(7);
      }
      if (userProfile.interests && userProfile.interests.length > 0) {
        setStep(8);
      }
    }
  }, [userProfile]);

  // Save current state to firebase on change of major steps
  const saveCurrentStep = async (nextStep: number) => {
    setError('');
    
    // Validations based on current step
    if (step === 2) {
      if (!formData.displayName.trim()) {
        setError("S'il vous plaît, entrez votre prénom.");
        return;
      }
      if (!formData.birthDate) {
        setError("S'il vous plaît, indiquez votre date de naissance.");
        return;
      }
      // Calculate age
      const birth = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      if (age < 18) {
        setError("Désolé, vous devez avoir au moins 18 ans pour vous inscrire sur LoveRose.");
        return;
      }
    }

    if (step === 5) {
      if (!formData.city.trim() || !formData.country.trim()) {
        setError("S'il vous plaît, indiquez votre ville et votre pays.");
        return;
      }
    }

    if (step === 6) {
      if (formData.photos.length === 0) {
        setError("S'il vous plaît, ajoutez au moins une photo de profil.");
        return;
      }
    }

    if (step === 7) {
      if (formData.interests.length < 2) {
        setError("Sélectionnez au moins 2 centres d'intérêt pour nous aider à trouver de parfaits profils.");
        return;
      }
    }

    setLoading(true);
    try {
      // Calculate age for saving
      let ageToSave = undefined;
      if (formData.birthDate) {
        const birth = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        ageToSave = age;
      }

      await updateProfileData({
        ...formData,
        ...(ageToSave ? { age: ageToSave } : {})
      });
      setStep(nextStep);
    } catch (err: any) {
      setError(err.message || "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const exists = prev.interests.includes(interest);
      const updated = exists 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  const addPresetPhoto = (url: string) => {
    setFormData(prev => {
      const exists = prev.photos.includes(url);
      const updated = exists
        ? prev.photos.filter(p => p !== url)
        : [...prev.photos, url].slice(0, 6); // Max 6 photos
      return { ...prev, photos: updated };
    });
  };

  // Preset gorgeous premium curated pictures (free vector & unsplash safe photos)
  const PRESET_PHOTOS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400"
  ];

  const totalSteps = 8;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-bg select-none relative overflow-hidden">
      
      {/* Decorative Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-brand/15"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] bg-brand-light/20"></div>
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}></div>
      </div>

      {/* Container Card */}
      <div className="w-full max-w-lg backdrop-blur-md bg-white/45 rounded-[40px] shadow-2xl border border-rose-100/50 overflow-hidden flex flex-col p-6 md:p-8 relative z-10">
        
        {/* Progress Bar */}
        <div className="w-full bg-rose-100/40 h-2 rounded-full mb-6 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-[#E85D75] to-[#F7B5C0] h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
          <span>Étape {step} sur {totalSteps}</span>
          <span className="font-bold text-brand">{Math.round(progressPercent)}% Complété</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50/70 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* STEP 1: Registration is covered via Auth sign-up, so step 2 is name and birthday */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-rose-50/70 rounded-full text-brand animate-pulse border border-rose-100">
                    <Heart size={48} fill="currentColor" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-800">Bienvenue sur LoveRose</h2>
                <p className="text-gray-500 text-sm">
                  Préparez-vous à trouver de magnifiques célibataires qui partagent vos valeurs. Commençons à créer votre profil premium.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-2xl font-bold hover:scale-[1.01] transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-200 mt-6 cursor-pointer"
                >
                  <span>Créer mon profil</span>
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Name & Birthday */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Parlez-nous de vous</h2>
                <p className="text-gray-500 text-sm mb-4">Votre prénom et date de naissance ne pourront plus être modifiés.</p>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Ex: Clara, Amadou..."
                      className="w-full pl-11 pr-4 py-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand text-gray-700 focus:bg-white transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Gender */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Quel est votre genre ?</h2>
                <p className="text-gray-500 text-sm mb-6">Sélectionnez le genre qui vous correspond le mieux.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {['Homme', 'Femme'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g as any })}
                      className={`py-6 rounded-3xl border-2 font-bold transition text-lg flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                        formData.gender === g 
                          ? 'border-brand bg-brand/10 text-brand' 
                          : 'border-rose-100/30 bg-white/30 text-gray-600 hover:border-rose-200/50 hover:bg-white/50'
                      }`}
                    >
                      <span className="text-3xl">{g === 'Homme' ? '👨' : '👩'}</span>
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Orientation */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Qui recherchez-vous ?</h2>
                <p className="text-gray-500 text-sm mb-6">Nous utiliserons cela pour filtrer vos profils de découverte.</p>
                
                <div className="space-y-3">
                  {['Homme', 'Femme', 'Les deux'].map((o) => (
                    <button
                      key={o}
                      onClick={() => setFormData({ ...formData, orientation: o as any })}
                      className={`w-full py-4 px-6 rounded-2xl border-2 font-bold transition text-left flex justify-between items-center cursor-pointer ${
                        formData.orientation === o 
                          ? 'border-brand bg-brand/10 text-brand' 
                          : 'border-rose-100/30 bg-white/30 text-gray-600 hover:border-rose-200/50 hover:bg-white/50'
                      }`}
                    >
                      <span>{o}</span>
                      {formData.orientation === o && <Check size={18} className="text-brand" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 5: Location */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Où habitez-vous ?</h2>
                <p className="text-gray-500 text-sm mb-4">Cela nous aide à calculer les distances de matching.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ville</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Ex: Douala, Paris, Abidjan..."
                        className="w-full pl-11 pr-4 py-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pays</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Ex: Cameroun, France, Côte d'Ivoire..."
                      className="w-full px-4 py-3.5 backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand text-gray-700 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Photos */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Ajoutez votre plus belle photo</h2>
                <p className="text-gray-500 text-sm mb-4">Une photo de profil principale est obligatoire. Choisissez parmi nos suggestions ou utilisez-les en guise de démo !</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_PHOTOS.map((url, idx) => {
                    const isSelected = formData.photos.includes(url);
                    return (
                      <button
                        key={idx}
                        onClick={() => addPresetPhoto(url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          isSelected ? 'border-brand ring-2 ring-brand/35' : 'border-rose-100/30 hover:opacity-90'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand/35 flex items-center justify-center">
                            <div className="p-1.5 bg-brand text-white rounded-full">
                              <Check size={14} />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {formData.photos.length > 0 && (
                  <div className="text-xs text-center text-gray-400 mt-2 font-medium">
                    {formData.photos.length} photo(s) sélectionnée(s) (Maximum 6)
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 7: Interests */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-gray-800">Vos centres d'intérêt</h2>
                <p className="text-gray-500 text-sm mb-4">Sélectionnez au moins 2 passions qui vous décrivent.</p>
                
                <div className="flex flex-wrap gap-2.5">
                  {INTERESTS_LIST.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-4 py-2 rounded-full border text-sm font-semibold transition cursor-pointer ${
                          isSelected 
                            ? 'bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] border-[#E85D75] text-white shadow-md shadow-rose-200/50' 
                            : 'bg-white/30 border-rose-100/30 text-gray-600 hover:border-rose-200/50 hover:bg-white/50'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 8: Email Verification */}
            {step === 8 && (
              <motion.div
                key="step8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-50/70 rounded-full text-green-500 border border-green-100">
                    <Mail size={48} />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-800">Dernière étape !</h2>
                <p className="text-gray-500 text-sm">
                  Votre profil LoveRose est presque prêt ! En cliquant sur Finaliser, vous confirmez que vos informations sont sincères et que vous acceptez les règles de bienséance.
                </p>
                
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await updateProfileData({
                        ...formData,
                        verificationLevel: 1, // level 1: email verified is default onboarding completion
                        isVerified: true // verify automatically to allow discovery in local dev env
                      });
                      navigate('/discovery');
                    } catch (err: any) {
                      setError(err.message || "Erreur de finalisation");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-2xl font-bold hover:scale-[1.01] transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-200 mt-6 cursor-pointer"
                >
                  <Sparkles size={18} />
                  <span>{loading ? 'Finalisation...' : 'Finaliser mon inscription'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons (Bottom) */}
        {step > 1 && step < 8 && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-rose-100/50">
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-800 transition flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft size={18} />
              <span>Retour</span>
            </button>
            <button
              onClick={() => saveCurrentStep(step + 1)}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-xl font-bold hover:scale-[1.01] transition flex items-center space-x-1 shadow-md shadow-rose-200/50 cursor-pointer"
            >
              <span>{loading ? 'Enregistrement...' : 'Suivant'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
