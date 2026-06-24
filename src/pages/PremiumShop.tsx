import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { PaymentRecord, SubscriptionPlan } from '../types';
import { Check, Sparkles, Award, Zap, ShieldCheck, ArrowRight, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PLANS: SubscriptionPlan[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Mensuel',
    price: 3500, // FCFA / month
    currency: 'FCFA',
    durationMonths: 1,
    features: [
      'Likes illimités (Gratuit: 10/jour)',
      'Voir qui vous aime',
      'Retour en arrière illimité',
      'Boost profil mensuel gratuit',
      'Aucune publicité'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Annuel',
    price: 24000,
    currency: 'FCFA',
    durationMonths: 12,
    features: [
      'Tous les avantages Premium',
      'Tarif réduit (-43%)',
      '2 Boosts profil gratuits / mois',
      'Support client prioritaire'
    ]
  },
  {
    id: 'vip',
    name: 'LoveRose VIP',
    price: 45000,
    currency: 'FCFA',
    durationMonths: 12,
    features: [
      'Badge VIP exclusif 👑',
      'Priorité absolue dans les résultats',
      'Boost automatique hebdomadaire',
      'Messages directs avant match'
    ]
  }
];

export default function PremiumShop() {
  const { userProfile, updateProfileData } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(PLANS[0]);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentRecord[]>([]);
  const [paymentModal, setPaymentModal] = useState<{ show: boolean; loading: boolean }>({ show: false, loading: false });
  const [phonePayment, setPhonePayment] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch payments history from DB
  useEffect(() => {
    const fetchPayments = async () => {
      if (!userProfile) return;
      try {
        const history = await dbService.fetchPayments(userProfile.uid);
        setPaymentsHistory(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error("Error fetching payments:", err);
      }
    };
    fetchPayments();
  }, [userProfile, successMsg]);

  const handleOpenPayment = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentModal({ show: true, loading: false });
  };

  const executeMoneyFusionWebhookAndActivate = async () => {
    if (!userProfile) return;
    setPaymentModal(prev => ({ ...prev, loading: true }));

    const reference = `LR-${Math.floor(Math.random() * 1000000)}`;
    const txId = `MF-TX-${Math.floor(Math.random() * 1000000)}`;

    try {
      // 1. Send transaction payload to our own Express Webhook api
      const response = await fetch('/api/moneyfusion/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          reference: reference,
          status: 'completed',
          amount: selectedPlan.price,
          signature: 'moneyfusion_simulated_secure_signature'
        })
      });

      const resData = await response.json();
      console.log("[Money Fusion Webhook Trigger Response]:", resData);

      // 2. Write payment record to DB
      const paymentRec: PaymentRecord = {
        id: reference,
        userId: userProfile.uid,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        offerId: selectedPlan.id,
        status: 'completed',
        date: new Date().toISOString(),
        reference: reference
      };
      await dbService.savePaymentRecord(paymentRec);

      // 3. Write/update Subscription in DB
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + selectedPlan.durationMonths);

      await dbService.saveSubscription(userProfile.uid, {
        id: `${userProfile.uid}_sub`,
        userId: userProfile.uid,
        type: selectedPlan.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: subscriptionEndDate.toISOString()
      });

      // 4. Update local user profile state
      await updateProfileData({
        isPremium: true,
        premiumUntil: subscriptionEndDate.toISOString(),
        isVip: selectedPlan.id === 'vip'
      });

      setSuccessMsg(`Félicitations ! Votre abonnement "${selectedPlan.name}" est désormais actif jusqu'au ${subscriptionEndDate.toLocaleDateString()}.`);
      setPaymentModal({ show: false, loading: false });

    } catch (err) {
      console.error("Payment Process Error:", err);
    }
  };

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto">
      
      {/* Visual Splash Banner */}
      <div className="bg-gradient-to-tr from-[#E85D75] to-[#F7B5C0] rounded-[35px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-rose-200/45">
        <div className="absolute right-4 bottom-0 opacity-15 text-8xl pointer-events-none">👑</div>
        <div className="relative max-w-xl space-y-3">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/25 w-max">
            <Sparkles size={12} className="text-brand-gold fill-brand-gold animate-bounce" />
            <span>LoveRose Premium</span>
          </div>
          <h2 className="text-3xl font-serif font-bold">Trouvez l'amour plus rapidement</h2>
          <p className="text-sm text-pink-100">
            Multipliez vos chances de faire de belles rencontres en accédant aux filtres avancés, aux likes illimités et aux appels audio/vidéo premium.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-2xl text-sm font-semibold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-500 font-bold hover:text-green-700 cursor-pointer">×</button>
        </div>
      )}

      {/* Subscription Offers cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isVip = plan.id === 'vip';
          const isSelected = selectedPlan.id === plan.id;
          
          return (
            <div 
              key={plan.id}
              className={`backdrop-blur-md bg-white/45 rounded-[35px] p-6 border flex flex-col justify-between relative shadow-lg transition hover:shadow-xl hover:scale-[1.02] duration-300 ${
                isVip ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/25' : 'border-rose-100/50'
              }`}
            >
              {isVip && (
                <div className="absolute -top-3.5 right-6 bg-brand-gold text-brand-dark px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center space-x-1.5 shadow-sm">
                  <Award size={10} />
                  <span>VIP Offre</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{plan.name}</h3>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className="text-3xl font-extrabold font-serif text-brand">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 font-semibold">{plan.currency}</span>
                    <span className="text-xs text-gray-400 font-normal">/{plan.durationMonths === 1 ? 'mois' : 'an'}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-pink-50 text-xs text-gray-600 font-medium">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check size={14} className="text-brand mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment(plan)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm mt-6 flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                  isVip 
                    ? 'bg-gradient-to-br from-[#D4AF37] to-[#F3D060] text-brand-dark shadow-md shadow-amber-200/50 hover:scale-[1.02]' 
                    : 'bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white shadow-md shadow-rose-200/50 hover:scale-[1.02]'
                }`}
              >
                <span>S'abonner</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Payments History table */}
      <div className="backdrop-blur-md bg-white/45 border border-rose-100/50 rounded-[35px] p-6 shadow-lg">
        <h3 className="text-lg font-serif font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <CreditCard className="text-brand" size={18} />
          <span>Historique des transactions</span>
        </h3>

        {paymentsHistory.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">Aucun paiement effectué pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500 font-medium">
              <thead>
                <tr className="border-b border-pink-50 text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Référence</th>
                  <th className="py-2.5">Montant</th>
                  <th className="py-2.5">Offre</th>
                  <th className="py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/40">
                {paymentsHistory.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3">{new Date(pay.date).toLocaleDateString()}</td>
                    <td className="py-3 font-mono">{pay.reference}</td>
                    <td className="py-3 font-bold text-brand">{pay.amount.toLocaleString()} {pay.currency}</td>
                    <td className="py-3">{PLANS.find(p => p.id === pay.offerId)?.name || pay.offerId}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold">
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Money Fusion payment mock overlay dialog */}
      <AnimatePresence>
        {paymentModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="backdrop-blur-md bg-white/80 rounded-[35px] p-6 w-full max-w-sm border border-rose-100/50 shadow-2xl space-y-5"
            >
              
              {/* Money Fusion visual header */}
              <div className="flex justify-between items-center pb-3 border-b border-pink-50">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl">💳</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800">Money Fusion Pay</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Passerelle de paiement premium Afrique</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPaymentModal({ show: false, loading: false })}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
                >
                  Annuler
                </button>
              </div>

              {/* Transaction details panel */}
              <div className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100/30 text-xs space-y-2">
                <div className="flex justify-between font-semibold text-gray-600">
                  <span>Offre sélectionnée:</span>
                  <span className="text-brand">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t border-dashed border-pink-100">
                  <span>Montant total:</span>
                  <span>{selectedPlan.price.toLocaleString()} {selectedPlan.currency}</span>
                </div>
              </div>

              {/* Mobile Mobile input for payment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Numéro de téléphone (Orange, MTN, Moov...)</label>
                <input 
                  type="tel"
                  placeholder="Ex: +237 6xx xx xx xx"
                  value={phonePayment}
                  onChange={e => setPhonePayment(e.target.value)}
                  className="w-full backdrop-blur-sm bg-white/40 border border-rose-100/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
                />
              </div>

              <button
                disabled={paymentModal.loading}
                onClick={executeMoneyFusionWebhookAndActivate}
                className="w-full py-4 bg-gradient-to-br from-[#E85D75] to-[#F7B5C0] text-white font-bold rounded-2xl hover:scale-[1.01] transition-all shadow-lg shadow-rose-200/50 text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                {paymentModal.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transaction en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirmer et Payer</span>
                  </>
                )}
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
