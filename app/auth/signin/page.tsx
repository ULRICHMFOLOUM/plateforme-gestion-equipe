"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Shield,
  CheckCircle2, AlertCircle, Users, MessageSquare,
  FolderKanban, TrendingUp, KeyRound, ArrowLeft, Info,
} from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  /* 2FA Step handling */
  const [step2FA, setStep2FA] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) setSuccess(decodeURIComponent(message));

    const err = searchParams.get("error");
    if (err) {
      if (err === "OAuthSignin" || err === "OAuthCallback" || err === "Configuration") {
        setError(
          "La connexion sociale nécessite de configurer les clés d'API (GOOGLE_CLIENT_ID / GITHUB_CLIENT_ID) dans le fichier .env"
        );
      } else if (err === "OAuthCreateAccount") {
        setError("Impossible de créer un compte avec cette méthode sociale.");
      } else if (err === "EmailCreateAccount") {
        setError("Erreur de création de compte email.");
      } else if (err === "Callback") {
        setError("Erreur lors de la redirection du fournisseur.");
      } else {
        setError("Erreur d'authentification : " + err);
      }
    }

    const storedLockout = localStorage.getItem("tf_auth_lockout");
    if (storedLockout) {
      const lockoutDate = new Date(storedLockout);
      if (lockoutDate > new Date()) {
        setLockedUntil(lockoutDate);
      } else {
        localStorage.removeItem("tf_auth_lockout");
        localStorage.removeItem("tf_auth_attempts");
      }
    }

    const storedAttempts = localStorage.getItem("tf_auth_attempts");
    if (storedAttempts) setAttempts(parseInt(storedAttempts, 10));
  }, [searchParams]);

  const isLocked = lockedUntil && lockedUntil > new Date();

  /* ── Handles 6-digit TOTP input ── */
  const handleDigitChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...totpCode];
    newCode[index] = value;
    setTotpCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setTotpCode(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const remainingMs = lockedUntil!.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      setError(`Trop de tentatives. Réessayez dans ${remainingMin} minute(s).`);
      return;
    }

    setLoading(true);
    setError("");

    const fullCode = step2FA ? totpCode.join("") : undefined;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        code: fullCode,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          setStep2FA(true);
          setError("");
          setTimeout(() => inputRefs.current[0]?.focus(), 200);
        } else if (result.error === "INVALID_2FA_CODE") {
          setError("Code 2FA incorrect. Veuillez vérifier Google Authenticator.");
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          localStorage.setItem("tf_auth_attempts", String(newAttempts));

          if (newAttempts >= MAX_ATTEMPTS) {
            const lockoutDate = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
            setLockedUntil(lockoutDate);
            localStorage.setItem("tf_auth_lockout", lockoutDate.toISOString());
            setError(
              `Compte temporairement bloqué après ${MAX_ATTEMPTS} tentatives échouées.`
            );
          } else {
            setError(
              `Email ou mot de passe incorrect. (${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s))`
            );
          }
        }
      } else {
        localStorage.removeItem("tf_auth_attempts");
        localStorage.removeItem("tf_auth_lockout");
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setSocialLoading(provider);
    setError("");
    try {
      const res = await signIn(provider, { callbackUrl: "/dashboard", redirect: true });
      if (res?.error) {
        setError(
          `Veuillez configurer ${provider.toUpperCase()}_CLIENT_ID et ${provider.toUpperCase()}_CLIENT_SECRET dans votre fichier .env pour activer cette connexion.`
        );
        setSocialLoading(null);
      }
    } catch {
      setError(
        `Veuillez configurer ${provider.toUpperCase()}_CLIENT_ID et ${provider.toUpperCase()}_CLIENT_SECRET dans votre fichier .env.`
      );
      setSocialLoading(null);
    }
  };

  const features = [
    { icon: FolderKanban, text: "Gestion de projets intuitive", color: "text-blue-400" },
    { icon: MessageSquare, text: "Chat & collaboration temps réel", color: "text-purple-400" },
    { icon: TrendingUp, text: "Analytics & rapports avancés", color: "text-cyan-400" },
    { icon: Users, text: "Gestion d'équipe centralisée", color: "text-emerald-400" },
  ];

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

        <div className="space-y-10">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl xl:text-6xl font-black text-white leading-tight mb-5"
            >
              Bienvenue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                de retour !
              </span>
            </motion.h1>
            <p className="text-slate-400 text-lg font-medium max-w-sm leading-relaxed">
              Retrouvez votre équipe et continuez là où vous vous étiez arrêtés.
            </p>
          </div>

          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <span className="text-slate-300 font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-slate-300 italic text-sm leading-relaxed mb-4">
              &ldquo;Teamflows a révolutionné notre façon de travailler. Tout est au même endroit.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-black">
                SJ
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Sarah Jensen</p>
                <p className="text-slate-500 text-xs">Product Manager</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-slate-600 text-sm">© {new Date().getFullYear()} Teamflows — Tous droits réservés</div>
      </motion.div>

      {/* ── RIGHT PANEL – Form ── */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/teamflow-logo.png" alt="Teamflows" fill className="object-contain" />
              </div>
              <span className="text-2xl font-black text-white">Teamflows</span>
            </Link>
          </div>

          <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/40">
            <AnimatePresence mode="wait">
              {!step2FA ? (
                /* ── STEP 1: Email & Password ── */
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-7">
                    <h2 className="text-2xl font-black text-white mb-1.5">Connexion</h2>
                    <p className="text-slate-400 text-sm">
                      Pas encore de compte ?{" "}
                      <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                        Créer un compte
                      </Link>
                    </p>
                  </div>

                  {/* Banners */}
                  {success && (
                    <div className="flex items-start gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 mb-6">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-emerald-300 text-sm">{success}</p>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-6">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* Social Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.12)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSocialSignIn("google")}
                      disabled={!!isLocked || !!socialLoading}
                      className="flex items-center justify-center gap-2.5 bg-white/[0.07] hover:bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-semibold text-sm transition-all disabled:opacity-40"
                    >
                      {socialLoading === "google" ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      <span>Google</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.12)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSocialSignIn("github")}
                      disabled={!!isLocked || !!socialLoading}
                      className="flex items-center justify-center gap-2.5 bg-white/[0.07] hover:bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-semibold text-sm transition-all disabled:opacity-40"
                    >
                      {socialLoading === "github" ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      )}
                      <span>GitHub</span>
                    </motion.button>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/8" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-transparent text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                        ou continuer avec email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!!isLocked}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={!!isLocked}
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
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                            rememberMe
                              ? "bg-blue-500 border-blue-500"
                              : "border-white/20 bg-transparent group-hover:border-white/40"
                          }`}
                        >
                          {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                          Se souvenir de moi
                        </span>
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>

                    <motion.button
                      whileHover={{ scale: isLocked || loading ? 1 : 1.02 }}
                      whileTap={{ scale: isLocked || loading ? 1 : 0.97 }}
                      type="submit"
                      disabled={!!isLocked || loading}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2 text-sm"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Continuer</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                /* ── STEP 2: 2FA Code Input ── */
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => { setStep2FA(false); setError(""); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                      <KeyRound className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-1">Double Authentification</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Entrez le code à 6 chiffres généré par votre application <span className="text-white font-semibold">Google Authenticator</span>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-6">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-between gap-2">
                      {totpCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="w-11 sm:w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.97 }}
                      type="submit"
                      disabled={loading || totpCode.join("").length !== 6}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Vérifier et Se Connecter</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
