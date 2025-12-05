import {
    isBefore,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays,
    isWithinInterval
} from 'date-fns';

export const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const safeDate = (dateInput) => {
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

export const checkIsOverdue = (dateString) => {
    if (!dateString) return false;
    return isBefore(safeDate(dateString), startOfDay(new Date()));
};

// --- MÁSCARA CORRIGIDA COM LIMITE RÍGIDO ---
export const formatCurrencyInput = (value) => {
    // 1. Remove tudo que não é número
    let v = value.replace(/\D/g, "");

    // 2. TRAVA DE SEGURANÇA (14 dígitos = 999 Bilhões e 99 centavos)
    if (v.length > 14) {
        v = v.slice(0, 14);
    }

    // 3. Se estiver vazio
    if (!v) return "";

    // 4. Matemática dos centavos
    v = (Number(v) / 100).toFixed(2) + "";

    // 5. Formatação Brasileira (RegEx)
    v = v.replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3})(\d{3}),/g, "$1.$2.$3.$4,"); // Bilhão
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,"); // Milhão
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,"); // Milhar

    return `R$ ${v}`;
};

export const parseCurrencyInput = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleanValue = value.replace("R$", "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanValue);
};

export const getDateRanges = () => {
    const today = new Date();
    return {
        thisMonth: {
            start: startOfMonth(today),
            end: endOfMonth(today),
            label: 'Mês Atual'
        },
        thisYear: {
            start: startOfYear(today),
            end: endOfYear(today),
            label: 'Ano Atual'
        },
        last30Days: {
            start: subDays(today, 30),
            end: today,
            label: 'Últimos 30 dias'
        }
    };
};

export const filterByDateRange = (items, startDate, endDate, dateField = 'data') => {
    if (!startDate || !endDate) return items;

    // safeDate é uma função que já existia no seu código, certifique-se de que ela está acessível aqui
    const start = startOfDay(safeDate(startDate));
    const end = endOfDay(safeDate(endDate));

    return items.filter(item => {
        const itemDate = safeDate(item[dateField]);
        return isWithinInterval(itemDate, { start, end });
    });
};