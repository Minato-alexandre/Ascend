import React, { useState } from 'react';
import { Mail, Lock, Flame, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Label } from './UI'; // Reusando nossos componentes da Fase 2
import { THEMES } from '../config/themes';

const AuthScreen = ({ onLogin, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const theme = THEMES.dark; // Login sempre no tema escuro por padrão

    const handleSubmit = (e) => {
        e.preventDefault();
        // Passamos o terceiro argumento para indicar se é registo ou login
        onLogin(email, password, isRegister);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl border-gray-800 bg-gray-900" theme={theme}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-4 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                        <Flame className="w-10 h-10 fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Ascend</h1>
                    <p className="text-gray-400 mt-2">Eleve a gestão dos seus projetos.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300 flex gap-2">
                        <AlertCircle size={16} />{error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <Label theme={theme}>E-mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input theme={theme} type="email" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <Label theme={theme}>Senha</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input theme={theme} type="password" className="pl-10 bg-black border-gray-800 focus:border-orange-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    <Button theme={theme} type="submit" className="w-full py-3 font-bold text-lg" disabled={loading}>
                        {loading ? 'A carregar...' : (isRegister ? 'Criar Conta' : 'Entrar')}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                        {isRegister ? 'Já tem conta? Entrar' : 'Primeiro acesso? Registar (Se tiver convite)'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default AuthScreen;