import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot, setDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { 
  Bell, Heart, MessageSquare, Star, RefreshCw, Eye, Sparkles, CheckCheck, Trash2, ShieldAlert, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserProfileModal from '../components/UserProfileModal';

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitorUid, setSelectedVisitorUid] = useState<string | null>(null);

  // Real-time notifications listener
  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as AppNotification);
      // Sort in memory by createdAt descending since composite index might not exist yet
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.error("Notifications listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const markAllAsRead = async () => {
    if (!userProfile || notifications.length === 0) return;
    try {
      for (const n of notifications) {
        if (!n.read) {
          await updateDoc(doc(db, 'notifications', n.id), { read: true });
        }
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!userProfile || notifications.length === 0) return;
    if (!window.confirm("Voulez-vous supprimer toutes vos notifications ?")) return;
    try {
      for (const n of notifications) {
        await deleteDoc(doc(db, 'notifications', n.id));
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      if (!notif.read) {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      }
      // If notification has a sender, let user visit their profile!
      if (notif.senderId) {
        setSelectedVisitorUid(notif.senderId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fun, immersive simulator to populate real-time activity for testing
  const triggerSimulation = async (type: 'visit' | 'like' | 'match') => {
    if (!userProfile) return;
    const mockSenders = [
      { uid: 'sim_charlotte', name: 'Charlotte Dubois', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
      { uid: 'sim_malik', name: 'Malik Sy', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
      { uid: 'sim_ines', name: 'Inès Touré', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' }
    ];
    
    // Pick random sender
    const sender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
    const notifId = `sim_${Date.now()}`;
    
    let title = '';
    let body = '';
    let notifType: AppNotification['type'] = 'promotion';

    if (type === 'visit') {
      title = 'Visite de Profil 🌹';
      body = `${sender.name} est venu visiter votre profil. Allez jeter un œil au sien !`;
      notifType = 'visit';
    } else if (type === 'like') {
      title = 'Coup de cœur ! ✨';
      body = `${sender.name} a glissé votre profil vers la droite. C'est peut-être le début de quelque chose !`;
      notifType = 'like';
    } else if (type === 'match') {
      title = "C'est un Match ! 💑";
      body = `Félicitations, vous et ${sender.name} avez matché ! Ouvrez le chat pour discuter.`;
      notifType = 'match';
    }

    try {
      // First, ensure the simulated user profile document exists in Firestore so they can visit it!
      await setDoc(doc(db, 'users', sender.uid), {
        uid: sender.uid,
        email: `${sender.uid}@loverose.com`,
        displayName: sender.name,
        photos: [sender.photo],
        bio: `Profil simulé de test pour ${sender.name}. UX Designer passionné(e) de voyages et de découvertes artistiques.`,
        age: 25,
        city: 'Dakar/Paris',
        country: 'Sénégal',
        isVerified: true,
        isPremium: true,
        verificationLevel: 3,
        interests: ['Cinéma', 'Voyages', 'Fitness'],
        languages: ['Français', 'English'],
        online: true,
        createdAt: new Date().toISOString()
      });

      // Write notification document
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: userProfile.uid,
        title,
        body,
        type: notifType,
        read: false,
        createdAt: new Date().toISOString(),
        senderId: sender.uid,
        senderName: sender.name,
        senderPhoto: sender.photo
      });

    } catch (err) {
      console.error("Simulation failure:", err);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'match':
        return <div className="bg-pink-100 text-pink-600 p-2.5 rounded-2xl"><Heart size={18} fill="currentColor" /></div>;
      case 'like':
        return <div className="bg-red-100 text-red-500 p-2.5 rounded-2xl"><Heart size={18} /></div>;
      case 'super_like':
        return <div className="bg-amber-100 text-amber-600 p-2.5 rounded-2xl"><Star size={18} fill="currentColor" /></div>;
      case 'message':
        return <div className="bg-blue-100 text-blue-600 p-2.5 rounded-2xl"><MessageSquare size={18} /></div>;
      case 'visit':
        return <div className="bg-purple-100 text-purple-600 p-2.5 rounded-2xl"><Eye size={18} /></div>;
      default:
        return <div className="bg-gray-100 text-gray-600 p-2.5 rounded-2xl"><Bell size={18} /></div>;
    }
  };

  if (!userProfile) {
    return (
      <div className="text-center p-12 text-gray-500">
        Veuillez vous connecter pour voir vos notifications.
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 flex items-center space-x-1.5">
            <span>Centre de Notifications</span>
            <Bell className="text-brand w-5 h-5 animate-bounce" />
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Retrouvez toutes les interactions, visites de profil et alertes récentes.</p>
        </div>

        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 bg-white/50 border border-rose-100/30 hover:bg-white text-gray-600 hover:text-brand rounded-xl text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-sm"
              >
                <CheckCheck size={12} />
                <span>Tout lire</span>
              </button>
              <button
                onClick={clearAllNotifications}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100/50 border border-red-100/20 text-red-500 rounded-xl text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer shadow-sm"
              >
                <Trash2 size={12} />
                <span>Effacer tout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main notifications log card list */}
      <div className="backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-6 shadow-xl min-h-[350px] flex flex-col justify-between">
        <div>
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="animate-spin text-brand" size={24} />
              <p className="text-xs text-gray-400 font-bold">Récupération des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-300">
                <Bell size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-700">Aucune notification pour l'instant</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Toutes vos activités de rencontre, visites de profil, messages et alertes de match s'afficheront ici.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-rose-100/30 space-y-1">
              <AnimatePresence initial={false}>
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 rounded-3xl flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                      notif.read ? 'hover:bg-white/30' : 'bg-rose-50/40 border border-rose-100/20 hover:bg-rose-50/60 shadow-sm'
                    }`}
                  >
                    {/* Icon or Author avatar */}
                    <div className="relative shrink-0">
                      {notif.senderPhoto ? (
                        <img 
                          src={notif.senderPhoto} 
                          alt="" 
                          className="w-11 h-11 rounded-2xl object-cover border border-rose-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        getIcon(notif.type)
                      )}
                      {!notif.read && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand rounded-full border border-white" />
                      )}
                    </div>

                    {/* Content body */}
                    <div className="flex-1 text-left space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-gray-800">{notif.title}</h4>
                        <span className="text-[9px] font-mono font-semibold text-gray-400">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-650 leading-relaxed">{notif.body}</p>
                      
                      {notif.senderId && (
                        <span className="inline-flex items-center text-[9px] font-bold text-brand hover:underline mt-1.5">
                          <span>Visiter le profil de {notif.senderName}</span>
                          <ArrowRight size={10} className="ml-1" />
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Dynamic simulator footer zone to populate test activities */}
        <div className="mt-8 pt-6 border-t border-rose-100/40 space-y-4">
          <div className="bg-rose-50/30 p-4 rounded-3xl border border-rose-100/20 text-left space-y-2">
            <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1">
              <Sparkles size={12} className="text-brand fill-brand" />
              <span>Mode Démo : Simulateur d'activité</span>
            </h4>
            <p className="text-[10px] text-gray-400">
              Puisque vous avez nettoyé les profils factices, vous pouvez utiliser ce simulateur pour déclencher instantanément des interactions réelles de test sur votre compte et essayer le système de visite !
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => triggerSimulation('visit')}
                className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-150/30 text-purple-700 rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer"
              >
                🌹 Visite
              </button>
              <button
                onClick={() => triggerSimulation('like')}
                className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-150/30 text-red-500 rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer"
              >
                💖 Like reçu
              </button>
              <button
                onClick={() => triggerSimulation('match')}
                className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-150/30 text-pink-600 rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer"
              >
                💑 Match instantané
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render visit details modal */}
      <AnimatePresence>
        {selectedVisitorUid && (
          <UserProfileModal 
            userId={selectedVisitorUid} 
            onClose={() => setSelectedVisitorUid(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
