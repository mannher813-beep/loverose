#!/bin/bash

# LoveRose Deployment Automation Script

echo "🌹 Commençons le déploiement de LoveRose..."

# 1. Verification of code compilation
echo "⚙️  Compilation et construction des fichiers de production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Compilation réussie ! Les fichiers statiques de production sont dans 'dist/'."
else
    echo "❌ Erreur de compilation. Déploiement annulé."
    exit 1
fi

# 2. Firebase Rules Deploy
echo "🛡️  Déploiement des règles de sécurité Firestore & Storage vers Firebase..."
if command -v firebase &> /dev/null
then
    firebase deploy --only firestore:rules,storage
    echo "✅ Règles Firebase déployées !"
else
    echo "⚠️  CLI Firebase non trouvé localement. Veuillez le déployer manuellement via 'firebase deploy'."
fi

# 3. Cloudflare Pages Deploy
echo "🚀 Pour déployer vers Cloudflare Pages :"
echo "   1. Connectez votre dépôt GitHub à Cloudflare Pages."
echo "   2. Configurez le framework de build sur 'Vite' ou 'Create React App'."
echo "   3. Dossier de sortie: 'dist/'"
echo "   4. URL de déploiement prévue : https://loverose.pages.dev"

echo "🌹 LoveRose est prêt à briller !"
