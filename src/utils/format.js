import { isBefore, startOfDay } from 'date-fns';

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