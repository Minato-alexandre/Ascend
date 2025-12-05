import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { getDateRanges } from '../utils/format';

const DateFilter = ({ startDate, endDate, onRangeChange }) => {
    const ranges = getDateRanges();

    const applyQuickRange = (rangeKey) => {
        const { start, end } = ranges[rangeKey];
        // Converte para string YYYY-MM-DD para os inputs funcionarem bem
        const formatForInput = (d) => d.toISOString().split('T')[0];
        onRangeChange(formatForInput(start), formatForInput(end));
    };

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Título */}
                <div className="flex items-center gap-2 text-white/80 font-medium min-w-fit">
                    <Filter className="w-5 h-5 text-orange-500" />
                    <span>Filtrar Período:</span>
                </div>

                {/* Botões Rápidos */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {Object.entries(ranges).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => applyQuickRange(key)}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/50 text-gray-300 hover:text-white transition-all whitespace-nowrap"
                        >
                            {value.label}
                        </button>
                    ))}
                </div>

                {/* Seletores Manuais (Texto Alinhado à Direita) */}
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 shadow-inner">
                    
                    {/* Data Início */}
                    <div className="relative group">
                        {/* Ícone na esquerda */}
                        <Calendar className="w-4 h-4 text-orange-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => onRangeChange(e.target.value, endDate)}
                            // MUDANÇA: Adicionado 'text-right' e removido 'pl-16'
                            className="bg-transparent border-none text-white text-sm pr-2 py-2 focus:ring-0 w-40 [color-scheme:dark] cursor-pointer font-medium hover:bg-white/5 rounded-lg transition-colors text-right [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                        />
                    </div>

                    <span className="text-gray-500 font-bold text-xs">ATÉ</span>

                    {/* Data Fim */}
                    <div className="relative group">
                        {/* Ícone na esquerda */}
                        <Calendar className="w-4 h-4 text-orange-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => onRangeChange(startDate, e.target.value)}
                            // MUDANÇA: Adicionado 'text-right' e removido 'pl-16'
                            className="bg-transparent border-none text-white text-sm pr-2 py-2 focus:ring-0 w-40 [color-scheme:dark] cursor-pointer font-medium hover:bg-white/5 rounded-lg transition-colors text-right [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateFilter;