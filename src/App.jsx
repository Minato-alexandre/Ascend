import React, { useState, useEffect, useMemo } from 'react';
// ADICIONADO: sendPasswordResetEmail
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, collection, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2, Trash2 } from 'lucide-react';

import { db, auth, appId } from './config/firebase';
import { THEMES } from './config/themes';
import { safeDate, formatCurrencyInput, parseCurrencyInput } from './utils/format';
import { isBefore, startOfDay } from 'date-fns';

import { Button, Dialog } from './components/UI';
import AuthScreen from './components/AuthScreen';
import GenericForm from './components/GenericForm';

import AppLayout from './layouts/AppLayout';
import DashboardView from './pages/DashboardView';
import TransactionsView from './pages/TransactionsView';
import ClientsView from './pages/ClientsView';
import TasksView from './pages/TasksView';
import TeamView from './pages/TeamView';
import SettingsView from './pages/SettingsView';

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

    const currentTheme = THEMES[themeKey] || THEMES.dark;

    // --- 1. AUTENTICAÇÃO & PERFIL (Busca os dados) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true); // Começa a carregar

            if (currentUser) {
                setUser(currentUser);
                try {
                    // 1. Tenta buscar direto pelo UID (Usuário já estabelecido)
                    const uidRef = doc(db, `artifacts/${appId}/team_members/${currentUser.uid}`);
                    const uidSnap = await getDoc(uidRef);

                    if (uidSnap.exists()) {
                        // ACHOU!
                        setUserData(uidSnap.data());
                    } else {
                        // 2. Não achou pelo UID. Tenta buscar convite por EMAIL
                        const emailRef = doc(db, `artifacts/${appId}/team_members/${currentUser.email}`);
                        const emailSnap = await getDoc(emailRef);

                        if (emailSnap.exists()) {
                            // ACHOU CONVITE! Migra para UID
                            const data = emailSnap.data();
                            await setDoc(uidRef, { ...data, uid: currentUser.uid, email: currentUser.email }, { merge: true });
                            await deleteDoc(emailRef); // Apaga o convite antigo
                            setUserData(data);
                        } else {
                            // 3. Usuário sem cadastro (Visitante)
                            console.warn("Nenhum perfil encontrado.");
                            setUserData({ role: 'visitante', name: currentUser.email, permissions: {} });
                        }
                    }
                } catch (error) {
                    console.error("Erro ao carregar perfil:", error);
                    setUserData({ role: 'erro', permissions: {} });
                }
            } else {
                // Deslogado
                setUser(null);
                setUserData(null);
            }

            // O segredo: Isso roda sempre no final, liberando a tela
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password, isRegister) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            if (isRegister) {
                // Cria a conta
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // ENVIA O E-MAIL DE VERIFICAÇÃO IMEDIATAMENTE
                await sendEmailVerification(userCredential.user);

                alert(`Conta criada com sucesso! Um e-mail de validação foi enviado para ${email}. Verifique sua caixa de entrada (e spam).`);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setAuthError("Este e-mail já está cadastrado.");
            } else if (error.code === 'auth/weak-password') {
                setAuthError("A senha deve ter pelo menos 6 caracteres.");
            } else {
                setAuthError("Erro de autenticação. Verifique os dados.");
            }
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
                        if (colName === 'tasks') {
                            const isOver = (!['concluida'].includes(data.status)) && isBefore(safeDate(data.data_entrega), startOfDay(new Date()));
                            if (isOver && data.prioridade !== 'urgente') {
                                setDoc(doc(db, path, data.id), { prioridade: 'urgente' }, { merge: true });
                                data.prioridade = 'urgente';
                            }
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
                }, (err) => console.error(`Erro sync ${colName}:`, err));
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
            if (editingItem) {
                const docId = isUserDoc ? editingItem.email : editingItem.id;
                await setDoc(doc(db, path, docId), { ...cleanData, ...audit }, { merge: true });
            } else {
                const createData = {
                    ...cleanData, ...audit,
                    createdAt: new Date().toISOString(),
                    createdBy: user.email
                };

                if (isUserDoc) {
                    await setDoc(doc(db, path, cleanData.email), createData);
                } else {
                    await addDoc(collection(db, path), createData);
                }
            }
            if (!keepOpen) { setModalOpen(false); setEditingItem(null); }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar. Verifique suas permissões.");
        }
    };

    const handleDelete = async () => {
        const { id, type } = deleteInfo;
        const collectionName = type === 'team_members' ? 'team_members' : type;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/${collectionName}`, id));
        } catch (error) {
            console.error("Erro ao apagar:", error);
        }
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

    const handleClearAllData = async () => {
        if (!confirm("Tem certeza? Isso apagará TODAS as informações GLOBAIS da empresa.")) return;
        setLoading(true);
        try {
            const cols = ['transactions', 'clients', 'tasks'];
            for (const c of cols) {
                const snap = await getDocs(collection(db, `artifacts/${appId}/${c}`));
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
            alert("Base de dados limpa.");
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // --- NOVO: RESETAR SENHA ---
    const handleResetPassword = async (email) => {
        if (!confirm(`Enviar e-mail de redefinição de senha para ${email}?`)) return;
        try {
            await sendPasswordResetEmail(auth, email);
            alert("E-mail enviado com sucesso!");
        } catch (error) {
            console.error("Erro ao enviar reset:", error);
            alert("Erro ao enviar e-mail. Verifique se o endereço está correto.");
        }
    };

    const openAdd = (type) => { setModalType(type); setEditingItem(null); setModalOpen(true); };
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
            {activeTab === 'dashboard' && <DashboardView summary={summary} transactions={transactions} tasks={tasks} onAdd={() => openAdd('transactions')} onEdit={(i) => openEdit('transactions', i)} onDelete={(id) => setDeleteInfo({ id, type: 'transactions' })} onMarkAsPaid={handleMarkAsPaid} theme={currentTheme} />}
            {activeTab === 'transactions' && <TransactionsView transactions={transactions} onAdd={() => openAdd('transactions')} onEdit={(i) => openEdit('transactions', i)} onDelete={(id) => setDeleteInfo({ id, type: 'transactions' })} onToggleStatus={handleMarkAsPaid} theme={currentTheme} />}
            {activeTab === 'clients' && <ClientsView clients={clients} onAdd={() => openAdd('clients')} onEdit={(i) => openEdit('clients', i)} onDelete={(id) => setDeleteInfo({ id, type: 'clients' })} onUpdate={handleInlineUpdate} theme={currentTheme} />}
            {activeTab === 'tasks' && <TasksView tasks={tasks} onAdd={() => openAdd('tasks')} onEdit={(i) => openEdit('tasks', i)} onDelete={(id) => setDeleteInfo({ id, type: 'tasks' })} theme={currentTheme} />}
            {activeTab === 'team' && (
                <TeamView
                    users={teamUsers}
                    onAdd={() => openAdd('users')}

                    // ADICIONE ESTA LINHA ABAIXO:
                    userRole={userData?.role}
                    onEdit={(user) => openEdit('users', user)}

                    onDelete={(id) => setDeleteInfo({ id, type: 'team_members' })}
                    currentUserId={user.uid}
                    theme={currentTheme}
                />
            )}
            {activeTab === 'settings' && <SettingsView onClearDatabase={handleClearAllData} currentThemeKey={themeKey} onChangeTheme={setThemeKey} theme={currentTheme} />}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} theme={currentTheme}>
                <h2 className={`text-xl font-bold mb-4 capitalize ${currentTheme.text}`}>
                    {editingItem ? 'Editar' : 'Novo'} {modalType === 'transactions' ? 'Transa\u00E7\u00E3o' : modalType === 'clients' ? 'Cliente' : modalType === 'users' ? 'Membro' : 'Tarefa'}
                </h2>
                <GenericForm
                    type={modalType}
                    initialData={editingItem}
                    onSubmit={handleSave}
                    onCancel={() => setModalOpen(false)}
                    onResetPassword={handleResetPassword}
                    currentUserRole={userData?.role}
                    clients={clients}
                    theme={currentTheme}>
                    

                </GenericForm>



            </Dialog>

            <Dialog open={!!deleteInfo} onClose={() => setDeleteInfo(null)} theme={currentTheme}>
                <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Apagar Registo
                </h2>
                {/* CORREÇÃO AQUI: Texto dentro de chaves e aspas para o código funcionar */}
                <p className={`${currentTheme.muted} mb-6`}>
                    {'Tem a certeza? Esta a\u00E7\u00E3o \u00E9 irrevers\u00EDvel.'}
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setDeleteInfo(null)} theme={currentTheme}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete} theme={currentTheme}>Confirmar</Button>
                </div>
            </Dialog>
        </AppLayout>
    );
}