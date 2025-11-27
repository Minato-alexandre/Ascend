import React, { useState, useEffect, useMemo } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2, Trash2, MessageSquare, Calendar, Pencil, X, Check } from 'lucide-react'; // Novos ícones importados
import { motion, AnimatePresence } from "framer-motion";

import { db, auth, appId } from './config/firebase';
import { THEMES } from './config/themes';
import { safeDate, formatCurrency } from './utils/format';
import { isBefore, startOfDay, format } from 'date-fns';

import { Button, Dialog, Drawer } from './components/UI';
import AuthScreen from './components/AuthScreen';
import GenericForm from './components/GenericForm';
import ReportEditor from './components/ReportEditor';

import AppLayout from './layouts/AppLayout';
import DashboardView from './pages/DashboardView';
import TransactionsView from './pages/TransactionsView';
import ClientsView from './pages/ClientsView';
import TeamView from './pages/TeamView';
import SettingsView from './pages/SettingsView';

// --- COMPONENTE AUXILIAR: ITEM DE ATUALIZAÇÃO (FEED) ---
const UpdateItem = ({ update, currentUser, onDelete, onEdit, theme }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(update.text);

    const isAuthor = update.author === currentUser.email;
    // Permite edição se for o autor ou se for admin/dev (lógica simplificada aqui, assumindo que admin pode tudo)
    const canModify = isAuthor;

    const handleSaveEdit = () => {
        onEdit(update.id, editText);
        setIsEditing(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl border ${theme.border} bg-black/20 group relative`}
        >
            {/* Cabeçalho do Card */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isAuthor ? 'text-blue-400' : theme.text}`}>{update.author}</span>
                    <span className={`text-[10px] ${theme.muted}`}>
                        {new Date(update.timestamp).toLocaleString('pt-BR')}
                    </span>
                </div>

                {/* Botões de Ação (Só aparecem no hover e se puder modificar) */}
                {canModify && !isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400" title="Editar">
                            <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(update.id)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400" title="Excluir">
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Conteúdo */}
            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`w-full bg-black/40 border ${theme.border} rounded p-2 text-sm ${theme.text} outline-none focus:border-blue-500 min-h-[80px]`}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/10 rounded text-gray-400"><X size={16} /></button>
                        <button onClick={handleSaveEdit} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"><Check size={16} /></button>
                    </div>
                </div>
            ) : (
                <p className={`text-sm ${theme.text} whitespace-pre-wrap font-sans leading-relaxed`}>
                    {update.text}
                </p>
            )}
        </motion.div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const [activeTab, setActiveTab] = useState('dashboard');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteInfo, setDeleteInfo] = useState(null);
    const [themeKey, setThemeKey] = useState('dark');

    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]);

    // ESTADO DE RELATÓRIO
    const [openedTaskId, setOpenedTaskId] = useState(null);

    const activeReportTask = useMemo(() => {
        return tasks.find(t => t.id === openedTaskId) || null;
    }, [tasks, openedTaskId]);

    const currentTheme = THEMES[themeKey] || THEMES.dark;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                try {
                    const uidRef = doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`);
                    const uidSnap = await getDoc(uidRef);
                    if (uidSnap.exists()) {
                        setUserData(uidSnap.data());
                    } else {
                        const emailRef = doc(db, `artifacts/${appId}/team_members/${currentUser.email}`);
                        const emailSnap = await getDoc(emailRef);
                        if (emailSnap.exists()) {
                            const data = emailSnap.data();
                            await setDoc(uidRef, { ...data, uid: currentUser.uid, email: currentUser.email }, { merge: true });
                            await deleteDoc(emailRef);
                            setUserData(data);
                        } else {
                            setUserData({ role: 'visitante', name: currentUser.email, permissions: {} });
                        }
                    }
                } catch (error) {
                    console.error(error);
                    setUserData({ role: 'erro', permissions: {} });
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password, isRegister) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            if (isRegister) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                alert(`Conta criada! Verifique o e-mail ${email}.`);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            setAuthError("Erro de autenticação. Verifique os dados.");
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !userData) return;
        const collectionsToSync = ['transactions', 'clients', 'tasks'];
        const unsubscribes = [];

        collectionsToSync.forEach(colName => {
            const permMap = { 'transactions': 'financeiro', 'clients': 'clientes', 'tasks': 'tarefas' };
            const isSuperUser = userData.role === 'admin' || userData.role === 'dev';

            if (isSuperUser || userData.permissions?.[permMap[colName]]) {
                const path = `artifacts/${appId}/${colName}`;
                const unsub = onSnapshot(collection(db, path), (s) => {
                    const list = s.docs.map(d => {
                        const data = { id: d.id, ...d.data() };
                        if (colName === 'transactions' && !['pago', 'recebido', 'cancelado'].includes(data.status)) {
                            data.isOverdue = isBefore(safeDate(data.date), startOfDay(new Date()));
                        }
                        return data;
                    });

                    if (colName === 'transactions') {
                        list.sort((a, b) => {
                            if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
                            return safeDate(b.date) - safeDate(a.date);
                        });
                        setTransactions(list);
                    } else if (colName === 'clients') {
                        setClients(list);
                    } else if (colName === 'tasks') {
                        setTasks(list);
                    }
                });
                unsubscribes.push(unsub);
            }
        });

        if (userData.role === 'admin' || userData.role === 'dev') {
            const unsubTeam = onSnapshot(collection(db, `artifacts/${appId}/team_members`), (s) => {
                const members = s.docs.map(d => ({ id: d.id, ...d.data(), email: d.data().email || d.id }));
                setTeamUsers(members);
            });
            unsubscribes.push(unsubTeam);
        }
        return () => unsubscribes.forEach(fn => fn());
    }, [user, userData]);

    const handleSave = async (data, keepOpen) => {
        if (!user) return;
        const cleanData = { ...data };
        if (cleanData.amount) cleanData.amount = parseFloat(cleanData.amount);

        const isUserDoc = modalType === 'users';
        const collectionName = isUserDoc ? 'team_members' : modalType;
        const path = `artifacts/${appId}/${collectionName}`;
        const audit = { updatedAt: new Date().toISOString(), updatedBy: user.email };

        try {
            const isEditMode = editingItem && (editingItem.id || (isUserDoc && editingItem.email));

            if (isEditMode) {
                const docId = isUserDoc ? editingItem.email : editingItem.id;
                await setDoc(doc(db, path, docId), { ...cleanData, ...audit }, { merge: true });
            } else {
                const createData = { ...cleanData, ...audit, createdAt: new Date().toISOString(), createdBy: user.email };
                let newDocId;
                if (isUserDoc) {
                    await setDoc(doc(db, path, cleanData.email), createData);
                    newDocId = cleanData.email;
                } else {
                    const docRef = await addDoc(collection(db, path), createData);
                    newDocId = docRef.id;
                }

                if (modalType === 'clients' && newDocId) {
                    const defaultTasks = [
                        { titulo: "Estrutura de Campanhas", status: "pendente", prioridade: "alta" },
                        { titulo: "Relatório Semanal", status: "pendente", prioridade: "media" },
                    ];
                    const batch = writeBatch(db);
                    defaultTasks.forEach(task => {
                        const taskRef = doc(collection(db, `artifacts/${appId}/tasks`));
                        batch.set(taskRef, {
                            ...task,
                            cliente_id: newDocId,
                            cliente_nome: cleanData.nome_projeto,
                            data_entrega: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            createdBy: "sistema"
                        });
                    });
                    await batch.commit();
                }
            }
            if (!keepOpen) { setModalOpen(false); setEditingItem(null); }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar.");
        }
    };

    const handleDelete = async () => {
        const { id, type } = deleteInfo;
        const collectionName = type === 'team_members' ? 'team_members' : type;
        try { await deleteDoc(doc(db, `artifacts/${appId}/${collectionName}`, id)); } catch (e) { console.error(e); }
        setDeleteInfo(null);
    };

    const handleInlineUpdate = async (id, field, value) => {
        try { await setDoc(doc(db, `artifacts/${appId}/clients`, id), { [field]: value }, { merge: true }); } catch (e) { console.error(e); }
    };

    const handleMarkAsPaid = async (transaction) => {
        const isCompleted = ['pago', 'recebido'].includes(transaction.status);
        let newStatus = isCompleted ? 'pendente' : (transaction.type === 'receita' ? 'recebido' : 'pago');
        try { await setDoc(doc(db, `artifacts/${appId}/transactions`, transaction.id), { status: newStatus }, { merge: true }); } catch (e) { console.error(e); }
    };

    const handleDevSync = async () => {
        if (!user || userData?.role !== 'dev') return;
        if (!confirm("Recalcular toda a base?")) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            let count = 0;
            const today = startOfDay(new Date());

            tasks.forEach(t => {
                const isOver = (!['concluida'].includes(t.status)) && isBefore(safeDate(t.data_entrega), today);
                if (isOver && t.prioridade !== 'urgente') {
                    batch.update(doc(db, `artifacts/${appId}/tasks`, t.id), { prioridade: 'urgente' });
                    count++;
                }
            });

            transactions.forEach(t => {
                if (typeof t.amount === 'string') {
                    batch.update(doc(db, `artifacts/${appId}/transactions`, t.id), { amount: parseFloat(t.amount) });
                    count++;
                }
            });

            if (count > 0) await batch.commit();
            alert(`Atualizado: ${count} registros.`);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleClearAllData = async () => {
        if (!confirm("Apagar TUDO?")) return;
        setLoading(true);
        try {
            const cols = ['transactions', 'clients', 'tasks'];
            for (const c of cols) {
                const snap = await getDocs(collection(db, `artifacts/${appId}/${c}`));
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            alert("Limpo.");
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleResetPassword = async (email) => {
        if (!confirm(`Resetar senha de ${email}?`)) return;
        try { await sendPasswordResetEmail(auth, email); alert("E-mail enviado."); } catch (e) { alert("Erro ao enviar."); }
    };

    // --- SISTEMA DE RELATÓRIO (AGORA COM ARRAY DE OBJETOS) ---
    const handleOpenReport = (task) => setOpenedTaskId(task.id);
    const handleCloseReport = () => setOpenedTaskId(null);

    const handleSaveReport = async (text) => {
        if (!activeReportTask) return;
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);

            // Cria um NOVO item de atualização (Feed)
            const newUpdate = {
                id: crypto.randomUUID(), // ID único para permitir exclusão/edição
                text: text,
                author: user.email,
                timestamp: new Date().toISOString()
            };

            const currentUpdates = activeReportTask.updates || [];

            await setDoc(taskRef, {
                updates: [newUpdate, ...currentUpdates], // Adiciona ao topo
                lastUpdate: new Date().toISOString()
            }, { merge: true });

        } catch (error) { console.error("Erro:", error); }
    };

    // Excluir um update específico
    const handleDeleteUpdate = async (updateId) => {
        if (!confirm("Apagar este comentário?")) return;
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);
            const currentUpdates = activeReportTask.updates || [];
            const newUpdates = currentUpdates.filter(u => u.id !== updateId);

            await setDoc(taskRef, { updates: newUpdates }, { merge: true });
        } catch (error) { console.error("Erro:", error); }
    };

    // Editar um update específico
    const handleEditUpdate = async (updateId, newText) => {
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);
            const currentUpdates = activeReportTask.updates || [];
            const newUpdates = currentUpdates.map(u =>
                u.id === updateId ? { ...u, text: newText } : u
            );

            await setDoc(taskRef, { updates: newUpdates }, { merge: true });
        } catch (error) { console.error("Erro:", error); }
    };

    const openAdd = (type, defaults = null) => {
        setModalType(type);
        setEditingItem(defaults);
        setModalOpen(true);
    };

    const openEdit = (type, item) => { setModalType(type); setEditingItem(item); setModalOpen(true); };

    const summary = useMemo(() => {
        const rec = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const desp = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        return { rec, desp, saldo: rec - desp };
    }, [transactions]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;
    if (!user) return <AuthScreen onLogin={handleLogin} loading={authLoading} error={authError} />;

    return (
        <AppLayout activeTab={activeTab} setActiveTab={setActiveTab} user={user} userData={userData} onLogout={() => signOut(auth)} currentTheme={currentTheme}>
            {activeTab === 'dashboard' && <DashboardView summary={summary} transactions={transactions} tasks={tasks} onAdd={() => openAdd('transactions')} onEdit={(i) => openEdit('transactions', i)} onDelete={(id) => setDeleteInfo({ id, type: 'transactions' })} onMarkAsPaid={handleMarkAsPaid} onDevSync={handleDevSync} userRole={userData?.role} theme={currentTheme} />}
            {activeTab === 'transactions' && <TransactionsView transactions={transactions} onAdd={() => openAdd('transactions')} onEdit={(i) => openEdit('transactions', i)} onDelete={(id) => setDeleteInfo({ id, type: 'transactions' })} onToggleStatus={handleMarkAsPaid} theme={currentTheme} />}

            {activeTab === 'clients' && (
                <ClientsView
                    clients={clients}
                    tasks={tasks}
                    onOpenReport={handleOpenReport}
                    onAdd={() => openAdd('clients')}
                    onEdit={(i) => openEdit('clients', i)}
                    onDelete={(id) => setDeleteInfo({ id, type: 'clients' })}
                    onUpdate={handleInlineUpdate}
                    onAddSubtask={(client) => openAdd('tasks', { cliente_id: client.id, cliente_nome: client.nome_projeto })}
                    theme={currentTheme}
                />
            )}

            {activeTab === 'team' && <TeamView users={teamUsers} onAdd={() => openAdd('users')} userRole={userData?.role} onEdit={(user) => openEdit('users', user)} onDelete={(id) => setDeleteInfo({ id, type: 'team_members' })} currentUserId={user.uid} theme={currentTheme} />}
            {activeTab === 'settings' && <SettingsView onClearDatabase={handleClearAllData} onDevSync={handleDevSync} userRole={userData?.role} currentThemeKey={themeKey} onChangeTheme={setThemeKey} theme={currentTheme} />}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} theme={currentTheme}>
                <h2 className={`text-xl font-bold mb-4 capitalize ${currentTheme.text}`}>
                    {editingItem ? 'Editar' : 'Novo'} {modalType === 'transactions' ? 'Transação' : modalType === 'clients' ? 'Cliente' : modalType === 'users' ? 'Membro' : 'Tarefa'}
                </h2>
                <GenericForm type={modalType} initialData={editingItem} onSubmit={handleSave} onCancel={() => setModalOpen(false)} onResetPassword={handleResetPassword} currentUserRole={userData?.role} clients={clients} theme={currentTheme} />
            </Dialog>

            <Dialog open={!!deleteInfo} onClose={() => setDeleteInfo(null)} theme={currentTheme}>
                <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Apagar Registo</h2>
                <p className={`${currentTheme.muted} mb-6`}>Tem a certeza? Esta ação é irreversível.</p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setDeleteInfo(null)} theme={currentTheme}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete} theme={currentTheme}>Confirmar</Button>
                </div>
            </Dialog>

            {/* DRAWER COM MOTION LEVE NO HISTÓRICO */}
            <Drawer open={!!activeReportTask} onClose={handleCloseReport} title={activeReportTask ? `Relatório: ${activeReportTask.titulo}` : 'Detalhes'} theme={currentTheme}>
                {activeReportTask && (
                    <div className="space-y-6">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between">
                            <div><p className="text-xs text-gray-400">Status</p><span className="font-bold text-white capitalize">{activeReportTask.status}</span></div>
                            <div><p className="text-xs text-gray-400">Entrega</p><span className="font-bold text-blue-400">{activeReportTask.data_entrega ? format(safeDate(activeReportTask.data_entrega), 'dd/MM/yyyy') : '-'}</span></div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><MessageSquare size={16} className="text-blue-400" /> Escrever Atualização</h3>
                            <ReportEditor onSave={handleSaveReport} theme={currentTheme} />
                        </div>
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Histórico de Atualizações</h3>
                            <div className="space-y-4">
                                {/* NOVO FORMATO (ARRAY) - FEED INTERATIVO */}
                                <AnimatePresence mode='popLayout'>
                                    {activeReportTask.updates?.map(update => (
                                        <UpdateItem
                                            key={update.id}
                                            update={update}
                                            currentUser={user}
                                            onDelete={handleDeleteUpdate}
                                            onEdit={handleEditUpdate}
                                            theme={currentTheme}
                                        />
                                    ))}
                                </AnimatePresence>

                                {/* LEGADO (STRING ANTIGA) - MANTÉM O QUE JÁ EXISTIA */}
                                {activeReportTask.relatorio && !activeReportTask.updates && (
                                    <div className="opacity-70 border-t border-dashed border-gray-700 pt-4 mt-8">
                                        <p className="text-xs text-gray-500 mb-2 uppercase">Antigo / Legado</p>
                                        <div className="whitespace-pre-wrap text-sm text-gray-300 p-4 bg-black/30 rounded-xl border border-white/5 leading-relaxed font-mono">
                                            {activeReportTask.relatorio}
                                        </div>
                                    </div>
                                )}

                                {!activeReportTask.updates?.length && !activeReportTask.relatorio && (
                                    <p className="text-gray-500 text-sm italic text-center py-4">Nenhum relatório registrado ainda.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </AppLayout>
    );
}