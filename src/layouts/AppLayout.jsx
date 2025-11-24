import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Users, ListTodo, LogOut, DollarSign,
    Shield, Settings, Bell, AlertCircle, Flame
} from 'lucide-react';
import { Button } from '../components/UI';

const AppLayout = ({ children, activeTab, setActiveTab, user, userData, onLogout, notifications = [], currentTheme }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    const navItems = useMemo(() => {
        // USANDO CÓDIGOS UNICODE PARA EVITAR ERROS DE CODIFICAÇÃO
        // \u00E3 = ã
        // \u00F5 = õ
        // \u00E7 = ç
        // \u00E9 = é
        const items = [
            { id: 'dashboard', label: 'Vis\u00E3o Geral', icon: LayoutDashboard, permission: 'dashboard' },
            { id: 'transactions', label: 'Financeiro', icon: DollarSign, permission: 'financeiro' },
            { id: 'clients', label: 'Clientes', icon: Users, permission: 'clientes' },
            { id: 'tasks', label: 'Tarefas', icon: ListTodo, permission: 'tarefas' },
        ];

        if (userData?.role === 'admin' || userData?.role === 'dev') {
            items.push({ id: 'team', label: 'Gest\u00E3o de Equipa', icon: Shield, permission: 'admin' });
            items.push({ id: 'settings', label: 'Configura\u00E7\u00F5es', icon: Settings, permission: 'admin' });
            return items;
        }

        const permissions = userData?.permissions || {};
        return items.filter(item => item.id === 'dashboard' || permissions[item.permission]===true);
    }, [userData]);

    useEffect(() => {
        // Título da aba do navegador também corrigido
        const currentLabel = navItems.find(item => item.id === activeTab)?.label || 'Gest\u00E3o';
        document.title = `Ascend | ${currentLabel}`;

    }, [activeTab, navItems]);

    return (
        <div className={`min-h-screen ${currentTheme.bg} font-sans ${currentTheme.text} flex flex-col md:flex-row`}>
            {/* Sidebar Desktop */}
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
                                <div className={`p-3 border-b ${currentTheme.border} ${currentTheme.headerBg} font-medium text-sm ${currentTheme.text.replace('text-white', 'text-gray-300')}`}>Notifica{'\u00E7'}{'\u00F5'}es</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className={`p-4 text-center ${currentTheme.muted} text-sm`}>Sem notifica{'\u00E7'}{'\u00F5'}es novas.</div>
                                    ) : (
                                        notifications.map((note, idx) => (
                                            <div key={idx} className={`p-3 border-b ${currentTheme.border} hover:${currentTheme.inputBg} last:border-0 transition-colors`}>
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-red-500/10 p-1.5 rounded-full"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                                                    <div><p className={`text-sm font-medium ${currentTheme.text}`}>{note.title}</p><p className={`text-xs ${currentTheme.muted} mt-0.5`}>{note.message}</p></div>
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

export default AppLayout;