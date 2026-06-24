import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ChevronLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-pink-50 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm select-none">
      <Link to="/" className="inline-flex items-center space-x-1 text-xs text-brand font-semibold hover:underline cursor-pointer">
        <ChevronLeft size={14} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="flex items-center space-x-2.5 pb-3 border-b border-pink-50">
        <Lock className="text-brand" size={24} />
        <h2 className="text-2xl font-serif font-bold text-gray-800">Politique de Confidentialité</h2>
      </div>

      <div className="text-xs text-gray-500 space-y-4 leading-relaxed font-medium">
        <p className="font-bold text-gray-700">Dernière mise à jour : 24 Juin 2026</p>
        
        <h3 className="font-bold text-sm text-gray-700 pt-2">1. Protection de vos données de géolocalisation</h3>
        <p>
          Nous utilisons votre ville et votre pays pour calculer de manière confidentielle les scores de matching entre célibataires. Votre position exacte ne sera jamais divulguée sans votre consentement.
        </p>

        <h3 className="font-bold text-sm text-gray-700 pt-2">2. Droits d'image</h3>
        <p>
          Toutes les galeries et photos de profils sont cryptées et hébergées de manière hautement sécurisée sur nos serveurs Firebase Storage protégés.
        </p>
      </div>
    </div>
  );
}
