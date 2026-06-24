import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ChevronLeft, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-pink-50 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm select-none">
      <Link to="/" className="inline-flex items-center space-x-1 text-xs text-brand font-semibold hover:underline cursor-pointer">
        <ChevronLeft size={14} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="flex items-center space-x-2.5 pb-3 border-b border-pink-50">
        <MessageSquare className="text-brand" size={24} />
        <h2 className="text-2xl font-serif font-bold text-gray-800">Support & Contact</h2>
      </div>

      {sent ? (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold text-center">
          Nous vous remercions pour votre message ! Notre équipe de support LoveRose vous répondra sous 24h.
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Votre nom complet</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Clara Diop" 
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Adresse Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="Ex: clara@example.com" 
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Message ou Réclamation</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              placeholder="Expliquez-nous comment nous pouvons vous aider..." 
              rows={4}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand hover:bg-opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Send size={12} />
            <span>Envoyer le message</span>
          </button>
        </form>
      )}
    </div>
  );
}
