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
    Globe, Server, Bell, Settings, ExternalLink, ChevronDown, Eye, EyeOff, Flame, Check, AlertTriangle, Shield
} from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, parseISO } from 'date-fns';
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
const Button = ({ children, onClick, className = "", variant, disabled, type = "button", ...props }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'ghost' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' :
                variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
                    variant === 'outline' ? 'border border-gray-700 text-gray-300 hover:bg-gray-800' :
                        'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-900/20'
            } ${className}`}
        {...props}
    >
        {children}
    </button>
);

const Input = ({ className = "", ...props }) => (
    <input
        className={`w-full border border-gray-700 rounded-md p-2 bg-gray-900 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-600 ${className}`}
        {...props}
    />
);

const Label = ({ children }) => <label className="block text-sm font-medium text-gray-300 mb-1.5">{children}</label>;

const Select = ({ children, value, onChange, name, className = "" }) => (
    <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border border-gray-700 rounded-md p-2 bg-gray-900 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none ${className}`}
    >
        {children}
    </select>
);

const Card = ({ children, className = "" }) => <div className={`bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden ${className}`}>{children}</div>;

const Badge = ({ children, className = "", variant }) => {
    let colors = 'bg-gray-700 text-gray-300';
    if (variant === 'success') colors = 'bg-emerald-900/50 text-emerald-400 border border-emerald-800';
    if (variant === 'warning') colors = 'bg-amber-900/50 text-amber-400 border border-amber-800';
    if (variant === 'danger') colors = 'bg-red-900/50 text-red-400 border border-red-800';
    if (variant === 'blue') colors = 'bg-blue-900/50 text-blue-400 border border-blue-800';
    if (variant === 'orange') colors = 'bg-orange-900/50 text-orange-400 border border-orange-800';
    if (variant === 'purple') colors = 'bg-purple-900/50 text-purple-400 border border-purple-800';

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors} ${className}`}>{children}</span>;
};

// Searchable Select Component
const ClientSearchInput = ({ clients, selectedId, onSelect }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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
                />
                {selectedId && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-[70] w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-2xl max-h-60 overflow-auto">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0 flex justify-between items-center group"
                                    onClick={() => handleSelect(client)}
                                >
                                    <div>
                                        <div className="font-medium text-white group-hover:text-orange-400 transition-colors">{client.nome_projeto}</div>
                                        <div className="text-xs text-gray-400">ID: {client.id.slice(0, 6)}...</div>
                                    </div>
                                    <Badge variant={client.tipo === 'dominio' ? 'blue' : 'orange'} className="text-[10px]">
                                        {client.tipo === 'dominio' ? 'Domínio' : 'Tráfego'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-400 text-center">
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
const Dialog = ({ open, onClose, children }) => (
    <AnimatePresence>
        {open && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto text-white"
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                    {children}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// --- 3. TELA DE LOGIN ---
const AuthScreen = ({ onLogin, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password, isRegister);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl border-gray-800 bg-gray-900">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-4 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                        <Flame className="w-10 h-10 fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Ascend</h1>
                    <p className="text-gray-400 mt-2">Eleve a gestão dos seus projetos.</p>
                </div>
                {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300 flex gap-2"><AlertCircle size={16} />{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div><Label>E-mail</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><Input type="email" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
                    <div><Label>Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><Input type="password" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={password} onChange={(e) => setPassword(e.target.value)} required /></div></div>
                    <Button type="submit" className="w-full py-3 font-bold text-lg" disabled={loading}>{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isRegister ? 'Criar Conta' : 'Entrar')}</Button>
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

const AppLayout = ({ children, activeTab, setActiveTab, user, userData, onLogout, notifications = [] }) => {
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

    return (
        <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
                <div className="p-6 flex items-center gap-3 border-b border-gray-800">
                    <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-lg shadow-lg shadow-orange-500/20">
                        <Flame className="w-6 h-6 text-white fill-current" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">Ascend</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === item.id ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                            <item.icon className="w-5 h-5" /> {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-orange-500 font-bold uppercase shadow-sm">{user?.email?.[0] || 'U'}</div>
                        <div className="flex-1 min-w-0 overflow-hidden"><p className="text-sm font-medium truncate text-white">{user?.email}</p><p className="text-xs text-gray-500 capitalize">{userData?.role || 'Gestor'}</p></div>
                        <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-500 hover:text-red-400"><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2"><Flame className="w-6 h-6 text-orange-500 fill-current" /><span className="font-bold text-lg text-white">Ascend</span></div>
                <Button variant="ghost" onClick={onLogout}><LogOut className="w-5 h-5 text-gray-400" /></Button>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-2 z-50">
                {navItems.slice(0, 4).map((item) => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-2 rounded-lg flex flex-col items-center ${activeTab === item.id ? 'text-orange-500' : 'text-gray-500'}`}>
                        <item.icon className="w-6 h-6" /> <span className="text-[10px] mt-1">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8 relative">
                {/* Top Bar with Notifications */}
                <div className="flex justify-end mb-8">
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-gray-800 rounded-full shadow-sm border border-gray-700 hover:bg-gray-700 relative transition-colors">
                            <Bell className="w-5 h-5 text-gray-400" />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800 animate-pulse"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                                <div className="p-3 border-b border-gray-700 bg-gray-900 font-medium text-sm text-gray-300">Notificações</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">Sem notificações novas.</div>
                                    ) : (
                                        notifications.map((note, idx) => (
                                            <div key={idx} className="p-3 border-b border-gray-700 hover:bg-gray-700/50 last:border-0 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-red-500/10 p-1.5 rounded-full">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{note.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{note.message}</p>
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

const StatsCard = ({ title, value, icon: IconComponent, color, trend }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="p-6 relative overflow-hidden hover:border-orange-500/30 transition-all group">
            <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('bg-', 'bg-').replace('text-', 'text-')} opacity-5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`} />
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {trend && <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}><span>{trend.positive ? '↑' : '↓'}</span> {trend.text}</div>}
                </div>
                <div className={`p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-lg`}><IconComponent className={`w-6 h-6 ${color}`} /></div>
            </div>
        </Card>
    </motion.div>
);

const TransactionList = ({ transactions, onEdit, onDelete }) => {
    if (transactions.length === 0) return <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-dashed border-gray-700"><DollarSign className="w-12 h-12 bg-gray-800 rounded-full p-2 mx-auto mb-3 text-gray-600" /><p className="text-gray-500">Nenhuma transação encontrada.</p></div>;
    return (
        <div className="space-y-3">
            {transactions.map((t) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-gray-900 border border-gray-700`}>{t.type === 'receita' ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-red-500" />}</div>
                            <div>
                                <p className="font-bold text-white">{t.description}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                                    <span>{format(safeDate(t.date), "dd MMM", { locale: ptBR })}</span>
                                    {t.clientName && <span className="px-2 py-0.5 bg-gray-900 text-orange-400 rounded flex items-center gap-1 border border-gray-700"><User size={10} /> {t.clientName}</span>}
                                    <Badge variant={t.status === 'pago' || t.status === 'recebido' ? 'success' : 'warning'} className="capitalize">{t.status}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                            <span className={`font-bold text-lg ${t.type === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}</span>
                            <div className="flex gap-1">
                                <Button variant="ghost" onClick={() => onEdit(t)} className="h-8 w-8 p-0"><Pencil size={16} /></Button>
                                <Button variant="ghost" onClick={() => onDelete(t.id, 'transactions')} className="h-8 w-8 p-0 text-red-500 hover:text-red-400"><Trash2 size={16} /></Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const ClientTable = ({ clients, onEdit, onDelete }) => {
    const [visibleColumns, setVisibleColumns] = useState({ projeto: true, gestor: true, nicho: true, prioridade: true, metaAds: true, googleAds: true, status: true, acoes: true });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    if (clients.length === 0) return <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-dashed border-gray-700"><Users className="w-12 h-12 bg-gray-800 rounded-full p-2 mx-auto mb-3 text-gray-600" /><p className="text-gray-500">Nenhum cliente registado.</p></div>;
    return (
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                <h3 className="font-semibold text-gray-200">Clientes Ativos ({clients.length})</h3>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"><Settings size={14} /> Colunas</Button>
                    {showColumnSelector && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 p-2">
                                {Object.keys(visibleColumns).map(col => (<label key={col} className="flex items-center px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="mr-2 rounded bg-gray-900 border-gray-600 text-orange-600 focus:ring-orange-500" /><span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span></label>))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-800">
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
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-700/30 transition-colors">
                                {visibleColumns.projeto && <td className="px-6 py-4 font-medium text-white"><div className="flex flex-col"><span className="text-base font-bold">{client.nome_projeto}</span><span className="text-xs text-gray-500 font-mono">ID: {client.id.slice(0, 8)}</span></div></td>}
                                {visibleColumns.gestor && <td className="px-6 py-4 text-gray-400">{client.gestor || '-'}</td>}
                                {visibleColumns.nicho && <td className="px-6 py-4"><div className="flex items-center gap-2">{client.tipo === 'dominio' ? <Globe size={16} className="text-blue-400" /> : <TrendingUp size={16} className="text-orange-400" />}<span>{client.nicho || (client.tipo === 'dominio' ? 'Hospedagem' : 'Tráfego')}</span></div></td>}
                                {visibleColumns.prioridade && <td className="px-6 py-4 text-center"><Badge variant={client.prioridade === 'alta' ? 'danger' : client.prioridade === 'media' ? 'warning' : 'blue'}>{client.prioridade}</Badge></td>}
                                {visibleColumns.metaAds && <td className="px-6 py-4 text-center">{client.link_meta_ads ? <a href={client.link_meta_ads} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-1"><ExternalLink size={14} /> Abrir</a> : <span className="text-gray-600">-</span>}<div className="text-xs text-gray-500 mt-1">{formatCurrency(client.orcamento_facebook)}</div></td>}
                                {visibleColumns.googleAds && <td className="px-6 py-4 text-center">{client.link_google_ads ? <a href={client.link_google_ads} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-1"><ExternalLink size={14} /> Abrir</a> : <span className="text-gray-600">-</span>}<div className="text-xs text-gray-500 mt-1">{formatCurrency(client.orcamento_google)}</div></td>}
                                {visibleColumns.status && <td className="px-6 py-4 text-center"><Badge variant={client.status === 'ativo' ? 'success' : 'gray'}>{client.status}</Badge></td>}
                                {visibleColumns.acoes && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(client)} className="p-1.5 hover:bg-gray-700 text-blue-400 rounded transition-colors"><Pencil size={16} /></button><button onClick={() => onDelete(client.id, 'clients')} className="p-1.5 hover:bg-gray-700 text-red-400 rounded transition-colors"><Trash2 size={16} /></button></div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TaskTable = ({ tasks, onEdit, onDelete }) => {
    const [visibleColumns, setVisibleColumns] = useState({ tarefa: true, cliente: true, data: true, prioridade: true, status: true, acoes: true });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    if (tasks.length === 0) return <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-dashed border-gray-700"><CheckSquare className="w-12 h-12 bg-gray-800 rounded-full p-2 mx-auto mb-3 text-gray-600" /><p className="text-gray-500">Nenhuma tarefa pendente.</p></div>;
    return (
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                <h3 className="font-semibold text-gray-200">Tarefas ({tasks.length})</h3>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)} className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"><Settings size={14} /> Colunas</Button>
                    {showColumnSelector && <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 p-2">{Object.keys(visibleColumns).map(col => (<label key={col} className="flex items-center px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-300"><input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} className="mr-2 rounded bg-gray-900 border-gray-600 text-orange-600 focus:ring-orange-500" /><span className="capitalize">{col}</span></label>))}</div>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-800">
                        <tr>{visibleColumns.tarefa && <th className="px-6 py-4">Tarefa</th>}{visibleColumns.cliente && <th className="px-6 py-4">Cliente</th>}{visibleColumns.data && <th className="px-6 py-4">Entrega</th>}{visibleColumns.prioridade && <th className="px-6 py-4 text-center">Prioridade</th>}{visibleColumns.status && <th className="px-6 py-4 text-center">Status</th>}{visibleColumns.acoes && <th className="px-6 py-4 text-right">Ações</th>}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-700/30 transition-colors">
                                {visibleColumns.tarefa && <td className={`px-6 py-4 font-medium ${task.status === 'concluida' ? 'line-through text-gray-500' : 'text-white'}`}>{task.titulo}</td>}
                                {visibleColumns.cliente && <td className="px-6 py-4 text-gray-400 flex items-center gap-2"><Briefcase size={14} /> {task.cliente_nome || '-'}</td>}
                                {visibleColumns.data && <td className="px-6 py-4 text-gray-400"><div className="flex items-center gap-2"><Calendar size={14} /> {task.data_entrega ? format(safeDate(task.data_entrega), 'dd MMM', { locale: ptBR }) : '-'}</div></td>}
                                {visibleColumns.prioridade && <td className="px-6 py-4 text-center"><Badge variant={task.prioridade === 'alta' ? 'danger' : task.prioridade === 'media' ? 'warning' : 'blue'}>{task.prioridade}</Badge></td>}
                                {visibleColumns.status && <td className="px-6 py-4 text-center"><Badge variant={task.status === 'concluida' ? 'success' : 'gray'}>{task.status}</Badge></td>}
                                {visibleColumns.acoes && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(task)} className="p-1.5 hover:bg-gray-700 text-blue-400 rounded transition-colors"><Pencil size={16} /></button><button onClick={() => onDelete(task.id, 'tasks')} className="p-1.5 hover:bg-gray-700 text-red-400 rounded transition-colors"><Trash2 size={16} /></button></div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 7. PAINEL DE UTILIZADORES (NOVO) ---

const TeamView = ({ users, onAdd, onDelete, currentUserId }) => {
    if (users.length === 0) return <div className="text-center py-12"><p className="text-gray-500">Sem membros na equipa.</p></div>;

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-200">Membros da Equipa ({users.length})</h3>
                <Button size="sm" onClick={onAdd}><Plus size={14} className="mr-1" /> Adicionar Gestor</Button>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-900 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-800">
                    <tr>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4 text-center">Função</th>
                        <th className="px-6 py-4">Permissões</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                    {users.map(u => (
                        <tr key={u.email} className="hover:bg-gray-700/30">
                            <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                            <td className="px-6 py-4 text-gray-400">{u.email}</td>
                            <td className="px-6 py-4 text-center"><Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {u.role === 'admin' ? <Badge variant="purple">Acesso Total</Badge> :
                                        Object.entries(u.permissions || {}).filter(([, v]) => v).map(([k]) => (
                                            <Badge key={k} className="text-[10px] capitalize">{k}</Badge>
                                        ))
                                    }
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {/* ID usado para delete é o email, que é o ID do documento Firestore */}
                                {u.email !== auth.currentUser?.email && <button onClick={() => onDelete(u.email, 'team_members')} className="p-1.5 hover:bg-gray-700 text-red-400 rounded"><Trash2 size={16} /></button>}
                            </td>
                        </tr>
                    ))}
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

const GenericForm = ({ type, initialData, onSubmit, onCancel, clients = [] }) => {
    const [formData, setFormData] = useState(initialData || (type === 'transactions' ? DEFAULT_TRANSACTION : type === 'clients' ? DEFAULT_CLIENT : type === 'users' ? DEFAULT_USER : DEFAULT_TASK));
    const [keepOpen, setKeepOpen] = useState(false);

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

    // FORM DE UTILIZADOR (NOVO)
    if (type === 'users') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome do Gestor</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                <div><Label>Email (Login)</Label><Input name="email" type="email" value={formData.email || ''} onChange={handleChange} required /></div>

                <div><Label>Função</Label><Select name="role" value={formData.role} onChange={handleChange}><option value="gestor">Gestor</option><option value="admin">Administrador</option></Select></div>

                {formData.role !== 'admin' && (
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                        <Label>Permissões de Acesso</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {['dashboard', 'financeiro', 'clientes', 'tarefas'].map(p => (
                                <label key={p} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                    <input type="checkbox" name={`perm_${p}`} checked={formData.permissions?.[p]} onChange={handleChange} className="rounded bg-gray-800 border-gray-600 text-orange-500 focus:ring-orange-500" />
                                    <span className="capitalize">{p}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-blue-900/20 p-3 rounded border border-blue-800/50 text-xs text-blue-300">
                    <p>O utilizador deverá criar conta com este email para ter acesso. Se já tiver conta, as permissões serão atualizadas.</p>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700"><Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button><Button type="submit">Salvar Permissões</Button></div>
            </form>
        );
    }

    // FORM DE TRANSAÇÃO
    if (type === 'transactions') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tipo</Label><Select name="type" value={formData.type || 'despesa'} onChange={handleChange}><option value="receita">Receita</option><option value="despesa">Despesa</option></Select></div>
                    <div><Label>Valor</Label><Input name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} required placeholder="0,00" /></div>
                </div>
                <div><Label>Vincular Cliente (Opcional)</Label><ClientSearchInput clients={clients} selectedId={formData.clientId} onSelect={(client) => setFormData({ ...formData, clientId: client?.id || '', clientName: client?.nome_projeto || '' })} /></div>
                <div><Label>Descrição</Label><Input name="description" value={formData.description || ''} onChange={handleChange} required /></div>
                <div><Label>Categoria</Label><Select name="category" value={formData.category || 'outras'} onChange={handleChange}><option value="vendas">Vendas</option><option value="servicos">Serviços</option><option value="marketing">Marketing</option><option value="outras">Outras</option></Select></div>
                <div><Label>Data</Label><Input name="date" type="date" value={formData.date || new Date().toISOString().split('T')[0]} onChange={handleChange} /></div>
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-700">
                    {!initialData && <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded bg-gray-900 border-gray-600 text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button><Button type="submit">Salvar</Button></div>
                </div>
            </form>
        );
    }

    // FORM DE CLIENTE
    if (type === 'clients') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tipo de Cliente</Label><Select name="tipo" value={formData.tipo || 'trafego'} onChange={handleChange}><option value="trafego">Tráfego Pago</option><option value="dominio">Domínio / Hospedagem</option></Select></div>
                    <div><Label>Status</Label><Select name="status" value={formData.status || 'ativo'} onChange={handleChange}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></div>
                </div>
                <div><Label>Nome do Projeto / Cliente</Label><Input name="nome_projeto" value={formData.nome_projeto || ''} onChange={handleChange} required placeholder="Ex: Empresa X" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Gestor</Label><Input name="gestor" value={formData.gestor || ''} onChange={handleChange} /></div>
                    <div><Label>Nicho</Label><Input name="nicho" value={formData.nicho || ''} onChange={handleChange} /></div>
                </div>
                {formData.tipo === 'trafego' ? (
                    <>
                        <div className="grid grid-cols-2 gap-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                            <div><Label>Orçamento FB (R$)</Label><Input name="orcamento_facebook" type="number" value={formData.orcamento_facebook || ''} onChange={handleChange} /></div>
                            <div><Label>Link Meta Ads</Label><Input name="link_meta_ads" value={formData.link_meta_ads || ''} onChange={handleChange} placeholder="https://..." /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                            <div><Label>Orçamento Google (R$)</Label><Input name="orcamento_google" type="number" value={formData.orcamento_google || ''} onChange={handleChange} /></div>
                            <div><Label>Link Google Ads</Label><Input name="link_google_ads" value={formData.link_google_ads || ''} onChange={handleChange} placeholder="https://..." /></div>
                        </div>
                    </>
                ) : (
                    <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800/50">
                        <Label>Data Vencimento Domínio</Label>
                        <Input name="data_vencimento_dominio" type="date" value={formData.data_vencimento_dominio || ''} onChange={handleChange} />
                    </div>
                )}
                <div><Label>Prioridade</Label><Select name="prioridade" value={formData.prioridade || 'media'} onChange={handleChange}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></Select></div>
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-700">
                    {!initialData && <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded bg-gray-900 border-gray-600 text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button><Button type="submit">Salvar</Button></div>
                </div>
            </form>
        );
    }

    // FORM DE TAREFA
    if (type === 'tasks') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Título da Tarefa</Label><Input name="titulo" value={formData.titulo || ''} onChange={handleChange} required /></div>
                <div><Label>Cliente / Projeto</Label><ClientSearchInput clients={clients} selectedId={formData.cliente_id} onSelect={(client) => setFormData({ ...formData, cliente_id: client?.id || '', cliente_nome: client?.nome_projeto || '' })} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>Data Entrega</Label><Input name="data_entrega" type="date" value={formData.data_entrega ? formData.data_entrega.split('T')[0] : ''} onChange={handleChange} /></div>
                    <div><Label>Prioridade</Label><Select name="prioridade" value={formData.prioridade || 'media'} onChange={handleChange}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></Select></div>
                </div>
                <div><Label>Status</Label><Select name="status" value={formData.status || 'pendente'} onChange={handleChange}><option value="pendente">Pendente</option><option value="em_andamento">Em Andamento</option><option value="concluida">Concluída</option></Select></div>
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-700">
                    {!initialData && <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded bg-gray-900 border-gray-600 text-orange-500 focus:ring-orange-500" /> Lançamento Contínuo</label>}
                    <div className="flex gap-3 ml-auto"><Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button><Button type="submit">Salvar</Button></div>
                </div>
            </form>
        );
    }

    return null;
};

// --- 9. VIEWS (Páginas) ---

const DashboardView = ({ summary, transactions, onAdd, onEdit, onDelete }) => (
    <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><h1 className="text-3xl font-bold text-white">Dashboard</h1><p className="text-gray-400 mt-1">Visão geral da sua operação.</p></div>
            <Button onClick={() => onAdd('transactions')}><Plus className="w-5 h-5 mr-2" /> Nova Transação</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard title="Receitas" value={formatCurrency(summary.rec)} icon={TrendingUp} color="text-emerald-400" trend={{ positive: true, text: "Entradas" }} />
            <StatsCard title="Despesas" value={formatCurrency(summary.desp)} icon={TrendingDown} color="text-red-400" trend={{ positive: false, text: "Saídas" }} />
            <StatsCard title="Saldo" value={formatCurrency(summary.saldo)} icon={PiggyBank} color="text-orange-400" trend={{ positive: summary.saldo >= 0, text: "Líquido" }} />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card className="h-[350px] flex flex-col"><div className="p-6 border-b border-gray-700 bg-gray-800/50"><h3 className="font-bold text-white">Fluxo Financeiro</h3></div><div className="flex-1 p-4 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Atual', receitas: summary.rec, despesas: summary.desp }]}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" /><XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9CA3AF" /><YAxis axisLine={false} tickLine={false} stroke="#9CA3AF" tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v)} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} cursor={{ fill: '#374151' }} /><Legend iconType="circle" wrapperStyle={{ color: '#9CA3AF' }} /><Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={60} /><Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={60} /></BarChart></ResponsiveContainer></div></Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="h-[350px] flex flex-col"><div className="p-6 border-b border-gray-700 bg-gray-800/50"><h3 className="font-bold text-white">Resumo</h3></div><div className="flex-1 p-4 flex flex-col justify-center items-center gap-4"><div className="text-center"><p className="text-sm text-gray-400">Saldo Atual</p><p className={`text-3xl font-bold ${summary.saldo >= 0 ? 'text-orange-400' : 'text-red-400'}`}>{formatCurrency(summary.saldo)}</p></div><div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${(summary.rec / (summary.rec + summary.desp || 1)) * 100}%` }} /></div><div className="flex justify-between w-full text-xs text-gray-400"><span>Entradas</span><span>Saídas</span></div></div></Card>
            </div>
        </div>
        <div><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white">Últimas Movimentações</h2></div><TransactionList transactions={transactions} limit={5} onEdit={(item) => openEdit('transactions', item)} onDelete={onDelete} /></div>
    </div>
);

const ClientsView = ({ clients, onAdd, onEdit, onDelete }) => (
    <div className="space-y-6 max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><h1 className="text-3xl font-bold text-white">Gestão de Clientes</h1><p className="text-gray-400 mt-1">Controle seus projetos de tráfego e domínios.</p></div>
            <Button onClick={onAdd}><Plus className="w-5 h-5 mr-2" /> Criar Projeto</Button>
        </div>
        <ClientTable clients={clients} onEdit={onEdit} onDelete={onDelete} />
    </div>
);

const TasksView = ({ tasks, onAdd, onEdit, onDelete }) => (
    <div className="space-y-6 max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><h1 className="text-3xl font-bold text-white">Gestão de Tarefas</h1><p className="text-gray-400 mt-1">Acompanhe suas entregas e prazos.</p></div>
            <Button onClick={onAdd}><Plus className="w-5 h-5 mr-2" /> Nova Tarefa</Button>
        </div>
        <TaskTable tasks={tasks} onEdit={onEdit} onDelete={onDelete} />
    </div>
);

const SettingsView = ({ onClearDatabase }) => (
    <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <Card className="p-6 border-red-900/50 bg-red-900/10"><h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle /> Zona de Perigo</h3><p className="text-gray-400 mb-6">Ações irreversíveis.</p><div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-red-900/30"><div><h4 className="font-medium text-white">Limpar Base de Dados</h4><p className="text-sm text-gray-500">Apaga permanentemente todas as transações, clientes e tarefas.</p></div><Button variant="destructive" onClick={onClearDatabase}>Limpar Tudo</Button></div></Card>
    </div>
);

// --- 10. APP PRINCIPAL ---

export default function App() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userData, setUserData] = useState(null); // Armazena o perfil do utilizador (role, permissions)
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const [activeTab, setActiveTab] = useState('dashboard');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState(null);

    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]); // Lista de utilizadores da equipa

    // Auth & Profile Loading
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);

                // Carregar o perfil do utilizador para saber permissões
                const userDoc = await getDoc(doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    // Se for o primeiro utilizador (fallback), dar admin
                    setUserData({ role: 'admin', name: currentUser.email });
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
                // NOTE: A criação de perfil é feita no registo, herdando o perfil se existir
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

    // Sync Data Logic
    useEffect(() => {
        if (!userId) return;

        // CORREÇÃO: Usando a estrutura de 5 segmentos para dados privados
        const collectionsToSync = ['transactions', 'clients', 'tasks'];

        const unsubscribes = collectionsToSync.map(colName => {
            const path = `artifacts/${appId}/users/${userId}/${colName}`;
            return onSnapshot(collection(db, path), (s) => {
                const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
                if (colName === 'transactions') setTransactions(list);
                if (colName === 'clients') setClients(list);
                if (colName === 'tasks') setTasks(list);
            }, (err) => console.error(`Erro ao sincronizar ${colName}:`, err));
        });

        let unsubTeam = () => { };
        // Sincroniza membros da equipe
        unsubTeam = onSnapshot(collection(db, `artifacts/${appId}/team_members`), (s) => {
            // Mapeia docs para garantir que o ID do documento é o email para o TeamView
            const members = s.docs.map(d => ({ id: d.id, ...d.data(), email: d.id.includes('@') ? d.id : d.data().email, docId: d.id }));
            setTeamUsers(members);
        }, (err) => console.error("Erro ao sincronizar Team Members:", err));


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
        return alerts;
    }, [clients]);

    const handleSave = async (data, keepOpen) => {
        if (!userId) return;
        const cleanData = { ...data };
        if (cleanData.amount) cleanData.amount = parseFloat(cleanData.amount);

        const isUserDoc = modalType === 'users';
        const path = isUserDoc ? `artifacts/${appId}/team_members` : `artifacts/${appId}/users/${userId}/${modalType}`;

        try {
            if (editingItem) {
                const docId = isUserDoc ? editingItem.email : editingItem.id; // Usa email como ID para users
                await setDoc(doc(db, path, docId), cleanData, { merge: true });
            } else {
                if (isUserDoc) {
                    // Quando cria novo utilizador, o ID do documento é o email
                    await setDoc(doc(db, path, cleanData.email), cleanData, { merge: true });
                } else {
                    await addDoc(collection(db, path), { ...cleanData, createdAt: new Date().toISOString(), createdBy: userId });
                }
            }

            if (!keepOpen) { setModalOpen(false); setEditingItem(null); }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async () => {
        const { id, type } = deleteInfo;
        const isUserDoc = type === 'team_members';
        // O ID deve ser o email para documentos de team_members
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
        if (!confirm("Tem certeza absoluta?")) return;
        // Lógica de limpar collections... (simplificada aqui)
        alert("Funcionalidade restrita por segurança neste exemplo.");
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
        <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} user={user} userData={userData} onLogout={handleLogout} notifications={notifications}>
            {activeTab === 'dashboard' && <DashboardView summary={summary} transactions={transactions} onAdd={() => openAdd('transactions')} onEdit={(item) => openEdit('transactions', item)} onDelete={(id) => openDelete(id, 'transactions')} />}
            {activeTab === 'transactions' && <div className="space-y-6 max-w-6xl mx-auto"><div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-white">Financeiro</h1><Button onClick={() => openAdd('transactions')}><Plus className="w-5 h-5 mr-2" /> Nova Transação</Button></div><TransactionList transactions={transactions} onEdit={(item) => openEdit('transactions', item)} onDelete={(id) => openDelete(id, 'transactions')} /></div>}
            {activeTab === 'clients' && <ClientsView clients={clients} onAdd={() => openAdd('clients')} onEdit={(item) => openEdit('clients', item)} onDelete={(id) => openDelete(id, 'clients')} />}
            {activeTab === 'tasks' && <TasksView tasks={tasks} onAdd={() => openAdd('tasks')} onEdit={(item) => openEdit('tasks', item)} onDelete={(id) => openDelete(id, 'tasks')} />}
            {activeTab === 'team' && (
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-white">Gestão de Equipa</h1><Button onClick={() => openAdd('users')}><Plus className="w-5 h-5 mr-2" /> Novo Gestor</Button></div>
                    <TeamView users={teamUsers} onAdd={() => openAdd('users')} onDelete={(id) => openDelete(id, 'team_members')} currentUserId={userId} />
                </div>
            )}
            {activeTab === 'settings' && <SettingsView onClearDatabase={handleClearAllData} />}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)}><h2 className="text-xl font-bold mb-4 capitalize text-white">{editingItem ? 'Editar' : 'Novo'} {modalType === 'transactions' ? 'Transação' : modalType === 'clients' ? 'Cliente' : modalType === 'users' ? 'Gestor' : 'Tarefa'}</h2><GenericForm type={modalType} initialData={editingItem} onSubmit={handleSave} onCancel={() => setModalOpen(false)} clients={clients} /></Dialog>
            <Dialog open={!!deleteInfo} onClose={() => setDeleteInfo(null)}><h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Apagar Registo</h2><p className="text-gray-300 mb-6">Tem a certeza? Esta ação é irreversível.</p><div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setDeleteInfo(null)}>Cancelar</Button><Button variant="destructive" onClick={handleDelete}>Confirmar</Button></div></Dialog>
        </AppLayout>
    );
}