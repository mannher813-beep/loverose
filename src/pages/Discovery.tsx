import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import { 
  collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, Like, Match } from '../types';
import { Heart, X, Star, MapPin, Sparkles, Sliders, CheckCircle2, Award, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import UserProfileModal from '../components/UserProfileModal';

export default function Discovery() {
  const { userProfile } = useAuth();
  const { filters, setFilters } = useAppStore();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [matchPopup, setMatchPopup] = useState<{ show: boolean; matchedUser?: UserProfile }>({ show: false });


  // Load and fetch real discoverable users
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!userProfile) return;
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const qAll = query(usersRef);
        const snapAll = await getDocs(qAll);
        
        // Exclude current user, and clean any leftover dummy seed accounts
        const fetchedUsers = snapAll.docs
          .map(d => d.data() as UserProfile)
          .filter(u => u.uid !== userProfile.uid && !u.uid.startsWith('seed_') && !u.email.endsWith('@loverose.com'));

        // Apply frontend filters
        const filtered = fetchedUsers.filter(u => {
          // Gender matches orientation of current user
          if (userProfile.orientation !== 'Les deux') {
            if (u.gender !== userProfile.orientation) return false;
          }
          // Age bounds
          if (u.age && (u.age < filters.minAge || u.age > filters.maxAge)) return false;
          // Verified bounds
          if (filters.onlyVerified && !u.isVerified) return false;
          // Premium bounds
          if (filters.onlyPremium && !u.isPremium) return false;

          return true;
        });

        setProfiles(filtered);
      } catch (err) {
        console.error("Error fetching discoverable profiles:", err);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [userProfile, filters]);

  // Motion values for swiping drag gesture
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

  const handleSwipe = async (direction: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length || !userProfile) return;
    
    const targetUser = profiles[currentIndex];
    console.log(`Swiped ${direction} on user: ${targetUser.displayName}`);

    try {
      // 1. Log the Like document in FireStore
      const likeId = `${userProfile.uid}_${targetUser.uid}`;
      await setDoc(doc(db, 'likes', likeId), {
        id: likeId,
        fromUid: userProfile.uid,
        toUid: targetUser.uid,
        type: direction,
        createdAt: new Date().toISOString()
      });

      // 2. Check for matching Like (Target user liked us)
      // To simulate high-fidelity matches for seeded users, we trigger a match if we Like or SuperLike them!
      const reciprocalLikeRef = doc(db, 'likes', `${targetUser.uid}_${userProfile.uid}`);
      const reciprocalSnap = await getDoc(reciprocalLikeRef);

      const isMatch = direction !== 'pass' && (
        reciprocalSnap.exists() && reciprocalSnap.data().type !== 'pass' ||
        targetUser.uid.startsWith('seed_') // auto match seeded users for excellent user experience
      );

      if (isMatch) {
        // Create match record
        const matchId = [userProfile.uid, targetUser.uid].sort().join('_');
        const newMatch: Match = {
          id: matchId,
          users: [userProfile.uid, targetUser.uid],
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastMessageText: "Vous avez un match ! Envoyez le premier message."
        };

        await setDoc(doc(db, 'matches', matchId), newMatch);
        
        // Trigger Match Popup overlay
        setMatchPopup({ show: true, matchedUser: targetUser });
      }

    } catch (err) {
      console.error("Error swiping profile:", err);
    }

    // Go to next card
    setCurrentIndex(prev => prev + 1);
  };

  const calculateCompatibilityScore = (target: UserProfile) => {
    if (!userProfile) return 70;
    let score = 50;
    // Interests match
    const sharedInterests = userProfile.interests.filter(i => target.interests.includes(i));
    score += sharedInterests.length * 15;
    // City match
    if (userProfile.city?.toLowerCase() === target.city?.toLowerCase()) {
      score += 15;
    }
    // Language compatibility
    const sharedLanguages = userProfile.languages?.filter(l => target.languages?.includes(l)) || [];
    score += sharedLanguages.length * 10;
    
    return Math.min(score, 100);
  };

  const activeProfile = profiles[currentIndex];

  return (
    <div className="max-w-md mx-auto flex flex-col justify-between min-h-[calc(100vh-140px)] select-none">
      
      {/* Header and Filter Controls */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800 flex items-center space-x-1">
          <span>Découverte</span>
          <Sparkles className="text-brand w-5 h-5 animate-pulse" />
        </h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-full border transition cursor-pointer backdrop-blur-sm ${
            showFilters ? 'bg-brand text-white border-brand/50' : 'bg-white/45 border-rose-100/50 text-gray-600 hover:text-brand'
          }`}
        >
          <Sliders size={18} />
        </button>
      </div>

      {/* Filter panel dropdown */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-3xl p-5 mb-4 shadow-lg overflow-hidden space-y-4"
          >
            <h3 className="font-bold text-sm text-gray-700">Filtres de recherche</h3>
            
            {/* Age filters */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Âge Recherché</span>
                <span>{filters.minAge} - {filters.maxAge} ans</span>
              </div>
              <div className="flex space-x-2">
                <input 
                  type="range" 
                  min="18" 
                  max="65" 
                  value={filters.minAge}
                  onChange={e => setFilters({ minAge: parseInt(e.target.value) })}
                  className="w-full accent-brand"
                />
                <input 
                  type="range" 
                  min="18" 
                  max="65" 
                  value={filters.maxAge}
                  onChange={e => setFilters({ maxAge: parseInt(e.target.value) })}
                  className="w-full accent-brand"
                />
              </div>
            </div>

            {/* Distance bounds */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Distance maximale</span>
                <span>{filters.distance} km</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="200" 
                value={filters.distance}
                onChange={e => setFilters({ distance: parseInt(e.target.value) })}
                className="w-full accent-brand"
              />
            </div>

            {/* Verified and Premium Toggles */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer bg-pink-50/50 p-2.5 rounded-xl border border-pink-100/50">
                <input 
                  type="checkbox" 
                  checked={filters.onlyVerified}
                  onChange={e => setFilters({ onlyVerified: e.target.checked })}
                  className="rounded text-brand focus:ring-brand"
                />
                <span className="font-semibold text-gray-600">Profils Vérifiés</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer bg-pink-50/50 p-2.5 rounded-xl border border-pink-100/50">
                <input 
                  type="checkbox" 
                  checked={filters.onlyPremium}
                  onChange={e => setFilters({ onlyPremium: e.target.checked })}
                  className="rounded text-brand focus:ring-brand"
                />
                <span className="font-semibold text-gray-600">Premium Seuls</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Main Stage Cards */}
      <div className="flex-1 flex items-center justify-center relative w-full h-[450px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-brand rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Recherche des profils LoveRose...</p>
          </div>
        ) : currentIndex >= profiles.length ? (
          <div className="text-center p-8 backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-3xl shadow-lg space-y-4 max-w-xs">
            <div className="text-4xl">🌹</div>
            <h3 className="text-lg font-bold text-gray-800">Plus aucun profil à proximité</h3>
            <p className="text-sm text-gray-400">
              Élargissez vos filtres d'âge ou de distance pour découvrir plus de monde sur LoveRose.
            </p>
            <button 
              onClick={() => {
                setFilters({ minAge: 18, maxAge: 65, distance: 150 });
                setCurrentIndex(0);
              }}
              className="px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-opacity-95 transition cursor-pointer shadow-md shadow-brand/10"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeProfile.uid}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: -300, right: 300 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 130) {
                  handleSwipe('like');
                } else if (info.offset.x < -130) {
                  handleSwipe('pass');
                }
              }}
              className="absolute w-full h-full backdrop-blur-md bg-white/45 rounded-[40px] shadow-2xl shadow-rose-950/5 border border-white/45 overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
            >
              
              {/* Photo & badges */}
              <div className="relative flex-1">
                <img 
                  src={activeProfile.photos[0] || "https://picsum.photos/seed/loverose/400/500"} 
                  alt={activeProfile.displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual labels */}
                <div className="absolute top-4 left-4 flex flex-col space-y-1.5 items-start">
                  
                  {/* Compatibility Score */}
                  <div className="bg-black/40 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 border border-white/20">
                    <span>🔥 {calculateCompatibilityScore(activeProfile)}% Compatible</span>
                  </div>

                  {activeProfile.isVerified && (
                    <div className="bg-blue-500/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 border border-blue-400/30">
                      <CheckCircle2 size={11} fill="white" className="text-blue-500" />
                      <span>Vérifié</span>
                    </div>
                  )}

                  {activeProfile.isVip && (
                    <div className="bg-[#D4AF37] text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 border border-amber-400/30 shadow-md">
                      <Award size={11} />
                      <span>VIP Membre</span>
                    </div>
                  )}
                </div>

                {/* Dark Vignette Bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-24 pb-6 px-5 text-white flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-serif font-bold">{activeProfile.displayName}, {activeProfile.age}</h3>
                      {activeProfile.online && (
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse" />
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedProfileUid(activeProfile.uid)}
                      className="p-2 bg-white/20 hover:bg-white/45 text-white rounded-full transition cursor-pointer"
                      title="Visiter le profil en détail"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                  
                  <p className="text-gray-200 text-xs font-semibold flex items-center mt-1">
                    <MapPin size={12} className="mr-1 text-brand" />
                    <span>{activeProfile.city}, {activeProfile.country}</span>
                  </p>
                </div>
              </div>

              {/* Bio & interests info section */}
              <div className="p-5 backdrop-blur-md bg-white/20 border-t border-white/35 space-y-3">
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  {activeProfile.bio || "Aucune bio rédigée pour le moment."}
                </p>
                
                {/* Interests tags */}
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.interests.slice(0, 3).map((interest, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 backdrop-blur-sm bg-white/50 border border-rose-100/30 text-brand text-[10px] font-bold rounded-full shadow-sm"
                    >
                      {interest}
                    </span>
                  ))}
                  {activeProfile.interests.length > 3 && (
                    <span className="px-2 py-1 backdrop-blur-sm bg-white/50 border border-gray-100/30 text-gray-500 text-[10px] font-bold rounded-full shadow-sm">
                      +{activeProfile.interests.length - 3}
                    </span>
                  )}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Control Buttons (Bottom Swiper Actions) */}
      {!loading && currentIndex < profiles.length && (
        <div className="flex justify-center items-center space-x-5 py-4">
          <button 
            onClick={() => handleSwipe('pass')}
            className="w-14 h-14 backdrop-blur-sm bg-white/50 border border-rose-100/50 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-150 hover:bg-white transition-all transform active:scale-90 cursor-pointer shadow-md"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={() => handleSwipe('superlike')}
            className="w-12 h-12 backdrop-blur-sm bg-white/50 border border-rose-100/50 rounded-full flex items-center justify-center text-[#D4AF37] hover:text-[#e0ba45] hover:border-amber-150 hover:bg-white transition-all transform active:scale-90 cursor-pointer shadow-md"
          >
            <Star size={18} fill="currentColor" />
          </button>

          <button 
            onClick={() => handleSwipe('like')}
            className="w-14 h-14 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-full flex items-center justify-center hover:scale-105 transition-all transform active:scale-95 cursor-pointer shadow-lg shadow-rose-200"
          >
            <Heart size={24} fill="currentColor" />
          </button>
        </div>
      )}

      {/* popup It's a Match modal trigger overlay */}
      <AnimatePresence>
        {matchPopup.show && matchPopup.matchedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="text-center text-white space-y-6 max-w-sm"
            >
              <h2 className="text-4xl font-serif font-bold text-brand italic">It's a Match! 🌹</h2>
              <p className="text-gray-300 text-sm">
                Vous et <strong>{matchPopup.matchedUser.displayName}</strong> vous appréciez mutuellement !
              </p>

              {/* Photo intersection */}
              <div className="flex justify-center items-center space-x-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img 
                    src={userProfile?.photos[0] || "https://picsum.photos/seed/user/200/200"} 
                    alt="Vous" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <Heart size={32} className="text-brand fill-brand animate-bounce" />
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img 
                    src={matchPopup.matchedUser.photos[0]} 
                    alt={matchPopup.matchedUser.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <button
                  onClick={() => {
                    setMatchPopup({ show: false });
                    navigate('/messages');
                  }}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-semibold hover:bg-opacity-95 transition cursor-pointer"
                >
                  Envoyer un message
                </button>
                <button
                  onClick={() => setMatchPopup({ show: false })}
                  className="w-full py-3.5 bg-zinc-800 text-zinc-300 rounded-2xl font-semibold hover:bg-zinc-700 transition cursor-pointer"
                >
                  Continuer à swiper
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfileUid && (
          <UserProfileModal 
            userId={selectedProfileUid} 
            onClose={() => setSelectedProfileUid(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
