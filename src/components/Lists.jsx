/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, User, Pencil, Trash2, RotateCcw, CheckCircle, Globe, Briefcase, Calendar, CheckSquare, Settings, ChevronRight, ChevronDown, MessageSquare, Activity } from 'lucide-react';
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

// --- HELPER: BARRA DE PROGRESSO ---
const ProgressBar = ({ progress }) => (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2 border border-white/5">
        <div
            className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-600'}`}
            style={{ width: `${progress}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
    </div>
);

// --- HELPER: USER PILL ---
const UserCell = ({ value, onUpdate }) => (
    <div className="flex items-center gap-3 group p-1 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-text relative">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold shadow-sm ring-2 ring-black">
            {value ? value[0].toUpperCase() : <User size={12} />}
        </div>
        <input
            type="text"
            defaultValue={value}
            onBlur={(e) => onUpdate(e.target.value)}
            className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-200 w-full placeholder-gray-600"
            placeholder="Atribuir..."
        />
        <Pencil size={10} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
    </div>
);

// --- TABELA DE CLIENTES ---
export const ClientTable = ({ clients, tasks = [], onEdit, onDelete, onUpdate, onOpenReport, onAddSubtask, theme }) => {
    const currentTheme = theme || THEMES.dark;
    const [visibleColumns, setVisibleColumns] = useState({ projeto: true, gestor: true, status: true, acoes: true });
    const [showCol, setShowCol] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (clientId) => {
        setExpandedRows(prev => ({ ...prev, [clientId]: !prev[clientId] }));
    };

    if (clients.length === 0) return <div className={`text-center py-12 ${currentTheme.cardBg}/50 rounded-xl border border-dashed ${currentTheme.border}`}><Users className={`w-12 h-12 ${currentTheme.cardBg} rounded-full p-2 mx-auto mb-3 ${currentTheme.placeholder}`} /><p className={currentTheme.muted}>Nenhum cliente.</p></div>;

    return (
        <div className={`${currentTheme.cardBg} rounded-xl shadow-xl border ${currentTheme.border} overflow-hidden`}>
            {/* HEADER DA TABELA */}
            <div className={`p-4 border-b ${currentTheme.border} flex justify-between items-center ${currentTheme.headerBg}`}>
                <h3 className={`font-semibold ${currentTheme.text}`}>Clientes ({clients.length})</h3>
                <div className="relative">
                    <Button variant="outline" size="sm" onClick={() => setShowCol(!showCol)} className="text-xs"><Settings size={14} /> Colunas</Button>
                    {showCol && <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 p-2 rounded shadow-xl z-20">{Object.keys(visibleColumns).map(k => <label key={k} className="flex items-center gap-2 p-1 text-sm text-white cursor-pointer"><input type="checkbox" checked={visibleColumns[k]} onChange={() => setVisibleColumns(p => ({ ...p, [k]: !p[k] }))} /> <span className="capitalize">{k}</span></label>)}</div>}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className={`${currentTheme.headerBg} ${currentTheme.muted} uppercase text-xs font-bold tracking-wider border-b ${currentTheme.border}`}>
                        <tr>
                            <th className="w-10 py-4 pl-4"></th>
                            {visibleColumns.projeto && <th className="px-4 py-4">Projeto</th>}
                            {visibleColumns.gestor && <th className="px-4 py-4 w-1/6">Gestor</th>}
                            <th className="px-4 py-4 w-1/4">Progresso</th>
                            {visibleColumns.status && <th className="px-4 py-4 text-center">Status</th>}
                            {visibleColumns.acoes && <th className="px-4 py-4 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${currentTheme.border} ${currentTheme.text}`}>
                        {clients.map((c) => {
                            const clientTasks = tasks.filter(t => t.cliente_id === c.id);
                            const completedTasks = clientTasks.filter(t => t.status === 'concluida').length;
                            const progress = clientTasks.length > 0 ? (completedTasks / clientTasks.length) * 100 : 0;
                            const isExpanded = expandedRows[c.id];

                            return (
                                <React.Fragment key={c.id}>
                                    {/* LINHA PRINCIPAL (CLIENTE) */}
                                    <tr className={`hover:${currentTheme.inputBg} transition-colors ${isExpanded ? 'bg-white/5' : ''}`}>
                                        <td className="pl-4 py-4 cursor-pointer text-center" onClick={() => toggleRow(c.id)}>
                                            {isExpanded ? <ChevronDown size={18} className="text-blue-400 mx-auto" /> : <ChevronRight size={18} className={`${currentTheme.muted} mx-auto`} />}
                                        </td>

                                        {visibleColumns.projeto && (
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => toggleRow(c.id)}>
                                                    <div className={`p-2 rounded-lg ${c.tipo === 'dominio' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'} border border-white/5 group-hover:scale-110 transition-transform`}>
                                                        {c.tipo === 'dominio' ? <Globe size={16} /> : <Briefcase size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{c.nome_projeto}</p>
                                                        <p className={`text-[10px] ${currentTheme.muted} uppercase tracking-wide`}>{clientTasks.length} Subelementos</p>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.gestor && (
                                            <td className="px-4 py-4">
                                                <UserCell value={c.gestor} onUpdate={(val) => onUpdate(c.id, 'gestor', val)} />
                                            </td>
                                        )}

                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                                                <span>Progresso</span>
                                                <span className={progress === 100 ? 'text-emerald-400' : 'text-blue-400'}>{Math.round(progress)}%</span>
                                            </div>
                                            <ProgressBar progress={progress} />
                                        </td>

                                        {visibleColumns.status && (
                                            <td className="px-4 py-4 text-center">
                                                <div className="relative inline-block group">
                                                    <select
                                                        value={c.status}
                                                        onChange={(e) => onUpdate(c.id, 'status', e.target.value)}
                                                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-full cursor-pointer text-[10px] font-bold uppercase tracking-wider border ${c.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-700 text-gray-400 border-gray-600'} hover:bg-opacity-20 outline-none transition-all`}
                                                    >
                                                        <option value="ativo">Ativo</option>
                                                        <option value="inativo">Inativo</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.acoes && (
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(c)} className={`p-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors`} title="Editar">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => onDelete(c.id, 'clients')} className={`p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors`} title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                    {/* LINHAS DE SUBTAREFAS (EXPANSÃO) */}
                                    {isExpanded && (
                                        <tr className="bg-black/20 shadow-inner border-t border-white/5">
                                            <td colSpan={Object.keys(visibleColumns).length + 2} className="p-0">
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-12 pr-4 py-4 bg-gradient-to-b from-black/20 to-transparent">
                                                    <div className="border-l-2 border-gray-700 pl-4">
                                                        <table className="w-full">
                                                            <tbody className="divide-y divide-white/5">
                                                                {/* Botão Adicionar Subelemento */}
                                                                <tr>
                                                                    <td colSpan="4" className="p-2 pl-4">
                                                                        <button
                                                                            // AQUI ESTÁ O FIX: Garante que chamamos a função correta com o objeto do cliente
                                                                            onClick={() => onAddSubtask && onAddSubtask(c)}
                                                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                                                                        >
                                                                            + Adicionar subelemento
                                                                        </button>
                                                                    </td>
                                                                </tr>

                                                                {clientTasks.length === 0 && (
                                                                    <tr><td colSpan="4" className="p-4 text-center text-xs text-gray-500 italic">Sem tarefas vinculadas.</td></tr>
                                                                )}

                                                                {clientTasks.map(task => (
                                                                    <tr key={task.id} className="hover:bg-white/5 group transition-colors">
                                                                        <td className="py-3 pl-2 w-1/2">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-2 h-2 rounded-full ${task.status === 'concluida' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-600'}`} />
                                                                                <span className={`text-sm font-medium ${task.status === 'concluida' ? 'line-through text-gray-500' : 'text-gray-300'}`}>{task.titulo}</span>
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-2" title={task.assinatura || "Sem dono"}>
                                                                                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] border border-gray-700 text-gray-400">
                                                                                    {task.assinatura?.[0] || <User size={12} />}
                                                                                </div>
                                                                                {task.assinatura && <span className="text-xs text-gray-500">{task.assinatura}</span>}
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-4 py-3 text-center">
                                                                            <Badge variant={task.status === 'concluida' ? 'success' : 'gray'} className="text-[10px] px-2 py-0.5 uppercase tracking-wider">{task.status.replace('_', ' ')}</Badge>
                                                                        </td>

                                                                        <td className="px-4 py-3 text-right">
                                                                            <button
                                                                                onClick={() => onOpenReport(task)}
                                                                                className={`relative p-2 rounded-full transition-all ${task.relatorio ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500 hover:text-blue-400 hover:bg-white/5'}`}
                                                                                title="Relatório / Updates"
                                                                            >
                                                                                <MessageSquare size={16} />
                                                                                {task.relatorio && <span className="absolute top-0 right-0 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span></span>}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- TAREFAS E EQUIPA (Mantidos iguais) ---
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