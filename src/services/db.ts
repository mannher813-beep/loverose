import { 
  collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { UserProfile, Like, Match, Message, AppNotification, Post, PostComment, Report, PaymentRecord, VerificationRequest } from '../types';

// ==========================================
// MAPPERS: Translate camelCase (React/Firestore) <=> snake_case (Supabase/Postgres)
// ==========================================

function toSupabaseProfile(p: Partial<UserProfile>) {
  const res: any = {};
  if (p.uid !== undefined) res.uid = p.uid;
  if (p.email !== undefined) res.email = p.email;
  if (p.displayName !== undefined) res.display_name = p.displayName;
  if (p.birthDate !== undefined) res.birth_date = p.birthDate;
  if (p.age !== undefined) res.age = p.age;
  if (p.gender !== undefined) res.gender = p.gender;
  if (p.orientation !== undefined) res.orientation = p.orientation;
  if (p.city !== undefined) res.city = p.city;
  if (p.country !== undefined) res.country = p.country;
  if (p.bio !== undefined) res.bio = p.bio;
  if (p.photos !== undefined) res.photos = p.photos;
  if (p.interests !== undefined) res.interests = p.interests;
  if (p.height !== undefined) res.height = p.height;
  if (p.profession !== undefined) res.profession = p.profession;
  if (p.education !== undefined) res.education = p.education;
  if (p.languages !== undefined) res.languages = p.languages;
  if (p.isPremium !== undefined) res.is_premium = p.isPremium;
  if (p.premiumUntil !== undefined) res.premium_until = p.premiumUntil;
  if (p.isVip !== undefined) res.is_vip = p.isVip;
  if (p.isVerified !== undefined) res.is_verified = p.isVerified;
  if (p.verificationLevel !== undefined) res.verification_level = p.verificationLevel;
  if (p.phone !== undefined) res.phone = p.phone;
  if (p.role !== undefined) res.role = p.role;
  if (p.online !== undefined) res.online = p.online;
  if (p.lastSeen !== undefined) res.last_seen = p.lastSeen;
  if (p.hideAge !== undefined) res.hide_age = p.hideAge;
  if (p.hideDistance !== undefined) res.hide_distance = p.hideDistance;
  if (p.hideOnline !== undefined) res.hide_online = p.hideOnline;
  if (p.createdAt !== undefined) res.created_at = p.createdAt;
  return res;
}

function fromSupabaseProfile(row: any): UserProfile {
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name,
    birthDate: row.birth_date,
    age: row.age,
    gender: row.gender,
    orientation: row.orientation,
    city: row.city,
    country: row.country,
    bio: row.bio,
    photos: row.photos || [],
    interests: row.interests || [],
    height: row.height,
    profession: row.profession,
    education: row.education,
    languages: row.languages || [],
    isPremium: row.is_premium,
    premiumUntil: row.premium_until,
    isVip: row.is_vip,
    isVerified: row.is_verified,
    verificationLevel: row.verification_level,
    phone: row.phone,
    role: row.role || 'user',
    online: row.online,
    lastSeen: row.last_seen,
    hideAge: row.hide_age,
    hideDistance: row.hide_distance,
    hideOnline: row.hide_online,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function toSupabaseLike(l: Partial<Like>) {
  return {
    id: l.id,
    from_uid: l.fromUid,
    to_uid: l.toUid,
    type: l.type,
    created_at: l.createdAt
  };
}

function toSupabaseMatch(m: Partial<Match>) {
  return {
    id: m.id,
    users: m.users,
    created_at: m.createdAt,
    last_message_at: m.lastMessageAt,
    last_message_text: m.lastMessageText
  };
}

function fromSupabaseMatch(row: any): Match {
  return {
    id: row.id,
    users: row.users || [],
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    lastMessageText: row.last_message_text
  };
}

function toSupabaseMessage(msg: Partial<Message>) {
  return {
    id: msg.id,
    match_id: msg.matchId,
    sender_id: msg.senderId,
    text: msg.text,
    image: msg.image,
    audio: msg.audio,
    gif: msg.gif,
    timestamp: msg.timestamp,
    reply_to_id: msg.replyToId,
    is_read: msg.isRead,
    is_deleted: msg.isDeleted
  };
}

function fromSupabaseMessage(row: any): Message {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    text: row.text,
    image: row.image,
    audio: row.audio,
    gif: row.gif,
    timestamp: row.timestamp,
    replyToId: row.reply_to_id,
    isRead: row.is_read,
    isDeleted: row.is_deleted
  };
}

function toSupabaseNotification(n: Partial<AppNotification>) {
  return {
    id: n.id,
    user_id: n.userId,
    title: n.title,
    body: n.body,
    type: n.type,
    read: n.read,
    created_at: n.createdAt,
    sender_id: n.senderId,
    sender_name: n.senderName,
    sender_photo: n.senderPhoto
  };
}

function fromSupabaseNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderPhoto: row.sender_photo
  };
}

function toSupabasePost(p: Partial<Post>) {
  return {
    id: p.id,
    author_id: p.authorId,
    author_name: p.authorName,
    author_photo: p.authorPhoto,
    text: p.text,
    photo: p.photo,
    likes: p.likes,
    comments: p.comments,
    created_at: p.createdAt
  };
}

function fromSupabasePost(row: any): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhoto: row.author_photo,
    text: row.text,
    photo: row.photo,
    likes: row.likes || [],
    comments: row.comments || [],
    createdAt: row.created_at
  };
}

// ==========================================
// DB SERVICE METHODS
// ==========================================

export const dbService = {
  // PROFILES OPERATIONS
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('uid', uid)
          .single();
        
        if (error) throw error;
        return data ? fromSupabaseProfile(data) : null;
      } catch (err) {
        console.error("Supabase getUserProfile error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const userSnap = await getDoc(doc(db, 'users', uid));
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(toSupabaseProfile(profile));
        if (error) throw error;
      } catch (err) {
        console.error("Supabase saveUserProfile error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'users', profile.uid), profile);
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(toSupabaseProfile(data))
          .eq('uid', uid);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase updateUserProfile error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await updateDoc(doc(db, 'users', uid), data);
  },

  async fetchDiscoverableProfiles(currentUser: UserProfile): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) throw error;
        if (data) {
          return data
            .map(fromSupabaseProfile)
            .filter(u => u.uid !== currentUser.uid && !u.uid.startsWith('seed_') && !u.email.endsWith('@loverose.com'));
        }
      } catch (err) {
        console.error("Supabase fetchDiscoverableProfiles error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const snapAll = await getDocs(collection(db, 'users'));
    return snapAll.docs
      .map(d => d.data() as UserProfile)
      .filter(u => u.uid !== currentUser.uid && !u.uid.startsWith('seed_') && !u.email.endsWith('@loverose.com'));
  },

  // SWIPE & LIKES OPERATIONS
  async saveLike(like: Like): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('likes')
          .upsert(toSupabaseLike(like));
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveLike error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'likes', like.id), like);
  },

  async checkReciprocalLike(fromUid: string, toUid: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('likes')
          .select('*')
          .eq('from_uid', toUid)
          .eq('to_uid', fromUid)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned, which is fine
        return Boolean(data && data.type !== 'pass');
      } catch (err) {
        console.error("Supabase checkReciprocalLike error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const reciprocalLikeRef = doc(db, 'likes', `${toUid}_${fromUid}`);
    const reciprocalSnap = await getDoc(reciprocalLikeRef);
    return reciprocalSnap.exists() && reciprocalSnap.data().type !== 'pass';
  },

  // MATCHES OPERATIONS
  async saveMatch(match: Match): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('matches')
          .upsert(toSupabaseMatch(match));
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveMatch error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'matches', match.id), match);
  },

  async fetchMatches(uid: string): Promise<Match[]> {
    if (isSupabaseConfigured) {
      try {
        // Since Postgres jsonb or array is stored, we can query matches where 'users' contains the uid
        const { data, error } = await supabase
          .from('matches')
          .select('*');
        if (error) throw error;
        if (data) {
          // Filter in memory for compatibility, or if 'users' contains uid
          return data
            .map(fromSupabaseMatch)
            .filter(m => m.users.includes(uid));
        }
      } catch (err) {
        console.error("Supabase fetchMatches error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Match);
  },

  // MESSAGES OPERATIONS
  async saveMessage(msg: Message): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('messages')
          .upsert(toSupabaseMessage(msg));
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveMessage error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'messages', msg.id), msg);
  },

  async updateMatchLastMessage(matchId: string, text: string): Promise<void> {
    const updatePayload = {
      lastMessageAt: new Date().toISOString(),
      lastMessageText: text
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('matches')
          .update(toSupabaseMatch(updatePayload))
          .eq('id', matchId);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase updateMatchLastMessage error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await updateDoc(doc(db, 'matches', matchId), updatePayload);
  },

  // NOTIFICATIONS OPERATIONS
  async saveNotification(notif: AppNotification): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .upsert(toSupabaseNotification(notif));
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveNotification error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'notifications', notif.id), notif);
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase markNotificationAsRead error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await updateDoc(doc(db, 'notifications', id), { read: true });
  },

  async deleteNotification(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase deleteNotification error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await deleteDoc(doc(db, 'notifications', id));
  },

  // POSTS (FIL D'ACTUALITE) OPERATIONS
  async savePost(post: Omit<Post, 'id'> & { id?: string }): Promise<string> {
    const finalId = post.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fullPost = { id: finalId, ...post } as Post;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('posts')
          .upsert(toSupabasePost(fullPost));
        if (error) throw error;
        return finalId;
      } catch (err) {
        console.error("Supabase savePost error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    if (post.id) {
      await setDoc(doc(db, 'posts', post.id), fullPost);
    } else {
      const docRef = await addDoc(collection(db, 'posts'), post);
      return docRef.id;
    }
    return finalId;
  },

  async likePost(post: Post, currentUserId: string): Promise<void> {
    const likesList = post.likes || [];
    const isLiked = likesList.includes(currentUserId);
    const updatedLikes = isLiked 
      ? likesList.filter(id => id !== currentUserId)
      : [...likesList, currentUserId];

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('posts')
          .update({ likes: updatedLikes })
          .eq('id', post.id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase likePost error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const postRef = doc(db, 'posts', post.id);
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(currentUserId) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUserId) });
    }
  },

  async addPostComment(post: Post, comment: PostComment): Promise<void> {
    const updatedComments = [...(post.comments || []), comment];

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('posts')
          .update({ comments: updatedComments })
          .eq('id', post.id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase addPostComment error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, { comments: arrayUnion(comment) });
  },

  // PAYMENTS & SUBSCRIPTIONS OPERATIONS
  async fetchPayments(userId: string): Promise<PaymentRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', userId);
        if (error) throw error;
        if (data) {
          return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            amount: row.amount,
            currency: row.currency,
            offerId: row.offer_id,
            status: row.status,
            date: row.date,
            reference: row.reference
          }));
        }
      } catch (err) {
        console.error("Supabase fetchPayments error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    const payRef = collection(db, 'payments');
    const q = query(payRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as PaymentRecord);
  },

  async savePaymentRecord(payment: PaymentRecord): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('payments')
          .upsert({
            id: payment.id,
            user_id: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            offer_id: payment.offerId,
            status: payment.status,
            date: payment.date,
            reference: payment.reference
          });
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase savePaymentRecord error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'payments', payment.id), payment);
  },

  async saveSubscription(userId: string, subscription: any): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            id: subscription.id,
            user_id: subscription.userId,
            type: subscription.type,
            status: subscription.status,
            start_date: subscription.startDate,
            end_date: subscription.endDate
          });
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveSubscription error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'subscriptions', subscription.id), subscription);
  },

  async saveVerificationRequest(vRequest: VerificationRequest): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('verification_requests')
          .upsert({
            id: vRequest.id,
            user_id: vRequest.userId,
            photo_url: vRequest.photoUrl,
            status: vRequest.status,
            level: vRequest.level,
            created_at: vRequest.createdAt
          });
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveVerificationRequest error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'verification_requests', vRequest.id), vRequest);
  },

  async saveReport(report: Report): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('reports')
          .upsert({
            id: report.id,
            reporter_id: report.reporterId,
            reported_id: report.reportedId,
            reason: report.reason,
            comment: report.comment,
            status: report.status,
            created_at: report.createdAt
          });
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Supabase saveReport error, trying firestore fallback:", err);
      }
    }

    // Firestore fallback
    await setDoc(doc(db, 'reports', report.id), report);
  }
};

// ==========================================
// REAL-TIME SUBSCRIBERS
// ==========================================

export function subscribeNotifications(userId: string, callback: (notifs: AppNotification[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Initial Supabase notifications fetch error:", error);
          return;
        }
        if (data) callback(data.map(fromSupabaseNotification));
      });

    // 2. Real-time Subscription Channel
    const channel = supabase.channel(`notifications_user_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        supabase.from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) callback(data.map(fromSupabaseNotification));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    // Firestore Fallback Listener
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as AppNotification);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, (err) => {
      console.warn("Firestore notifications subscriber error:", err);
    });
  }
}

export function subscribePosts(callback: (posts: Post[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Initial Supabase posts fetch error:", error);
          return;
        }
        if (data) callback(data.map(fromSupabasePost));
      });

    // 2. Real-time Subscription Channel
    const channel = supabase.channel('public_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        supabase.from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) callback(data.map(fromSupabasePost));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    // Firestore Fallback Listener
    const q = collection(db, 'posts');
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, (err) => {
      console.warn("Firestore posts subscriber error:", err);
    });
  }
}

export function subscribeMessages(matchId: string, callback: (msgs: Message[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('timestamp', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Initial Supabase messages fetch error:", error);
          return;
        }
        if (data) callback(data.map(fromSupabaseMessage));
      });

    // 2. Real-time Subscription Channel
    const channel = supabase.channel(`messages_match_${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, () => {
        supabase.from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('timestamp', { ascending: true })
          .then(({ data }) => {
            if (data) callback(data.map(fromSupabaseMessage));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    // Firestore Fallback Listener
    const q = query(
      collection(db, 'messages'),
      where('matchId', '==', matchId)
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Message);
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(list);
    }, (err) => {
      console.warn("Firestore messages subscriber error:", err);
    });
  }
}

export function subscribeAllUsers(callback: (users: UserProfile[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('profiles')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.warn("Initial Supabase profiles fetch error:", error);
          return;
        }
        if (data) callback(data.map(fromSupabaseProfile));
      });

    // 2. Subscription Channel
    const channel = supabase.channel('admin_all_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        supabase.from('profiles')
          .select('*')
          .then(({ data }) => {
            if (data) callback(data.map(fromSupabaseProfile));
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    return onSnapshot(collection(db, 'users'), (snap) => {
      callback(snap.docs.map(doc => doc.data() as UserProfile));
    });
  }
}

export function subscribeAllReports(callback: (reports: Report[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('reports')
      .select('*')
      .then(({ data }) => {
        if (data) callback(data);
      });

    // 2. Subscription Channel
    const channel = supabase.channel('admin_all_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        supabase.from('reports')
          .select('*')
          .then(({ data }) => {
            if (data) callback(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    return onSnapshot(collection(db, 'reports'), (snap) => {
      callback(snap.docs.map(doc => doc.data() as Report));
    });
  }
}

export function subscribeAllVerifications(callback: (verifs: VerificationRequest[]) => void): () => void {
  if (isSupabaseConfigured) {
    // 1. Initial fetch
    supabase.from('verification_requests')
      .select('*')
      .then(({ data }) => {
        if (data) {
          callback(data.map((v: any) => ({
            id: v.id,
            userId: v.user_id,
            photoUrl: v.photo_url,
            status: v.status,
            level: v.level,
            createdAt: v.created_at
          })));
        }
      });

    // 2. Subscription Channel
    const channel = supabase.channel('admin_all_verifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, () => {
        supabase.from('verification_requests')
          .select('*')
          .then(({ data }) => {
            if (data) {
              callback(data.map((v: any) => ({
                id: v.id,
                userId: v.user_id,
                photoUrl: v.photo_url,
                status: v.status,
                level: v.level,
                createdAt: v.created_at
              })));
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } else {
    return onSnapshot(collection(db, 'verification_requests'), (snap) => {
      callback(snap.docs.map(doc => doc.data() as VerificationRequest));
    });
  }
}

export async function updateVerificationRequestStatus(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      return;
    } catch (err) {
      console.error("Supabase updateVerificationRequestStatus error, trying firestore fallback:", err);
    }
  }

  // Firestore fallback
  await updateDoc(doc(db, 'verification_requests', id), { status });
}
