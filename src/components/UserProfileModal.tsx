import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';
import { UserProfile, Match } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, MapPin, Heart, Star, Sparkles, CheckCircle2, Award, 
  MessageSquare, ShieldAlert, AlertTriangle, Languages, User, Briefcase, GraduationCap, Ruler 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<'faux_profil' | 'arnaque' | 'harcelement' | 'spam' | 'photo_inappropriate'>('faux_profil');
  const [reportComment, setReportComment] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const user = await dbService.getUserProfile(userId);
        if (user) {
          setProfile(user);
          
          // Log a profile visit in the notifications for high interaction simulation!
          if (userProfile && userProfile.uid !== userId) {
            const notifId = `visit_${userProfile.uid}_to_${userId}_${Date.now()}`;
            await dbService.saveNotification({
              id: notifId,
              userId: userId,
              type: 'visit',
              title: 'Nouvelle visite de profil 🌹',
              body: `${userProfile.displayName} a visité votre profil. Allez voir son feed !`,
              read: false,
              createdAt: new Date().toISOString(),
              senderId: userProfile.uid,
              senderName: userProfile.displayName,
              senderPhoto: userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200'
            }).catch(e => console.warn("Failed recording visit notification", e));
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      fetchProfile();
    }
  }, [userId, userProfile]);

  const handleAction = async (type: 'like' | 'superlike') => {
    if (!userProfile || !profile) return;
    setActionLoading(true);
    setSuccessMsg('');
    try {
      const likeId = `${userProfile.uid}_${profile.uid}`;
      await dbService.saveLike({
        id: likeId,
        fromUid: userProfile.uid,
        toUid: profile.uid,
        type: type,
        createdAt: new Date().toISOString()
      });

      // Reciprocal check
      const isMatch = await dbService.checkReciprocalLike(userProfile.uid, profile.uid);

      if (isMatch) {
        const matchId = [userProfile.uid, profile.uid].sort().join('_');
        const newMatch: Match = {
          id: matchId,
          users: [userProfile.uid, profile.uid],
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastMessageText: "Vous avez un match ! Envoyez le premier message."
        };
        await dbService.saveMatch(newMatch);
        setSuccessMsg(`Félicitations ! C'est un Match avec ${profile.displayName} ! 🌹`);
      } else {
        setSuccessMsg(`Votre ${type === 'like' ? 'Like' : 'Super Like'} a bien été envoyé !`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const startChat = async () => {
    if (!userProfile || !profile) return;
    setActionLoading(true);
    try {
      // Find or create match
      const matchId = [userProfile.uid, profile.uid].sort().join('_');
      const matches = await dbService.fetchMatches(userProfile.uid);
      const matchExists = matches.some(m => m.id === matchId);

      if (!matchExists) {
        const newMatch: Match = {
          id: matchId,
          users: [userProfile.uid, profile.uid],
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          lastMessageText: "Discussion lancée."
        };
        await dbService.saveMatch(newMatch);
      }
      
      onClose();
      navigate('/messages');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !profile) return;
    setActionLoading(true);
    try {
      const reportId = `rep_${userProfile.uid}_${profile.uid}_${Date.now()}`;
      await dbService.saveReport({
        id: reportId,
        reporterId: userProfile.uid,
        reportedId: profile.uid,
        reason: reportReason,
        comment: reportComment,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccessMsg("Signalement envoyé. Notre équipe de modération va examiner ce profil.");
      setShowReportForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white/95 border border-rose-100/30 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-md transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-brand rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-bold">Chargement du profil...</p>
          </div>
        ) : !profile ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-sm text-gray-500 font-bold">Profil introuvable ou supprimé.</p>
            <button onClick={onClose} className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold">Fermer</button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {/* Primary Cover Image */}
            <div className="relative h-72 w-full bg-rose-50">
              <img 
                src={profile.photos?.[0] || 'https://picsum.photos/seed/loverose/400/300'} 
                alt={profile.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-6 text-white space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-bold font-serif">{profile.displayName}{profile.age ? `, ${profile.age}` : ''}</h3>
                  {profile.online && (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse" />
                  )}
                  {profile.isVerified && (
                    <span className="bg-blue-500 text-white rounded-full p-0.5 text-[8px] font-bold" title="Profil Vérifié IA">✔</span>
                  )}
                </div>
                <p className="text-xs text-rose-100 flex items-center">
                  <MapPin size={12} className="mr-1" />
                  <span>{profile.city || 'Non renseigné'}, {profile.country || ''}</span>
                </p>
              </div>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-6">
              
              {/* Alert Message */}
              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Badges details */}
              <div className="flex flex-wrap gap-2">
                {profile.isPremium && (
                  <span className="bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                    <Sparkles size={10} className="fill-amber-600 text-amber-600" />
                    <span>Premium</span>
                  </span>
                )}
                {profile.isVip && (
                  <span className="bg-indigo-100 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                    <Award size={10} />
                    <span>VIP</span>
                  </span>
                )}
                {profile.gender && (
                  <span className="bg-pink-100 border border-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-bold">
                    {profile.gender}
                  </span>
                )}
              </div>

              {/* Biography Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <User size={13} className="text-brand" />
                  <span>Ma Biographie</span>
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed bg-rose-50/30 p-4 rounded-2xl border border-rose-100/10">
                  {profile.bio || "Cette personne n'a pas encore rédigé sa biographie."}
                </p>
              </div>

              {/* Physical & personal attributes */}
              <div className="grid grid-cols-2 gap-4">
                {profile.height && (
                  <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center space-x-3">
                    <Ruler size={16} className="text-gray-400" />
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400">Taille</p>
                      <p className="text-xs font-bold text-gray-700">{profile.height} cm</p>
                    </div>
                  </div>
                )}
                {profile.profession && (
                  <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center space-x-3">
                    <Briefcase size={16} className="text-gray-400" />
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400">Profession</p>
                      <p className="text-xs font-bold text-gray-700">{profile.profession}</p>
                    </div>
                  </div>
                )}
                {profile.education && (
                  <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center space-x-3">
                    <GraduationCap size={16} className="text-gray-400" />
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400">Études</p>
                      <p className="text-xs font-bold text-gray-700">{profile.education}</p>
                    </div>
                  </div>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-center space-x-3">
                    <Languages size={16} className="text-gray-400" />
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400">Langues</p>
                      <p className="text-xs font-bold text-gray-700">{profile.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests tag cloud */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">Centres d'intérêt</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-white border border-rose-100/40 text-brand text-[10px] font-bold rounded-full shadow-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {profile.photos && profile.photos.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">Toutes les photos ({profile.photos.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.photos.map((p, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                        <img 
                          src={p} 
                          alt="" 
                          className="w-full h-full object-cover hover:scale-105 transition duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons footer inside card */}
              {userProfile && userProfile.uid !== profile.uid && (
                <div className="pt-4 border-t border-rose-150/40 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleAction('like')}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-xl text-xs font-bold hover:scale-[1.01] transition shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Heart size={14} fill="currentColor" />
                    <span>Liker</span>
                  </button>

                  <button
                    onClick={() => handleAction('superlike')}
                    disabled={actionLoading}
                    className="py-3 px-4 border border-rose-150/40 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Star size={14} fill="currentColor" />
                    <span>Super</span>
                  </button>

                  <button
                    onClick={startChat}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="p-3 text-gray-400 hover:text-red-500 border border-gray-100 rounded-xl hover:bg-red-50/50 cursor-pointer transition"
                    title="Signaler l'utilisateur"
                  >
                    <ShieldAlert size={14} />
                  </button>
                </div>
              )}

              {/* Expandable Signalement report form */}
              <AnimatePresence>
                {showReportForm && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={submitReport}
                    className="bg-red-50/50 border border-red-100 rounded-3xl p-4 space-y-3 overflow-hidden text-left"
                  >
                    <div className="flex items-center space-x-1.5 text-red-600 font-bold text-xs">
                      <AlertTriangle size={14} />
                      <span>Signaler ce compte</span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600">Raison</label>
                      <select
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value as any)}
                        className="w-full bg-white border border-red-100 rounded-xl p-2 text-xs focus:outline-none"
                      >
                        <option value="faux_profil">Faux Profil / Robot</option>
                        <option value="arnaque">Arnaque / Publicité commerciale</option>
                        <option value="harcelement">Harcèlement / Comportement déplacé</option>
                        <option value="spam">Spam / Messages répétitifs</option>
                        <option value="photo_inappropriate">Photos de profil inappropriées</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600">Commentaire (facultatif)</label>
                      <textarea
                        value={reportComment}
                        onChange={e => setReportComment(e.target.value)}
                        placeholder="Fournissez plus de détails..."
                        rows={3}
                        className="w-full bg-white border border-red-100 rounded-xl p-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex space-x-2 justify-end pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowReportForm(false)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-bold"
                      >
                        Envoyer le Signalement
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
