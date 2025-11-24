import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, ListTodo, Hourglass, CheckSquare, AlertTriangle, Activity, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from "framer-motion";
import { Badge, Button } from '../components/UI'; // Reaproveitando seus componentes
import { TransactionList } from '../components/Lists';
import { formatCurrency } from '../utils/format';
import { THEMES } from '../config/themes';

// --- ESTILOS VISUAIS (CONSTANTES) ---
// O segredo do "Blur" e do visual moderno está aqui
const GLASS_CARD = "bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl";
const GRADIENT_TEXT = "bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400";

// --- COMPONENTE: CARD DE ESTATÍSTICAS (Animado) ---
const StatsCard = ({ title, value, icon: Icon, color, trend, theme }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.3)" }} // Efeito Hover
        transition={{ duration: 0.3 }}
        className={`${GLASS_CARD} p-6 relative overflow-hidden group`}
    >
        {/* Luz de fundo (Glow) */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')} opacity-5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity duration-500`} />

        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className={`text-xs font-bold text-gray-400 uppercase tracking-widest mb-1`}>{title}</p>
                <h3 className={`text-3xl font-extrabold text-white mt-1 tracking-tight`}>{value}</h3>

                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold mt-3 py-1 px-2 rounded-full w-fit ${trend.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span>{trend.positive ? '↑' : '↓'}</span> {trend.text}
                    </div>
                )}
            </div>

            <div className={`p-3 rounded-xl border border-white/10 bg-white/5 shadow-inner`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </motion.div>
);

// --- COMPONENTE: CARD DE SALDO (Com barra de progresso moderna) ---
const BalanceCard = ({ summary, theme }) => {
    // Calcula porcentagem para a barra (evita divisão por zero)
    const totalMovimentado = summary.rec + summary.desp;
    const percentRec = totalMovimentado > 0 ? (summary.rec / totalMovimentado) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${GLASS_CARD} h-[400px] flex flex-col relative`}
        >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-500" /> Resumo Financeiro
                </h3>
            </div>

            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center relative z-10">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Saldo Líquido</p>
                <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className={`text-6xl font-black tracking-tighter mb-8 ${summary.saldo >= 0 ? 'text-white' : 'text-red-400'}`}
                >
                    {formatCurrency(summary.saldo)}
                </motion.p>

                {/* Barra de Progresso "Neon" */}
                <div className="w-full space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-gray-400">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div> Entradas</span>
                        <span className="flex items-center gap-1">Saídas <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div></span>
                    </div>

                    <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden relative border border-gray-700 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentRec}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative"
                        >
                            {/* Brilho na ponta da barra */}
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]" />
                        </motion.div>
                    </div>

                    <div className="flex justify-between text-sm font-medium text-white">
                        <span>{formatCurrency(summary.rec)}</span>
                        <span>{formatCurrency(summary.desp)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// --- VIEW PRINCIPAL ---
const DashboardView = ({ summary, transactions, tasks, onAdd, onEdit, onDelete, onMarkAsPaid, theme }) => {
    const currentTheme = theme || THEMES.dark;

    const taskSummary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'concluida').length;
        const pending = tasks.filter(t => t.status === 'pendente').length;
        const overdue = tasks.filter(t => (t.status === 'pendente' || t.status === 'em_andamento') && new Date(t.data_entrega) < new Date()).length; // Simplificado data
        return { total, completed, pending, overdue };
    }, [tasks]);

    // Dados para o gráfico (Exemplo simplificado - idealmente viria do backend agrupado por mês)
    const chartData = [
        { name: 'Semana 1', rec: summary.rec * 0.2, desp: summary.desp * 0.3 },
        { name: 'Semana 2', rec: summary.rec * 0.5, desp: summary.desp * 0.4 },
        { name: 'Semana 3', rec: summary.rec * 0.8, desp: summary.desp * 0.6 },
        { name: 'Atual', rec: summary.rec, desp: summary.desp },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className={`text-4xl font-black text-white tracking-tight mb-2`}>Dashboard</h1>
                    <p className="text-gray-400">Visão geral estratégica da sua operação.</p>
                </div>
                {/* Botão com gradiente */}
                <button onClick={() => onAdd('transactions')} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transform hover:-translate-y-1 transition-all flex items-center gap-2">
                    <PiggyBank className="w-5 h-5" /> Nova Transação
                </button>
            </div>

            {/* Grid de Cards Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Receitas Totais" value={formatCurrency(summary.rec)} icon={TrendingUp} color="text-emerald-400" trend={{ positive: true, text: "Entradas" }} theme={currentTheme} />
                <StatsCard title="Despesas Totais" value={formatCurrency(summary.desp)} icon={TrendingDown} color="text-red-400" trend={{ positive: false, text: "Saídas" }} theme={currentTheme} />
                <StatsCard title="Saldo em Caixa" value={formatCurrency(summary.saldo)} icon={Wallet} color="text-orange-400" theme={currentTheme} />
            </div>

            {/* Grid de Gráfico e Resumo */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${GLASS_CARD} h-[400px] flex flex-col`}
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" /> Fluxo de Caixa (Evolução)
                            </h3>
                        </div>
                        <div className="flex-1 p-4 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="#9CA3AF" tickFormatter={(v) => `R$ ${v / 1000}k`} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: '#4B5563', strokeWidth: 1, strokeDasharray: '5 5' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="rec" name="Receitas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                                    <Area type="monotone" dataKey="desp" name="Despesas" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDesp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
                <div className="lg:col-span-1">
                    <BalanceCard summary={summary} theme={currentTheme} />
                </div>
            </div>

            {/* Grid de Tarefas (Mini Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Tarefas Totais" value={taskSummary.total} icon={ListTodo} color="text-blue-400" theme={currentTheme} />
                <StatsCard title="Pendentes" value={taskSummary.pending} icon={Hourglass} color="text-amber-400" theme={currentTheme} />
                <StatsCard title="Concluídas" value={taskSummary.completed} icon={CheckSquare} color="text-emerald-400" theme={currentTheme} />
                <StatsCard title="Atrasadas" value={taskSummary.overdue} icon={AlertTriangle} color="text-red-400" trend={{ positive: false, text: "Urgente" }} theme={currentTheme} />
            </div>

            {/* Últimas Movimentações */}
            <div className={`${GLASS_CARD} p-6`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Últimas Movimentações</h2>
                    <button className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">Ver todas</button>
                </div>
                <TransactionList transactions={transactions} limit={5} onEdit={(i) => onEdit('transactions', i)} onDelete={(id) => onDelete(id, 'transactions')} onToggleStatus={onMarkAsPaid} theme={currentTheme} />
            </div>
        </div>
    );
};

export default DashboardView;