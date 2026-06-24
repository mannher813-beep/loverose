export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  birthDate?: string;
  age?: number;
  gender?: 'Homme' | 'Femme';
  orientation?: 'Homme' | 'Femme' | 'Les deux';
  city?: string;
  country?: string;
  bio?: string;
  photos: string[];
  interests: string[];
  height?: number;
  profession?: string;
  education?: string;
  languages: string[];
  isPremium: boolean;
  premiumUntil?: string;
  isVip: boolean;
  isVerified: boolean;
  verificationLevel: 1 | 2 | 3;
  phone?: string;
  role: 'user' | 'moderator' | 'admin';
  online: boolean;
  lastSeen?: string;
  hideAge?: boolean;
  hideDistance?: boolean;
  hideOnline?: boolean;
  createdAt: string;
}

export interface Like {
  id: string;
  fromUid: string;
  toUid: string;
  type: 'like' | 'pass' | 'superlike';
  createdAt: string;
}

export interface Match {
  id: string;
  users: string[]; // [uid1, uid2]
  createdAt: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  unlockedUntil?: string; // 24-hour temporary unlock timestamp
  unlockedBy?: string;    // User UID who paid 250 FCFA
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text?: string;
  image?: string;
  audio?: string;
  gif?: string;
  timestamp: string;
  replyToId?: string;
  isRead: boolean;
  isDeleted: boolean;
}

export interface SubscriptionPlan {
  id: 'premium_monthly' | 'premium_yearly' | 'vip';
  name: string;
  price: number;
  currency: string;
  durationMonths: number;
  features: string[];
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  offerId: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  reference: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: 'faux_profil' | 'arnaque' | 'harcelement' | 'spam' | 'photo_inappropriate';
  comment: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  level: 1 | 2 | 3;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'match' | 'message' | 'like' | 'super_like' | 'subscription_expired' | 'promotion' | 'visit' | 'system';
  read: boolean;
  createdAt: string;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  photo?: string;
  likes: string[]; // List of user UIDs who liked
  comments: PostComment[];
  createdAt: string;
}
