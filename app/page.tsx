"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  CheckCircle2,
  Users,
  Calendar,
  MessageSquare,
  FolderKanban,
  Video,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

const stats = [
  {
    label: "Utilisateurs actifs",
    value: "10k+",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "Tâches gérées",
    value: "500k+",
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-500",
  },
  {
    label: "Projets terminés",
    value: "50k+",
    icon: FolderKanban,
    color: "from-orange-500 to-amber-500",
  },
  {
    label: "Disponibilité",
    value: "99.9%",
    icon: TrendingUp,
    color: "from-purple-500 to-pink-500",
  },
];

const features = [
  {
    icon: FolderKanban,
    title: "Gestion de tâches",
    description:
      "Organisez vos tâches avec un système Kanban intuitif et des fonctionnalités avancées.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Collaboration d'équipe",
    description:
      "Travaillez ensemble efficacement avec des groupes, des permissions et des notifications.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Calendar,
    title: "Calendrier intégré",
    description:
      "Planifiez vos événements, réunions et deadlines directement dans la plateforme.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "Messagerie temps réel",
    description:
      "Communiquez instantanément avec votre équipe via le chat intégré.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Gestion de fichiers",
    description:
      "Stockez, organisez et partagez vos documents en toute sécurité.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Video,
    title: "Visioconférence",
    description:
      "Organisez des réunions virtuelles directement depuis la plateforme.",
    color: "from-red-500 to-pink-500",
  },
];

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-20 left-20 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]"
          />
          <motion.div
            animate={{
              scale: [0.8, 1.1, 0.8],
              x: [0, -50, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[160px]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            style={{ opacity, scale }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-blue-200 rounded-full mb-8 shadow-lg shadow-blue-500/10"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">
                Nouvelle version 2.0 disponible
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6"
            >
              Gérez votre équipe{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  comme jamais
                </span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute bottom-2 left-0 h-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 -z-10"
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Une plateforme complète pour la gestion de projets, la
              collaboration d'équipe et la productivité. Tout ce dont vous avez
              besoin pour réussir ensemble.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(0, 153, 230, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/30 flex items-center gap-2 relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative">Commencer gratuitement</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
                </motion.button>
              </Link>

              <Link href="#features">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-lg"
                >
                  Découvrir les fonctionnalités
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="relative rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)] border-8 border-white bg-white/40 backdrop-blur-3xl">
              <div className="aspect-[16/9] bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center relative overflow-hidden p-12">
                
                {/* Decorative Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                {/* Floating Cards */}
                {[...Array(6)].map((_, i) => {
                  const configs = [
                    { icon: FolderKanban, color: "from-blue-500 to-cyan-500", label: "Projets", pos: "left-[5%] top-[10%]" },
                    { icon: Users, color: "from-emerald-500 to-teal-500", label: "Équipe", pos: "right-[8%] top-[15%]" },
                    { icon: MessageSquare, color: "from-purple-500 to-pink-500", label: "Chat", pos: "left-[8%] bottom-[20%]" },
                    { icon: Video, color: "from-red-500 to-pink-500", label: "Vidéo", pos: "right-[5%] bottom-[10%]" },
                    { icon: Calendar, color: "from-amber-500 to-orange-500", label: "Agenda", pos: "left-[40%] top-[5%]" },
                    { icon: TrendingUp, color: "from-blue-600 to-indigo-600", label: "Stats", pos: "right-[40%] bottom-[5%]" },
                  ];
                  const cfg = configs[i % configs.length];
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        y: [0, -15, 0],
                        rotate: [0, i % 2 === 0 ? 2 : -2, 0],
                      }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                      }}
                      className={`absolute ${cfg.pos} group`}
                    >
                      <div className={`relative px-5 py-4 bg-gradient-to-br ${cfg.color} rounded-2xl shadow-2xl shadow-blue-500/10 flex items-center gap-3 border border-white/20 transition-all hover:scale-110 hover:-rotate-2`}>
                        {/* Glow effect */}
                        <div className={`absolute -inset-2 bg-gradient-to-br ${cfg.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
                        
                        <div className="relative w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                          <cfg.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="relative text-white font-black text-xs uppercase tracking-widest">{cfg.label}</span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Central Visual - Premium Dashboard Mockup Placeholder */}
                <div className="relative z-10 w-full max-w-2xl bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 border border-white shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-slate-200 rounded-full mb-2" />
                      <div className="h-2 w-20 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-2xl border border-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-blue-200" />
                    </div>
                    <div className="h-32 bg-gradient-to-br from-purple-50 to-transparent rounded-2xl border border-purple-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-purple-200" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ delay: 1, duration: 1.5 }} className="h-full bg-blue-500" />
                    </div>
                    <div className="h-2 w-[80%] bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: "45%" }} transition={{ delay: 1.2, duration: 1.5 }} className="h-full bg-cyan-500" />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between items-center bg-slate-50/50 rounded-xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps de réponse équipe</p>
                    <span className="text-blue-600 font-bold text-sm">~ 12 min</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-xl border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="text-center group"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-display font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Fonctionnalités{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                puissantes
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Découvrez tous les outils dont votre équipe a besoin pour
              travailler efficacement
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 hover:border-blue-300 shadow-xl shadow-slate-200/50 hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`}
                />
                <div className="relative">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mb-6">
              Une plateforme, <span className="text-blue-600">trois étapes</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              TeamFlow simplifie la complexité pour que vous puissiez vous concentrer sur ce qui compte vraiment.
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-12">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -translate-y-1/2 hidden md:block -z-10" />
            
            {[
              { step: "01", title: "Configurez", desc: "Créez votre espace de travail et invitez vos collaborateurs en quelques secondes.", icon: Zap, bg: "bg-blue-500", shadow: "shadow-blue-500/20" },
              { step: "02", title: "Collaborez", desc: "Gérez vos projets, discutez en temps réel et organisez des réunions.", icon: MessageSquare, bg: "bg-indigo-500", shadow: "shadow-indigo-500/20" },
              { step: "03", title: "Livrez", desc: "Suivez vos indicateurs de performance et atteignez vos objectifs sereinement.", icon: CheckCircle2, bg: "bg-cyan-500", shadow: "shadow-cyan-500/20" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="absolute -top-6 left-8 px-4 py-2 bg-slate-900 text-white font-black rounded-xl text-xs tracking-[0.3em] shadow-xl">
                  STEP {item.step}
                </div>
                <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${item.shadow} group-hover:rotate-12 transition-transform`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Propulsé par les meilleurs</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           {/* Placeholder for integration icons/logos */}
           {['Slack', 'GitHub', 'Figma', 'Notion', 'Google', 'Zoom'].map((tool) => (
             <div key={tool} className="text-2xl font-display font-black text-slate-900 flex items-center gap-2">
               <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
               {tool}
             </div>
           ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8 text-center md:text-left">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-6xl font-display font-black text-slate-900 mb-6 leading-tight">
                Ils nous font <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">confiance</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium">
                Découvrez comment les meilleures équipes utilisent TeamFlow pour révolutionner leur productivité quotidienne.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-2xl">
                4.9
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex text-amber-400">
                   {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm font-black text-slate-900">1200+ Avis clients</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { name: "Sarah Jensen", role: "Product Manager", quote: "TeamFlow a littéralement changé notre façon de travailler. C'est l'outil le plus intuitif que j'ai utilisé en 10 ans.", avatar: "SJ" },
               { name: "Marc Dubois", role: "Lead Dev", quote: "La visioconférence intégrée au chat change tout. Plus besoin de jongler entre trois applis pour une simple question.", avatar: "MD" },
               { name: "Léa Martin", role: "Creative Director", quote: "Le design est magnifique, ce qui rend le travail quotidien beaucoup plus agréable pour toute l'équipe design.", avatar: "LM" }
             ].map((t, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-10 bg-white/50 backdrop-blur-xl border border-slate-100 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all"
               >
                 <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                     {t.avatar}
                   </div>
                   <div>
                     <h4 className="font-black text-slate-900">{t.name}</h4>
                     <p className="text-sm text-slate-500 font-medium">{t.role}</p>
                   </div>
                 </div>
                 <p className="text-slate-600 text-lg leading-relaxed italic">"{t.quote}"</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl sm:text-6xl font-display font-black text-white leading-tight">
              Prêt à transformer votre <br />
              <span className="text-cyan-300">flux de travail ?</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">
              Rejoignez des milliers d'équipes qui utilisent TeamFlow pour collaborer plus intelligemment et livrer plus vite.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xl shadow-2xl transition-all"
                >
                  Démarrer maintenant
                </motion.button>
              </Link>
              <button className="text-white font-bold flex items-center gap-2 hover:gap-4 transition-all">
                Voir toutes les fonctionnalités <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-3xl border-t border-slate-200 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-display font-black text-slate-900 tracking-tight">
                  TeamFlow
                </span>
              </div>
              <p className="text-slate-500 text-lg leading-relaxed max-w-sm mb-8">
                L'espace de travail unifié pour les équipes modernes qui refusent de ralentir.
              </p>
              <div className="flex items-center gap-4">
                {['twitter', 'github', 'linkedin'].map((social) => (
                  <button key={social} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-slate-400">
                    <div className="uppercase font-black text-[10px]">{social.charAt(0)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-6">Produit</h4>
              <ul className="space-y-4">
                {['Fonctionnalités', 'Visioconférence', 'Kanban', 'Messagerie'].map((item) => (
                  <li key={item}><a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-6">Entreprise</h4>
              <ul className="space-y-4">
                {['À propos', 'Blog', 'Carrières', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-6">Ressources</h4>
              <ul className="space-y-4">
                {['Documentation', 'Sécurité', 'Confidentialité', 'Status'].map((item) => (
                  <li key={item}><a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm font-medium">
              © 2024 TeamFlow Inc. Fabriqué avec passion pour les créateurs.
            </p>
            <div className="flex items-center gap-8 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-blue-600 transition-colors">Politique</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Conditions</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
