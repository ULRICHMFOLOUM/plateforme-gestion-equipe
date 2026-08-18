"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Users, Calendar, MessageSquare, FolderKanban,
  Video, ArrowRight, Sparkles, TrendingUp, Shield, Zap, Clock,
  Twitter, Github, Linkedin, Globe, Star, ChevronDown,
  BarChart3, Lock, Rocket, Play,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

/* ─────────────────────────── DATA ─────────────────────────── */

const stats = [
  { label: "Utilisateurs actifs", value: "10k+", icon: Users, color: "from-blue-500 to-cyan-500" },
  { label: "Tâches gérées", value: "500k+", icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
  { label: "Projets terminés", value: "50k+", icon: FolderKanban, color: "from-orange-500 to-amber-500" },
  { label: "Disponibilité", value: "99.9%", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
];

const features = [
  { icon: FolderKanban, title: "Gestion de tâches", description: "Organisez vos tâches avec un système Kanban intuitif et des fonctionnalités avancées de suivi.", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20" },
  { icon: Users, title: "Collaboration d'équipe", description: "Travaillez ensemble efficacement avec des groupes, des permissions et des notifications en temps réel.", color: "from-green-500 to-emerald-500", glow: "shadow-green-500/20" },
  { icon: Calendar, title: "Calendrier intégré", description: "Planifiez vos événements, réunions et deadlines directement dans la plateforme.", color: "from-orange-500 to-amber-500", glow: "shadow-orange-500/20" },
  { icon: MessageSquare, title: "Messagerie temps réel", description: "Communiquez instantanément avec votre équipe via le chat intégré et les fils de discussion.", color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/20" },
  { icon: Lock, title: "Sécurité avancée", description: "Stockez, organisez et partagez vos documents en toute sécurité avec chiffrement end-to-end.", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20" },
  { icon: Video, title: "Visioconférence HD", description: "Organisez des réunions virtuelles directement depuis la plateforme sans application externe.", color: "from-red-500 to-pink-500", glow: "shadow-red-500/20" },
];

/* ─────────────────────────── BENTO COMPONENTS ─────────────────────────── */

function BentoCard({ delay, floatDelay = 0, className = "", children }: { delay: number; floatDelay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5 + floatDelay, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function KanbanPill({ label, bg, delay }: { label: string; bg: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`px-3 py-2 ${bg} rounded-lg text-white text-[11px] font-semibold`}
    >
      {label}
    </motion.div>
  );
}

/* ─────────────────────────── HERO BENTO GRID ─────────────────────────── */

function HeroBentoGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* ── Projets Kanban ── */}
      <BentoCard delay={0.6} floatDelay={0} className="col-span-2">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-blue-500/25 relative overflow-hidden h-full">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/90 font-bold text-sm">Projets</span>
            <span className="ml-auto text-[11px] bg-white/20 px-2 py-1 rounded-full text-white/80 font-semibold">3 actifs</span>
          </div>
          <div className="grid grid-cols-3 gap-2 relative">
            <div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">À faire</p>
              <div className="space-y-1.5">
                <KanbanPill label="Design UI" bg="bg-white/15" delay={0.9} />
                <KanbanPill label="API Auth" bg="bg-white/15" delay={1.0} />
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">En cours</p>
              <div className="space-y-1.5">
                <KanbanPill label="Dashboard" bg="bg-cyan-400/40" delay={1.1} />
                <KanbanPill label="Base DB" bg="bg-cyan-400/40" delay={1.2} />
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Terminé</p>
              <div className="space-y-1.5">
                <KanbanPill label="Maquettes" bg="bg-green-400/40" delay={1.3} />
                <KanbanPill label="Specs" bg="bg-green-400/40" delay={1.4} />
              </div>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* ── Équipe ── */}
      <BentoCard delay={0.7} floatDelay={1.2}>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-emerald-500/25 relative overflow-hidden h-full">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/90 font-bold text-sm">Équipe</span>
          </div>
          <div className="flex -space-x-2 mb-3">
            {['SJ', 'MD', 'LM', 'AB'].map((init, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, type: "spring", stiffness: 300 }}
                className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-[9px] font-black text-white"
              >
                {init}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-300"
            />
            <span className="text-white/80 text-[11px] font-semibold">4 en ligne maintenant</span>
          </div>
        </div>
      </BentoCard>

      {/* ── Chat ── */}
      <BentoCard delay={0.8} floatDelay={0.7}>
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-violet-500/25 relative overflow-hidden h-full">
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/90 font-bold text-sm">Chat</span>
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-auto w-5 h-5 bg-red-400 rounded-full text-[10px] font-black text-white flex items-center justify-center"
            >3</motion.span>
          </div>
          <div className="space-y-2">
            <div className="bg-white/20 rounded-xl rounded-tl-none px-3 py-2 text-[11px] text-white/90 max-w-[85%]">Réunion à 14h ? 👋</div>
            <div className="bg-white/10 rounded-xl rounded-tr-none px-3 py-2 text-[11px] text-white/80 max-w-[85%] ml-auto text-right">Parfait pour moi !</div>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} className="flex gap-1 items-center px-2 py-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} className="w-1.5 h-1.5 rounded-full bg-white/50" />
              ))}
            </motion.div>
          </div>
        </div>
      </BentoCard>

      {/* ── Stats ── */}
      <BentoCard delay={0.9} floatDelay={1.8} className="col-span-2">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-slate-900/40 relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-5 relative">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/90 font-bold text-sm">Statistiques</span>
            <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }} className="ml-auto text-[11px] text-emerald-400 font-bold">▲ +24% ce mois</motion.span>
          </div>
          <div className="space-y-3 relative">
            {[
              { label: "Tâches complétées", value: 78, color: "from-blue-500 to-cyan-400", delay: 1.3 },
              { label: "Objectifs atteints", value: 92, color: "from-emerald-500 to-green-400", delay: 1.5 },
              { label: "Collaboration", value: 65, color: "from-purple-500 to-pink-400", delay: 1.7 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-white/50 font-medium">{item.label}</span>
                  <span className="text-white/90 font-bold">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ delay: item.delay, duration: 1.4, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${item.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* ── Vidéo ── */}
      <BentoCard delay={1.0} floatDelay={2.2}>
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-rose-500/25 relative overflow-hidden h-full">
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><Video className="w-4 h-4 text-white" /></div>
            <span className="text-white/90 font-bold text-sm">Vidéo</span>
          </div>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 rgba(255,255,255,0.3)", "0 0 0 10px rgba(255,255,255,0)", "0 0 0 0 rgba(255,255,255,0)"] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="w-11 h-11 bg-white/30 rounded-full flex items-center justify-center mb-3 cursor-pointer"
            >
              <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-transparent border-l-white ml-1" />
            </motion.div>
            <p className="text-white/90 text-[11px] font-bold text-center">Réunion hebdo</p>
            <p className="text-white/55 text-[10px] text-center mt-0.5">Dans 2h30</p>
          </div>
        </div>
      </BentoCard>

      {/* ── Agenda ── */}
      <BentoCard delay={1.1} floatDelay={0.4}>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-amber-500/25 relative overflow-hidden h-full">
          <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-white" /></div>
            <span className="text-white/90 font-bold text-sm">Agenda</span>
          </div>
          <div className="space-y-2">
            {[{ time: "09:00", event: "Standup" }, { time: "14:00", event: "Code Review" }, { time: "16:30", event: "Demo client" }].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + i * 0.15 }} className="flex items-center gap-2">
                <span className="text-white/50 text-[10px] font-bold w-9 shrink-0">{item.time}</span>
                <div className="flex-1 bg-white/20 rounded-lg px-2 py-1.5 text-[11px] text-white font-semibold">{item.event}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </BentoCard>

      {/* ── Réactivité ── */}
      <BentoCard delay={1.2} floatDelay={1.5} className="col-span-2 lg:col-span-1">
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-sky-500/25 relative overflow-hidden h-full">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="flex items-center gap-2 mb-3 relative">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4 text-white" /></div>
            <span className="text-white/90 font-bold text-sm">Réactivité</span>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, type: "spring" }} className="text-3xl font-black text-white mb-1 relative">~12 min</motion.div>
          <p className="text-white/55 text-[11px] font-medium">Temps de réponse équipe</p>
          <div className="flex items-center gap-1.5 mt-3">
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-300" />
            <span className="text-emerald-300 text-[10px] font-black uppercase tracking-wider">Excellent</span>
          </div>
        </div>
      </BentoCard>
    </div>
  );
}

/* ─────────────────────────── FLOATING PARTICLES ─────────────────────────── */

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/30"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0], scale: [0, 1, 0] }}
          transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── ANIMATED COUNTER ─────────────────────────── */

function AnimatedStat({ value, label, icon: Icon, color }: { value: string; label: string; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.05 }}
      className="text-center group cursor-default"
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className={`inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-br ${color} rounded-2xl mb-4 shadow-xl group-hover:shadow-2xl transition-shadow`}
      >
        <Icon className="w-7 h-7 text-white" />
      </motion.div>
      <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </motion.div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 overflow-x-hidden">
      <Navbar />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <FloatingParticles />

        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 80, 0] }} transition={{ duration: 22, repeat: Infinity }} className="absolute top-10 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], y: [0, 80, 0] }} transition={{ duration: 28, repeat: Infinity }} className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[140px]" />
          <motion.div animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 18, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[160px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Text block */}
          <div className="text-center max-w-5xl mx-auto mb-14 sm:mb-20">

            {/* Badge animé avec icônes des technologies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-xl border border-blue-200/60 rounded-full mb-8 shadow-xl shadow-blue-500/10"
            >
              <div className="flex items-center gap-1.5">
                {/* T = Twitter/X style icon */}
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="w-6 h-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-[9px] font-black">T</span>
                </motion.div>
                {/* G = Google/GitHub */}
                <motion.div whileHover={{ scale: 1.2, rotate: -10 }} className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-[9px] font-black">G</span>
                </motion.div>
                {/* L = LinkedIn */}
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-[9px] font-black">Li</span>
                </motion.div>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-slate-700">Connexion rapide disponible</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tight"
            >
              <span className="block text-slate-900">Gérez votre</span>
              <span className="block relative">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">équipe sans</span>
              </span>
              <span className="block text-slate-900 relative">
                limites
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.9, duration: 1 }}
                  className="absolute bottom-2 left-0 h-4 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 -z-10 rounded-lg"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              L'espace de travail unifié pour les équipes modernes. Projets, chat, vidéo, rapports — tout au même endroit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(0,153,230,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 overflow-hidden flex items-center gap-3"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-800" />
                  <Rocket className="w-5 h-5 relative" />
                  <span className="relative">Commencer gratuitement</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
                </motion.button>
              </Link>

              <Link href="#features">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Voir la démo
                </motion.button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center justify-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {['SJ', 'MD', 'LM', 'AB', 'PC'].map((init, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-md"
                  >{init}</motion.div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                <p className="text-xs text-slate-500 font-medium">+10 000 équipes satisfaites</p>
              </div>
            </motion.div>
          </div>

          {/* Bento Grid */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <HeroBentoGrid />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Défiler</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/70 backdrop-blur-xl border-y border-slate-200/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white to-cyan-50/50" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((stat, i) => (
              <AnimatedStat key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} color={stat.color} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-sm font-black rounded-full mb-4 tracking-wider uppercase"
            >
              Fonctionnalités
            </motion.span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-5 leading-tight">
              Tout ce dont votre <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">équipe a besoin</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Des outils pensés pour la performance, la collaboration et la clarté à chaque étape de vos projets.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`group relative bg-white rounded-3xl p-8 border border-slate-100 hover:border-transparent shadow-lg ${feature.glow} hover:shadow-2xl transition-all duration-400 overflow-hidden cursor-default`}
              >
                {/* Gradient hover background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                {/* Animated corner */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-bl-[100px] group-hover:opacity-10 transition-opacity`} />

                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-white text-sm font-black rounded-full mb-4 tracking-wider uppercase backdrop-blur-sm">Comment ça marche</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5">
              Trois étapes vers
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> l'excellence</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">TeamFlow simplifie la complexité pour que vous puissiez vous concentrer sur ce qui compte vraiment.</p>
          </motion.div>

          <div className="relative grid sm:grid-cols-3 gap-8">
            {/* Connecting line */}
            <div className="absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-blue-500/30 via-cyan-500/50 to-blue-500/30 hidden sm:block" />

            {[
              { step: "01", title: "Configurez", desc: "Créez votre espace en quelques secondes et invitez vos collaborateurs instantanément.", icon: Zap, color: "from-blue-400 to-cyan-400" },
              { step: "02", title: "Collaborez", desc: "Gérez vos projets, discutez en temps réel et organisez des réunions vidéo sans friction.", icon: MessageSquare, color: "from-cyan-400 to-teal-400" },
              { step: "03", title: "Livrez", desc: "Suivez vos indicateurs, générez des rapports et célébrez vos succès en équipe.", icon: CheckCircle2, color: "from-teal-400 to-green-400" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }} className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <span className="text-5xl font-black text-white/10 group-hover:text-white/20 transition-colors">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <span className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-black rounded-full mb-4 tracking-wider uppercase">Témoignages</span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 leading-tight">
                Ils nous font <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">confiance</span>
              </h2>
              <p className="text-lg text-slate-500">Des équipes comme la vôtre révolutionnent leur productivité chaque jour.</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-4 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">4.9</div>
              <div>
                <div className="flex text-amber-400 mb-1">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-sm font-black text-slate-900">1 200+ avis</p>
                <p className="text-xs text-slate-400">Satisfaction clients</p>
              </div>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Sarah Jensen", role: "Product Manager chez TechCorp", quote: "TeamFlow a littéralement changé notre façon de travailler. C'est l'outil le plus intuitif que j'ai utilisé en 10 ans de carrière.", avatar: "SJ", color: "from-blue-400 to-indigo-500" },
              { name: "Marc Dubois", role: "Lead Developer chez StartupXY", quote: "La visioconférence intégrée au chat change tout. Plus besoin de jongler entre trois applis différentes pour une simple réunion.", avatar: "MD", color: "from-emerald-400 to-teal-500" },
              { name: "Léa Martin", role: "Creative Director chez AgenceM", quote: "Le design est magnifique et l'expérience utilisateur est parfaite. Le travail quotidien est devenu un vrai plaisir pour toute mon équipe.", avatar: "LM", color: "from-purple-400 to-pink-500" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl hover:shadow-2xl hover:border-blue-100 transition-all duration-300"
              >
                <div className="flex text-amber-400 mb-5">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}</div>
                <p className="text-slate-600 text-base leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 bg-gradient-to-br ${t.color} rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg`}>{t.avatar}</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PRICING TEASER ══════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-4 py-1.5 bg-white border border-blue-100 text-blue-600 text-sm font-black rounded-full mb-4">Tarification simple</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Commencez gratuitement <br/> <span className="text-blue-600">14 jours d'essai</span></h2>
            <p className="text-slate-500 mb-8">Aucune carte bancaire requise. Accès complet à toutes les fonctionnalités.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 flex items-center gap-2">
                  <Rocket className="w-5 h-5" /> Démarrer l'essai gratuit
                </motion.button>
              </Link>
              <Link href="/settings/billing">
                <button className="text-blue-600 font-bold hover:underline flex items-center gap-1">Voir les tarifs <ArrowRight className="w-4 h-4" /></button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FINAL CTA ══════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900" />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <FloatingParticles />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-8">
            <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight">
              Prêt à transformer <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">votre façon de travailler ?</span>
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
              Rejoignez des milliers d'équipes qui collaborent plus intelligemment et livrent plus vite avec TeamFlow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup">
                <motion.button whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }} whileTap={{ scale: 0.97 }}
                  className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-2">
                  <Rocket className="w-5 h-5" /> Démarrer maintenant
                </motion.button>
              </Link>
              <Link href="#features">
                <button className="text-white/80 hover:text-white font-bold flex items-center gap-2 transition-all hover:gap-3">
                  Voir toutes les fonctionnalités <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20">
                  <Image src="/teamflow-logo.png" alt="TeamFlow Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">TeamFlow</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
                L'espace de travail unifié pour les équipes modernes qui refusent de ralentir.
              </p>
              <div className="flex items-center gap-3">
                <motion.a whileHover={{ scale: 1.15, y: -2 }} href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/30 transition-all">
                  <Twitter className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                </motion.a>
                <motion.a whileHover={{ scale: 1.15, y: -2 }} href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all">
                  <Github className="w-4 h-4 text-slate-400 hover:text-white" />
                </motion.a>
                <motion.a whileHover={{ scale: 1.15, y: -2 }} href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-700/20 hover:border-blue-700/30 transition-all">
                  <Linkedin className="w-4 h-4 text-slate-400 hover:text-blue-500" />
                </motion.a>
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Produit",
                items: [
                  { label: "Fonctionnalités", href: "#features" },
                  { label: "Visioconférence", href: "/video" },
                  { label: "Kanban", href: "/projects" },
                  { label: "Messagerie", href: "/chat" },
                ],
              },
              {
                title: "Entreprise",
                items: [
                  { label: "À propos", href: "/about" },
                  { label: "Blog", href: "/blog" },
                  { label: "Carrières", href: "/careers" },
                  { label: "Contact", href: "/contact" },
                ],
              },
              {
                title: "Légal",
                items: [
                  { label: "Politique de confidentialité", href: "/privacy" },
                  { label: "Conditions d'utilisation", href: "/terms" },
                  { label: "Cookies", href: "/cookies" },
                  { label: "Sécurité", href: "/security" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-black text-white uppercase tracking-[0.2em] text-[10px] mb-5">{col.title}</h4>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href}
                        className="text-slate-500 hover:text-blue-400 font-medium transition-colors text-sm flex items-center gap-1 group">
                        <span className="w-0 group-hover:w-2 h-px bg-blue-400 transition-all duration-200" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-sm font-medium">
              © {new Date().getFullYear()} TeamFlow by Novastack Digital. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-blue-400 transition-colors font-medium">Confidentialité</Link>
              <Link href="/terms" className="hover:text-blue-400 transition-colors font-medium">Conditions</Link>
              <Link href="/cookies" className="hover:text-blue-400 transition-colors font-medium">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
      <PWAInstallPrompt />
    </div>
  );
}
