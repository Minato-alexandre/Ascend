/* eslint-disable no-unused-vars */
import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from 'lucide-react';
import { THEMES } from '../config/themes';

// --- Botão Padrão ---
export const Button = ({ children, onClick, className = "", variant, disabled, type = "button", theme, ...props }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'ghost' ? `hover:${currentTheme.inputBg} ${currentTheme.muted} hover:${currentTheme.text}` :
                    variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
                        variant === 'outline' ? `border ${currentTheme.border} ${currentTheme.text} hover:${currentTheme.inputBg} hover:${currentTheme.text}` :
                            `${currentTheme.primary} text-white hover:opacity-90 shadow-lg ${currentTheme.animationColor}`
                } ${className}`}
            {...props}
        >
            {disabled && variant !== 'ghost' ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
        </button>
    );
};

// --- Input de Texto ---
export const Input = ({ className = "", theme, ...props }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <input
            className={`w-full border ${currentTheme.border} rounded-md p-2 ${currentTheme.inputBg} ${currentTheme.text} focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${currentTheme.placeholder} ${className}`}
            {...props}
        />
    );
};

// --- Labels ---
export const Label = ({ children, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return <label className={`block text-sm font-medium ${currentTheme.text.replace('text-white', 'text-gray-300')} mb-1.5`}>{children}</label>;
};

// --- Select (Dropdown) ---
export const Select = ({ children, value, onChange, name, className = "", theme }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full border ${currentTheme.border} rounded-md p-2 ${currentTheme.inputBg} ${currentTheme.text} focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none ${className}`}
        >
            {children}
        </select>
    );
};

// --- Card (Cartão) ---
export const Card = ({ children, className = "", theme }) => {
    const currentTheme = theme || THEMES.dark;
    return <div className={`${currentTheme.cardBg} rounded-xl shadow-md border ${currentTheme.border} overflow-hidden ${className}`}>{children}</div>;
};

// --- Badge (Etiquetas Coloridas) ---
export const Badge = ({ children, className = "", variant }) => {
    let colors = 'bg-gray-700 text-gray-300';
    if (variant === 'success') colors = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (variant === 'warning') colors = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    if (variant === 'danger') colors = 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (variant === 'blue') colors = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    if (variant === 'orange') colors = 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
    if (variant === 'purple') colors = 'bg-purple-500/10 text-purple-500 border border-purple-500/20';

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>{children}</span>;
};

// --- Modal / Dialog ---
export const Dialog = ({ open, onClose, children, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`${currentTheme.cardBg} border ${currentTheme.border} rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto ${currentTheme.text}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={onClose} className={`absolute top-4 right-4 ${currentTheme.muted} hover:${currentTheme.text} transition-colors`}>
                            <X size={20} />
                        </button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};