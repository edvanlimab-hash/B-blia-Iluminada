
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Heart, Share2, Calendar, Coffee, Volume2, Loader2 } from 'lucide-react';
import { speakText, VoiceGender } from './AudioUtils';

interface DailyDevotionalProps {
  voiceGender?: VoiceGender;
}

const DailyDevotional: React.FC<DailyDevotionalProps> = ({ voiceGender = 'female' }) => {
  const [devotional, setDevotional] = useState<{ title: string; verse: string; message: string; prayer: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);

  useEffect(() => {
    generateDevotional();
  }, []);

  const generateDevotional = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Gere um devocional curto para hoje, incluindo um título inspirador, um versículo bíblico chave, uma reflexão e uma breve oração. Responda em Português.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              verse: { type: "string" },
              message: { type: "string" },
              prayer: { type: "string" }
            },
            required: ["title", "verse", "message", "prayer"]
          }
        }
      });
      const data = JSON.parse(response.text);
      setDevotional(data);
    } catch (error) {
      console.error("Devotional Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNarration = async () => {
    if (!devotional || isNarrating) return;
    setIsNarrating(true);
    const fullText = `${devotional.title}. O versículo de hoje é: ${devotional.verse}. Reflexão: ${devotional.message}. E terminamos com uma oração: ${devotional.prayer}`;
    await speakText(fullText, voiceGender);
    setIsNarrating(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center"><Coffee size={20} className="text-indigo-300" /></div>
        </div>
        <div className="text-center"><h3 className="text-lg font-bold text-slate-800">Preparando seu Maná</h3><p className="text-sm text-slate-400 italic">"Pão nosso de cada dia nos dai hoje..."</p></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-20 overflow-y-auto h-full relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-rose-500 font-bold uppercase tracking-widest text-xs">
          <Calendar size={14} />
          {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleNarration} 
            disabled={isNarrating}
            className={`p-3 rounded-full shadow-lg transition-all flex items-center gap-2 ${isNarrating ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}`}
          >
            {isNarrating ? <Loader2 className="animate-spin" size={18} /> : <Volume2 size={18} />}
            <span className="text-xs font-bold uppercase tracking-wider">{isNarrating ? 'Ouvindo...' : 'Ouvir Tudo'}</span>
          </button>
          <button onClick={generateDevotional} className="text-indigo-600 hover:text-indigo-800 p-2"><Sparkles size={18} /></button>
        </div>
      </div>

      <header className="space-y-4">
        <h2 className={`text-4xl font-extrabold leading-tight serif-bible transition-colors ${isNarrating ? 'text-indigo-600' : 'text-slate-900'}`}>{devotional?.title}</h2>
        <div className="bg-amber-50 border-l-4 border-amber-300 p-5 rounded-r-2xl italic text-amber-900 serif-bible text-xl shadow-sm">
           "{devotional?.verse}"
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><Coffee size={18} />Reflexão do Dia</h3>
        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">{devotional?.message}</p>
      </section>

      <section className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
        <h3 className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-4">Oração</h3>
        <p className="italic text-lg leading-relaxed font-light">{devotional?.prayer}</p>
      </section>

      <div className="flex gap-4 pt-4">
        <button className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Heart size={20} className="text-rose-500" />Favoritar</button>
        <button className="flex-1 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Share2 size={20} className="text-indigo-500" />Compartilhar</button>
      </div>
    </div>
  );
};

export default DailyDevotional;
