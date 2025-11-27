import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './UI';

const SUGGESTED_EMOJIS = ["🚀", "✅", "🔥", "📊", "📅", "⚠️", "💰", "🎯"];

const ReportEditor = ({ initialText, onSave, theme }) => {
    const [text, setText] = useState(initialText || '');

    const addEmoji = (emoji) => {
        setText(prev => prev + emoji + " ");
    };

    const handleSave = () => {
        if (!text.trim()) return;
        onSave(text);
        setText('');
    };

    return (
        <div className={`flex flex-col gap-3 h-full`}>
            <div className={`border ${theme.border} rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-black/20`}>
                <textarea
                    className={`w-full h-48 p-4 bg-transparent outline-none resize-none ${theme.text} placeholder-gray-600`}
                    placeholder="Digite o relatório da campanha aqui..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className={`p-2 border-t ${theme.border} ${theme.inputBg} flex justify-between items-center`}>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {SUGGESTED_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => addEmoji(emoji)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg"
                                title="Adicionar Emoji"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white px-6">
                        Atualizar <Send size={16} className="ml-2" />
                    </Button>
                </div>
            </div>

            <p className={`text-xs ${theme.muted} mt-2 text-center`}>
                Dica: Use emojis para destacar pontos importantes do feedback semanal.
            </p>
        </div>
    );
};

export default ReportEditor;