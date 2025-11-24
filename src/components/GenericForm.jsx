import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Input, Select, Label, Button } from './UI';
import ClientSearchInput from './ClientSearchInput';
import { THEMES } from '../config/themes';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/format';

const DEFAULTS = {
    transaction: { type: 'despesa', category: 'outras', date: new Date().toISOString().substring(0, 10), status: 'pendente', amount: '' },
    client: { tipo: 'trafego', status: 'ativo', prioridade: 'media', orcamento_facebook: '', orcamento_google: '' },
    task: { status: 'pendente', prioridade: 'media', data_entrega: new Date().toISOString().substring(0, 10), valor_contrato: 0, assinatura: '' },
    user: { role: 'gestor', permissions: { dashboard: true, financeiro: false, clientes: true, tarefas: true } }
};

const GenericForm = ({ type, initialData, onSubmit, onCancel, onResetPassword, currentUserRole, clients = [], theme }) => {
    const currentTheme = theme || THEMES.dark;
    const [formData, setFormData] = useState(initialData || (
        type === 'transactions' ? DEFAULTS.transaction :
            type === 'clients' ? DEFAULTS.client :
                type === 'users' ? DEFAULTS.user : DEFAULTS.task
    ));
    const [keepOpen, setKeepOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        if (name.startsWith('perm_')) {
            const permName = name.replace('perm_', '');
            setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [permName]: checked } }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanData = { ...formData };

        if (type === 'tasks' && typeof cleanData.valor_contrato === 'string') {
            cleanData.valor_contrato = parseCurrencyInput(cleanData.valor_contrato);
        }

        await onSubmit(cleanData, keepOpen);

        if (keepOpen && !initialData) {
            setFormData(type === 'transactions' ? DEFAULTS.transaction : type === 'clients' ? DEFAULTS.client : type === 'users' ? DEFAULTS.user : DEFAULTS.task);
        }
    };

    // --- TRANSAÇÕES ---
    if (type === 'transactions') return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Tipo</Label>
                    <Select name="type" value={formData.type} onChange={handleChange} theme={currentTheme}>
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                    </Select>
                </div>
                <div>
                    <Label theme={currentTheme}>Valor</Label>
                    <Input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required placeholder="0,00" theme={currentTheme} />
                </div>
            </div>
            <div>
                <Label theme={currentTheme}>Vincular Cliente</Label>
                <ClientSearchInput clients={clients} selectedId={formData.clientId} onSelect={(c) => setFormData({ ...formData, clientId: c?.id || '', clientName: c?.nome_projeto || '' })} theme={currentTheme} />
            </div>
            <div>
                <Label theme={currentTheme}>Descrição</Label>
                <Input name="description" value={formData.description} onChange={handleChange} required theme={currentTheme} />
            </div>
            <div>
                <Label theme={currentTheme}>Categoria</Label>
                <Select name="category" value={formData.category} onChange={handleChange} theme={currentTheme}>
                    <option value="vendas">Vendas</option>
                    <option value="servicos">Serviços</option>
                    <option value="marketing">Marketing</option>
                    <option value="outras">Outras</option>
                </Select>
            </div>
            <div>
                <Label theme={currentTheme}>Data</Label>
                <Input name="date" type="date" value={formData.date} onChange={handleChange} theme={currentTheme} />
            </div>
            <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-700">
                {!initialData && (
                    <label className={`flex items-center gap-2 text-sm ${currentTheme.muted} cursor-pointer`}>
                        <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="rounded text-orange-500" /> Criar outro em seguida
                    </label>
                )}
                <div className="flex gap-3 ml-auto">
                    <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                    <Button type="submit" theme={currentTheme}>Salvar</Button>
                </div>
            </div>
        </form>
    );

    // --- CLIENTES ---
    if (type === 'clients') return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Tipo</Label>
                    <Select name="type" value={formData.type} onChange={handleChange} theme={currentTheme}>
                        <option value="trafego">Tráfego Pago</option>
                        <option value="dominio">Domínio</option>
                    </Select>
                </div>
                <div>
                    <Label theme={currentTheme}>Status</Label>
                    <Select name="status" value={formData.status} onChange={handleChange} theme={currentTheme}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </Select>
                </div>
            </div>
            <div>
                <Label theme={currentTheme}>Nome Projeto</Label>
                <Input name="nome_projeto" value={formData.nome_projeto} onChange={handleChange} required theme={currentTheme} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Gestor</Label>
                    <Input name="gestor" value={formData.gestor} onChange={handleChange} theme={currentTheme} />
                </div>
                <div>
                    <Label theme={currentTheme}>Nicho</Label>
                    <Input name="nicho" value={formData.nicho} onChange={handleChange} theme={currentTheme} />
                </div>
            </div>
            {formData.tipo === 'trafego' ? (
                <div className="grid grid-cols-2 gap-4 p-3 rounded border border-gray-700 bg-gray-900/50">
                    <div>
                        <Label theme={currentTheme}>Orç. Face</Label>
                        <Input name="orcamento_facebook" type="number" value={formData.orcamento_facebook} onChange={handleChange} theme={currentTheme} />
                    </div>
                    <div>
                        <Label theme={currentTheme}>Orç. Google</Label>
                        <Input name="orcamento_google" type="number" value={formData.orcamento_google} onChange={handleChange} theme={currentTheme} />
                    </div>
                </div>
            ) : (
                <div>
                    <Label theme={currentTheme}>Vencimento Domínio</Label>
                    <Input name="data_vencimento_dominio" type="date" value={formData.data_vencimento_dominio} onChange={handleChange} theme={currentTheme} />
                </div>
            )}
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button type="submit" theme={currentTheme}>Salvar</Button>
            </div>
        </form>
    );

    // --- TAREFAS ---
    if (type === 'tasks') return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label theme={currentTheme}>Título da Tarefa / Contrato</Label>
                <Input name="titulo" value={formData.titulo} onChange={handleChange} required theme={currentTheme} placeholder="Ex: Desenvolvimento de Site" />
            </div>

            <div>
                <Label theme={currentTheme}>Cliente Vinculado</Label>
                <ClientSearchInput clients={clients} selectedId={formData.cliente_id} onSelect={(c) => setFormData({ ...formData, cliente_id: c?.id || '', cliente_nome: c?.nome_projeto || '' })} theme={currentTheme} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Valor do Contrato</Label>
                    <Input
                        name="valor_contrato"
                        value={typeof formData.valor_contrato === 'number' ? formatCurrency(formData.valor_contrato) : (formData.valor_contrato || '')}
                        onChange={(e) => {
                            const masked = formatCurrencyInput(e.target.value);
                            setFormData({ ...formData, valor_contrato: masked });
                        }}
                        placeholder="R$ 0,00"
                        theme={currentTheme}
                    />
                </div>
                <div>
                    <Label theme={currentTheme}>Data de Entrega</Label>
                    <Input name="data_entrega" type="date" value={formData.data_entrega} onChange={handleChange} theme={currentTheme} style={{ colorScheme: 'dark' }} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Assinado Por</Label>
                    <Input name="assinatura" value={formData.assinatura || ''} onChange={handleChange} placeholder="Nome do responsável" theme={currentTheme} />
                </div>
                <div>
                    <Label theme={currentTheme}>Prioridade</Label>
                    <Select name="prioridade" value={formData.prioridade} onChange={handleChange} theme={currentTheme}>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                    </Select>
                </div>
            </div>

            <div>
                <Label theme={currentTheme}>Status Atual</Label>
                <Select name="status" value={formData.status} onChange={handleChange} theme={currentTheme}>
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                </Select>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button
                    type="submit"
                    theme={currentTheme}
                    onClick={(e) => {
                        e.preventDefault();
                        const cleanData = { ...formData };
                        if (cleanData.valor_contrato && typeof cleanData.valor_contrato === 'string') {
                            cleanData.valor_contrato = parseCurrencyInput(cleanData.valor_contrato);
                        }
                        onSubmit(cleanData, keepOpen);
                    }}
                >
                    Salvar
                </Button>
            </div>
        </form>
    );

    // --- USUÁRIOS ---
    if (type === 'users') return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <Label theme={currentTheme}>Nome do Colaborador</Label>
                <Input name="name" value={formData.name} onChange={handleChange} required theme={currentTheme} />
            </div>
            <div>
                <Label theme={currentTheme}>Email (Login)</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required theme={currentTheme} />
            </div>

            <div>
                <Label theme={currentTheme}>Função</Label>
                <Select name="role" value={formData.role} onChange={handleChange} theme={currentTheme}>
                    <option value="gestor">Gestor (Acesso Limitado)</option>
                    {(currentUserRole === 'admin' || currentUserRole === 'dev') && (
                        <>
                            <option value="admin">Administrador (Acesso Total)</option>
                            <option value="dev">Desenvolvedor (Super User)</option>
                        </>
                    )}
                </Select>
            </div>

            {formData.role !== 'admin' && formData.role !== 'dev' && (
                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50">
                    <Label theme={currentTheme}>Permissões</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        {['dashboard', 'financeiro', 'clientes', 'tarefas'].map(p => (
                            <label key={p} className={`flex items-center gap-3 cursor-pointer`}>
                                <input type="checkbox" name={`perm_${p}`} checked={formData.permissions?.[p]} onChange={handleChange} className="w-4 h-4 rounded text-orange-500 bg-gray-800 border-gray-600" />
                                <span className="capitalize text-sm text-gray-300">{p}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {initialData && (currentUserRole === 'admin' || currentUserRole === 'dev') && (
                <div className="p-4 mt-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-yellow-200 font-bold flex items-center gap-2">
                            <Lock size={14} /> Segurança
                        </p>
                        <p className="text-xs text-yellow-500/80 mt-1">
                            Enviar e-mail para o usuário redefinir a senha.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onResetPassword(formData.email)}
                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded border border-yellow-500/20 transition-colors"
                    >
                        Redefinir Senha
                    </button>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button type="submit" theme={currentTheme}>Salvar</Button>
            </div>
        </form>
    );

    return null;
};

export default GenericForm;