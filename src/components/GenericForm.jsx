import React, { useState } from 'react';
import { Lock, Briefcase, DollarSign, Tag, ChevronDown, Plus } from 'lucide-react';
import { Input, Select, Label, Button } from './UI';
import ClientSearchInput from './ClientSearchInput';
import { THEMES } from '../config/themes';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/format';

const DEFAULTS = {
    transaction: { type: 'despesa', category: 'outras', date: new Date().toISOString().substring(0, 10), status: 'pendente', amount: '' },
    client: {
        tipo: 'trafego',
        status: 'ativo',
        nome_projeto: '',
        valor_contrato: '',
        orcamento_facebook: '',
        orcamento_google: '',
        gestor: '',
        nicho: '',
        temperatura: 'Fluindo Bem',
        otimizacao: 'Otimizada',
        data_otimizacao: new Date().toISOString().substring(0, 10),
        feedback: 'A fazer'
    },
    task: { status: 'pendente', prioridade: 'media', data_entrega: new Date().toISOString().substring(0, 10), assinatura: '' },
    user: { role: 'gestor', permissions: { dashboard: true, financeiro: false, clientes: true, tarefas: true } }
};

const SectionTitle = ({ icon: Icon, children, theme }) => (
    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${theme.muted} mb-3 mt-2 border-b ${theme.border} pb-2`}>
        <Icon size={14} /> {children}
    </div>
);

// --- COMPONENTE: INPUT COM SUGESTÕES VISUAIS ---
const SuggestionInput = ({ label, name, value, onChange, theme, options = [] }) => {
    const [showOptions, setShowOptions] = useState(false);

    const handleSelect = (val) => {
        onChange({ target: { name, value: val } }); // Simula evento nativo
        setShowOptions(false);
    };

    return (
        <div className="relative">
            <Label theme={theme}>{label}</Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        name={name}
                        value={value}
                        onChange={onChange}
                        theme={theme}
                        placeholder="Selecione ou digite..."
                        autoComplete="off"
                        onFocus={() => setShowOptions(true)}
                    />
                    {/* Botão Seta para forçar abrir */}
                    <button
                        type="button"
                        onClick={() => setShowOptions(!showOptions)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 ${theme.muted}`}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* MENU DE OPÇÕES FLUTUANTE */}
            {showOptions && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                    <div className={`absolute z-20 w-full mt-1 bg-gray-900 border ${theme.border} rounded-lg shadow-xl max-h-48 overflow-y-auto p-1`}>
                        {options.map((opt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm flex items-center gap-2 transition-colors"
                            >
                                <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                <span className={theme.text}>{opt.value}</span>
                            </button>
                        ))}
                        <div className={`px-3 py-2 text-xs ${theme.muted} border-t ${theme.border} mt-1`}>
                            <Plus size={10} className="inline mr-1" /> Digite no campo para criar novo
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const GenericForm = ({ type, initialData, onSubmit, onCancel, onResetPassword, currentUserRole, clients = [], theme }) => {
    const currentTheme = theme || THEMES.dark;

    const [formData, setFormData] = useState(() => {
        const defaultValues = type === 'transactions' ? DEFAULTS.transaction :
            type === 'clients' ? DEFAULTS.client :
                type === 'users' ? DEFAULTS.user : DEFAULTS.task;
        return { ...defaultValues, ...initialData };
    });

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

        if (typeof cleanData.valor_contrato === 'string') {
            cleanData.valor_contrato = parseCurrencyInput(cleanData.valor_contrato);
        }

        await onSubmit(cleanData, keepOpen);

        if (keepOpen) {
            const defaults = type === 'transactions' ? DEFAULTS.transaction : type === 'clients' ? DEFAULTS.client : type === 'users' ? DEFAULTS.user : DEFAULTS.task;
            if (type === 'tasks' && formData.cliente_id) {
                setFormData({ ...defaults, cliente_id: formData.cliente_id, cliente_nome: formData.cliente_nome });
            } else {
                setFormData(defaults);
            }
        }
    };

    // --- TRANSAÇÕES (Mantido) ---
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button type="submit" theme={currentTheme}>Salvar</Button>
            </div>
        </form>
    );

    // --- CLIENTES (ATUALIZADO COM SUGGESTION INPUT) ---
    if (type === 'clients') return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div>
                <SectionTitle icon={Briefcase} theme={currentTheme}>Dados do Projeto</SectionTitle>
                <div className="space-y-4">
                    <div>
                        <Label theme={currentTheme}>Nome do Projeto / Empresa</Label>
                        <Input name="nome_projeto" value={formData.nome_projeto} onChange={handleChange} required theme={currentTheme} placeholder="Ex: D'Italia Pizzaria" className="text-lg font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label theme={currentTheme}>Gestor Responsável</Label>
                            <Input name="gestor" value={formData.gestor} onChange={handleChange} theme={currentTheme} placeholder="Quem cuida?" />
                        </div>
                        <div>
                            <Label theme={currentTheme}>Nicho de Mercado</Label>
                            <Input name="nicho" value={formData.nicho} onChange={handleChange} theme={currentTheme} placeholder="Ex: Delivery" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label theme={currentTheme}>Tipo de Contrato</Label>
                            <Select name="type" value={formData.type} onChange={handleChange} theme={currentTheme}>
                                <option value="trafego">Tráfego Pago</option>
                                <option value="dominio">Domínio / Site</option>
                            </Select>
                        </div>
                        <div>
                            <Label theme={currentTheme}>Status do Contrato</Label>
                            <Select name="status" value={formData.status} onChange={handleChange} theme={currentTheme}>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo / Cancelado</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <SectionTitle icon={DollarSign} theme={currentTheme}>Financeiro & Investimento</SectionTitle>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                        <Label theme={currentTheme}>Valor do Contrato (Fee Mensal)</Label>
                        <div className="relative">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${currentTheme.text} font-bold`}>R$</span>
                            <Input
                                name="valor_contrato"
                                value={typeof formData.valor_contrato === 'number' ? formatCurrency(formData.valor_contrato).replace('R$', '').trim() : (formData.valor_contrato || '').replace('R$', '').trim()}
                                onChange={(e) => {
                                    const masked = formatCurrencyInput(e.target.value);
                                    setFormData({ ...formData, valor_contrato: masked });
                                }}
                                placeholder="0,00"
                                theme={currentTheme}
                                className="pl-10 font-mono text-emerald-400 font-bold text-lg"
                            />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <Label theme={currentTheme}>Verba Face</Label>
                        <Input name="orcamento_facebook" type="number" value={formData.orcamento_facebook} onChange={handleChange} theme={currentTheme} placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <Label theme={currentTheme}>Verba Google</Label>
                        <Input name="orcamento_google" type="number" value={formData.orcamento_google} onChange={handleChange} theme={currentTheme} placeholder="0" />
                    </div>
                    {formData.type === 'dominio' && (
                        <div className="col-span-1">
                            <Label theme={currentTheme}>Vencimento</Label>
                            <Input name="data_vencimento_dominio" type="date" value={formData.data_vencimento_dominio} onChange={handleChange} theme={currentTheme} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- AQUI ESTÁ A MÁGICA: INPUTS COM SUGESTÃO E CORES --- */}
            <div className="p-4 bg-white/5 rounded-xl border border-gray-700/50">
                <SectionTitle icon={Tag} theme={currentTheme}>Etiquetas e Status Operacional</SectionTitle>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <SuggestionInput
                            label="Temperatura"
                            name="temperatura"
                            value={formData.temperatura}
                            onChange={handleChange}
                            theme={currentTheme}
                            options={[
                                { value: "Fluindo Bem", color: "bg-green-500" },
                                { value: "Encaixando", color: "bg-teal-500" },
                                { value: "Iniciando Projeto", color: "bg-pink-500" },
                                { value: "Precisa de Novas Estratégias", color: "bg-purple-500" },
                                { value: "Acompanhar", color: "bg-blue-500" }
                            ]}
                        />
                    </div>
                    <div>
                        <SuggestionInput
                            label="Otimização"
                            name="otimizacao"
                            value={formData.otimizacao}
                            onChange={handleChange}
                            theme={currentTheme}
                            options={[
                                { value: "Otimizada", color: "bg-emerald-500" },
                                { value: "Mensurar", color: "bg-rose-500" },
                                { value: "Parado", color: "bg-gray-500" }
                            ]}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label theme={currentTheme}>Última Otimização</Label>
                        <Input name="data_otimizacao" type="date" value={formData.data_otimizacao} onChange={handleChange} theme={currentTheme} style={{ colorScheme: 'dark' }} />
                    </div>
                    <div>
                        <SuggestionInput
                            label="Feedback Semanal"
                            name="feedback"
                            value={formData.feedback}
                            onChange={handleChange}
                            theme={currentTheme}
                            options={[
                                { value: "Enviado WhatsApp", color: "bg-green-600" },
                                { value: "Planilha/Dash", color: "bg-orange-500" },
                                { value: "A fazer", color: "bg-gray-500" },
                                { value: "Feito", color: "bg-purple-500" },
                                { value: "Não Rodou / Sem Feedback", color: "bg-red-600" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button type="submit" theme={currentTheme}>Salvar Projeto</Button>
            </div>
        </form>
    );

    // --- TAREFAS (Mantido) ---
    if (type === 'tasks') return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {formData.cliente_id && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3 text-blue-200 mb-2">
                    <Briefcase size={18} />
                    <div className="flex-1">
                        <p className="text-xs text-blue-400 font-bold uppercase">Vinculado ao Projeto</p>
                        <p className="font-bold">{formData.cliente_nome}</p>
                    </div>
                </div>
            )}

            <div>
                <Label theme={currentTheme}>O que precisa ser feito?</Label>
                <Input name="titulo" value={formData.titulo} onChange={handleChange} required theme={currentTheme} placeholder="Ex: Criar novos criativos para Black Friday" autoFocus />
            </div>

            {!formData.cliente_id && (
                <div>
                    <Label theme={currentTheme}>Vincular a um Projeto</Label>
                    <ClientSearchInput clients={clients} selectedId={formData.cliente_id} onSelect={(c) => setFormData({ ...formData, cliente_id: c?.id || '', cliente_nome: c?.nome_projeto || '' })} theme={currentTheme} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Prazo de Entrega</Label>
                    <Input name="data_entrega" type="date" value={formData.data_entrega} onChange={handleChange} theme={currentTheme} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                    <Label theme={currentTheme}>Prioridade</Label>
                    <Select name="prioridade" value={formData.prioridade} onChange={handleChange} theme={currentTheme}>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="baixa">Baixa</option>
                        <option value="urgente">Urgente</option>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label theme={currentTheme}>Responsável</Label>
                    <Input name="assinatura" value={formData.assinatura || ''} onChange={handleChange} placeholder="Quem executa?" theme={currentTheme} />
                </div>
                <div>
                    <Label theme={currentTheme}>Status Atual</Label>
                    <Select name="status" value={formData.status} onChange={handleChange} theme={currentTheme}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button>
                <Button type="submit" theme={currentTheme}>Salvar Tarefa</Button>
            </div>
        </form>
    );

    // --- USUÁRIOS (Mantido) ---
    if (type === 'users') return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div><Label theme={currentTheme}>Nome</Label><Input name="name" value={formData.name} onChange={handleChange} required theme={currentTheme} /></div>
            <div><Label theme={currentTheme}>Email</Label><Input name="email" type="email" value={formData.email} onChange={handleChange} required theme={currentTheme} /></div>
            <div>
                <Label theme={currentTheme}>Função</Label>
                <Select name="role" value={formData.role} onChange={handleChange} theme={currentTheme}>
                    <option value="gestor">Gestor</option>
                    {(currentUserRole === 'admin' || currentUserRole === 'dev') && <><option value="admin">Administrador</option><option value="dev">Dev</option></>}
                </Select>
            </div>
            {formData.role !== 'admin' && formData.role !== 'dev' && (
                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50">
                    <Label theme={currentTheme}>Permissões</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">{['dashboard', 'financeiro', 'clientes', 'tarefas'].map(p => (<label key={p} className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" name={`perm_${p}`} checked={formData.permissions?.[p]} onChange={handleChange} /> <span className="capitalize">{p}</span></label>))}</div>
                </div>
            )}
            {initialData?.id && (currentUserRole === 'admin' || currentUserRole === 'dev') && (
                <div className="p-4 mt-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-yellow-200 font-bold flex items-center gap-2"><Lock size={14} /> Segurança</p>
                        <p className="text-xs text-yellow-500/80 mt-1">Enviar e-mail para o usuário redefinir a senha.</p>
                    </div>
                    <button type="button" onClick={() => onResetPassword(formData.email)} className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded border border-yellow-500/20 transition-colors">Redefinir Senha</button>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-700"><Button variant="outline" onClick={onCancel} theme={currentTheme}>Cancelar</Button><Button type="submit" theme={currentTheme}>Salvar</Button></div>
        </form>
    );

    return null;
};

export default GenericForm;