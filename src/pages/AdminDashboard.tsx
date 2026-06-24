import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile, Report, VerificationRequest } from '../types';
import { 
  Users, AlertTriangle, ShieldAlert, BadgePercent, CheckCircle, Ban, ArrowDownToLine, TrendingUp, BarChart2, Award 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'verifications' | 'stats'>('stats');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [verificationsList, setVerificationsList] = useState<VerificationRequest[]>([]);

  // Real-time listen to all users
  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersList(snap.docs.map(doc => doc.data() as UserProfile));
    });

    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      setReportsList(snap.docs.map(doc => doc.data() as Report));
    });

    const unsubVerifications = onSnapshot(collection(db, 'verification_requests'), (snap) => {
      setVerificationsList(snap.docs.map(doc => doc.data() as VerificationRequest));
    });

    return () => {
      unsubUsers();
      unsubReports();
      unsubVerifications();
    };
  }, [userProfile]);

  if (userProfile?.role !== 'admin') {
    return (
      <div className="text-center p-16 space-y-3 bg-red-50 text-red-600 rounded-3xl max-w-md mx-auto my-12 border border-red-100 shadow-sm">
        <ShieldAlert size={48} className="mx-auto" />
        <h3 className="text-lg font-bold">Accès Non Autorisé</h3>
        <p className="text-xs">
          Cette section d'administration est strictement réservée aux administrateurs de l'application LoveRose.
        </p>
      </div>
    );
  }

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isPremium: !currentStatus });
    } catch (err) {
      console.error("Error updating premium status:", err);
    }
  };

  const handleApproveVerification = async (userId: string, reqId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: true,
        verificationLevel: 3
      });
      await updateDoc(doc(db, 'verification_requests', reqId), {
        status: 'approved'
      });
    } catch (err) {
      console.error("Error approving verification:", err);
    }
  };

  const exportUsersToCsv = () => {
    const headers = ['UID', 'Prénom', 'Email', 'Genre', 'Pays', 'Premium', 'Rôle'];
    const rows = usersList.map(u => [
      u.uid, u.displayName, u.email, u.gender || '', u.country || '', u.isPremium ? 'OUI' : 'NON', u.role
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loverose_users_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-pink-50">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800">Console d'administration LoveRose</h2>
          <p className="text-xs text-gray-400">Modération globale, statistiques financières et gestion des utilisateurs.</p>
        </div>

        <button 
          onClick={exportUsersToCsv}
          className="mt-3 md:mt-0 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
        >
          <ArrowDownToLine size={14} />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Main stats layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-pink-50 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">Membres</span>
            <Users size={16} className="text-brand" />
          </div>
          <p className="text-2xl font-extrabold font-serif text-gray-800">{usersList.length}</p>
          <span className="text-[10px] text-green-500 font-semibold flex items-center">
            <TrendingUp size={10} className="mr-0.5" /> +12% cette semaine
          </span>
        </div>

        <div className="bg-white border border-pink-50 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">Signalements</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold font-serif text-gray-800">{reportsList.length}</p>
          <span className="text-[10px] text-gray-400 font-medium">En attente de modération</span>
        </div>

        <div className="bg-white border border-pink-50 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">Vérifications IA</span>
            <CheckCircle size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold font-serif text-gray-800">
            {verificationsList.filter(v => v.status === 'pending').length}
          </p>
          <span className="text-[10px] text-blue-500 font-semibold">Niveau 3 requis</span>
        </div>

        <div className="bg-white border border-pink-50 rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-xs font-bold">Revenus Premium</span>
            <Award size={16} className="text-brand-gold" />
          </div>
          <p className="text-2xl font-extrabold font-serif text-brand">
            {(usersList.filter(u => u.isPremium).length * 3500).toLocaleString()} FCFA
          </p>
          <span className="text-[10px] text-brand font-semibold">Abonnements actifs</span>
        </div>
      </div>

      {/* Admin tabs navigation */}
      <div className="flex space-x-2 border-b border-pink-50 pb-2 text-xs font-bold">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`py-2 px-4 rounded-lg cursor-pointer transition ${activeTab === 'stats' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-pink-50/50'}`}
        >
          Statistiques graphiques
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-lg cursor-pointer transition ${activeTab === 'users' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-pink-50/50'}`}
        >
          Gestion Utilisateurs ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveTab('verifications')}
          className={`py-2 px-4 rounded-lg cursor-pointer transition ${activeTab === 'verifications' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-pink-50/50'}`}
        >
          Demandes de Vérification ({verificationsList.length})
        </button>
      </div>

      {/* Sub tabs elements */}
      <div className="bg-white border border-pink-50 rounded-3xl p-6 shadow-sm">
        
        {/* Sub tab: stats */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-gray-800 flex items-center space-x-2">
              <BarChart2 className="text-brand animate-pulse" />
              <span>Analyse de croissance & trafic LoveRose</span>
            </h3>
            
            {/* Custom high fidelity visual SVG chart graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Inscriptions */}
              <div className="border border-pink-50 p-4 rounded-2xl bg-pink-50/10 space-y-3">
                <span className="text-xs font-bold text-gray-600 block">Courbe de nouvelles inscriptions quotidiennes</span>
                
                <div className="h-48 flex items-end justify-between px-4 pt-4 border-b border-l border-pink-100">
                  {/* Custom columns */}
                  {[
                    { day: 'Lun', val: 30 },
                    { day: 'Mar', val: 45 },
                    { day: 'Mer', val: 60 },
                    { day: 'Jeu', val: 80 },
                    { day: 'Ven', val: 95 },
                    { day: 'Sam', val: 120 },
                    { day: 'Dim', val: 150 }
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center space-y-1.5 w-8">
                      <div 
                        className="bg-gradient-to-t from-brand to-pink-400 w-full rounded-t-md transition-all duration-500" 
                        style={{ height: `${d.val}px` }}
                      />
                      <span className="text-[9px] font-bold text-gray-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Revenues */}
              <div className="border border-pink-50 p-4 rounded-2xl bg-pink-50/10 space-y-3">
                <span className="text-xs font-bold text-gray-600 block">Ventes mensuelles par offre</span>
                
                <div className="h-48 flex items-end justify-between px-4 pt-4 border-b border-l border-pink-100">
                  {/* Custom columns */}
                  {[
                    { cat: 'Premium Mensuel', val: 130 },
                    { cat: 'Premium Annuel', val: 90 },
                    { cat: 'LoveRose VIP', val: 65 }
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center space-y-1.5 w-20">
                      <div 
                        className="bg-gradient-to-t from-brand-gold to-yellow-500 w-12 rounded-t-md transition-all duration-500" 
                        style={{ height: `${d.val}px` }}
                      />
                      <span className="text-[9px] font-bold text-gray-400 text-center line-clamp-1">{d.cat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Sub tab: Users */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-800">Annuaire des membres inscrits</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-500 font-medium">
                <thead>
                  <tr className="border-b border-pink-50 text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5">Membre</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Rôle</th>
                    <th className="py-2.5">Premium</th>
                    <th className="py-2.5">Confiance</th>
                    <th className="py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50/40">
                  {usersList.map((u) => (
                    <tr key={u.uid}>
                      <td className="py-3 flex items-center space-x-2">
                        <img src={u.photos[0]} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-bold text-gray-800">{u.displayName}</span>
                      </td>
                      <td className="py-3 font-mono">{u.email}</td>
                      <td className="py-3 text-xs uppercase font-bold text-brand">{u.role}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isPremium ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {u.isPremium ? 'Premium' : 'Gratuit'}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-gray-700">{u.verificationLevel}/3</td>
                      <td className="py-3 flex items-center space-x-2">
                        <button 
                          onClick={() => handleTogglePremium(u.uid, u.isPremium)}
                          className="px-2 py-1 bg-pink-50 text-brand rounded font-bold cursor-pointer hover:bg-brand hover:text-white transition"
                        >
                          Offrir Premium
                        </button>
                        <button 
                          onClick={() => handleUpdateRole(u.uid, u.role === 'admin' ? 'user' : 'admin')}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-bold cursor-pointer hover:bg-gray-800 hover:text-white transition"
                        >
                          {u.role === 'admin' ? 'Retirer Admin' : 'Nommer Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub tab: Verifications */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-800">Demandes de validation de selfie (Niveau 3)</h3>

            {verificationsList.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune demande de vérification en attente pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationsList.map((req) => (
                  <div key={req.id} className="p-4 border border-pink-50 rounded-2xl space-y-3 bg-pink-50/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-700">Utilisateur ID: {req.userId}</span>
                      <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-[9px] font-bold">
                        {req.status}
                      </span>
                    </div>

                    {req.photoUrl && (
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <img src={req.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleApproveVerification(req.userId, req.id)}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs cursor-pointer transition"
                      >
                        Approuver & Valider ✔
                      </button>
                      <button 
                        className="px-3 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
