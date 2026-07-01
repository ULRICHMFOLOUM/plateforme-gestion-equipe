"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow"
            >
              <Users className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              TeamFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-slate-700 hover:text-blue-600 font-bold transition-colors"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#how-it-works"
              className="text-slate-700 hover:text-blue-600 font-bold transition-colors"
            >
              Comment ça marche
            </Link>
            <Link
              href="#testimonials"
              className="text-slate-700 hover:text-blue-600 font-bold transition-colors"
            >
              Témoignages
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
            >
              S'inscrire
            </Link>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{
          height: isMenuOpen ? "auto" : 0,
          opacity: isMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-slate-200"
      >
        <div className="px-4 py-6 space-y-4">
          <Link
            href="#features"
            onClick={() => setIsMenuOpen(false)}
            className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all"
          >
            Fonctionnalités
          </Link>
          <Link
            href="#how-it-works"
            onClick={() => setIsMenuOpen(false)}
            className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all"
          >
            Comment ça marche
          </Link>
          <Link
            href="#testimonials"
            onClick={() => setIsMenuOpen(false)}
            className="block py-3 px-4 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all"
          >
            Témoignages
          </Link>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <Link
              href="/auth/signin"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full py-3 px-4 text-slate-700 border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl font-semibold transition-all text-center"
            >
              Connexion
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 text-center"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
