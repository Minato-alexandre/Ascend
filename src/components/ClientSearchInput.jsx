import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input, Badge } from './UI';
import { THEMES } from '../config/themes';

const ClientSearchInput = ({ clients, selectedId, onSelect, theme }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const currentTheme = theme || THEMES.dark;

    // Sincroniza o texto do input com o ID selecionado externamente
    useEffect(() => {
        if (selectedId) {
            const client = clients.find(c => c.id === selectedId);
            if (client && search !== client.nome_projeto) {
                setSearch(client.nome_projeto);
            }
        } else {
            // Limpa o input se a seleção for removida externamente
            if (selectedId === null && search !== '' && !isOpen) {
                setSearch('');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, clients]);

    const filteredClients = clients.filter(c =>
        c.nome_projeto.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (client) => {
        onSelect(client);
        setSearch(client.nome_projeto);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect(null);
        setSearch('');
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        if (e.target.value === '') onSelect(null);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Digite o nome ou ID..."
                    className="pr-8"
                    theme={currentTheme}
                />
                {selectedId && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 ${currentTheme.muted} hover:text-red-400`}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                    <div className={`absolute z-[70] w-full mt-1 ${currentTheme.cardBg} border ${currentTheme.border} rounded-md shadow-2xl max-h-60 overflow-auto`}>
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    className={`p-3 hover:${currentTheme.inputBg} cursor-pointer border-b ${currentTheme.border} last:border-0 flex justify-between items-center group`}
                                    onClick={() => handleSelect(client)}
                                >
                                    <div>
                                        <div className={`font-medium ${currentTheme.text}`}>{client.nome_projeto}</div>
                                        <div className={`text-xs ${currentTheme.muted}`}>ID: {client.id.slice(0, 6)}...</div>
                                    </div>
                                    <Badge variant={client.tipo === 'dominio' ? 'blue' : 'orange'} className="text-[10px]">
                                        {client.tipo === 'dominio' ? 'Domínio' : 'Tráfego'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className={`p-3 text-sm ${currentTheme.muted} text-center`}>
                                {search ? "Nenhum cliente encontrado." : "Digite para buscar..."}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ClientSearchInput;