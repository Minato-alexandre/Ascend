import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Card, Label, Button } from '../components/UI';
import { THEMES } from '../config/themes';

const SettingsView = ({ onClearDatabase, onDevSync, userRole, currentThemeKey, onChangeTheme, theme }) => {
    const currentTheme = theme || THEMES.dark;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className={`text-3xl font-bold ${currentTheme.text}`}>Configurações</h1>

            <Card className="p-6" theme={currentTheme}>
                <h3 className={`text-xl font-bold ${currentTheme.primaryText} mb-4`}>Aparência</h3>
                <Label theme={currentTheme}>Tema da Aplicação</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                    {Object.keys(THEMES).map(key => (
                        <button key={key} onClick={() => onChangeTheme(key)} className={`p-3 rounded-xl border-4 transition-all h-28 flex flex-col items-center justify-center text-sm font-medium ${currentThemeKey === key ? 'border-orange-500' : `border-gray-600 hover:border-gray-500`} ${THEMES[key].cardBg} ${THEMES[key].text}`}>
                            <div className={`w-8 h-8 rounded-full ${THEMES[key].primary} mb-2`}></div>
                            <span className="capitalize">{THEMES[key].label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* ÁREA DO DESENVOLVEDOR */}
            {userRole === 'dev' && (
                <Card className="p-6 border-blue-900/50 bg-blue-900/10" theme={currentTheme}>
                    <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center gap-2"><Database /> Área do Desenvolvedor</h3>
                    <div className={`flex items-center justify-between p-4 ${currentTheme.inputBg} rounded-lg border border-blue-900/30`}>
                        <div>
                            <h4 className={`font-medium ${currentTheme.text}`}>Sincronizar Dashboard</h4>
                            <p className={`text-sm ${currentTheme.muted}`}>Recalcula atrasos e atualiza registros antigos.</p>
                        </div>
                        <Button onClick={onDevSync} className="bg-blue-600 hover:bg-blue-500 text-white" theme={currentTheme}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Tudo
                        </Button>
                    </div>
                </Card>
            )}

            <Card className="p-6 border-red-900/50 bg-red-900/10" theme={currentTheme}>
                <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle /> Zona de Perigo</h3>
                <div className={`flex items-center justify-between p-4 ${currentTheme.inputBg} rounded-lg border border-red-900/30`}>
                    <div><h4 className={`font-medium ${currentTheme.text}`}>Limpar Base de Dados</h4><p className={`text-sm ${currentTheme.muted}`}>Ação irreversível.</p></div>
                    <Button variant="destructive" onClick={onClearDatabase} theme={currentTheme}>Limpar Tudo</Button>
                </div>
            </Card>
        </div>
    );
};

export default SettingsView;