/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, User, Pencil, Trash2, RotateCcw, CheckCircle, Globe, Briefcase, Calendar, CheckSquare, Settings, ChevronRight, ChevronDown, MessageSquare, Activity, Thermometer, BarChart2, MessageCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge } from './UI';
import { formatCurrency, safeDate } from '../utils/format';
import { THEMES } from '../config/themes';

// --- LISTA DE TRANSAÇÕES (Mantido) ---
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
            className="bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-gray-200 w-full placeholder-gray-600"
            placeholder="Atribuir..."
        />
    </div>
);

// --- HELPER: QUICK EDIT INPUT (Com Menu Suspenso) ---
const QuickEditInput = ({ label, icon: Icon, value, onChange, options = [], type = "text" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const dropdownRef = useRef(null);

    useEffect(() => { setInputValue(value || ""); }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        setInputValue(opt.value);
        onChange(opt.value);
        setIsOpen(false);
    };

    const handleBlur = () => {
        setTimeout(() => { if (!isOpen) onChange(inputValue); }, 200);
    };

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors group relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                <Icon size={10} className="text-blue-400" /> {label}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleBlur}
                    onFocus={() => options.length > 0 && setIsOpen(true)}
                    className="bg-transparent border-none w-full text-sm font-semibold text-gray-200 p-0 focus:ring-0 placeholder-gray-700"
                    placeholder="Definir..."
                />
                {options.length > 0 && (
                    <button onClick={() => setIsOpen(!isOpen)} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 p-1">
                        <ChevronDown size={14} />
                    </button>
                )}
            </div>
            <AnimatePresence>
                {isOpen && options.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 right-0 top-full mt-2 bg-[#1e1e2e] border border-gray-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => handleSelect(opt)} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-xs font-medium text-gray-200 transition-colors border-b border-white/5 last:border-0">
                                <div className={`w-2 h-2 rounded-full ${opt.color}`} /> {opt.value}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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

                                        {visibleColumns.gestor && <td className="px-4 py-4"><UserCell value={c.gestor} onUpdate={(val) => onUpdate(c.id, 'gestor', val)} /></td>}

                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                                                <span>Progresso</span><span className={progress === 100 ? 'text-emerald-400' : 'text-blue-400'}>{Math.round(progress)}%</span>
                                            </div>
                                            <ProgressBar progress={progress} />
                                        </td>

                                        {visibleColumns.status && (
                                            <td className="px-4 py-4 text-center">
                                                <div className="relative inline-block group">
                                                    <select value={c.status} onChange={(e) => onUpdate(c.id, 'status', e.target.value)} className={`appearance-none pl-3 pr-8 py-1.5 rounded-full cursor-pointer text-[10px] font-bold uppercase tracking-wider border ${c.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-700 text-gray-400 border-gray-600'} hover:bg-opacity-20 outline-none transition-all`}>
                                                        <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                                </div>
                                            </td>
                                        )}

                                        {visibleColumns.acoes && (
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(c)} className={`p-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors`}><Pencil size={16} /></button>
                                                    <button onClick={() => onDelete(c.id, 'clients')} className={`p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors`}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-black/20 shadow-inner border-t border-white/5">
                                            <td colSpan={Object.keys(visibleColumns).length + 2} className="p-0">
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pl-12 pr-4 py-6 bg-gradient-to-b from-black/20 to-transparent">

                                                    {/* CAIXA DE ETIQUETAS (CORRIGIDO: REMOVIDO OVERFLOW-HIDDEN) */}
                                                    <div className="mb-6 bg-[#0F1115] rounded-xl border border-gray-800 p-4 shadow-inner grid grid-cols-4 gap-4 relative">
                                                        {/* Efeito visual de "Caixa dentro da Caixa" com cantos arredondados para não vazar */}
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl"></div>

                                                        <QuickEditInput label="Temperatura" icon={Thermometer} value={c.temperatura} onChange={(val) => onUpdate(c.id, 'temperatura', val)} options={[{ value: "Fluindo Bem", color: "bg-green-500" }, { value: "Encaixando", color: "bg-teal-500" }, { value: "Iniciando Projeto", color: "bg-pink-500" }, { value: "Precisa de Novas Estratégias", color: "bg-purple-500" }, { value: "Acompanhar", color: "bg-blue-500" }]} />
                                                        <QuickEditInput label="Otimização" icon={BarChart2} value={c.otimizacao} onChange={(val) => onUpdate(c.id, 'otimizacao', val)} options={[{ value: "Otimizada", color: "bg-emerald-500" }, { value: "Mensurar", color: "bg-rose-500" }, { value: "Parado", color: "bg-gray-500" }]} />
                                                        <QuickEditInput label="Data Otimização" icon={Clock} type="date" value={c.data_otimizacao} onChange={(val) => onUpdate(c.id, 'data_otimizacao', val)} />
                                                        <QuickEditInput label="Feedback" icon={MessageCircle} value={c.feedback} onChange={(val) => onUpdate(c.id, 'feedback', val)} options={[{ value: "Enviado WhatsApp", color: "bg-green-600" }, { value: "Planilha/Dash", color: "bg-orange-500" }, { value: "A fazer", color: "bg-gray-500" }, { value: "Feito", color: "bg-purple-500" }, { value: "Não Rodou", color: "bg-red-600" }]} />
                                                    </div>

                                                    {/* LISTA DE TAREFAS COMO CAIXAS/CARDS */}
                                                    <div className="border-l-2 border-gray-700 pl-4 ml-2">
                                                        {/* CABEÇALHO DAS TAREFAS */}
                                                        <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                                                            <div className="flex-1">Tarefa / Subelemento</div>
                                                            <div className="px-4 w-32">Responsável</div>
                                                            <div className="px-4 w-24 text-center">Status</div>
                                                            <div className="w-6"></div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            {clientTasks.length === 0 && (
                                                                <div className="p-4 text-center text-xs text-gray-500 italic border border-dashed border-gray-700 rounded-lg">Sem tarefas.</div>
                                                            )}

                                                            {clientTasks.map(task => (
                                                                <div
                                                                    key={task.id}
                                                                    onClick={() => onOpenReport(task)}
                                                                    className="group flex items-center justify-between bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/30 p-3 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md"
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'concluida' ? 'bg-emerald-500' : task.relatorio ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-sm font-medium ${task.status === 'concluida' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.titulo}</span>
                                                                            {task.relatorio && <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-0.5"><FileText size={10} /> Possui atualizações</div>}
                                                                        </div>
                                                                    </div>

                                                                    <div className="px-4 w-32">
                                                                        {task.assinatura ? (
                                                                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-[10px] text-gray-400 border border-white/5 w-fit">
                                                                                <User size={10} /> <span className="truncate max-w-[80px]">{task.assinatura}</span>
                                                                            </div>
                                                                        ) : <span className="text-gray-600 text-[10px]">-</span>}
                                                                    </div>

                                                                    <div className="px-4 w-24 text-center">
                                                                        <Badge variant={task.status === 'concluida' ? 'success' : 'gray'} className="text-[10px] px-2 py-0.5 uppercase tracking-wider">{task.status.replace('_', ' ')}</Badge>
                                                                    </div>

                                                                    <div className="w-6 text-right">
                                                                        <ChevronRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Botão Adicionar Nova Tarefa (EMBAIXO) */}
                                                        <button
                                                            onClick={() => onAddSubtask && onAddSubtask(c)}
                                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-2 font-medium px-4 py-3 rounded-lg hover:bg-blue-500/10 transition-all w-full border border-dashed border-blue-500/30 hover:border-blue-500/50 mt-3 justify-center"
                                                        >
                                                            + Adicionar nova tarefa
                                                        </button>
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