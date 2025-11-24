/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, User, Pencil, Trash2, RotateCcw, CheckCircle, Globe, Briefcase, Calendar, CheckSquare, Settings, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from "framer-motion";
import { Button, Badge } from './UI';
import { formatCurrency, safeDate } from '../utils/format';
import { THEMES } from '../config/themes';

// --- LISTA DE TRANSAÇÕES ---
export const TransactionList = ({ transactions, onEdit, onDelete, onToggleStatus, theme, limit }) => {
    const currentTheme = theme || THEMES.dark;
    const displayList = limit ? transactions.slice(0, limit) : transactions;

    if (displayList.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><p className={currentTheme.muted}>Nenhuma transação.</p></div>;

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
                                        <Badge variant={isCompleted ? 'success' : t.isOverdue ? 'danger' : 'warning'} className="capitalize">{isCompleted ? 'Baixado' : t.isOverdue ? 'Atrasado' : t.status}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                                <span className={`font-bold text-lg ${t.type === 'receita' ? currentTheme.success : currentTheme.danger}`}>{t.type === 'receita' ? '+' : '-'} {formatCurrency(t.amount)}</span>
                                <div className="flex gap-2 items-center">
                                    {onToggleStatus && (<button onClick={() => onToggleStatus(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm ${isCompleted ? `bg-gray-600 text-white hover:bg-gray-700` : `bg-emerald-600 text-white hover:bg-emerald-700`}`} title={isCompleted ? "Estornar" : "Baixar"}>{isCompleted ? <RotateCcw size={16} /> : <CheckCircle size={16} />}</button>)}
                                    <div className="flex gap-1 ml-2"><Button variant="ghost" onClick={() => onEdit(t)} className="h-9 w-9 p-0" theme={currentTheme}><Pencil size={18} /></Button><Button variant="ghost" onClick={() => onDelete(t.id, 'transactions')} className={`h-9 w-9 p-0 ${currentTheme.danger}`} theme={currentTheme}><Trash2 size={18} /></Button></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// --- TABELA DE CLIENTES ---
export const ClientTable = ({ clients, onEdit, onDelete, theme, onUpdate }) => {
    const currentTheme = theme || THEMES.dark;
    const [visibleColumns, setVisibleColumns] = useState({ projeto: true, gestor: true, status: true, acoes: true });
    const [showCol, setShowCol] = useState(false);

    if (clients.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><Users className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhum cliente.</p></div>;

    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border}`}>
            <div className={`p-4 border-b ${currentTheme.border} flex justify-between items-center ${currentTheme.headerBg} rounded-t-xl`}>
                <h3 className={`font-semibold ${currentTheme.text}`}>Clientes ({clients.length})</h3>
                <div className="relative"><Button variant="outline" size="sm" onClick={() => setShowCol(!showCol)} className="text-xs"><Settings size={14} /> Colunas</Button>{showCol && <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 p-2 rounded shadow-xl z-20">{Object.keys(visibleColumns).map(k => <label key={k} className="flex items-center gap-2 p-1 text-sm text-white cursor-pointer"><input type="checkbox" checked={visibleColumns[k]} onChange={() => setVisibleColumns(p => ({ ...p, [k]: !p[k] }))} /> <span className="capitalize">{k}</span></label>)}</div>}</div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`${currentTheme.headerBg} ${currentTheme.muted} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}><tr>{visibleColumns.projeto && <th className="px-6 py-4">Projeto</th>}{visibleColumns.gestor && <th className="px-6 py-4">Gestor</th>}{visibleColumns.status && <th className="px-6 py-4 text-center">Status</th>}{visibleColumns.acoes && <th className="px-6 py-4 text-right">Ações</th>}</tr></thead>
                    <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                        {clients.map((c) => (
                            <tr key={c.id} className={`hover:${currentTheme.inputBg}`}>
                                {visibleColumns.projeto && <td className="px-6 py-4"><div className="flex items-center gap-2">{c.tipo === 'dominio' ? <Globe size={14} className="text-blue-400" /> : <Briefcase size={14} className="text-orange-400" />} <div><p className="font-bold">{c.nome_projeto}</p><p className={`text-xs ${currentTheme.muted}`}>ID: {c.id.slice(0, 6)}</p></div></div></td>}
                                {visibleColumns.gestor && <td className="px-6 py-4"><input type="text" defaultValue={c.gestor} onBlur={(e) => onUpdate(c.id, 'gestor', e.target.value)} className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-orange-500 outline-none w-full" placeholder="-" /></td>}
                                {visibleColumns.status && <td className="px-6 py-4 text-center"><div className="relative inline-block"><select value={c.status} onChange={(e) => onUpdate(c.id, 'status', e.target.value)} className="appearance-none bg-transparent pl-2 pr-6 py-1 rounded cursor-pointer text-xs font-bold uppercase border border-gray-700 hover:bg-gray-700/50"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div></td>}
                                {visibleColumns.acoes && <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(c)} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.primaryText} rounded`}><Pencil size={16} /></button><button onClick={() => onDelete(c.id, 'clients')} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.danger} rounded`}><Trash2 size={16} /></button></div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- TABELA DE TAREFAS ---
export const TaskTable = ({ tasks, onEdit, onDelete, theme }) => {
    const currentTheme = theme || THEMES.dark;
    if (tasks.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><CheckSquare className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhuma tarefa.</p></div>;

    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border} overflow-x-auto`}>
            <table className="w-full text-sm text-left">
                <thead className={`bg-gray-900 ${currentTheme.placeholder} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}><tr><th className="px-6 py-4">Tarefa</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Entrega</th><th className="px-6 py-4 text-center">Prioridade</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                    {tasks.map((t) => (
                        <tr key={t.id} className={`hover:${currentTheme.inputBg}`}>
                            <td className={`px-6 py-4 font-medium ${t.status === 'concluida' ? 'line-through opacity-50' : ''}`}>{t.titulo}</td>
                            <td className={`px-6 py-4 ${currentTheme.muted}`}>{t.cliente_nome}</td>
                            <td className={`px-6 py-4 ${currentTheme.muted}`}>{t.data_entrega ? format(safeDate(t.data_entrega), 'dd/MM/yyyy') : '-'}</td>
                            <td className="px-6 py-4 text-center"><Badge variant={t.prioridade === 'urgente' ? 'danger' : t.prioridade === 'alta' ? 'warning' : 'blue'}>{t.prioridade}</Badge></td>
                            <td className="px-6 py-4 text-center"><Badge variant={t.status === 'concluida' ? 'success' : 'gray'}>{t.status}</Badge></td>
                            <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEdit(t)} className="p-1.5 hover:bg-gray-800 text-orange-500 rounded"><Pencil size={16} /></button><button onClick={() => onDelete(t.id, 'tasks')} className="p-1.5 hover:bg-gray-800 text-red-500 rounded"><Trash2 size={16} /></button></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- TABELA DE EQUIPA ---
export const TeamView = ({ users, onDelete, theme }) => {
    const currentTheme = theme || THEMES.dark;
    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border} overflow-x-auto`}>
            <table className="w-full text-sm text-left">
                <thead className={`bg-gray-900 ${currentTheme.placeholder} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Email</th><th className="px-6 py-4 text-center">Função</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
                <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                    {users.map(u => (<tr key={u.email} className={`hover:${currentTheme.inputBg}`}><td className="px-6 py-4 font-medium">{u.name}</td><td className={`px-6 py-4 ${currentTheme.muted}`}>{u.email}</td><td className="px-6 py-4 text-center"><Badge variant={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td><td className="px-6 py-4 text-right"><button onClick={() => onDelete(u.email, 'team_members')} className={`p-1.5 hover:${currentTheme.inputBg} ${currentTheme.danger} rounded`}><Trash2 size={16} /></button></td></tr>))}
                </tbody>
            </table>
        </div>
    );
};