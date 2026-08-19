"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, User, Mail, Lock, ArrowRight,
  CheckCircle2, AlertCircle, Shield, Check, X
} from "lucide-react";

/* ─── Helper for password strength calculation ─── */
function getPasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length) score += 25;
  if (checks.uppercase) score += 25;
  if (checks.number) score += 25;
  if (checks.special) score += 25;

  let label = "Trop court";
  let color = "bg-slate-600";
  let textColor = "text-slate-400";

  if (score >= 100) {
    label = "Très fort";
    color = "bg-emerald-400";
    textColor = "text-emerald-400";
  } else if (score >= 75) {
    label = "Fort";
    color = "bg-green-400";
    textColor = "text-green-400";
  } else if (score >= 50) {
    label = "Moyen";
    color = "bg-amber-400";
    textColor = "text-amber-400";
  } else if (score >= 25) {
    label = "Faible";
    color = "bg-rose-500";
    textColor = "text-rose-400";
  }

  return { score, label, color, textColor, checks };
}

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        router.push("/auth/signin?message=" + encodeURIComponent("Compte créé avec succès. Vous pouvez vous connecter."));
      } else {
        const data = await response.json();
        setError(data.message || "Erreur lors de la création du compte");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── LEFT PANEL – Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 xl:p-16 relative z-10"
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20">
            <Image src="/teamflow-logo.png" alt="Teamflows" fill className="object-contain" priority />
          </div>
          <span className="text-3xl font-black text-white tracking-tight">Teamflows</span>
        </Link>

        <div className="space-y-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl xl:text-6xl font-black text-white leading-tight mb-4"
            >
              Rejoignez <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                l&apos;aventure !
              </span>
            </motion.h1>
            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed">
              Créez votre espace de travail d&apos;équipe en quelques secondes et boostez votre productivité.
            </p>
          </div>

          {/* Benefits list */}
          <div className="space-y-4">
            {[
              "Espace de travail illimité pour votre équipe",
              "Outils de collaboration temps réel",
              "Sécurité renforcée avec 2FA TOTP optionnelle",
              "Support prioritaire et sauvegardes automatiques"
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-slate-300 font-medium text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-slate-600 text-sm">© {new Date().getFullYear()} Teamflows — Tous droits réservés</div>
      </motion.div>

      {/* ── RIGHT PANEL – Form ── */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 relative z-10 my-6 lg:my-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/teamflow-logo.png" alt="Teamflows" fill className="object-contain" />
              </div>
              <span className="text-2xl font-black text-white">Teamflows</span>
            </Link>
          </div>

          <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white mb-1.5">Créer un compte</h2>
              <p className="text-slate-400 text-sm">
                Déjà un compte ?{" "}
                <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-6 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="ex: Alexandre Dubois"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="alexandre@exemple.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {formData.password && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Force du mot de passe:</span>
                      <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${strength.score}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full ${strength.color} rounded-full`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {[
                        { label: "8+ caractères", ok: strength.checks.length },
                        { label: "Majuscule", ok: strength.checks.uppercase },
                        { label: "Un chiffre", ok: strength.checks.number },
                        { label: "Symbole spécial", ok: strength.checks.special },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 text-[11px]">
                          {item.ok ? (
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                          <span className={item.ok ? "text-slate-300 font-medium" : "text-slate-600"}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-4 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
