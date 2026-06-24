import React, { useEffect, useState } from 'react';
import { dbService, subscribePosts } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Post, PostComment } from '../types';
import { 
  Heart, MessageSquare, Send, Image as ImageIcon, Sparkles, RefreshCw, Upload, X, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserProfileModal from '../components/UserProfileModal';

export default function FeedPage() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [posting, setPosting] = useState(false);
  
  // Track comments expansion for each post
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  
  // Profile visitor modal state
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);

  // Load posts in real-time
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePosts(async (list) => {
      // If there are no posts, seed 2 elegant dating posts to make the screen alive & beautiful
      if (list.length === 0 && userProfile) {
        await seedInitialPosts();
      } else {
        setPosts(list);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  const seedInitialPosts = async () => {
    try {
      const postsToSeed = [
        {
          authorId: 'feed_seed_camille',
          authorName: 'Camille Rey',
          authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          text: 'Superbe randonnée ce matin au lever du soleil ! 🌅 Qui est motivé pour m\'accompagner le week-end prochain ? J\'adore le plein air.',
          photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600',
          likes: [],
          comments: [
            {
              id: 'comment_1',
              authorId: 'feed_seed_thomas',
              authorName: 'Thomas Martin',
              authorPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
              text: 'Carrément motivé ! Dis-moi où tu vas ?',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          authorId: 'feed_seed_lucas',
          authorName: 'Lucas Bernard',
          authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
          text: 'Session cuisine ce soir : makis faits maison. 🍣 Un peu d\'exercice et beaucoup de gourmandise ! Vous préférez saumon ou avocat ?',
          photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600',
          likes: [],
          comments: [],
          createdAt: new Date(Date.now() - 14400000).toISOString()
        }
      ];

      for (const p of postsToSeed) {
        // Also register authors so they can be visited
        await dbService.saveUserProfile({
          uid: p.authorId,
          email: `${p.authorId}@loverose.com`,
          displayName: p.authorName,
          photos: [p.authorPhoto],
          bio: `Bienvenue sur mon profil ! J'adore partager mes aventures de tous les jours sur mon feed. Faisons connaissance !`,
          age: 27,
          city: 'Dakar',
          country: 'Sénégal',
          isVerified: true,
          isPremium: false,
          isVip: false,
          role: 'user',
          verificationLevel: 2,
          interests: ['Cuisine', 'Nature', 'Randonnée', 'Rencontres'],
          languages: ['Français'],
          online: true,
          createdAt: new Date().toISOString()
        });

        await dbService.savePost(p);
      }
    } catch (err) {
      console.warn("Failed seeding initial posts", err);
    }
  };

  const handlePostPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 3) {
      alert("L'image est trop lourde. Choisissez un fichier de moins de 3 Mo.");
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPostPhoto(reader.result as string);
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!newPostText.trim() && !newPostPhoto) return;

    setPosting(true);
    try {
      const newPost: Omit<Post, 'id'> = {
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorPhoto: userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200',
        text: newPostText,
        photo: newPostPhoto || undefined,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };

      await dbService.savePost(newPost);
      
      // Reset inputs
      setNewPostText('');
      setNewPostPhoto(null);
    } catch (err) {
      console.error("Error creating feed post:", err);
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (post: Post) => {
    if (!userProfile) return;
    const isLiked = post.likes.includes(userProfile.uid);

    try {
      await dbService.likePost(post, userProfile.uid);

      if (!isLiked) {
        // Push a notification to the author if it's someone else
        if (post.authorId !== userProfile.uid) {
          const notifId = `like_post_${post.id}_${userProfile.uid}`;
          await dbService.saveNotification({
            id: notifId,
            userId: post.authorId,
            type: 'like',
            title: 'Nouveau coup de cœur 💖',
            body: `${userProfile.displayName} a aimé votre publication : "${post.text.slice(0, 30)}..."`,
            read: false,
            createdAt: new Date().toISOString(),
            senderId: userProfile.uid,
            senderName: userProfile.displayName,
            senderPhoto: userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200'
          }).catch(e => console.warn("Failed recording post notification", e));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string, post: Post) => {
    if (!userProfile) return;
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment: PostComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      authorId: userProfile.uid,
      authorName: userProfile.displayName,
      authorPhoto: userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200',
      text: commentText,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.addPostComment(post, newComment);

      // Reset specific comment input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      // Notify post author
      if (post.authorId !== userProfile.uid) {
        const notifId = `comment_post_${postId}_${Date.now()}`;
        await dbService.saveNotification({
          id: notifId,
          userId: post.authorId,
          type: 'message',
          title: 'Nouveau commentaire 💬',
          body: `${userProfile.displayName} a commenté votre post : "${commentText.slice(0, 30)}..."`,
          read: false,
          createdAt: new Date().toISOString(),
          senderId: userProfile.uid,
          senderName: userProfile.displayName,
          senderPhoto: userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200'
        }).catch(e => console.warn(e));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (!userProfile) {
    return (
      <div className="text-center p-12 text-gray-500">
        Veuillez vous connecter pour voir le fil d'actualité.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      
      {/* Feed Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-800 flex items-center space-x-1.5">
          <span>Fil d'actualité</span>
          <Sparkles className="text-brand w-5 h-5 animate-pulse" />
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">Partagez votre humeur, vos moments de vie et découvrez les nouveautés des célibataires.</p>
      </div>

      {/* 1. Create Post card */}
      <div className="backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-5 shadow-lg">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex items-start gap-3">
            <img 
              src={userProfile.photos?.[0] || 'https://picsum.photos/seed/loverose/200/200'} 
              alt="Moi" 
              className="w-10 h-10 rounded-2xl object-cover border border-rose-100"
              referrerPolicy="no-referrer"
            />
            <textarea
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
              placeholder="Que voulez-vous partager aujourd'hui ? 🌹"
              rows={3}
              className="flex-1 backdrop-blur-sm bg-white/40 border border-rose-100/35 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white text-gray-700 transition"
            />
          </div>

          {/* Photo attachment preview */}
          {newPostPhoto && (
            <div className="relative w-full max-h-60 rounded-2xl overflow-hidden border border-rose-100/30">
              <img src={newPostPhoto} alt="Aperçu publication" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => setNewPostPhoto(null)}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Controls bar */}
          <div className="pt-2 border-t border-rose-100/20 flex items-center justify-between">
            <label className="inline-flex items-center space-x-1 px-3 py-2 bg-white hover:bg-rose-50 border border-rose-150/30 rounded-xl text-[10px] font-bold text-brand cursor-pointer shadow-sm transition">
              <ImageIcon size={12} />
              <span>{uploadingPhoto ? 'Chargement...' : 'Ajouter une photo'}</span>
              <input type="file" accept="image/*" onChange={handlePostPhotoChange} className="hidden" disabled={uploadingPhoto} />
            </label>

            <button
              type="submit"
              disabled={posting || (!newPostText.trim() && !newPostPhoto)}
              className="px-4 py-2 bg-brand text-white text-[11px] font-bold rounded-xl shadow-md shadow-brand/10 hover:scale-[1.02] active:scale-[0.98] transition flex items-center space-x-1 cursor-pointer"
            >
              <Send size={11} />
              <span>{posting ? 'Publication...' : 'Publier'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Posts stream */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="animate-spin text-brand" size={24} />
            <p className="text-xs text-gray-400 font-bold">Actualisation du fil d'actualité...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 text-gray-400 font-medium text-xs">
            Aucun message partagé pour le moment. Soyez le premier !
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likes?.includes(userProfile.uid) || false;
            const commentsOpen = expandedComments[post.id] || false;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-5 shadow-md space-y-4"
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div 
                    onClick={() => setSelectedProfileUid(post.authorId)}
                    className="flex items-center gap-3 cursor-pointer group text-left"
                  >
                    <img 
                      src={post.authorPhoto || 'https://picsum.photos/seed/loverose/200/200'} 
                      alt={post.authorName}
                      className="w-10 h-10 rounded-2xl object-cover border border-rose-100/40 group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1 group-hover:text-brand transition">
                        <span>{post.authorName}</span>
                        {post.authorId.startsWith('feed_seed_') && (
                          <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase">VIP</span>
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-semibold font-mono">
                        {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Quick visit trigger */}
                  {post.authorId !== userProfile.uid && (
                    <button
                      onClick={() => setSelectedProfileUid(post.authorId)}
                      className="text-[9px] font-bold text-brand hover:underline flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>Profil</span>
                      <ArrowUpRight size={10} />
                    </button>
                  )}
                </div>

                {/* Text post */}
                {post.text && (
                  <p className="text-xs text-gray-750 leading-relaxed text-left whitespace-pre-wrap">
                    {post.text}
                  </p>
                )}

                {/* Image attachment */}
                {post.photo && (
                  <div className="rounded-3xl overflow-hidden max-h-80 border border-rose-100/20 bg-black">
                    <img 
                      src={post.photo} 
                      alt="" 
                      className="w-full h-full object-cover max-h-80 hover:scale-[1.01] transition duration-300" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Engagement row */}
                <div className="pt-2 border-t border-rose-100/15 flex items-center space-x-5">
                  <button
                    onClick={() => handleLikePost(post)}
                    className={`flex items-center space-x-1.5 text-xs font-bold transition cursor-pointer ${
                      hasLiked ? 'text-brand' : 'text-gray-400 hover:text-brand'
                    }`}
                  >
                    <Heart size={14} fill={hasLiked ? "currentColor" : "none"} />
                    <span>{post.likes?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-gray-400 hover:text-brand transition cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>

                {/* Comments box */}
                {commentsOpen && (
                  <div className="mt-3 pt-4 border-t border-rose-100/20 space-y-4">
                    {/* Previous comments list */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2 text-left">
                            <img 
                              src={comment.authorPhoto || 'https://picsum.photos/seed/loverose/200/200'} 
                              alt="" 
                              className="w-7 h-7 rounded-xl object-cover shrink-0 border border-gray-100 cursor-pointer"
                              onClick={() => setSelectedProfileUid(comment.authorId)}
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 bg-rose-50/20 border border-rose-100/10 p-2.5 rounded-2xl">
                              <div className="flex justify-between items-baseline">
                                <span 
                                  onClick={() => setSelectedProfileUid(comment.authorId)}
                                  className="text-[10px] font-bold text-gray-800 hover:underline cursor-pointer"
                                >
                                  {comment.authorName}
                                </span>
                                <span className="text-[8px] font-mono font-semibold text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-650 leading-relaxed mt-0.5">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rédiger une réponse..."
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-1 backdrop-blur-sm bg-white/50 border border-rose-100/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand text-gray-700"
                      />
                      <button
                        onClick={() => handleAddComment(post.id, post)}
                        className="p-2 bg-brand text-white rounded-xl hover:scale-[1.03] active:scale-[0.97] transition cursor-pointer shadow shadow-brand/10"
                      >
                        <Send size={11} />
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            );
          })
        )}
      </div>

      {/* Profile Detail overlay visitor */}
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
