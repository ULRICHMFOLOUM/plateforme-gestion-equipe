"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, Bell, Trash2, Globe, Mail } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "1. Données collectées",
    content: `Lors de votre inscription et utilisation de TeamFlow, nous collectons les informations suivantes :

**Données d'identité :** Nom, prénom, adresse e-mail, photo de profil (optionnelle).

**Données professionnelles :** Intitulé de poste, département, fuseau horaire, langue préférée.

**Données d'utilisation :** Activités sur la plateforme (projets créés, tâches effectuées, messages envoyés), horodatages de connexion, adresse IP, type de navigateur et appareil.

**Données de paiement :** Informations de transaction (montant, devise, référence) traitées via Flutterwave. Aucune coordonnée bancaire n'est stockée directement sur nos serveurs.`,
  },
  {
    icon: Shield,
    title: "2. Utilisation des données",
    content: `Vos données sont utilisées exclusivement dans les finalités suivantes :

• **Fourniture du service :** Création et gestion de votre compte, accès aux fonctionnalités de la plateforme (projets, chat, calendrier, visioconférence).

• **Amélioration du produit :** Analyse agrégée et anonymisée des usages pour améliorer les fonctionnalités et l'expérience utilisateur.

• **Communication :** Envoi de notifications liées à votre compte (confirmations de paiement, alertes de sécurité, mises à jour importantes).

• **Facturation :** Traitement des abonnements et suivi des paiements.

• **Sécurité :** Détection et prévention des activités frauduleuses ou abusives.

Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.`,
  },
  {
    icon: Globe,
    title: "3. Partage et sous-traitants",
    content: `TeamFlow fait appel à des sous-traitants techniques de confiance pour assurer la fourniture du service :

• **NeonDB (Neon Technologies)** : Hébergement de la base de données PostgreSQL sur des serveurs sécurisés situés aux États-Unis. Données chiffrées au repos et en transit.

• **Flutterwave** : Traitement sécurisé des paiements. Flutterwave est conforme aux normes PCI-DSS. Consultez leur politique sur flutterwave.com.

• **Cloudinary** : Stockage et optimisation des images (photos de profil, pièces jointes). Serveurs certifiés ISO 27001.

• **Pusher** : Infrastructure de messagerie temps réel. Communications chiffrées via WebSocket sécurisé (WSS).

Tous nos sous-traitants sont soumis à des accords de traitement des données conformes aux réglementations en vigueur.`,
  },
  {
    icon: Lock,
    title: "4. Sécurité des données",
    content: `Nous appliquons des mesures de sécurité strictes pour protéger vos données :

• **Chiffrement en transit :** Toutes les communications entre votre navigateur et nos serveurs utilisent le protocole HTTPS/TLS 1.3.

• **Mots de passe :** Vos mots de passe sont hachés avec l'algorithme bcrypt (facteur de travail élevé). Nous ne pouvons pas accéder à votre mot de passe en clair.

• **Authentification à deux facteurs (2FA) :** Disponible et recommandée pour tous les comptes.

• **Contrôle d'accès :** Accès aux données de production restreint aux membres techniques autorisés de l'équipe Novastack.

• **Journaux d'audit :** Toutes les actions critiques (connexions, modifications de compte, paiements) sont enregistrées dans un journal d'activité sécurisé.`,
  },
  {
    icon: Bell,
    title: "5. Vos droits",
    content: `Conformément aux législations applicables (RGPD en Europe et législations locales équivalentes), vous disposez des droits suivants :

• **Droit d'accès :** Obtenir une copie de toutes les données personnelles que nous détenons sur vous.

• **Droit de rectification :** Corriger des données inexactes ou incomplètes directement depuis vos paramètres de profil (/settings/profile).

• **Droit à l'effacement :** Demander la suppression définitive de votre compte et de toutes vos données associées.

• **Droit à la portabilité :** Recevoir vos données dans un format structuré et lisible par machine (JSON, CSV).

• **Droit d'opposition :** Vous opposer à certains traitements (ex: communications marketing).

**Pour exercer vos droits**, contactez-nous à : privacy@teamflow.novastack.cm`,
  },
  {
    icon: Trash2,
    title: "6. Conservation des données",
    content: `Vos données sont conservées selon les règles suivantes :

• **Compte actif :** Les données sont conservées tant que votre compte est actif.

• **Après suppression du compte :** Les données personnelles sont supprimées définitivement dans un délai de 30 jours. Certaines données peuvent être conservées plus longtemps si la loi l'exige (ex: données de facturation conservées 5 ans pour obligations comptables).

• **Données de paiement :** Les références de transactions sont conservées 7 ans conformément aux obligations légales fiscales et comptables.

• **Journaux de sécurité :** Conservés 12 mois maximum, puis supprimés automatiquement.`,
  },
  {
    icon: Mail,
    title: "7. Cookies",
    content: `TeamFlow utilise des cookies et technologies similaires pour :

• **Cookies essentiels :** Maintenir votre session de connexion (cookie de session NextAuth). Strictement nécessaires au fonctionnement du service — non soumis au consentement.

• **Cookies de préférence :** Mémoriser vos préférences d'affichage (thème, langue). Durée : 1 an.

• **Cookies analytiques :** Mesure d'audience anonyme pour améliorer le service. Vous pouvez vous y opposer.

Vous pouvez gérer vos préférences de cookies à tout moment depuis la page /cookies ou depuis les paramètres de votre navigateur.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-blue-200 text-sm font-bold tracking-wider uppercase">Légal</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">Politique de confidentialité</h1>
              </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
              TeamFlow by Novastack Digital s'engage à protéger et respecter votre vie privée.
              Ce document explique quelles données nous collectons, pourquoi et comment nous les utilisons.
            </p>
            <p className="text-blue-300 text-sm mt-4 font-medium">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24">
        {/* Quick summary card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-blue-100 shadow-2xl p-8 mb-10"
        >
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">📌</span>
            En résumé
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "🔒", text: "Vos données ne sont jamais vendues à des tiers." },
              { icon: "🛡️", text: "Chiffrement HTTPS et bcrypt pour vos mots de passe." },
              { icon: "✉️", text: "Vous pouvez demander la suppression à tout moment." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
              </div>
              <div className="text-slate-600 leading-relaxed space-y-3">
                {section.content.split('\n\n').map((paragraph, j) => (
                  <p key={j} className="text-sm sm:text-base" dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-800">$1</strong>')
                      .replace(/•/g, '<span class="text-blue-500">•</span>')
                  }} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-black mb-3">Une question sur vos données ?</h3>
          <p className="text-blue-100 mb-6">Notre équipe est disponible pour répondre à toutes vos questions concernant la protection de vos données personnelles.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:privacy@teamflow.novastack.cm"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
              <Mail className="w-4 h-4" /> privacy@teamflow.novastack.cm
            </a>
          </div>
          <p className="text-blue-200 text-sm mt-4">Délai de réponse : 48h ouvrées maximum</p>
        </motion.div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Accueil</Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors font-medium">Conditions d'utilisation</Link>
          <Link href="/cookies" className="hover:text-blue-600 transition-colors font-medium">Cookies</Link>
        </div>
      </div>
    </div>
  );
}
