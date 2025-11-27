// ... imports (mantidos iguais)
import React, { useState, useEffect, useMemo } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2, Trash2, MessageSquare, Calendar, Pencil, X, Check } from 'lucide-react'; // Adicione Pencil, X, Check aqui se não tiver
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

// --- UpdateItem (MANTIDO DO CÓDIGO ANTERIOR) ---
const UpdateItem = ({ update, currentUser, onDelete, onEdit, theme }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(update.text);
    const isAuthor = update.author === currentUser.email;
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
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isAuthor ? 'text-blue-400' : theme.text}`}>{update.author}</span>
                    <span className={`text-[10px] ${theme.muted}`}>{new Date(update.timestamp).toLocaleString('pt-BR')}</span>
                </div>
                {canModify && !isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400"><Pencil size={14} /></button>
                        <button onClick={() => onDelete(update.id)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                )}
            </div>
            {isEditing ? (
                <div className="space-y-2">
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className={`w-full bg-black/40 border ${theme.border} rounded p-2 text-sm ${theme.text} outline-none focus:border-blue-500 min-h-[80px]`} />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/10 rounded text-gray-400"><X size={16} /></button>
                        <button onClick={handleSaveEdit} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"><Check size={16} /></button>
                    </div>
                </div>
            ) : (
                <p className={`text-sm ${theme.text} whitespace-pre-wrap font-sans leading-relaxed`}>{update.text}</p>
            )}
        </motion.div>
    );
};

export default function App() {
    // ... estados (iguais)
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

    const [openedTaskId, setOpenedTaskId] = useState(null);
    const activeReportTask = useMemo(() => tasks.find(t => t.id === openedTaskId) || null, [tasks, openedTaskId]);

    const currentTheme = THEMES[themeKey] || THEMES.dark;

    // ... useEffect auth e sync (MANTIDOS IGUAIS AO ANTERIOR) ...
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                try {
                    const uidRef = doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`);
                    const uidSnap = await getDoc(uidRef);
                    if (uidSnap.exists()) { setUserData(uidSnap.data()); }
                    else {
                        const emailRef = doc(db, `artifacts/${appId}/team_members/${currentUser.email}`);
                        const emailSnap = await getDoc(emailRef);
                        if (emailSnap.exists()) {
                            const data = emailSnap.data();
                            await setDoc(uidRef, { ...data, uid: currentUser.uid, email: currentUser.email }, { merge: true });
                            await deleteDoc(emailRef);
                            setUserData(data);
                        } else { setUserData({ role: 'visitante', name: currentUser.email, permissions: {} }); }
                    }
                } catch (error) { console.error(error); setUserData({ role: 'erro', permissions: {} }); }
            } else { setUser(null); setUserData(null); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password, isRegister) => {
        setAuthLoading(true); setAuthError('');
        try {
            if (isRegister) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                alert(`Conta criada! Verifique o e-mail ${email}.`);
            } else { await signInWithEmailAndPassword(auth, email, password); }
        } catch (error) { setAuthError("Erro de autenticação."); } finally { setAuthLoading(false); }
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
                unsubscribes.push(onSnapshot(collection(db, path), (s) => {
                    const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (colName === 'transactions') setTransactions(list.sort((a, b) => safeDate(b.date) - safeDate(a.date)));
                    else if (colName === 'clients') setClients(list);
                    else if (colName === 'tasks') setTasks(list);
                }));
            }
        });
        if (userData.role === 'admin' || userData.role === 'dev') {
            unsubscribes.push(onSnapshot(collection(db, `artifacts/${appId}/team_members`), (s) => setTeamUsers(s.docs.map(d => ({ id: d.id, ...d.data(), email: d.data().email || d.id })))));
        }
        return () => unsubscribes.forEach(fn => fn());
    }, [user, userData]);

    // --- HANDLE SAVE ATUALIZADO ---
    const handleSave = async (data, keepOpen) => {
        if (!user) return;
        const cleanData = { ...data };
        // Garante formato numérico para orçamentos e valor de contrato
        if (cleanData.amount) cleanData.amount = parseFloat(cleanData.amount);
        if (cleanData.valor_contrato) cleanData.valor_contrato = typeof cleanData.valor_contrato === 'string' ? parseFloat(cleanData.valor_contrato.replace(/[^0-9.,]/g, '').replace(',', '.')) : cleanData.valor_contrato;

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

                // CRIA TAREFAS PADRÃO AO CRIAR CLIENTE
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
        } catch (error) { console.error("Erro ao salvar:", error); alert("Erro ao salvar."); }
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
            // Garante que contratos em clientes sejam numéricos
            clients.forEach(c => {
                if (typeof c.valor_contrato === 'string') {
                    batch.update(doc(db, `artifacts/${appId}/clients`, c.id), {
                        valor_contrato: parseFloat(c.valor_contrato.replace(/[^0-9.,]/g, '').replace(',', '.'))
                    });
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
        if (!confirm(`Resetar senha?`)) return;
        try { await sendPasswordResetEmail(auth, email); alert("Enviado."); } catch (e) { alert("Erro."); }
    };

    // --- RELATÓRIO COM FEED ---
    const handleOpenReport = (task) => setOpenedTaskId(task.id);
    const handleCloseReport = () => setOpenedTaskId(null);

    const handleSaveReport = async (text) => {
        if (!activeReportTask) return;
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);
            const newUpdate = { id: crypto.randomUUID(), text, author: user.email, timestamp: new Date().toISOString() };
            const currentUpdates = activeReportTask.updates || [];
            await setDoc(taskRef, { updates: [newUpdate, ...currentUpdates], lastUpdate: new Date().toISOString() }, { merge: true });
        } catch (error) { console.error("Erro:", error); }
    };

    const handleDeleteUpdate = async (updateId) => {
        if (!confirm("Apagar comentário?")) return;
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);
            const newUpdates = (activeReportTask.updates || []).filter(u => u.id !== updateId);
            await setDoc(taskRef, { updates: newUpdates }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const handleEditUpdate = async (updateId, newText) => {
        try {
            const taskRef = doc(db, `artifacts/${appId}/tasks`, activeReportTask.id);
            const newUpdates = (activeReportTask.updates || []).map(u => u.id === updateId ? { ...u, text: newText } : u);
            await setDoc(taskRef, { updates: newUpdates }, { merge: true });
        } catch (e) { console.error(e); }
    };

    const openAdd = (type, defaults = null) => { setModalType(type); setEditingItem(defaults); setModalOpen(true); };
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
            {activeTab === 'clients' && <ClientsView clients={clients} tasks={tasks} onOpenReport={handleOpenReport} onAdd={() => openAdd('clients')} onEdit={(i) => openEdit('clients', i)} onDelete={(id) => setDeleteInfo({ id, type: 'clients' })} onUpdate={handleInlineUpdate} onAddSubtask={(client) => openAdd('tasks', { cliente_id: client.id, cliente_nome: client.nome_projeto })} theme={currentTheme} />}
            {activeTab === 'team' && <TeamView users={teamUsers} onAdd={() => openAdd('users')} userRole={userData?.role} onEdit={(user) => openEdit('users', user)} onDelete={(id) => setDeleteInfo({ id, type: 'team_members' })} currentUserId={user.uid} theme={currentTheme} />}
            {activeTab === 'settings' && <SettingsView onClearDatabase={handleClearAllData} onDevSync={handleDevSync} userRole={userData?.role} currentThemeKey={themeKey} onChangeTheme={setThemeKey} theme={currentTheme} />}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} theme={currentTheme}>
                <h2 className={`text-xl font-bold mb-4 capitalize ${currentTheme.text}`}>{editingItem?.id ? 'Editar' : 'Novo'} {modalType === 'transactions' ? 'Transação' : modalType === 'clients' ? 'Projeto' : modalType === 'users' ? 'Membro' : 'Tarefa'}</h2>
                <GenericForm type={modalType} initialData={editingItem} onSubmit={handleSave} onCancel={() => setModalOpen(false)} onResetPassword={handleResetPassword} currentUserRole={userData?.role} clients={clients} theme={currentTheme} />
            </Dialog>

            <Dialog open={!!deleteInfo} onClose={() => setDeleteInfo(null)} theme={currentTheme}>
                <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Apagar Registo</h2>
                <p className={`${currentTheme.muted} mb-6`}>Tem a certeza? Esta ação é irreversível.</p>
                <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setDeleteInfo(null)} theme={currentTheme}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} theme={currentTheme}>Confirmar</Button></div>
            </Dialog>

            <Drawer open={!!activeReportTask} onClose={handleCloseReport} title={activeReportTask ? `Relatório: ${activeReportTask.titulo}` : 'Detalhes'} theme={currentTheme}>
                {activeReportTask && (
                    <div className="space-y-6">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between">
                            <div><p className="text-xs text-gray-400">Status</p><span className="font-bold text-white capitalize">{activeReportTask.status}</span></div>
                            <div><p className="text-xs text-gray-400">Entrega</p><span className="font-bold text-blue-400">{activeReportTask.data_entrega ? format(safeDate(activeReportTask.data_entrega), 'dd/MM/yyyy') : '-'}</span></div>
                        </div>
                        <div><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><MessageSquare size={16} className="text-blue-400" /> Escrever Atualização</h3><ReportEditor onSave={handleSaveReport} theme={currentTheme} /></div>
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Histórico de Atualizações</h3>
                            <div className="space-y-4">
                                <AnimatePresence mode='popLayout'>
                                    {activeReportTask.updates?.map(update => (
                                        <UpdateItem key={update.id} update={update} currentUser={user} onDelete={handleDeleteUpdate} onEdit={handleEditUpdate} theme={currentTheme} />
                                    ))}
                                </AnimatePresence>
                                {activeReportTask.relatorio && !activeReportTask.updates && (
                                    <div className="opacity-70 border-t border-dashed border-gray-700 pt-4 mt-8"><p className="text-xs text-gray-500 mb-2 uppercase">Legado</p><div className="whitespace-pre-wrap text-sm text-gray-300 p-4 bg-black/30 rounded-xl border border-white/5 font-mono">{activeReportTask.relatorio}</div></div>
                                )}
                                {!activeReportTask.updates?.length && !activeReportTask.relatorio && <p className="text-gray-500 text-sm italic text-center py-4">Nenhum relatório.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </AppLayout>
    );
}