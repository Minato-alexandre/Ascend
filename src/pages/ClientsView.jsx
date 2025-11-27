import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/UI';
import { ClientTable } from '../components/Lists';
import { THEMES } from '../config/themes';

const ClientsView = ({ clients, tasks, onAdd, onEdit, onDelete, onUpdate, onOpenReport, onAddSubtask, theme }) => {
    const currentTheme = theme || THEMES.dark;

    return (
        <div className="space-y-6 max-w-full mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Gestão de Clientes</h1>
                    <p className={`${currentTheme.muted} mt-1`}>Controle seus projetos de tráfego e domínios.</p>
                </div>
                <Button onClick={onAdd} theme={currentTheme}>
                    <Plus className="w-5 h-5 mr-2" /> Criar Projeto
                </Button>
            </div>

            <ClientTable
                clients={clients}
                tasks={tasks}
                onEdit={(item) => onEdit('clients', item)}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onOpenReport={onOpenReport}

                // Agora repassamos a função correta que veio do App.jsx
                onAddSubtask={onAddSubtask}

                theme={currentTheme}
            />
        </div>
    );
};

export default ClientsView;