import React from 'react';
import { Plus, Calendar, CheckSquare, AlertTriangle, DollarSign, FileSignature, Clock, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { THEMES } from '../config/themes';
import { formatCurrency, safeDate } from '../utils/format';

const GLASS_CARD = "bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden";

const TasksView = ({ tasks, onAdd, onEdit, onDelete, theme }) => {
    const currentTheme = theme || THEMES.dark;

    // Helper para badges de status/prioridade
    const getStatusBadge = (status, prioridade) => {
        if (status === 'concluida') return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-bold uppercase flex items-center gap-1"><CheckSquare size={12} /> Concluída</span>;
        if (prioridade === 'alta' || prioridade === 'urgente') return <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-xs font-bold uppercase flex items-center gap-1"><AlertTriangle size={12} /> Urgente</span>;
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold uppercase flex items-center gap-1"><Clock size={12} /> Em Andamento</span>;
    };

    return (
        <div className="space-y-8 max-w-full mx-auto">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Gestão de Tarefas</h1>
                    <p className="text-gray-400">Acompanhe entregas, contratos e prazos.</p>
                </div>
                <button
                    onClick={onAdd}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nova Tarefa
                </button>
            </div>

            {/* Tabela Glass */}
            <div className={GLASS_CARD}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <th className="p-6">Tarefa / Contrato</th>
                                <th className="p-6">Cliente</th>
                                <th className="p-6">Valor Contrato</th>
                                <th className="p-6">Data Entrega</th>
                                <th className="p-6">Assinado Por</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-300 divide-y divide-white/5">
                            {tasks.map((t, index) => (
                                <motion.tr
                                    key={t.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    {/* Tarefa */}
                                    <td className="p-6 font-bold text-white">
                                        {t.titulo}
                                        <div className="text-xs text-gray-500 font-mono mt-1">ID: {t.id.slice(0, 6)}</div>
                                    </td>

                                    {/* Cliente */}
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Briefcase size={14} className="text-orange-500" />
                                            {t.cliente_nome || <span className="text-gray-600 italic">Sem cliente</span>}
                                        </div>
                                    </td>

                                    {/* Valor (Novo Campo) */}
                                    <td className="p-6 font-mono text-emerald-400 font-bold">
                                        {t.valor_contrato ? formatCurrency(t.valor_contrato) : '-'}
                                    </td>

                                    {/* Data (Formatada dd-mm-yyyy) */}
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-400" />
                                            {t.data_entrega ? format(safeDate(t.data_entrega), 'dd/MM/yyyy') : '-'}
                                        </div>
                                    </td>

                                    {/* Assinatura (Novo Campo) */}
                                    <td className="p-6">
                                        {t.assinatura ? (
                                            <div className="flex items-center gap-2 text-gray-300" title="Assinado digitalmente">
                                                <FileSignature size={14} className="text-purple-400" />
                                                <span className="italic">{t.assinatura}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">Pendente</span>
                                        )}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="p-6 text-center">
                                        {getStatusBadge(t.status, t.prioridade)}
                                    </td>

                                    {/* Ações */}
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(t)} className="p-2 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => onDelete(t.id, 'tasks')} className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {tasks.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhuma tarefa ou contrato cadastrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TasksView;