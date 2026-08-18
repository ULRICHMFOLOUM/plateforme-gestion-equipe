"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle2, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-blue-200 text-sm font-bold tracking-wider uppercase">Support & Questions</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">Contactez l'équipe TeamFlow</h1>
              </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
              Une question, un besoin d'assistance ou un projet sur-mesure ? Nous sommes à votre écoute 7j/7.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Info cards */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-2">
              <Mail className="w-6 h-6 text-blue-600 mb-1" />
              <p className="font-bold text-slate-900 text-sm">Email Support</p>
              <p className="text-xs text-slate-500">support@teamflow.novastack.cm</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-2">
              <Phone className="w-6 h-6 text-emerald-600 mb-1" />
              <p className="font-bold text-slate-900 text-sm">Téléphone / WhatsApp</p>
              <p className="text-xs text-slate-500">+237 600 000 000</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-2">
              <MapPin className="w-6 h-6 text-purple-600 mb-1" />
              <p className="font-bold text-slate-900 text-sm">Siège Social</p>
              <p className="text-xs text-slate-500">Novastack Digital, Douala - Cameroun</p>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h3 className="text-2xl font-black text-slate-900">Message envoyé !</h3>
                <p className="text-slate-500 text-sm">Notre équipe vous répondra sous 24h ouvrées.</p>
                <button onClick={() => setSubmitted(false)} className="text-blue-600 font-bold text-sm hover:underline">Envoyer un autre message</button>
              </motion.div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Votre Nom</label>
                  <input required type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Votre Email</label>
                  <input required type="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Message</label>
                  <textarea required rows={4} placeholder="Comment pouvons-nous vous aider ?" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm outline-none transition-all resize-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity">
                  <Send className="w-4 h-4" /> Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
