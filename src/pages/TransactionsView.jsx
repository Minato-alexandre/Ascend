import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/UI';
import { TransactionList } from '../components/Lists';
import { THEMES } from '../config/themes';

const TransactionsView = ({ transactions, onAdd, onEdit, onDelete, onToggleStatus, theme }) => {
    const currentTheme = theme || THEMES.dark;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                {/* Título limpo */}
                <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Financeiro</h1>

                {/* Botão com acentuação correta */}
                <Button onClick={onAdd} theme={currentTheme}>
                    <Plus className="w-5 h-5 mr-2" /> Nova Transação
                </Button>
            </div>

            <TransactionList
                transactions={transactions}
                onEdit={(item) => onEdit('transactions', item)}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                theme={currentTheme}
            />
        </div>
    );
};

export default TransactionsView;