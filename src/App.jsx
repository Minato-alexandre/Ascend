import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import {
    Plus, TrendingUp, TrendingDown, PiggyBank, Loader2, X,
    LayoutDashboard, Users, ListTodo, LogOut, DollarSign, Pencil, Trash2, Search, Filter, AlertCircle,
    Briefcase, Calendar, CheckSquare, User, Mail, Lock, Link as LinkIcon,
    Globe, Server, Bell, Settings, ExternalLink, ChevronDown, Eye, EyeOff, Flame, Check, AlertTriangle, Shield, Clock, Hourglass, CheckCircle, RotateCcw
} from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- 1. CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBfD2ebBay_Aqvf4NKQ5kP01yTbBe9fq_Q",
    authDomain: "financechart-41c8d.firebaseapp.com",
    projectId: "financechart-41c8d",
    storageBucket: "financechart-41c8d.firebasestorage.app",
    messagingSenderId: "701580996602",
    appId: "1:701580996602:web:a65bb0304a803b0da73e43",
    measurementId: "G-7N29BXB72L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "ascend-prod";

// --- DEFINIÇÕES DE TEMA ---
const THEMES = {
    dark: {
        label: 'Ascend Padrão', bg: 'bg-black', text: 'text-white', muted: 'text-gray-400',
        primary: 'bg-orange-600', primaryText: 'text-orange-500',
        cardBg: 'bg-gray-800', border: 'border-gray-700',
        inputBg: 'bg-gray-900', placeholder: 'text-gray-600',
        headerBg: 'bg-gray-900', sidebarBg: 'bg-gray-900', sidebarBorder: 'border-gray-800',
        danger: 'text-red-400', success: 'text-emerald-400', animationColor: 'shadow-orange-900/20',
        iconBg: 'bg-gray-900',
    },
    light: {
        label: 'Claro', bg: 'bg-gray-50', text: 'text-gray-900', muted: 'text-gray-500',
        primary: 'bg-orange-600', primaryText: 'text-orange-600',
        cardBg: 'bg-white', border: 'border-gray-200',
        inputBg: 'bg-gray-50', placeholder: 'text-gray-400',
        headerBg: 'bg-white', sidebarBg: 'bg-white', sidebarBorder: 'border-gray-200',
        danger: 'text-red-600', success: 'text-emerald-600', animationColor: 'shadow-orange-300/30',
        iconBg: 'bg-gray-100',
    },
    blue: {
        label: 'Azul Corporativo', bg: 'bg-slate-900', text: 'text-white', muted: 'text-slate-400',
        primary: 'bg-blue-600', primaryText: 'text-blue-400',
        cardBg: 'bg-slate-800', border: 'border-slate-700',
        inputBg: 'bg-slate-900', placeholder: 'text-slate-500',
        headerBg: 'bg-slate-900', sidebarBg: 'bg-slate-900', sidebarBorder: 'border-slate-700',
        danger: 'text-red-400', success: 'text-cyan-400', animationColor: 'shadow-blue-900/20',
        iconBg: 'bg-slate-950',
    },
    matrix: {
        label: 'Tech Matrix', bg: 'bg-black', text: 'text-green-400', muted: 'text-green-800',
        primary: 'bg-green-600', primaryText: 'text-green-400',
        cardBg: 'bg-gray-900', border: 'border-green-900',
        inputBg: 'bg-black', placeholder: 'text-green-900',
        headerBg: 'bg-black', sidebarBg: 'bg-black', sidebarBorder: 'border-green-900',
        danger: 'text-red-500', success: 'text-green-400', animationColor: 'shadow-green-500/10',
        iconBg: 'bg-gray-900',
    },
    corp: {
        label: 'Corporate Gray', bg: 'bg-gray-100', text: 'text-slate-800', muted: 'text-slate-500',
        primary: 'bg-slate-700', primaryText: 'text-slate-700',
        cardBg: 'bg-white', border: 'border-slate-200',
        inputBg: 'bg-slate-50', placeholder: 'text-slate-400',
        headerBg: 'bg-white', sidebarBg: 'bg-white', sidebarBorder: 'border-slate-200',
        danger: 'text-red-700', success: 'text-green-700', animationColor: 'shadow-slate-900/10',
        iconBg: 'bg-slate-100',
    },
    sunset: {
        label: 'Sunset Gold', bg: 'bg-purple-950', text: 'text-amber-100', muted: 'text-purple-300',
        primary: 'bg-pink-600', primaryText: 'text-pink-400',
        cardBg: 'bg-purple-900/40', border: 'border-pink-500/30',
        inputBg: 'bg-purple-900/60', placeholder: 'text-purple-400',
        headerBg: 'bg-purple-900', sidebarBg: 'bg-purple-900', sidebarBorder: 'border-pink-500/20',
        danger: 'text-red-300', success: 'text-amber-300', animationColor: 'shadow-pink-500/20',
        iconBg: 'bg-purple-950',
    }
};

// --- UTILITÁRIOS ---
const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const safeDate = (dateInput) => {
    try {
        if (!dateInput) return new Date();
        if (typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
            return dateInput.toDate();
        }
        const d = new Date(dateInput);
        return isNaN(d.getTime()) ? new Date() : d;
    } catch {
        return new Date();
    }
};

// --- 2. COMPONENTES UI BASE ---
const Button = ({ children, onClick, className = "", variant, disabled, type = "button", theme, ...props }) => {
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
            {children}
        </button>
    );
};

const Input = ({ className = "", theme, ...props }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <input
            className={`w-full border ${currentTheme.border} rounded-md p-2 ${currentTheme.inputBg} ${currentTheme.text} focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${currentTheme.placeholder} ${className}`}
            {...props}
        />
    );
};

const Label = ({ children, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return <label className={`block text-sm font-medium ${currentTheme.text.replace('text-white', 'text-gray-300')} mb-1.5`}>{children}</label>;
};

const Select = ({ children, value, onChange, name, className = "", theme }) => {
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

const Card = ({ children, className = "", theme }) => {
    const currentTheme = theme || THEMES.dark;
    return <div className={`${currentTheme.cardBg} rounded-xl shadow-md border ${currentTheme.border} overflow-hidden ${className}`}>{children}</div>;
};

const Badge = ({ children, className = "", variant }) => {
    let colors = 'bg-gray-700 text-gray-300';
    if (variant === 'success') colors = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (variant === 'warning') colors = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    if (variant === 'danger') colors = 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (variant === 'blue') colors = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    if (variant === 'orange') colors = 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
    if (variant === 'purple') colors = 'bg-purple-500/10 text-purple-500 border border-purple-500/20';

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>{children}</span>;
};

// Searchable Select Component
const ClientSearchInput = ({ clients, selectedId, onSelect, theme }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const currentTheme = theme || THEMES.dark;

    useEffect(() => {
        if (selectedId) {
            const client = clients.find(c => c.id === selectedId);
            if (client && search !== client.nome_projeto) {
                setSearch(client.nome_projeto);
            }
        } else {
            if (search !== '') setSearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, clients]);

    const filteredClients = clients.filter(c =>
        c.nome_projeto.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (client) => {
        onSelect(client);
        setSearch(client.nome_projeto);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect(null);
        setSearch('');
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setIsOpen(true); if (e.target.value === '') onSelect(null); }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Digite o nome ou ID..."
                    className="pr-8"
                    theme={currentTheme}
                />
                {selectedId && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${currentTheme.muted} hover:text-red-400`}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className={`absolute z-[70] w-full mt-1 ${currentTheme.cardBg} border ${currentTheme.border} rounded-md shadow-2xl max-h-60 overflow-auto`}>
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    className={`p-3 hover:${currentTheme.inputBg} cursor-pointer border-b ${currentTheme.border} last:border-0 flex justify-between items-center group`}
                                    onClick={() => handleSelect(client)}
                                >
                                    <div>
                                        <div className={`font-medium ${currentTheme.text}`}>{client.nome_projeto}</div>
                                        <div className={`text-xs ${currentTheme.muted}`}>ID: {client.id.slice(0, 6)}...</div>
                                    </div>
                                    <Badge variant={client.tipo === 'dominio' ? 'blue' : 'orange'} className="text-[10px]">
                                        {client.tipo === 'dominio' ? 'Domínio' : 'Tráfego'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className={`p-3 text-sm ${currentTheme.muted} text-center`}>
                                {search ? "Nenhum cliente encontrado." : "Digite para buscar..."}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Modal/Dialog
const Dialog = ({ open, onClose, children, theme }) => {
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
                        <button onClick={onClose} className={`absolute top-4 right-4 ${currentTheme.muted} hover:${currentTheme.text} transition-colors`}><X size={20} /></button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- 3. TELA DE LOGIN ---
const AuthScreen = ({ onLogin, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const theme = THEMES.dark;

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password, isRegister);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl border-gray-800 bg-gray-900" theme={theme}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-4 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                        <Flame className="w-10 h-10 fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Ascend</h1>
                    <p className="text-gray-400 mt-2">Eleve a gestão dos seus projetos.</p>
                </div>
                {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300 flex gap-2"><AlertCircle size={16} />{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div><Label theme={theme}>E-mail</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><Input theme={theme} type="email" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
                    <div><Label theme={theme}>Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><Input theme={theme} type="password" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={password} onChange={(e) => setPassword(e.target.value)} required /></div></div>
                    <Button theme={theme} type="submit" className="w-full py-3 font-bold text-lg" disabled={loading}>{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegister ? 'Criar Conta' : 'Entrar')}</Button>
                </form>
                <div className="mt-6 text-center">
                    <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                        {isRegister ? 'Já tem conta? Entrar' : 'Primeiro acesso? Registar (Se tiver convite)'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

// --- 4. COMPONENTES DE NAVEGAÇÃO ---

const AppLayout = ({ children, activeTab, setActiveTab, user, userData, onLogout, notifications = [], currentTheme }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    const navItems = useMemo(() => {
        const items = [
            { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, permission: 'dashboard' },
            { id: 'transactions', label: 'Financeiro', icon: DollarSign, permission: 'financeiro' },
            { id: 'clients', label: 'Clientes', icon: Users, permission: 'clientes' },
            { id: 'tasks', label: 'Tarefas', icon: ListTodo, permission: 'tarefas' },
        ];

        if (userData?.role === 'admin') {
            items.push({ id: 'team', label: 'Gestão Equipa', icon: Shield, permission: 'admin' });
            items.push({ id: 'settings', label: 'Configurações', icon: Settings, permission: 'admin' });
            return items;
        }

        const permissions = userData?.permissions || {};
        return items.filter(item => item.id === 'dashboard' || permissions[item.permission]);
    }, [userData]);

    useEffect(() => {
        document.title = `Ascend | ${navItems.find(item => item.id === activeTab)?.label || 'Gestão'}`;
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/svg+xml';
        link.rel = 'icon';
        link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23f97316%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z%22/></svg>`;
        document.getElementsByTagName('head')[0].appendChild(link);
    }, [activeTab, navItems]);

    return (
        <div className={`min-h-screen ${currentTheme.bg} font-sans ${currentTheme.text} flex flex-col md:flex-row`}>
            {/* Sidebar */}
            <aside className={`hidden md:flex flex-col w-64 ${currentTheme.sidebarBg} border-r ${currentTheme.sidebarBorder} h-screen sticky top-0`}>
                <div className={`p-6 flex items-center gap-3 border-b ${currentTheme.sidebarBorder}`}>
                    <div className={`p-2 rounded-lg shadow-lg ${currentTheme.primary.replace('bg-', 'bg-opacity-20 bg-')}`}>
                        <Flame className={`w-6 h-6 ${currentTheme.primaryText}`} />
                    </div>
                    <span className={`text-2xl font-bold tracking-tight ${currentTheme.text}`}>Ascend</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === item.id ? `${currentTheme.primary.replace('bg-', 'bg-opacity-10 bg-')} ${currentTheme.primaryText} border ${currentTheme.border}` : `${currentTheme.muted} hover:${currentTheme.inputBg} hover:${currentTheme.text}`}`}>
                            <item.icon className="w-5 h-5" /> {item.label}
                        </button>
                    ))}
                </nav>
                <div className={`p-4 border-t ${currentTheme.sidebarBorder}`}>
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className={`w-10 h-10 rounded-full ${currentTheme.cardBg} border ${currentTheme.border} flex items-center justify-center ${currentTheme.primaryText} font-bold uppercase shadow-sm`}>{user?.email?.[0] || 'U'}</div>
                        <div className="flex-1 min-w-0 overflow-hidden"><p className={`text-sm font-medium truncate ${currentTheme.text}`}>{user?.email}</p><p className={`text-xs ${currentTheme.muted} capitalize`}>{userData?.role || 'Gestor'}</p></div>
                        <Button variant="ghost" size="icon" onClick={onLogout} className={`${currentTheme.muted} hover:${currentTheme.danger}`}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className={`md:hidden ${currentTheme.sidebarBg} border-b ${currentTheme.sidebarBorder} p-4 flex justify-between items-center sticky top-0 z-20`}>
                <div className="flex items-center gap-2"><Flame className={`w-6 h-6 ${currentTheme.primaryText}`} /><span className={`font-bold text-lg ${currentTheme.text}`}>Ascend</span></div>
                <Button variant="ghost" onClick={onLogout} className={`${currentTheme.muted} hover:${currentTheme.text}`}><LogOut className="w-5 h-5" /></Button>
            </div>

            {/* Mobile Nav */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 ${currentTheme.sidebarBg} border-t ${currentTheme.sidebarBorder} flex justify-around p-2 z-50`}>
                {navItems.slice(0, 4).map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === item.id ? currentTheme.primaryText : currentTheme.muted}`}>
                        <item.icon className="w-6 h-6" /> <span className="text-[10px] mt-1">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8 relative">
                {/* Top Bar with Notifications */}
                <div className="flex justify-end mb-8">
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 ${currentTheme.cardBg} rounded-full shadow-sm border ${currentTheme.border} hover:${currentTheme.inputBg} relative transition-colors`}>
                            <Bell className={`w-5 h-5 ${currentTheme.muted}`} />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800 animate-pulse"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className={`absolute right-0 mt-2 w-80 ${currentTheme.cardBg} rounded-xl shadow-2xl border ${currentTheme.border} z-50 overflow-hidden`}>
                                <div className={`p-3 border-b ${currentTheme.border} ${currentTheme.headerBg} font-medium text-sm ${currentTheme.text.replace('text-white', 'text-gray-300')}`}>Notificações</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className={`p-4 text-center ${currentTheme.muted} text-sm`}>Sem notificações novas.</div>
                                    ) : (
                                        notifications.map((note, idx) => (
                                            <div key={idx} className={`p-3 border-b ${currentTheme.border} hover:${currentTheme.inputBg} last:border-0 transition-colors`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-red-500/10 p-1.5 rounded-full">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${currentTheme.text}`}>{note.title}</p>
                                                        <p className={`text-xs ${currentTheme.muted} mt-0.5`}>{note.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        {showNotifications && <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />}
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
};

// --- 5. COMPONENTES DE DADOS ---

const StatsCard = ({ title, value, icon: IconComponent, color, trend, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className={`p-6 relative overflow-hidden hover:border-orange-500/30 transition-all group`} theme={currentTheme}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')} opacity-5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`} />
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className={`text-xs font-bold ${currentTheme.muted} uppercase tracking-widest`}>{title}</p>
                        <p className={`text-3xl font-bold ${currentTheme.text} mt-2`}>{value}</p>
                        {trend && <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${trend.positive ? currentTheme.success : currentTheme.danger}`}><span>{trend.positive ? '↑' : '↓'}</span> {trend.text}</div>}
                    </div>
                    <div className={`p-3 ${currentTheme.iconBg} border ${currentTheme.border} rounded-xl shadow-lg`}><IconComponent className={`w-6 h-6 ${color}`} /></div>
                </div>
            </Card>
        </motion.div>
    );
};

const BalanceCard = ({ summary, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <Card className="h-[350px] flex flex-col relative overflow-hidden" theme={currentTheme}>
            <div className={`p-6 border-b ${currentTheme.border} ${currentTheme.headerBg} flex justify-between items-center`}>
                <h3 className={`font-bold ${currentTheme.text} text-lg`}>Resumo</h3>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center items-center gap-6 relative z-10">
                <div className="text-center">
                    <p className={`text-sm ${currentTheme.muted} uppercase tracking-wide mb-2`}>Saldo Atual</p>
                    <p className={`text-5xl font-bold ${summary.saldo >= 0 ? currentTheme.primaryText : currentTheme.danger}`}>
                        {formatCurrency(summary.saldo)}
                    </p>
                </div>

                <div className="w-full space-y-2">
                    <div className={`w-full h-4 ${currentTheme.inputBg} rounded-full overflow-hidden relative border ${currentTheme.border}`}>
                        <div className={`h-full ${currentTheme.primary}`} style={{ width: '70%' }} />
                        <div className={`absolute top-0 h-full w-1 ${currentTheme.cardBg}`} style={{ left: '70%' }} />
                    </div>
                    <div className={`flex justify-between w-full text-xs ${currentTheme.muted} font-medium uppercase tracking-wider`}>
                        <span>Entradas</span>
                        <span>Saídas</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

const TransactionList = ({ transactions, onEdit, onDelete, onToggleStatus, theme, limit }) => {
    const currentTheme = theme || THEMES.dark;
    const displayList = limit ? transactions.slice(0, limit) : transactions;

    if (displayList.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><DollarSign className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhuma transação encontrada.</p></div>;

    return (
        <div className="space-y-3">
            {displayList.map((t) => {
                const isCompleted = ['pago', 'recebido'].includes(t.status);
                return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                        <div className={`${currentTheme.cardBg} p-4 rounded-xl border ${currentTheme.border} hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${currentTheme.iconBg} border ${currentTheme.border}`}>{t.type === 'receita' ? <TrendingUp size={20} className={currentTheme.success} /> : <TrendingDown size={20} className={currentTheme.danger} />}</div>
                                <div>
                                    <p className={`font-bold ${currentTheme.text}`}>{t.description}</p>
                                    <div className={`flex flex-wrap items-center gap-2 text-xs ${currentTheme.muted} mt-1`}>
                                        <span>{format(safeDate(t.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                                        {t.clientName && <span className={`px-2 py-0.5 ${currentTheme.inputBg} ${currentTheme.primaryText} rounded flex items-center gap-1 border ${currentTheme.border}`}><User size={10} /> {t.clientName}</span>}
                                        <Badge
                                            variant={t.status === 'pago' || t.status === 'recebido' ? 'success' : t.isOverdue ? 'danger' : 'warning'}
                                            className="capitalize"
                                        >
                                            {['pago', 'recebido'].includes(t.status) ? 'Baixado' : t.isOverdue && t.status !== 'cancelado' ? 'Atrasado' : t.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                                <span className={`font-bold text-lg ${t.type === 'receita' ? currentTheme.success : currentTheme.danger}`}>{t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}</span>
                                <div className="flex gap-2 items-center">
                                    {onToggleStatus && (
                                        <button
                                            onClick={() => onToggleStatus(t)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm ${isCompleted
                                                    ? `bg-gray-600 text-white hover:bg-gray-700 border border-gray-500` // Botão Estornar (Cinza/Neutro)
                                                    : `bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-500` // Botão Baixar (Verde)
                                                }`}
                                            title={isCompleted ? "Clique para estornar" : "Clique para baixar"}
                                        >
                                            {isCompleted ? (
                                                <> <RotateCcw size={16} /> Estornar </>
                                            ) : (
                                                <> <CheckCircle size={16} /> Baixar </>
                                            )}
                                        </button>
                                    )}
                                    <div className="flex gap-1 ml-2">
                                        <Button variant="ghost" onClick={() => onEdit(t)} className="h-9 w-9 p-0" theme={currentTheme}><Pencil size={18} /></Button>
                                        <Button variant="ghost" onClick={() => onDelete(t.id, 'transactions')} className={`h-9 w-9 p-0 ${currentTheme.danger}`} theme={currentTheme}><Trash2 size={18} /></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    );
};

const ClientTable = ({ clients, onEdit, onDelete, theme, onUpdate }) => {
    const [visibleColumns, setVisibleColumns] = useState({ projeto: true, gestor: true, nicho: true, prioridade: true, metaAds: true, googleAds: true, status: true, acoes: true });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const currentTheme = theme || THEMES.dark;

    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    if (clients.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><Users className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhum cliente registado.</p></div>;
    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border}`}>
            <div className={`p-4 border-b ${currentTheme.border} flex justify-between items-center ${currentTheme.headerBg} rounded-t-xl`}>
                <h3 className={`font-semibold ${currentTheme.text}`}>Clientes Ativos ({clients.length})</h3>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className={`bg-gray-800 ${currentTheme.border} text-gray-300 hover:bg-gray-700`}><Settings size={14} /> Colunas</Button>
                    {showColumnSelector && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                            <div className={`absolute right-0 mt-2 w-48 ${currentTheme.cardBg} rounded-lg shadow-xl border ${currentTheme.border} z-20 p-2`}>
                                {Object.keys(visibleColumns).map(col => (<label key={col} className={`flex items-center px-2 py-1.5 hover:${currentTheme.inputBg} rounded cursor-pointer text-sm ${currentTheme.muted}`}><input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className={`mr-2 rounded ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.primaryText} focus:ring-1`} /><span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span></label>))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full text-sm text-left">
                    <thead className={`${currentTheme.headerBg} ${currentTheme.muted} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}>
                        <tr>
                            {visibleColumns.projeto && <th className="px-6 py-4">Projeto / Cliente</th>}
                            {visibleColumns.gestor && <th className="px-6 py-4">Gestor</th>}
                            {visibleColumns.nicho && <th className="px-6 py-4">Nicho / Tipo</th>}
                            {visibleColumns.prioridade && <th className="px-6 py-4 text-center">Prioridade</th>}
                            {visibleColumns.metaAds && <th className="px-6 py-4 text-center">Meta Ads</th>}
                            {visibleColumns.googleAds && <th className="px-6 py-4 text-center">Google Ads</th>}
                            {visibleColumns.status && <th className="px-6 py-4 text-center">Status</th>}
                            {visibleColumns.acoes && <th className="px-6 py-4 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                        {clients.map((client) => (
                            <tr key={client.id} className={`hover:${currentTheme.inputBg} transition-colors`}>
                                {visibleColumns.projeto && <td className={`px-6 py-4 font-medium ${currentTheme.text}`}><div className="flex flex-col"><span className="text-base font-bold">{client.nome_projeto}</span><span className={`text-xs ${currentTheme.muted} font-mono`}>ID: {client.id.slice(0, 8)}</span></div></td>}

                                {/* EDITABLE GESTOR */}
                                {visibleColumns.gestor && <td className={`px-6 py-4 ${currentTheme.muted}`}>
                                    <input
                                        type="text"
                                        defaultValue={client.gestor || ''}
                                        onBlur={(e) => onUpdate(client.id, 'gestor', e.target.value)}
                                        className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-orange-500 outline-none w-full transition-colors"
                                        placeholder="-"
                                    />
                                </td>}

                                {/* EDITABLE NICHO */}
                                {visibleColumns.nicho && <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {client.tipo === 'dominio' ? <Globe size={16} className={currentTheme.success} /> : <TrendingUp size={16} className={currentTheme.primaryText} />}
                                        <input
                                            type="text"
                                            defaultValue={client.nicho || (client.tipo === 'dominio' ? 'Hospedagem' : 'Tráfego')}
                                            onBlur={(e) => onUpdate(client.id, 'nicho', e.target.value)}
                                            className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-orange-500 outline-none w-full transition-colors"
                                        />
                                    </div>
                                </td>}

                                {/* EDITABLE PRIORITY */}
                                {visibleColumns.prioridade && <td className="px-6 py-4 text-center">
                                    <div className="relative inline-block">
                                        <select
                                            value={client.prioridade}
                                            onChange={(e) => onUpdate(client.id, 'prioridade', e.target.value)}
                                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium cursor-pointer outline-none border text-center transition-all
                          ${client.prioridade === 'alta' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' :
                                                    client.prioridade === 'media' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'}
                        `}
                                        >
                                            <option value="alta" className="bg-gray-900 text-white">Alta</option>
                                            <option value="media" className="bg-gray-900 text-white">Média</option>
                                            <option value="baixa" className="bg-gray-900 text-white">Baixa</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                </td>}

                                {/* EDITABLE BUDGETS */}
                                {visibleColumns.metaAds && <td className="px-6 py-4 text-center">
                                    {client.link_meta_ads ? <a href={client.link_meta_ads} target="_blank" rel="noreferrer" className={`${currentTheme.success} hover:underline flex items-center justify-center gap-1`}><ExternalLink size={14} /> Abrir</a> : <span className={currentTheme.muted}>-</span>}
                                    <div className={`text-xs ${currentTheme.muted} mt-1`}>
                                        <input
                                            type="number"
                                            defaultValue={client.orcamento_facebook || ''}
                                            onBlur={(e) => onUpdate(client.id, 'orcamento_facebook', parseFloat(e.target.value))}
                                            className="bg-transparent text-center w-20 border-b border-transparent hover:border-gray-500 focus:border-orange-500 outline-none"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                </td>}

                                {visibleColumns.googleAds && <td className="px-6 py-4 text-center">
                                    {client.link_google_ads ? <a href={client.link_google_ads} target="_blank" rel="noreferrer" className={`${currentTheme.success} hover:underline flex items-center justify-center gap-1`}><ExternalLink size={14} /> Abrir</a> : <span className={currentTheme.muted}>-</span>}
                                    <div className={`text-xs ${currentTheme.muted} mt-1`}>
                                        <input
                                            type="number"
                                            defaultValue={client.orcamento_google || ''}
                                            onBlur={(e) => onUpdate(client.id, 'orcamento_google', parseFloat(e.target.value))}
                                            className="bg-transparent text-center w-20 border-b border-transparent hover:border-gray-500 focus:border-orange-500 outline-none"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                </td>}

                                {/* EDITABLE STATUS */}
                                {visibleColumns.status && <td className="px-6 py-4 text-center">
                                    <div className="relative inline-block">
                                        <select
                                            value={client.status}
                                            onChange={(e) => onUpdate(client.id, 'status', e.target.value)}
                                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium cursor-pointer outline-none border text-center transition-all
                          ${client.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'}
                        `}
                                        >
                                            <option value="ativo" className="bg-gray-900 text-white">Ativo</option>
                                            <option value="inativo" className="bg-gray-900 text-white">Inativo</option>
                                            <option value="aguardando" className="bg-gray-900 text-white">Aguardando</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                </td>}

                                {visibleColumns.acoes && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(client)} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.primaryText} rounded transition-colors`}><Pencil size={16} /></button><button onClick={() => onDelete(client.id, 'clients')} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.danger} rounded transition-colors`}><Trash2 size={16} /></button></div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TaskTable = ({ tasks, onEdit, onDelete, theme }) => {
    const [visibleColumns, setVisibleColumns] = useState({ tarefa: true, cliente: true, data: true, prioridade: true, status: true, acoes: true });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const currentTheme = theme || THEMES.dark;

    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    // Lista de colunas disponíveis para o seletor
    const columnOptions = [
        { key: 'tarefa', label: 'Tarefa' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'data', label: 'Data Entrega' },
        { key: 'prioridade', label: 'Prioridade' },
        { key: 'status', label: 'Status' },
        { key: 'acoes', label: 'Ações' }
    ];

    if (tasks.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><CheckSquare className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhuma tarefa pendente.</p></div>;

    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border}`}>
            <div className={`p-4 border-b ${currentTheme.border} flex justify-between items-center ${currentTheme.headerBg} rounded-t-xl`}>
                <h3 className={`font-semibold ${currentTheme.text}`}>Tarefas ({tasks.length})</h3>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className={`bg-gray-800 ${currentTheme.border} text-gray-300 hover:bg-gray-700`}><Settings size={14} /> Colunas</Button>
                    {showColumnSelector && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                            <div className={`absolute right-0 mt-2 w-48 ${currentTheme.cardBg} rounded-lg shadow-xl border ${currentTheme.border} z-20 p-2`}>
                                <div className={`text-xs font-semibold ${currentTheme.muted} mb-2 px-2`}>Selecionar Colunas</div>
                                {columnOptions.map(col => (
                                    <label key={col.key} className={`flex items-center px-2 py-1.5 hover:${currentTheme.inputBg} rounded cursor-pointer text-sm ${currentTheme.text}`}>
                                        <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)} className={`mr-2 rounded ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.primaryText}`} />
                                        <span>{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full text-sm text-left">
                    <thead className={`bg-gray-900 ${currentTheme.placeholder} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}>
                        <tr>
                            {visibleColumns.tarefa && <th className="px-6 py-4">Tarefa</th>}
                            {visibleColumns.cliente && <th className="px-6 py-4">Cliente</th>}
                            {visibleColumns.data && <th className="px-6 py-4">Entrega</th>}
                            {visibleColumns.prioridade && <th className="px-6 py-4 text-center">Prioridade</th>}
                            {visibleColumns.status && <th className="px-6 py-4 text-center">Status</th>}
                            {visibleColumns.acoes && <th className="px-6 py-4 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text.replace('text-white', 'text-gray-300')}`}>
                        {tasks.map((task) => (
                            <tr key={task.id} className={`hover:${currentTheme.inputBg} transition-colors`}>
                                {visibleColumns.tarefa && <td className={`px-6 py-4 font-medium ${task.status === 'concluida' ? `${currentTheme.muted} line-through` : currentTheme.text}`}>{task.titulo}</td>}
                                {visibleColumns.cliente && <td className={`px-6 py-4 ${currentTheme.muted} flex items-center gap-2`}><Briefcase size={14} /> {task.cliente_nome || '-'}</td>}
                                {visibleColumns.data && <td className={`px-6 py-4 ${currentTheme.muted}`}><div className="flex items-center gap-2"><Calendar size={14} /> {task.data_entrega ? format(safeDate(task.data_entrega), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div></td>}
                                {visibleColumns.prioridade && <td className="px-6 py-4 text-center"><Badge variant={task.prioridade === 'urgente' ? 'danger' : task.prioridade === 'alta' ? 'warning' : 'blue'}>{task.prioridade}</Badge></td>}
                                {visibleColumns.status && <td className="px-6 py-4 text-center"><Badge variant={task.status === 'concluida' ? 'success' : task.prioridade === 'urgente' ? 'danger' : 'gray'}>{task.status}</Badge></td>}
                                {visibleColumns.acoes && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(task)} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.primaryText} rounded transition-colors`}><Pencil size={16} /></button><button onClick={() => onDelete(task.id, 'tasks')} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.danger} rounded transition-colors`}><Trash2 size={16} /></button></div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 7. PAINEL DE UTILIZADORES (TEAMVIEW) ---
const TeamView = ({ users, onAdd, onDelete, currentUserId, theme }) => {
    const currentTheme = theme || THEMES.dark;
    if (users.length === 0) return <div className={`text-center py-12 ${currentTheme.muted}`}><p>Sem membros na equipa.</p></div>;
    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border}`}>
            <div className={`p-4 border-b ${currentTheme.border} ${currentTheme.headerBg} flex justify-between items-center rounded-t-xl`}>
                <h3 className={`font-semibold ${currentTheme.text}`}>Membros da Equipa ({users.length})</h3>
                {/* Botão Removido para evitar duplicidade */}
            </div>
            <table className="w-full text-sm text-left rounded-b-xl">
                <thead className={`bg-gray-900 ${currentTheme.placeholder} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}>
                    <tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4 text-center">Função</th><th className="px-6 py-4">Permissões</th><th className="px-6 py-4 text-right">Ações</th></tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                    {users.map(u => (<tr key={u.email} className={`hover:${currentTheme.inputBg}`}><td className={`px-6 py-4 font-medium ${currentTheme.text}`}>{u.name}</td><td className={`px-6 py-4 ${currentTheme.muted}`}>{u.email}</td><td className="px-6 py-4 text-center"><Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td><td className="px-6 py-4"><div className="flex flex-wrap gap-1">{u.role === 'admin' ? <Badge variant="purple">Acesso Total</Badge> : Object.entries(u.permissions || {}).filter(([, v]) => v).map(([k]) => (<Badge key={k} className="text-[10px] capitalize">{k}</Badge>))}</div></td><td className="px-6 py-4 text-right">{u.email !== auth.currentUser?.email && <button onClick={() => onDelete(u.email, 'team_members')} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.danger} rounded`}><Trash2 size={16} /></button>}</td></tr>))}
                </tbody>
            </table>
        </div>
    );
};

// --- 8. FORMULÁRIO GENÉRICO ---

// Definições de estado inicial
const DEFAULT_TRANSACTION = { type: 'despesa', category: 'outras', date: new Date().toISOString().substring(0, 10), status: 'pendente', amount: '' };
const DEFAULT_CLIENT = { tipo: 'trafego', status: 'ativo', prioridade: 'media', orcamento_facebook: '', orcamento_google: '' };
const DEFAULT_TASK = { status: 'pendente', prioridade: 'media', data_entrega: new Date().toISOString().substring(0, 10) };
const DEFAULT_USER = { role: 'gestor', permissions: { dashboard: true, financeiro: false, clientes: true, tarefas: true } };

const GenericForm = ({ type, initialData, onSubmit, onCancel, clients = [], theme }) => {
    const [formData, setFormData] = useState(initialData || (type === 'transactions' ? DEFAULT_TRANSACTION : type === 'clients' ? DEFAULT_CLIENT : type === 'users' ? DEFAULT_USER : DEFAULT_TASK));
    const [keepOpen, setKeepOpen] = useState(false);
    const currentTheme = theme || THEMES.dark;

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name.startsWith('perm_')) {
            const permName = name.replace('perm_', '');
            setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [permName]: checked } }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData, keepOpen);
        if (keepOpen && !initialData) {
            setFormData(type === 'transactions' ? DEFAULT_TRANSACTION : type === 'clients' ? DEFAULT_CLIENT : type === 'users' ? DEFAULT_USER : DEFAULT_TASK);
        }
    };

    // FORM DE UTILIZADOR (USERS)
    if (type === 'users') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label theme={currentTheme}>Nome do Gestor</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required theme={currentTheme} /></div>
                <div><Label theme={currentTheme}>Email (Login)</Label><Input name="email" type="email" value={formData.email || ''} onChange={handleChange} required theme={currentTheme} /></div>

                <div><Label theme={currentTheme}>Função</Label><Select name="role" value={formData.role} onChange={handleChange} theme={currentTheme}><option value="gestor">Gestor</option><option value="admin">Administrador</option></Select></div>

                {formData.role !== 'admin' && (
                    <div className={`p-3 rounded border ${currentTheme.border} ${currentTheme.inputBg}`}>
                        <Label theme={currentTheme}>Permissões de Acesso</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {['dashboard', 'financeiro', 'clientes', 'tarefas'].map(p => (
                                <label key={p} className={`flex items-center gap-2 text-sm ${currentTheme.text} cursor-pointer`}>
                                    <input type="checkbox" name={`perm_${p}`} checked={formData.permissions?.[p]} onChange={handleChange} className="rounded text-orange-500 focus:ring-orange-500" />
                                    <span className="capitalize">{p}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className={`p-3 rounded border ${currentTheme.border} bg-blue-500/10 text-xs ${currentTheme.muted}`}>
                    <p>O utilizador deverá criar conta com este email para ter acesso.</p>
                </div>

                <div className={`flex justify-end gap-3 pt-6 mt-4 border-t ${currentTheme.border}`}><Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button><Button type="submit" theme={currentTheme}>Salvar Permissões</Button></div>
            </form>
        );
    }

    // FORM DE TRANSAÇÃO
    if (type === 'transactions') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label theme={currentTheme}>Tipo</Label><Select name="type" value={formData.type || 'despesa'} onChange={handleChange} theme={currentTheme}><option value="receita">Receita</option><option value="despesa">Despesa</option></Select></div>
                    <div><Label theme={currentTheme}>Valor</Label><Input name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} required placeholder="0,00" theme={currentTheme} /></div>
                </div>
                <div><Label theme={currentTheme}>Vincular Cliente (Opcional)</Label><ClientSearchInput clients={clients} selectedId={formData.clientId} onSelect={(client) => setFormData({ ...formData, clientId: client?.id || '', clientName: client?.nome_projeto || '' })} theme={currentTheme} /></div>
                <div><Label theme={currentTheme}>Descrição</Label><Input name="description" value={formData.description || ''} onChange={handleChange} required theme={currentTheme} /></div>
                <div><Label theme={currentTheme}>Categoria</Label><Select name="category" value={formData.category || 'outras'} onChange={handleChange} theme={currentTheme}><option value="vendas">Vendas</option><option value="servicos">Serviços</option><option value="marketing">Marketing</option><option value="outras">Outras</option></Select></div>
                <div><Label theme={currentTheme}>Data</Label><Input name="date" type="date" value={formData.date || new Date().toISOString().split('T')[0]} onChange={handleChange} theme={currentTheme} /></div>
                <div className={`flex justify-between items-center pt-6 mt-4 border-t ${currentTheme.border}`}>
                    {!initialData && <label className={`flex items-center gap-2 text-sm ${currentTheme.muted} cursor-pointer`}><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button><Button type="submit" theme={currentTheme}>Salvar</Button></div>
                </div>
            </form>
        );
    }

    // FORM DE CLIENTE
    if (type === 'clients') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label theme={currentTheme}>Tipo de Cliente</Label><Select name="type" value={formData.type || 'trafego'} onChange={handleChange} theme={currentTheme}><option value="trafego">Tráfego Pago</option><option value="dominio">Domínio / Hospedagem</option></Select></div>
                    <div><Label theme={currentTheme}>Status</Label><Select name="status" value={formData.status || 'ativo'} onChange={handleChange} theme={currentTheme}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></div>
                </div>
                <div><Label theme={currentTheme}>Nome do Projeto / Cliente</Label><Input name="nome_projeto" value={formData.nome_projeto || ''} onChange={handleChange} required placeholder="Ex: Empresa X" theme={currentTheme} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label theme={currentTheme}>Gestor</Label><Input name="gestor" value={formData.gestor || ''} onChange={handleChange} theme={currentTheme} /></div>
                    <div><Label theme={currentTheme}>Nicho</Label><Input name="nicho" value={formData.nicho || ''} onChange={handleChange} theme={currentTheme} /></div>
                </div>
                {formData.tipo === 'trafego' ? (
                    <>
                        <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg border ${currentTheme.border} ${currentTheme.inputBg}`}>
                            <div><Label theme={currentTheme}>Orçamento FB (R$)</Label><Input name="orcamento_facebook" type="number" value={formData.orcamento_facebook || ''} onChange={handleChange} theme={currentTheme} /></div>
                            <div><Label theme={currentTheme}>Link Meta Ads</Label><Input name="link_meta_ads" value={formData.link_meta_ads || ''} onChange={handleChange} placeholder="https://..." theme={currentTheme} /></div>
                        </div>
                        <div className={`grid grid-cols-2 gap-4 p-3 rounded-lg border ${currentTheme.border} ${currentTheme.inputBg}`}>
                            <div><Label theme={currentTheme}>Orçamento Google (R$)</Label><Input name="orcamento_google" type="number" value={formData.orcamento_google || ''} onChange={handleChange} theme={currentTheme} /></div>
                            <div><Label theme={currentTheme}>Link Google Ads</Label><Input name="link_google_ads" value={formData.link_google_ads || ''} onChange={handleChange} placeholder="https://..." theme={currentTheme} /></div>
                        </div>
                    </>
                ) : (
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
                        <Label theme={currentTheme}>Data Vencimento Domínio</Label>
                        <Input name="data_vencimento_dominio" type="date" value={formData.data_vencimento_dominio || ''} onChange={handleChange} theme={currentTheme} />
                    </div>
                )}
                <div><Label theme={currentTheme}>Prioridade</Label><Select name="prioridade" value={formData.prioridade || 'media'} onChange={handleChange} theme={currentTheme}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></Select></div>
                <div className={`flex justify-between items-center pt-6 mt-4 border-t ${currentTheme.border}`}>
                    {!initialData && <label className={`flex items-center gap-2 text-sm ${currentTheme.muted} cursor-pointer`}><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button><Button type="submit" theme={currentTheme}>Salvar</Button></div>
                </div>
            </form>
        );
    }

    // FORM DE TAREFA
    if (type === 'tasks') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label theme={currentTheme}>Título da Tarefa</Label><Input name="titulo" value={formData.titulo || ''} onChange={handleChange} required theme={currentTheme} /></div>
                <div><Label theme={currentTheme}>Cliente / Projeto</Label><ClientSearchInput clients={clients} selectedId={formData.cliente_id} onSelect={(client) => setFormData({ ...formData, cliente_id: client?.id || '', cliente_nome: client?.nome_projeto || '' })} theme={currentTheme} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label theme={currentTheme}>Data Entrega</Label><Input name="data_entrega" type="date" value={formData.data_entrega ? formData.data_entrega.split('T')[0] : ''} onChange={handleChange} theme={currentTheme} /></div>
                    <div><Label theme={currentTheme}>Prioridade</Label><Select name="prioridade" value={formData.prioridade || 'media'} onChange={handleChange} theme={currentTheme}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></Select></div>
                </div>
                <div><Label theme={currentTheme}>Status</Label><Select name="status" value={formData.status || 'pendente'} onChange={handleChange} theme={currentTheme}><option value="pendente">Pendente</option><option value="em_andamento">Em Andamento</option><option value="concluida">Concluída</option></Select></div>
                <div className={`flex justify-between items-center pt-6 mt-4 border-t ${currentTheme.border}`}>
                    {!initialData && <label className={`flex items-center gap-2 text-sm ${currentTheme.muted} cursor-pointer`}><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button><Button type="submit" theme={currentTheme}>Salvar</Button></div>
                </div>
            </form>
        );
    }

    return null;
};

// --- 9. VIEWS (Páginas) ---

const DashboardView = ({ summary, transactions, tasks, onAdd, onEdit, onDelete, onMarkAsPaid, theme }) => {
    const taskSummary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'concluida').length;
        const pending = tasks.filter(t => t.status === 'pendente' || t.status === 'em_andamento').length;
        const overdue = tasks.filter(t => (t.status === 'pendente' || t.status === 'em_andamento') && isBefore(safeDate(t.data_entrega), startOfDay(new Date()))).length;
        return { total, completed, pending, overdue };
    }, [tasks]);
    const currentTheme = theme || THEMES.dark;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className={`text-3xl font-bold ${currentTheme.text}`}>Dashboard</h1><p className={`${currentTheme.muted} mt-1`}>Visão geral da sua operação.</p></div>
                <Button onClick={() => onAdd('transactions')} theme={currentTheme}><Plus className="w-5 h-5 mr-2" /> Nova Transação</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Receitas" value={formatCurrency(summary.rec)} icon={TrendingUp} color="text-emerald-400" trend={{ positive: true, text: "Entradas" }} theme={currentTheme} />
                <StatsCard title="Despesas" value={formatCurrency(summary.desp)} icon={TrendingDown} color="text-red-400" trend={{ positive: false, text: "Saídas" }} theme={currentTheme} />
                <StatsCard title="Saldo" value={formatCurrency(summary.saldo)} icon={PiggyBank} color="text-orange-400" trend={{ positive: summary.saldo >= 0, text: "Líquido" }} theme={currentTheme} />
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <StatsCard title="Total Tarefas" value={taskSummary.total} icon={ListTodo} color="text-blue-400" theme={currentTheme} />
                <StatsCard title="Pendentes" value={taskSummary.pending} icon={Hourglass} color="text-amber-400" theme={currentTheme} />
                <StatsCard title="Concluídas" value={taskSummary.completed} icon={CheckSquare} color="text-emerald-400" trend={{ positive: true, text: `De ${taskSummary.total} Total` }} theme={currentTheme} />
                <StatsCard title="Atrasadas" value={taskSummary.overdue} icon={AlertTriangle} color="text-red-400" trend={{ positive: false, text: "Urgente" }} theme={currentTheme} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-[350px] flex flex-col" theme={currentTheme}><div className={`p-6 border-b ${currentTheme.border} ${currentTheme.cardBg}/50`}><h3 className={`font-bold ${currentTheme.text}`}>Fluxo Financeiro</h3></div><div className="flex-1 p-4 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Atual', receitas: summary.rec, despesas: summary.desp }]}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={currentTheme.label === 'Claro' ? '#e5e7eb' : '#374151'} /><XAxis dataKey="name" axisLine={false} tickLine={false} stroke={currentTheme.label === 'Claro' ? '#374151' : '#9CA3AF'} /><YAxis axisLine={false} tickLine={false} stroke={currentTheme.label === 'Claro' ? '#374151' : '#9CA3AF'} tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v)} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} cursor={{ fill: '#374151' }} /><Legend iconType="circle" wrapperStyle={{ color: '#9CA3AF' }} /><Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={60} /><Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={60} /></BarChart></ResponsiveContainer></div></Card>
                </div>
                <div className="lg:col-span-1">
                    <BalanceCard summary={summary} theme={currentTheme} />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${currentTheme.text}`}>Últimas Movimentações</h2>
                </div>
                <TransactionList
                    transactions={transactions}
                    limit={5}
                    onEdit={(item) => onEdit('transactions', item)}
                    onDelete={onDelete}
                    onToggleStatus={onMarkAsPaid}
                    theme={currentTheme}
                />
            </div>
        </div>
    );
};

const ClientsView = ({ clients, onAdd, onEdit, onDelete, theme, onUpdate }) => (
    <div className="space-y-6 max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><h1 className={`text-3xl font-bold ${theme.text}`}>Gestão de Clientes</h1><p className={`${theme.muted} mt-1`}>Controle seus projetos de tráfego e domínios.</p></div>
            <Button onClick={onAdd} theme={theme}><Plus className="w-5 h-5 mr-2" /> Criar Projeto</Button>
        </div>
        <ClientTable clients={clients} onEdit={onEdit} onDelete={onDelete} theme={theme} onUpdate={onUpdate} />
    </div>
);

const TasksView = ({ tasks, onAdd, onEdit, onDelete, theme }) => (
    <div className="space-y-6 max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><h1 className={`text-3xl font-bold ${theme.text}`}>Gestão de Tarefas</h1><p className={`${theme.muted} mt-1`}>Acompanhe suas entregas e prazos.</p></div>
            <Button onClick={onAdd} theme={theme}><Plus className="w-5 h-5 mr-2" /> Nova Tarefa</Button>
        </div>
        <TaskTable tasks={tasks} onEdit={onEdit} onDelete={onDelete} theme={theme} />
    </div>
);

const SettingsView = ({ onClearDatabase, currentThemeKey, onChangeTheme, theme }) => {
    const currentTheme = theme || THEMES.dark; // Tema base para a view

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Configurações</h1>

            <Card className="p-6" theme={currentTheme}>
                <h3 className={`text-xl font-bold ${currentTheme.primaryText} mb-4`}>Aparência</h3>
                <Label theme={currentTheme}>Tema da Aplicação</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                    {Object.keys(THEMES).map(key => (
                        <button
                            key={key}
                            onClick={() => onChangeTheme(key)}
                            className={`p-3 rounded-xl border-4 transition-all h-28 flex flex-col items-center justify-center text-sm font-medium ${currentThemeKey === key ? 'border-orange-500' : `border-gray-600 hover:border-gray-500`
                                } ${THEMES[key].cardBg} ${THEMES[key].previewText || THEMES[key].text}`}
                        >
                            <div className={`w-8 h-8 rounded-full ${THEMES[key].primary} mb-2`}></div>
                            <span className="capitalize">{THEMES[key].label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="p-6 border-red-900/50 bg-red-900/10" theme={currentTheme}>
                <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle /> Zona de Perigo</h3>
                <p className={`${currentTheme.muted} mb-6`}>Ações irreversíveis.</p>
                <div className={`flex items-center justify-between p-4 ${currentTheme.inputBg} rounded-lg border border-red-900/30`}>
                    <div>
                        <h4 className={`font-medium ${currentTheme.text}`}>Limpar Base de Dados</h4>
                        <p className={`text-sm ${currentTheme.muted}`}>Apaga permanentemente todas as transações, clientes e tarefas.</p>
                    </div>
                    <Button variant="destructive" onClick={onClearDatabase} theme={currentTheme}>Limpar Tudo</Button>
                </div>
            </Card>
        </div>
    );
};

// --- 10. APP PRINCIPAL ---

export default function App() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const [activeTab, setActiveTab] = useState('dashboard');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState(null);
    const [themeKey, setThemeKey] = useState('dark');
    const currentTheme = THEMES[themeKey] || THEMES.dark;

    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]);

    // Auth & Profile Loading
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);

                const userDoc = await getDoc(doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    const emailDoc = await getDoc(doc(db, `artifacts/${appId}/team_members/${currentUser.email}`));
                    if (emailDoc.exists()) {
                        setUserData(emailDoc.data());
                        await setDoc(doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`), emailDoc.data(), { merge: true });
                        await deleteDoc(doc(db, `artifacts/${appId}/team_members/${currentUser.email}`));
                    } else {
                        setUserData({ role: 'admin', name: currentUser.email, permissions: { dashboard: true, financeiro: true, clientes: true, tarefas: true } });
                    }
                }
            } else {
                setUser(null);
                setUserId(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password, isRegister) => {
        setAuthLoading(true); setAuthError('');
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            setAuthError("Erro de autenticação. Verifique os dados.");
            console.error(error);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => { try { await signOut(auth); } catch (error) { console.error(error); } };

    // Data Sync Logic
    useEffect(() => {
        if (!userId) return;

        const collectionsToSync = ['transactions', 'clients', 'tasks'];

        const unsubscribes = collectionsToSync.map(colName => {
            const path = `artifacts/${appId}/users/${userId}/${colName}`;
            return onSnapshot(collection(db, path), (s) => {
                const list = s.docs.map(d => {
                    const data = { id: d.id, ...d.data() };

                    if (colName === 'transactions') {
                        if (data.status !== 'pago' && data.status !== 'recebido' && data.status !== 'cancelado') {
                            data.isOverdue = isBefore(safeDate(data.date), startOfDay(new Date()));
                        }
                    }

                    if (colName === 'tasks') {
                        const isTaskOverdue = (data.status === 'pendente' || data.status === 'em_andamento') && isBefore(safeDate(data.data_entrega), startOfDay(new Date()));

                        if (isTaskOverdue && data.prioridade !== 'urgente') {
                            const taskRef = doc(db, path, data.id);
                            setDoc(taskRef, { prioridade: 'urgente' }, { merge: true }).catch(err => console.error("Falha ao atualizar tarefa para urgente:", err));
                            data.prioridade = 'urgente';
                        }
                    }

                    return data;
                });

                if (colName === 'transactions') {
                    list.sort((a, b) => {
                        if (a.isOverdue && !b.isOverdue) return -1;
                        if (!a.isOverdue && b.isOverdue) return 1;
                        return safeDate(b.date).getTime() - safeDate(a.date).getTime();
                    });
                    setTransactions(list);
                }
                if (colName === 'clients') setClients(list);
                if (colName === 'tasks') setTasks(list);
            }, (err) => console.error(`Erro ao sincronizar ${colName}:`, err));
        });

        let unsubTeam = () => { };
        if (userData?.role === 'admin') {
            unsubTeam = onSnapshot(collection(db, `artifacts/${appId}/team_members`), (s) => {
                const members = s.docs.map(d => ({ id: d.id, ...d.data(), email: d.data().email || d.id, docId: d.id }));
                setTeamUsers(members);
            }, (err) => console.error("Erro ao sincronizar Team Members:", err));
        }

        return () => { unsubscribes.forEach(unsub => unsub()); unsubTeam(); };
    }, [userId, userData]);

    const notifications = useMemo(() => {
        const alerts = [];
        clients.filter(c => c.tipo === 'dominio' && c.data_vencimento_dominio).forEach(c => {
            const dueDate = parseISO(c.data_vencimento_dominio);
            const daysLeft = differenceInDays(dueDate, new Date());
            if (daysLeft < 0) alerts.push({ title: 'Domínio Vencido!', message: `O domínio de ${c.nome_projeto} venceu há ${Math.abs(daysLeft)} dias.`, type: 'urgent' });
            else if (daysLeft <= 5) alerts.push({ title: 'Vencimento Próximo', message: `Domínio de ${c.nome_projeto} vence em ${daysLeft} dias.`, type: 'warning' });
        });
        const overdueTasksCount = tasks.filter(t => (t.status === 'pendente' || t.status === 'em_andamento') && isBefore(safeDate(t.data_entrega), startOfDay(new Date()))).length;
        if (overdueTasksCount > 0) {
            alerts.push({ title: 'Tarefas Atrasadas!', message: `${overdueTasksCount} tarefas estão com a entrega vencida. Priorize!`, type: 'urgent' });
        }
        return alerts;
    }, [clients, tasks]);

    const handleSave = async (data, keepOpen) => {
        if (!userId) return;
        const cleanData = { ...data };
        if (cleanData.amount) cleanData.amount = parseFloat(cleanData.amount);

        const isUserDoc = modalType === 'users';
        const path = isUserDoc ? `artifacts/${appId}/team_members` : `artifacts/${appId}/users/${userId}/${modalType}`;

        try {
            if (editingItem) {
                const docId = isUserDoc ? editingItem.email : editingItem.id;
                await setDoc(doc(db, path, docId), cleanData, { merge: true });
            } else {
                if (isUserDoc) {
                    await setDoc(doc(db, path, cleanData.email), cleanData, { merge: true });
                } else {
                    await addDoc(collection(db, path), { ...cleanData, createdAt: new Date().toISOString(), createdBy: userId });
                }
            }

            if (!keepOpen) { setModalOpen(false); setEditingItem(null); }
        } catch (error) { console.error(error); }
    };

    // Função de atualização inline (para select da tabela de clientes)
    const handleInlineUpdate = async (id, field, value) => {
        if (!userId) return;
        try {
            await setDoc(doc(db, `artifacts/${appId}/users/${userId}/clients`, id), { [field]: value }, { merge: true });
        } catch (e) { console.error("Erro ao atualizar:", e); }
    };

    const handleMarkAsPaid = async (transaction) => {
        if (!userId) return;
        const isCompleted = ['pago', 'recebido'].includes(transaction.status);
        let newStatus = 'pendente';

        if (!isCompleted) {
            newStatus = transaction.type === 'receita' ? 'recebido' : 'pago';
        }

        try {
            await setDoc(doc(db, `artifacts/${appId}/users/${userId}/transactions`, transaction.id), { status: newStatus }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        const { id, type } = deleteInfo;
        const isUserDoc = type === 'team_members';
        const docIdToDelete = isUserDoc ? id : id;
        const path = isUserDoc ? `artifacts/${appId}/team_members` : `artifacts/${appId}/users/${userId}/${type}`;

        try {
            await deleteDoc(doc(db, path, docIdToDelete));
        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
        setDeleteInfo(null);
    };

    const handleClearAllData = async () => {
        if (!confirm("Tem certeza absoluta? Isso apagará TODAS as transações, clientes e tarefas permanentemente.")) return;

        setLoading(true);
        try {
            const collections = ['transactions', 'clients', 'tasks'];
            const pathBase = `artifacts/${appId}/users/${userId}/`;

            for (const colName of collections) {
                const q = collection(db, pathBase + colName);
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
            alert("Base de dados limpa com sucesso!");
        } catch (error) {
            console.error("Erro ao limpar:", error);
            alert("Erro ao limpar dados. Verifique as regras de segurança do Firestore.");
        } finally {
            setLoading(false);
        }
    };

    const openAdd = (type) => { setModalType(type); setEditingItem(null); setModalOpen(true); };
    const openEdit = (type, item) => { setModalType(type); setEditingItem(item); setModalOpen(true); };
    const openDelete = (id, type) => { setDeleteInfo({ id, type }); };

    const summary = useMemo(() => {
        const rec = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const desp = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        return { rec, desp, saldo: rec - desp };
    }, [transactions]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;
    if (!user) return <AuthScreen onLogin={handleLogin} loading={authLoading} error={authError} />;

    return (
        <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} user={user} userData={userData} onLogout={handleLogout} notifications={notifications} currentTheme={currentTheme}>
            {activeTab === 'dashboard' && <DashboardView summary={summary} transactions={transactions} tasks={tasks} onAdd={() => openAdd('transactions')} onEdit={(item) => openEdit('transactions', item)} onDelete={(id) => openDelete(id, 'transactions')} onMarkAsPaid={handleMarkAsPaid} theme={currentTheme} />}
            {activeTab === 'transactions' && <div className="space-y-6 max-w-6xl mx-auto"><div className="flex justify-between items-center"><h1 className={`text-3xl font-bold ${currentTheme.text}`}>Financeiro</h1><Button onClick={() => openAdd('transactions')} theme={currentTheme}><Plus className="w-5 h-5 mr-2" /> Nova Transação</Button></div><TransactionList transactions={transactions} onEdit={(item) => openEdit('transactions', item)} onDelete={(id) => openDelete(id, 'transactions')} onToggleStatus={handleMarkAsPaid} theme={currentTheme} /></div>}
            {activeTab === 'clients' && <ClientsView clients={clients} onAdd={() => openAdd('clients')} onEdit={(item) => openEdit('clients', item)} onDelete={(id) => openDelete(id, 'clients')} theme={currentTheme} onUpdate={handleInlineUpdate} />}
            {activeTab === 'tasks' && <TasksView tasks={tasks} onAdd={() => openAdd('tasks')} onEdit={(item) => openEdit('tasks', item)} onDelete={(id) => openDelete(id, 'tasks')} theme={currentTheme} />}
            {activeTab === 'team' && (
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="flex justify-between items-center"><h1 className={`text-3xl font-bold ${currentTheme.text}`}>Gestão de Equipa</h1><Button onClick={() => openAdd('users')} theme={currentTheme}><Plus className="w-5 h-5 mr-2" /> Novo Gestor</Button></div>
                    <TeamView users={teamUsers} onAdd={() => openAdd('users')} onDelete={(id) => openDelete(id, 'team_members')} currentUserId={userId} theme={currentTheme} />
                </div>
            )}
            {activeTab === 'settings' && <SettingsView onClearDatabase={handleClearAllData} currentThemeKey={themeKey} onChangeTheme={setThemeKey} theme={currentTheme} />}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} theme={currentTheme}><h2 className={`text-xl font-bold mb-4 capitalize ${currentTheme.text}`}>{editingItem ? 'Editar' : 'Novo'} {modalType === 'transactions' ? 'Transação' : modalType === 'clients' ? 'Cliente' : modalType === 'users' ? 'Gestor' : 'Tarefa'}</h2><GenericForm type={modalType} initialData={editingItem} onSubmit={handleSave} onCancel={() => setModalOpen(false)} clients={clients} theme={currentTheme} /></Dialog>
            <Dialog open={!!deleteInfo} onClose={() => setDeleteInfo(null)} theme={currentTheme}><h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Apagar Registo</h2><p className={`${currentTheme.muted} mb-6`}>Tem a certeza? Esta ação é irreversível.</p><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setDeleteInfo(null)} theme={currentTheme}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} theme={currentTheme}>Confirmar</Button></div></Dialog>
        </AppLayout>
    );
}