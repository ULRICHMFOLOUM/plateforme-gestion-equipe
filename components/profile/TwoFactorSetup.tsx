"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldAlert, KeyRound,
  CheckCircle2, AlertCircle, Copy, Check, QrCode, Lock
} from "lucide-react";

interface TwoFactorSetupProps {
  initialTwoFactorEnabled?: boolean;
  userRole?: string;
}

export function TwoFactorSetup({ initialTwoFactorEnabled = false, userRole = "USER" }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(initialTwoFactorEnabled);
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = userRole === "ADMIN";

  const handleStartSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setStep("setup");
      } else {
        setError(data.message || "Erreur lors de la génération du QR Code");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEnabled(true);
        setSuccess("Double authentification activée avec succès !");
        setStep("idle");
        setCode("");
      } else {
        setError(data.message || "Code invalide");
      }
    } catch {
      setError("Erreur de vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (isAdmin) {
      setError("La 2FA est obligatoire pour les comptes administrateurs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsEnabled(false);
        setSuccess("2FA désactivée.");
        setStep("idle");
      } else {
        setError(data.message || "Erreur");
      }
    } catch {
      setError("Erreur de réseau");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
            isEnabled
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
              : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20"
          }`}>
            {isEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Double Authentification (2FA TOTP)
              {isAdmin && (
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Requis pour Admin
                </span>
              )}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Protégez votre compte avec Google Authenticator ou une application TOTP compatible.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Activée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold">
              Désactivée
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-6 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle State */}
      {step === "idle" && (
        <div className="space-y-4">
          {!isEnabled ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-purple-500/5 border border-purple-500/15 rounded-2xl">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Activer l&apos;authentification par application</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Scannez un QR Code avec Google Authenticator ou Authy</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartSetup}
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all text-sm flex items-center gap-2 shrink-0"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <QrCode className="w-4 h-4" />}
                <span>Configurer la 2FA</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Votre compte est sécurisé</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Chaque connexion nécessite un code TOTP temporaire</p>
              </div>
              {!isAdmin && (
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl text-xs transition-colors"
                >
                  Désactiver 2FA
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup Step: Show QR Code */}
      {step === "setup" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
              {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt="QR Code 2FA" width={180} height={180} className="rounded-lg" />
              ) : (
                <div className="w-44 h-44 bg-slate-100 rounded-lg animate-pulse" />
              )}
              <span className="text-[11px] text-slate-400 font-bold mt-2">Scannez avec Google Authenticator</span>
            </div>

            {/* Secret key */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Instructions :</h4>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Téléchargez <strong>Google Authenticator</strong> ou <strong>Authy</strong>.</li>
                <li>Scannez le QR Code ci-contre.</li>
                <li>Ou entrez la clé de configuration manuellement :</li>
              </ol>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl">
                <code className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex-1 truncate">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => setStep("verify")}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Étape suivante : Vérifier le code</span>
                <KeyRound className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verify Step: Enter TOTP code */}
      {step === "verify" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-md mx-auto">
          <div className="text-center">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Entrez le code à 6 chiffres</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Saisissez le code affiché dans votre application Authenticator</p>
          </div>

          <form onSubmit={handleVerifyAndEnable} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="flex-1 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-sm transition-all disabled:opacity-40"
              >
                {loading ? "Vérification..." : "Activer la 2FA"}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
