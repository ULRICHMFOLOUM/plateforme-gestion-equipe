'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Card Variants
 * - default: Fond blanc glassmorphic standard
 * - primary: Accent bleu avec gradient subtil
 * - success: Accent vert pour succès
 * - warning: Accent orange pour avertissements
 * - danger: Accent rouge pour erreurs
 */
type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Card Sizes
 * - sm: Padding réduit, texte plus petit
 * - md: Taille standard
 * - lg: Padding généreux, texte plus grand
 */
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  iconColor?: string;
  title?: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

/**
 * Card Component - Glassmorphic style
 *
 * Composant de carte réutilisable avec effet glassmorphism,
 * animations Framer Motion, et variantes de couleur.
 *
 * @example
 * ```tsx
 * <Card
 *   variant="primary"
 *   icon={Folder}
 *   title="Projets"
 *   hover
 * >
 *   Contenu de la carte
 * </Card>
 * ```
 */
export function Card({
  children,
  variant = 'default',
  size = 'md',
  hover = true,
  className = '',
  onClick,
  icon: Icon,
  iconColor,
  title,
  description,
  badge,
  actions,
}: CardProps) {

  // Variants de couleur pour le fond et la bordure
  const variantStyles = {
    default: {
      background: 'bg-white/80',
      border: 'border-slate-200',
      shadow: 'shadow-blue-500/10',
      iconBg: 'from-blue-500 to-cyan-500',
    },
    primary: {
      background: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/20',
      iconBg: 'from-blue-500 to-cyan-500',
    },
    success: {
      background: 'bg-gradient-to-br from-green-50/80 to-emerald-50/80',
      border: 'border-green-200',
      shadow: 'shadow-green-500/20',
      iconBg: 'from-green-500 to-emerald-500',
    },
    warning: {
      background: 'bg-gradient-to-br from-orange-50/80 to-amber-50/80',
      border: 'border-orange-200',
      shadow: 'shadow-orange-500/20',
      iconBg: 'from-orange-500 to-amber-500',
    },
    danger: {
      background: 'bg-gradient-to-br from-red-50/80 to-pink-50/80',
      border: 'border-red-200',
      shadow: 'shadow-red-500/20',
      iconBg: 'from-red-500 to-pink-500',
    },
  };

  // Tailles de padding
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Tailles d'icône
  const iconSizes = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-14 h-14', icon: 'w-7 h-7' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8' },
  };

  const styles = variantStyles[variant];
  const iconSize = iconSizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? {
        y: -10,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 153, 230, 0.15)'
      } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        group relative overflow-hidden
        ${styles.background}
        backdrop-blur-xl
        border ${styles.border}
        rounded-3xl
        ${sizeStyles[size]}
        shadow-xl ${styles.shadow}
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header avec icône et badge */}
        {(Icon || title || badge) && (
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {Icon && (
                <div
                  className={`
                    ${iconSize.container}
                    bg-gradient-to-br ${iconColor || styles.iconBg}
                    rounded-xl
                    flex items-center justify-center
                    shadow-lg
                    group-hover:scale-110
                    transition-transform duration-300
                  `}
                >
                  <Icon className={`${iconSize.icon} text-white`} />
                </div>
              )}

              {title && (
                <div>
                  <h3 className={`
                    font-display font-bold text-slate-900
                    ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'}
                  `}>
                    {title}
                  </h3>
                  {description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {badge !== undefined && (
              <div className="flex-shrink-0">
                {typeof badge === 'string' || typeof badge === 'number' ? (
                  <span className={`
                    px-3 py-1
                    bg-gradient-to-r ${styles.iconBg}
                    text-white
                    rounded-full
                    text-sm font-semibold
                    shadow-lg
                  `}>
                    {badge}
                  </span>
                ) : (
                  badge
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <div className={title || Icon ? 'mt-4' : ''}>
          {children}
        </div>

        {/* Actions footer */}
        {actions && (
          <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-end gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom gradient line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}

/**
 * StatCard - Card optimisée pour afficher des statistiques
 */
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'blue',
  onClick,
}: StatCardProps) {

  const colorStyles = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-pink-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 153, 230, 0.2)'
      }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`
        group relative overflow-hidden
        bg-white/80 backdrop-blur-xl
        border border-slate-200
        rounded-3xl p-6
        shadow-xl shadow-blue-500/10
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Background gradient on hover */}
      <div className={`
        absolute inset-0
        bg-gradient-to-br ${colorStyles[color]}
        opacity-0 group-hover:opacity-5
        transition-opacity duration-300
      `} />

      <div className="relative z-10">
        {/* Icon */}
        <div className={`
          w-12 h-12
          bg-gradient-to-br ${colorStyles[color]}
          rounded-2xl
          flex items-center justify-center
          mb-4
          shadow-lg
          group-hover:rotate-6
          transition-transform duration-300
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Label */}
        <p className="text-sm text-slate-600 mb-2 font-medium">
          {label}
        </p>

        {/* Value and Trend */}
        <div className="flex items-end justify-between">
          <h3 className="text-4xl font-display font-bold text-slate-900">
            {value}
          </h3>

          {trend && (
            <div className={`
              flex items-center gap-1 text-sm font-semibold
              ${trend.isPositive ? 'text-green-600' : 'text-red-600'}
            `}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Glow effect */}
      <div className={`
        absolute -right-4 -bottom-4 w-32 h-32
        bg-gradient-to-br ${colorStyles[color]}
        opacity-0 group-hover:opacity-20 blur-3xl
        transition-opacity duration-500
      `} />

      {/* Bottom line animation */}
      <div className={`
        absolute bottom-0 left-0 right-0 h-1
        bg-gradient-to-r ${colorStyles[color]}
        transform scale-x-0 group-hover:scale-x-100
        transition-transform duration-300 origin-left
      `} />
    </motion.div>
  );
}

/**
 * ActionCard - Card pour actions rapides
 */
interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  color = 'blue',
}: ActionCardProps) {

  const colorStyles = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-pink-500',
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0, 153, 230, 0.2)'
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        w-full text-left
        bg-white/80 backdrop-blur-xl
        border border-slate-200
        rounded-3xl p-6
        shadow-xl shadow-blue-500/10
        transition-all duration-300
        group relative overflow-hidden
      `}
    >
      {/* Background gradient on hover */}
      <div className={`
        absolute inset-0
        bg-gradient-to-br ${colorStyles[color]}
        opacity-0 group-hover:opacity-10
        transition-opacity duration-300
      `} />

      <div className="relative z-10">
        {/* Icon */}
        <div className={`
          w-14 h-14
          bg-gradient-to-br ${colorStyles[color]}
          rounded-2xl
          flex items-center justify-center
          mb-4
          shadow-lg
          group-hover:rotate-6
          transition-transform duration-300
        `}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h4 className="text-xl font-display font-bold text-slate-900">
            {title}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Indicator */}
        <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all">
          <span>Ouvrir</span>
          <svg
            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Glow effect */}
      <div className={`
        absolute -right-4 -bottom-4 w-32 h-32
        bg-gradient-to-br ${colorStyles[color]}
        opacity-0 group-hover:opacity-20 blur-3xl
        transition-opacity duration-500
      `} />
    </motion.button>
  );
}

export default Card;
