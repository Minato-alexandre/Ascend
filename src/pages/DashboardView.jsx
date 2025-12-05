import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, ListTodo, Hourglass, CheckSquare, AlertTriangle, Activity, Wallet, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from "framer-motion";
import { formatCurrency, filterByDateRange, getDateRanges } from '../utils/format';
import { THEMES } from '../config/themes';
import { addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// IMPORTANTE: Certifique-se que estes componentes existem
import { Badge, Button } from '../components/UI';
import { TransactionList } from '../components/Lists';
import DateFilter from '../components/DateFilter'; // O componente que criamos

// --- ESTILOS VISUAIS ---
const GLASS_CARD = "bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl";

// --- CARD DE ESTATÍSTICAS ---
const StatsCard = ({ title, value, icon: Icon, color, trend, theme }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.3)" }}
        transition={{ duration: 0.3 }}
        className={`${GLASS_CARD} p-6 relative overflow-hidden group`}
    >
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

// --- CARD DE SALDO ---
const BalanceCard = ({ summary, theme }) => {
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

// --- CARD DE PROJEÇÃO (NOVO) ---
const ProjectionCard = ({ projection }) => {
    const total = projection.expected + projection.realized;
    const percent = total > 0 ? Math.round((projection.realized / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${GLASS_CARD} p-6 relative overflow-hidden`}
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Performance de Contratos
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Comparativo: Recebido Mês Atual vs. A Vencer (30d)</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                    Eficiência: {percent}%
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="space-y-1">
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Recebido (Mês Atual)</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(projection.realized)}</p>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">A Vencer (Próx 30 dias)</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(projection.expected)}</p>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full opacity-50" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
        </motion.div>
    );
};

// --- VIEW PRINCIPAL ---
const DashboardView = ({ summary: initialSummary, transactions, tasks, onAdd, onEdit, onDelete, onMarkAsPaid, onDevSync, userRole, theme }) => {
    const currentTheme = theme || THEMES.dark;

    // 1. ESTADO DO FILTRO DE DATA
    // Iniciamos com o Mês Atual
    const defaultRange = getDateRanges().thisMonth;
    const [dateFilter, setDateFilter] = useState({
        start: defaultRange.start.toISOString().split('T')[0],
        end: defaultRange.end.toISOString().split('T')[0]
    });

    // 2. FILTRAR TRANSAÇÕES (CORREÇÃO CRÍTICA: Usando 'createdAt')
    const filteredTransactions = useMemo(() => {
        // ATENÇÃO: Se suas transações não aparecerem, é porque a data de criação delas está fora do mês atual.
        // Tente mudar o filtro no painel para "Ano Atual".
        return filterByDateRange(transactions, dateFilter.start, dateFilter.end, 'createdAt');
    }, [transactions, dateFilter]);

    // 3. CALCULAR RESUMO COM BASE NO FILTRO (CORREÇÃO CRÍTICA: Usando 'amount')
    const filteredSummary = useMemo(() => {
        console.log("Calculando resumo para:", filteredTransactions.length, "itens");

        return filteredTransactions.reduce((acc, curr) => {
            // 1. Pega o valor (tenta 'amount' primeiro, depois 'valor')
            const val = parseFloat(curr.amount || curr.valor) || 0;

            // 2. Normaliza o tipo (para minúsculo e sem espaços)
            const rawType = curr.type || curr.tipo || '';
            const tipo = rawType.toLowerCase().trim();

            console.log(`Item: ${val} | Tipo: ${tipo}`); // Debug no console

            // 3. Verifica se é receita
            if (tipo === 'receita' || tipo === 'income' || tipo === 'entrada') {
                acc.rec += val;
                acc.saldo += val;
            } else {
                // Se não for receita, assumimos que é despesa
                acc.desp += val;
                acc.saldo -= val;
            }
            return acc;
        }, { rec: 0, desp: 0, saldo: 0 });
    }, [filteredTransactions]);

    // 4. LÓGICA DO CARD DE PROJEÇÃO (CORREÇÃO CRÍTICA: Usando 'createdAt' e 'amount')
    const projectionData = useMemo(() => {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);
        const thirtyDaysFromNow = addDays(today, 30);

        // Recebido Real (Mês Atual)
        const realized = transactions
            .filter(t =>
                t.type === 'receita' &&
                (t.status === 'pago' || t.status === 'recebido') &&
                t.createdAt && // Verifica se existe data
                isWithinInterval(new Date(t.createdAt), { start: startOfCurrentMonth, end: endOfCurrentMonth })
            )
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        // A Vencer (Próximos 30 dias)
        const expected = transactions
            .filter(t => {
                const dateToCheck = t.data_vencimento ? new Date(t.data_vencimento) : (t.createdAt ? new Date(t.createdAt) : null);
                if (!dateToCheck) return false;

                return t.type === 'receita' &&
                    (t.status === 'pendente' || t.status === 'atrasado') &&
                    isWithinInterval(dateToCheck, { start: today, end: thirtyDaysFromNow });
            })
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        return { realized, expected };
    }, [transactions]);

    // 5. Dados de Tarefas
    const taskSummary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'concluida').length;
        const pending = tasks.filter(t => t.status === 'pendente').length;
        const overdue = tasks.filter(t => (t.status === 'pendente' || t.status === 'em_andamento') && new Date(t.data_entrega) < new Date()).length;
        return { total, completed, pending, overdue };
    }, [tasks]);

    // 6. Dados do Gráfico (Baseado no filtrado)
    const chartData = useMemo(() => {
        return [
            { name: 'Início', rec: filteredSummary.rec * 0.2, desp: filteredSummary.desp * 0.3 },
            { name: 'Meio', rec: filteredSummary.rec * 0.5, desp: filteredSummary.desp * 0.4 },
            { name: 'Fim', rec: filteredSummary.rec * 0.8, desp: filteredSummary.desp * 0.6 },
            { name: 'Total', rec: filteredSummary.rec, desp: filteredSummary.desp },
        ];
    }, [filteredSummary]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h1 className={`text-4xl font-black text-white tracking-tight mb-2`}>Dashboard</h1>
                    <p className="text-gray-400">Visão geral estratégica da sua operação.</p>
                </div>

                <div className="flex gap-3">
                    {userRole === 'dev' && (
                        <button
                            onClick={onDevSync}
                            className="px-4 py-3 bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-bold rounded-xl border border-blue-500/30 flex items-center gap-2 transition-all"
                        >
                            <RefreshCw className="w-5 h-5" /> Atualizar DB
                        </button>
                    )}

                    <button onClick={() => onAdd('transactions')} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transform hover:-translate-y-1 transition-all flex items-center gap-2">
                        <PiggyBank className="w-5 h-5" /> Nova Transação
                    </button>
                </div>
            </div>

            {/* FILTRO DE DATA */}
            <DateFilter
                startDate={dateFilter.start}
                endDate={dateFilter.end}
                onRangeChange={(start, end) => setDateFilter({ start, end })}
            />

            {/* Grid de Cards Financeiros (Usando dados filtrados) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Receitas do Período" value={formatCurrency(filteredSummary.rec)} icon={TrendingUp} color="text-emerald-400" trend={{ positive: true, text: "Entradas" }} theme={currentTheme} />
                <StatsCard title="Despesas do Período" value={formatCurrency(filteredSummary.desp)} icon={TrendingDown} color="text-red-400" trend={{ positive: false, text: "Saídas" }} theme={currentTheme} />
                <StatsCard title="Saldo do Período" value={formatCurrency(filteredSummary.saldo)} icon={Wallet} color="text-orange-400" theme={currentTheme} />
            </div>

            {/* CARD DE PROJEÇÃO (NOVO) */}
            <div className="mt-6">
                <ProjectionCard projection={projectionData} />
            </div>

            {/* Grid de Gráfico e Resumo */}
            <div className="grid lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${GLASS_CARD} h-[400px] flex flex-col`}
                    >
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" /> Fluxo de Caixa (Visualização)
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
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="rec" name="Receitas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                                    <Area type="monotone" dataKey="desp" name="Despesas" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDesp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
                <div className="lg:col-span-1">
                    <BalanceCard summary={filteredSummary} theme={currentTheme} />
                </div>
            </div>

            {/* Grid de Tarefas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <StatsCard title="Tarefas Totais" value={taskSummary.total} icon={ListTodo} color="text-blue-400" theme={currentTheme} />
                <StatsCard title="Pendentes" value={taskSummary.pending} icon={Hourglass} color="text-amber-400" theme={currentTheme} />
                <StatsCard title="Concluídas" value={taskSummary.completed} icon={CheckSquare} color="text-emerald-400" theme={currentTheme} />
                <StatsCard title="Atrasadas" value={taskSummary.overdue} icon={AlertTriangle} color="text-red-400" trend={{ positive: false, text: "Urgente" }} theme={currentTheme} />
            </div>

            {/* Últimas Movimentações */}
            <div className={`${GLASS_CARD} p-6 mt-6`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Movimentações do Período</h2>
                    <button className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">Ver todas</button>
                </div>
                <TransactionList transactions={filteredTransactions} limit={5} onEdit={(i) => onEdit('transactions', i)} onDelete={(id) => onDelete(id, 'transactions')} onToggleStatus={onMarkAsPaid} theme={currentTheme} />
            </div>
        </div>
    );
};

export default DashboardView;