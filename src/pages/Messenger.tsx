import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { isSupabaseConfigured, supabase } from '../supabase/config';
import { dbService, subscribeMessages } from '../services/db';
import { Match, Message, UserProfile } from '../types';
import { 
  Send, Smile, Image as ImageIcon, Mic, Phone, Video, Trash2, CornerUpLeft, CheckCheck, MapPin, Sparkles, X, ChevronLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserProfileModal from '../components/UserProfileModal';

export default function Messenger() {
  const { userProfile } = useAuth();
  const { startCall } = useAppStore();

  const [matches, setMatches] = useState<(Match & { targetUser: UserProfile })[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<(Match & { targetUser: UserProfile }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to matches in real-time
  useEffect(() => {
    if (!userProfile) return;

    if (isSupabaseConfigured) {
      const fetchSupabaseMatches = async () => {
        try {
          const list = await dbService.fetchMatches(userProfile.uid);
          const fetchedMatches: any[] = [];
          for (const matchData of list) {
            const targetUid = matchData.users.find(uid => uid !== userProfile.uid);
            if (targetUid) {
              const profile = await dbService.getUserProfile(targetUid);
              if (profile) {
                fetchedMatches.push({
                  ...matchData,
                  targetUser: profile
                });
              }
            }
          }
          setMatches(fetchedMatches.sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return dateB - dateA;
          }));
          setLoading(false);
        } catch (err) {
          console.error("Error fetching Supabase matches:", err);
        }
      };

      fetchSupabaseMatches();

      // Setup a subscription for new matches as well
      const channel = supabase.channel('realtime_matches_lobby')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
          fetchSupabaseMatches();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Fallback
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('users', 'array-contains', userProfile.uid));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedMatches: any[] = [];
        for (const d of snapshot.docs) {
          const matchData = d.data() as Match;
          const targetUid = matchData.users.find(uid => uid !== userProfile.uid);
          if (targetUid) {
            const profile = await dbService.getUserProfile(targetUid);
            if (profile) {
              fetchedMatches.push({
                ...matchData,
                targetUser: profile
              });
            }
          }
        }
        setMatches(fetchedMatches.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        }));
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userProfile]);

  // 2. Listen to messages for the selected match in real-time
  useEffect(() => {
    if (!selectedMatch) return;

    const unsubscribe = subscribeMessages(selectedMatch.id, setMessages);
    return () => unsubscribe();
  }, [selectedMatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, customFields: Partial<Message> = {}) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !customFields.image && !customFields.audio && !customFields.gif) return;
    if (!userProfile || !selectedMatch) return;

    try {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const messageData: Message = {
        id: msgId,
        matchId: selectedMatch.id,
        senderId: userProfile.uid,
        text: inputText.trim() || undefined,
        timestamp: new Date().toISOString(),
        isRead: false,
        isDeleted: false,
        replyToId: replyMessage?.id || undefined,
        ...customFields
      };

      await dbService.saveMessage(messageData);

      // Update match preview
      const previewText = inputText.trim() || (customFields.audio ? '🎤 Message vocal' : customFields.gif ? '🖼️ GIF' : '📷 Image');
      await dbService.updateMatchLastMessage(selectedMatch.id, previewText);

      setInputText('');
      setReplyMessage(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Delete message (soft delete)
  const handleDeleteMessage = async (msgId: string) => {
    try {
      const msgToUpdate = messages.find(m => m.id === msgId);
      if (msgToUpdate) {
        await dbService.saveMessage({
          ...msgToUpdate,
          isDeleted: true,
          text: "Ce message a été supprimé"
        });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleTriggerCall = (isVideo: boolean) => {
    if (!selectedMatch) return;
    
    // Check premium role permission
    if (!userProfile?.isPremium && !userProfile?.isVip) {
      alert("⚠️ Les appels audio/vidéo WebRTC sont réservés aux membres premium. Veuillez vous abonner dans la boutique !");
      return;
    }

    startCall(selectedMatch.targetUser.uid, selectedMatch.targetUser.displayName, isVideo);
  };

  const triggerPresetMedia = (type: 'image' | 'gif' | 'voice') => {
    if (type === 'image') {
      handleSendMessage(undefined, { image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400' });
    } else if (type === 'gif') {
      handleSendMessage(undefined, { gif: 'https://media.giphy.com/media/26hpKzG2eLPvK/giphy.gif' });
    } else {
      handleSendMessage(undefined, { audio: 'https://example.com/mock-audio.mp3' });
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[40px] overflow-hidden shadow-2xl">
      
      {/* Matches Side Rail Panel */}
      <div className={`w-full md:w-80 border-r border-rose-100/50 flex flex-col backdrop-blur-md bg-white/20 ${selectedMatch ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-rose-100/50 bg-white/40">
          <h2 className="text-xl font-serif font-bold text-gray-800">Vos conversations</h2>
          <p className="text-xs text-gray-400 mt-1">Discutez en temps réel avec vos correspondants.</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-rose-100/30">
          {loading ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              🌟 Aucun match pour l'instant. Allez dans la section Découverte pour swiper des profils !
            </div>
          ) : (
            matches.map((m) => {
              const isSelected = selectedMatch?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatch(m)}
                  className={`w-full p-4 flex items-center space-x-3 text-left transition cursor-pointer ${
                    isSelected ? 'bg-brand/10 border-l-4 border-brand' : 'hover:bg-white/30'
                  }`}
                >
                  <div 
                    className="relative cursor-pointer group shrink-0"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent chat selection, view profile instead
                      setSelectedProfileUid(m.targetUser.uid);
                    }}
                    title="Visiter le profil en détail"
                  >
                    <img 
                      src={m.targetUser.photos[0]} 
                      alt={m.targetUser.displayName} 
                      className="w-12 h-12 rounded-full object-cover border border-pink-100 group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    {m.targetUser.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-sm text-gray-800 truncate">{m.targetUser.displayName}</h4>
                      {m.targetUser.isVerified && (
                        <span className="text-[10px] bg-blue-50 text-blue-500 px-1 rounded font-bold">✔</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{m.lastMessageText}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Conversation Stage */}
      <div className={`flex-1 flex flex-col bg-brand-bg/20 ${!selectedMatch ? 'hidden md:flex justify-center items-center text-gray-400 p-8' : 'flex'}`}>
        {selectedMatch ? (
          <>
            {/* Target Match Header */}
            <div className="p-4 border-b border-rose-100/50 bg-white/40 flex justify-between items-center">
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedMatch(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 md:hidden mr-1 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div 
                  onClick={() => setSelectedProfileUid(selectedMatch.targetUser.uid)}
                  className="flex items-center space-x-3 cursor-pointer group text-left"
                  title="Visiter le profil de ce correspondant"
                >
                  <img 
                    src={selectedMatch.targetUser.photos[0]} 
                    alt={selectedMatch.targetUser.displayName} 
                    className="w-10 h-10 rounded-full object-cover border border-pink-50 group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 flex items-center group-hover:text-brand transition">
                      <span>{selectedMatch.targetUser.displayName}</span>
                      {selectedMatch.targetUser.isVerified && (
                        <span className="text-blue-500 ml-1 text-xs">✔</span>
                      )}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {selectedMatch.targetUser.online ? 'En ligne' : `Dernière connexion: ${selectedMatch.targetUser.city || 'LoveRose'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* WebRTC calling controls */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleTriggerCall(false)}
                  className="p-2.5 rounded-xl bg-pink-50 text-brand hover:bg-brand hover:text-white transition cursor-pointer"
                  title="Appel Audio"
                >
                  <Phone size={16} />
                </button>
                <button 
                  onClick={() => handleTriggerCall(true)}
                  className="p-2.5 rounded-xl bg-pink-50 text-brand hover:bg-brand hover:text-white transition cursor-pointer"
                  title="Appel Vidéo"
                >
                  <Video size={16} />
                </button>
              </div>

            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isSelf = msg.senderId === userProfile?.uid;
                
                // Lookup parent message context if reply
                const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

                return (
                  <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] space-y-1">
                      
                      {/* Replied snippet if exists */}
                      {repliedMsg && (
                        <div className="bg-zinc-100 border-l-4 border-pink-400 p-1.5 rounded-t-xl text-[10px] text-zinc-500 line-clamp-1 italic">
                          En réponse à: {repliedMsg.text || 'Média'}
                        </div>
                      )}

                      <div className={`p-3.5 rounded-2xl relative group ${
                        isSelf 
                          ? 'bg-brand text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-pink-100 rounded-tl-none'
                      }`}>
                        
                        {/* Message textual block */}
                        {msg.isDeleted ? (
                          <span className="text-xs italic text-gray-300">Ce message a été supprimé</span>
                        ) : (
                          <>
                            {msg.text && <p className="text-sm font-medium">{msg.text}</p>}
                            
                            {/* Rich contents */}
                            {msg.image && (
                              <img src={msg.image} alt="Chat attach" className="rounded-xl max-w-full h-40 object-cover mt-1.5" referrerPolicy="no-referrer" />
                            )}
                            {msg.gif && (
                              <img src={msg.gif} alt="Chat GIF" className="rounded-xl max-w-full h-40 object-cover mt-1.5" referrerPolicy="no-referrer" />
                            )}
                            {msg.audio && (
                              <div className="flex items-center space-x-2 mt-1 bg-black/10 p-2 rounded-lg text-xs">
                                <button className="p-1 bg-white text-brand rounded-full cursor-pointer">▶</button>
                                <span>Message vocal — 0:08</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Action buttons (Delete / Reply overlays) on Hover */}
                        {!msg.isDeleted && (
                          <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-1.5 px-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm text-gray-500 z-10 ${
                            isSelf ? '-left-16' : '-right-16'
                          }`}>
                            <button 
                              onClick={() => setReplyMessage(msg)}
                              className="p-1 hover:text-brand cursor-pointer" 
                              title="Répondre"
                            >
                              <CornerUpLeft size={12} />
                            </button>
                            {isSelf && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:text-red-500 cursor-pointer" 
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Info lines (Time / ticks) */}
                      <div className={`flex items-center space-x-1.5 text-[9px] text-gray-400 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isSelf && <CheckCheck size={10} className="text-pink-400" />}
                      </div>

                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Active Reply Banner bar */}
            {replyMessage && (
              <div className="bg-pink-50/50 p-2 px-4 border-t border-pink-50 text-xs text-brand flex justify-between items-center font-semibold">
                <div className="flex items-center space-x-1">
                  <CornerUpLeft size={12} />
                  <span>En réponse à: <strong className="text-gray-700">{replyMessage.text || 'Pièce jointe'}</strong></span>
                </div>
                <button onClick={() => setReplyMessage(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Input Form Box & Rich action tray */}
            <form onSubmit={handleSendMessage} className="p-4 backdrop-blur-sm bg-white/30 border-t border-rose-100/50 flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 backdrop-blur-sm bg-white/50 border border-rose-100/30 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                
                {/* Send Button */}
                <button 
                  type="submit"
                  className="p-3 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white rounded-full hover:scale-105 shadow shadow-brand/15 cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Instant Rich Media Tray for Premium Demo */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 font-semibold pt-1">
                <span className="text-[10px] text-gray-400 mr-2 uppercase tracking-wider font-mono">Médias démos:</span>
                <button 
                  type="button" 
                  onClick={() => triggerPresetMedia('voice')}
                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-brand rounded-full flex items-center space-x-1 cursor-pointer"
                >
                  <Mic size={10} />
                  <span>Vocal</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerPresetMedia('image')}
                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-brand rounded-full flex items-center space-x-1 cursor-pointer"
                >
                  <ImageIcon size={10} />
                  <span>Photo</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => triggerPresetMedia('gif')}
                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-brand rounded-full flex items-center space-x-1 cursor-pointer"
                >
                  <Smile size={10} />
                  <span>GIF</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 p-8 backdrop-blur-sm bg-white/30 border border-rose-100/30 rounded-[30px] max-w-sm shadow-md">
            <span className="text-5xl">💬</span>
            <h3 className="text-xl font-serif font-bold text-gray-800">Boîte de réception Premium</h3>
            <p className="text-xs md:text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              Sélectionnez un profil vérifié à gauche pour initier une conversation cryptée et fluide.
            </p>
          </div>
        )}
      </div>

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
