// components/ui/Button.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * Button Component - TeamFlow style
 *
 * Bouton réutilisable avec variantes, tailles, icônes et état de chargement.
 * Utilise Framer Motion pour les animations.
 *
 * @example
 * ```tsx
 * <Button variant="primary" icon={Plus} loading={isLoading}>
 *   Créer un projet
 * </Button>
 * ```
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-cyan-500
      text-white
      shadow-lg shadow-blue-500/30
      hover:shadow-xl hover:shadow-blue-500/50
      disabled:from-slate-300 disabled:to-slate-400
      disabled:shadow-none
    `,
    secondary: `
      bg-white
      text-slate-700
      border-2 border-slate-300
      hover:border-blue-500 hover:text-blue-600
      disabled:bg-slate-100 disabled:text-slate-400
      disabled:border-slate-200
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-pink-500
      text-white
      shadow-lg shadow-red-500/30
      hover:shadow-xl hover:shadow-red-500/50
      disabled:from-slate-300 disabled:to-slate-400
      disabled:shadow-none
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-green-600
      text-white
      shadow-lg shadow-green-500/30
      hover:shadow-xl hover:shadow-green-500/50
      disabled:from-slate-300 disabled:to-slate-400
      disabled:shadow-none
    `,
    warning: `
      bg-gradient-to-r from-amber-500 to-orange-600
      text-white
      shadow-lg shadow-orange-500/30
      hover:shadow-xl hover:shadow-orange-500/50
      disabled:from-slate-300 disabled:to-slate-400
      disabled:shadow-none
    `,
    ghost: `
      bg-transparent
      text-slate-700
      hover:bg-slate-100
      disabled:text-slate-400
      disabled:hover:bg-transparent
    `,
    outline: `
      bg-transparent
      text-blue-600
      border-2 border-blue-500
      hover:bg-blue-50
      disabled:text-slate-400
      disabled:border-slate-200
      disabled:hover:bg-transparent
    `,
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      className={`
        relative
        font-semibold
        rounded-xl
        transition-all duration-300
        disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      )}

      {/* Icon gauche */}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconSizes[size]} />
      )}

      {/* Texte */}
      <span>{children}</span>

      {/* Icon droite */}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} />
      )}
    </motion.button>
  );
}

export default Button;
