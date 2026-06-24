import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-pink-50 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm select-none">
      <Link to="/" className="inline-flex items-center space-x-1 text-xs text-brand font-semibold hover:underline cursor-pointer">
        <ChevronLeft size={14} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="flex items-center space-x-2.5 pb-3 border-b border-pink-50">
        <Shield className="text-brand" size={24} />
        <h2 className="text-2xl font-serif font-bold text-gray-800">Conditions Générales d'Utilisation</h2>
      </div>

      <div className="text-xs text-gray-500 space-y-4 leading-relaxed font-medium">
        <p className="font-bold text-gray-700">Dernière mise à jour : 24 Juin 2026</p>
        
        <h3 className="font-bold text-sm text-gray-700 pt-2">1. Acceptation des Conditions</h3>
        <p>
          En accédant et en utilisant LoveRose, vous déclarez avoir plus de 18 ans et acceptez de respecter l'intégralité des présentes conditions de service.
        </p>

        <h3 className="font-bold text-sm text-gray-700 pt-2">2. Comportement et Respect de la Communauté</h3>
        <p>
          Tout comportement haineux, harcèlement, usurpation d'identité, spam ou contenu sexuellement explicite inapproprié entraînera un bannissement permanent immédiat par l'équipe de modération de LoveRose.
        </p>

        <h3 className="font-bold text-sm text-gray-700 pt-2">3. Abonnements et Transactions Money Fusion</h3>
        <p>
          L'accès à nos fonctionnalités haut de gamme nécessite l'acquisition d'un abonnement Premium ou VIP. Toutes les transactions financières s'effectuent en FCFA ou équivalents via notre partenaire sécurisé Money Fusion. Les abonnements premium et VIP sont non remboursables.
        </p>
      </div>
    </div>
  );
}
