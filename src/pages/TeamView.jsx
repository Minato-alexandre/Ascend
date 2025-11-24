import React from 'react';
import { Plus, Shield, User, Trash2, Mail, Code, CheckCircle, Pencil, EyeOff } from 'lucide-react';
import { motion } from "framer-motion";
import { THEMES } from '../config/themes';

const GLASS_CARD = "bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden";

const TeamView = ({ users, onAdd, onEdit, onDelete, currentUserId, userRole, theme }) => {
    const currentTheme = theme || THEMES.dark;

    // LÓGICA DE FILTRAGEM E SEGURANÇA
    const filteredUsers = users.filter(u => {
        // 1. Se quem está olhando é 'dev', vê tudo.
        if (userRole === 'dev') return true;

        // 2. Se quem está olhando é 'admin', NÃO vê 'dev'.
        if (userRole === 'admin' && u.role === 'dev') return false;

        // 3. Gestor vê os outros (mas não edita, tratado abaixo), ou ocultar devs também
        if (u.role === 'dev') return false;

        return true;
    });

    // Verifica se tem permissão de escrita (Só Admin e Dev podem editar/excluir)
    const canManage = userRole === 'admin' || userRole === 'dev';

    const getRoleStyle = (role) => {
        switch (role) {
            case 'admin': return { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Shield, label: 'Administrador' };
            case 'dev': return { color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: Code, label: 'Developer' };
            default: return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: User, label: 'Gestor' };
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Gest{'\u00E3'}o de Equipa</h1>
                    <p className="text-gray-400">Gerencie permiss{'\u00F5'}es e acesso ao sistema.</p>
                </div>

                {/* Botão Novo Membro: Só aparece se tiver permissão */}
                {canManage && (
                    <button
                        onClick={onAdd}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Novo Membro
                    </button>
                )}
            </div>

            <div className={GLASS_CARD}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <th className="p-6">Colaborador</th>
                                <th className="p-6">Email (Login)</th>
                                <th className="p-6 text-center">Fun{'\u00E7'}{'\u00E3'}o</th>
                                <th className="p-6 text-center">Permiss{'\u00F5'}es</th>
                                {/* Coluna Ações só aparece para quem pode gerenciar */}
                                {canManage && <th className="p-6 text-right">A{'\u00E7'}{'\u00F5'}es</th>}
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300 divide-y divide-white/5">
                            {filteredUsers.map((u, index) => {
                                const style = getRoleStyle(u.role);
                                const RoleIcon = style.icon;
                                const isMe = u.uid === currentUserId || u.email === currentUserId;

                                return (
                                    <motion.tr
                                        key={u.email || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-6 font-bold text-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 shadow-inner text-lg">
                                                {u.name?.[0]?.toUpperCase() || <User size={18} />}
                                            </div>
                                            {u.name}
                                            {isMe && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">Voc{'\u00EA'}</span>}
                                        </td>
                                        <td className="p-6"><div className="flex items-center gap-2 text-gray-400"><Mail size={14} /> {u.email}</div></td>
                                        <td className="p-6 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.color}`}>
                                                <RoleIcon size={14} /> {style.label}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center flex-wrap gap-1">
                                                {u.role === 'admin' || u.role === 'dev' ? (
                                                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20"><Shield size={12} /> Acesso Total</span>
                                                ) : (
                                                    Object.entries(u.permissions || {}).filter(([, active]) => active).map(([key]) => (
                                                        <span key={key} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-[10px] uppercase tracking-wide text-gray-400 flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> {key}</span>
                                                    ))
                                                )}
                                                {u.role === 'gestor' && (!u.permissions || Object.values(u.permissions).every(v => !v)) && <span className="text-xs text-red-400 italic">Sem acesso configurado</span>}
                                            </div>
                                        </td>

                                        {/* AÇÕES PROTEGIDAS */}
                                        {canManage && (
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Edição: Permitida */}
                                                    <button
                                                        onClick={() => onEdit(u)}
                                                        className="p-2 hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 rounded-lg transition-all group"
                                                        title="Editar Usuário"
                                                    >
                                                        <Pencil size={18} className="group-hover:scale-110 transition-transform" />
                                                    </button>

                                                    {/* Exclusão: Não pode apagar a si mesmo */}
                                                    {!isMe && (
                                                        <button
                                                            onClick={() => onDelete(u.uid || u.email, 'team_members')}
                                                            className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-all group"
                                                            title="Remover Usuário"
                                                        >
                                                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            <EyeOff size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhum membro visível para o seu nível de acesso.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamView;