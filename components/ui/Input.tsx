"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "onDrag"
    | "onDragEnd"
    | "onDragEnter"
    | "onDragLeave"
    | "onDragOver"
    | "onDragStart"
  > {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

/**
 * Input Component - TeamFlow style
 *
 * Input réutilisable avec support d'icône, label, et états d'erreur.
 * Utilise Framer Motion pour les animations de focus.
 *
 * @example
 * 
```
tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="votre@email.com"
 *   icon={Mail}
 * />
 * 
```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      iconPosition = "left",
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Icon Left */}
          {Icon && iconPosition === "left" && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-5 h-5" />
            </div>
          )}

          <input
            ref={ref}
            className={`
            w-full
            px-4 py-3
            bg-slate-50
            border-2 border-slate-300
            rounded-xl
            text-slate-900
            placeholder:text-slate-400
            focus:outline-none
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-500/20
            transition-all
            duration-300
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            ${Icon && iconPosition === "left" ? "pl-12" : ""}
            ${Icon && iconPosition === "right" ? "pr-12" : ""}
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
            ${className}
          `}
            {...props}
          />

          {/* Icon Right */}
          {Icon && iconPosition === "right" && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
