
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Sparkles, X, Info, Volume2, Loader2 } from 'lucide-react';
import { ChatMessage } from './types';
import { VoiceGender, speakText } from './AudioUtils';

interface AICounselorProps {
  contextVerse?: string | null;
  onClearContext?: () => void;
  voiceGender?: VoiceGender;
}

const AICounselor: React.FC<AICounselorProps> = ({ contextVerse, onClearContext, voiceGender = 'female' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNarratingIdx, setIsNarratingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSpeak = async (text: string, index: number) => {
    if (isNarratingIdx !== null) return;
    setIsNarratingIdx(index);
    await speakText(text, voiceGender);
    setIsNarratingIdx(null);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: textToSend,
        config: {
          systemInstruction: `Você é um Mentor Bíblico e Teólogo especializado em Português (Brasil). 
          Responda sempre com sabedoria, citando versículos e fornecendo contexto histórico. 
          Se o usuário fornecer um versículo específico, analise-o profundamente.`,
        },
      });

      const aiContent = response.text || "Desculpe, tive um problema ao refletir sobre isso.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro de conexão com o mentor. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {contextVerse && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Info className="text-indigo-500 mt-1 flex-shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Contexto Selecionado</p>
              <p className="text-sm italic text-indigo-900 leading-relaxed">"{contextVerse}"</p>
              <button 
                onClick={() => handleSend(`Explique o contexto e o significado teológico deste versículo: ${contextVerse}`)}
                className="mt-3 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Analisar com IA
              </button>
            </div>
            <button onClick={onClearContext} className="text-indigo-300 hover:text-indigo-500">
              <X size={18} />
            </button>
          </div>
        )}

        {messages.length === 0 && !contextVerse && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Como posso te ajudar hoje?</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Tire dúvidas sobre capítulos, temas ou peça um aconselhamento bíblico.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              
              {msg.role === 'assistant' && (
                <button 
                  onClick={() => handleSpeak(msg.content, idx)}
                  className={`absolute -right-12 bottom-0 p-2 rounded-full transition-all ${isNarratingIdx === idx ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100'}`}
                >
                  {isNarratingIdx === idx ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs text-slate-400 font-medium ml-2">Mentor refletindo...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sua dúvida ou reflexão..."
            className="flex-1 bg-slate-100 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICounselor;
