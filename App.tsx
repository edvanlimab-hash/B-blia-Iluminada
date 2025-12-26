
import React, { useState } from 'react';
import Reader from './Reader';
import AICounselor from './AICounselor';
import DailyDevotional from './DailyDevotional';
import { BookOpen, Sparkles, MessageCircle, Settings, Home, User, UserCheck, Volume2, Loader2 } from 'lucide-react';
import { VoiceGender, speakText } from './AudioUtils';

export type Tab = 'home' | 'bible' | 'ai' | 'devotional';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedVerseContext, setSelectedVerseContext] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');

  const handleAskAI = (verseText: string) => {
    setSelectedVerseContext(verseText);
    setActiveTab('ai');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onNavigate={setActiveTab} voiceGender={voiceGender} />;
      case 'bible':
        return <Reader onAskAI={handleAskAI} voiceGender={voiceGender} />;
      case 'ai':
        return <AICounselor 
          contextVerse={selectedVerseContext} 
          onClearContext={() => setSelectedVerseContext(null)} 
          voiceGender={voiceGender}
        />;
      case 'devotional':
        return <DailyDevotional voiceGender={voiceGender} />;
      default:
        return <HomeView onNavigate={setActiveTab} voiceGender={voiceGender} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFCFB] text-slate-900 overflow-hidden">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold tracking-tight text-indigo-900 serif-bible flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={18} />
          </div>
          Bíblia Iluminada
        </h1>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setVoiceGender(voiceGender === 'female' ? 'male' : 'female')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 rounded-full text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all border border-slate-100"
            title="Alternar Voz Narração"
          >
            {voiceGender === 'female' ? <User size={14} /> : <UserCheck size={14} />}
            {voiceGender === 'female' ? 'Voz Feminina' : 'Voz Masculina'}
          </button>
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}
      </main>

      <nav className="bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center pb-8 md:pb-3">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => { setActiveTab('home'); setSelectedVerseContext(null); }} 
          icon={<Home size={22} />} 
          label="Início" 
        />
        <NavButton 
          active={activeTab === 'bible'} 
          onClick={() => { setActiveTab('bible'); setSelectedVerseContext(null); }} 
          icon={<BookOpen size={22} />} 
          label="Leitura" 
        />
        <NavButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')} 
          icon={<MessageCircle size={22} />} 
          label="Mentor IA" 
        />
        <NavButton 
          active={activeTab === 'devotional'} 
          onClick={() => { setActiveTab('devotional'); setSelectedVerseContext(null); }} 
          icon={<Sparkles size={22} />} 
          label="Devocional" 
        />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    <div className={`p-1 rounded-xl transition-colors ${active ? 'bg-indigo-50' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

const HomeView = ({ onNavigate, voiceGender }: { onNavigate: (tab: Tab) => void, voiceGender: VoiceGender }) => {
  const [isNarrating, setIsNarrating] = useState(false);
  const dailyVerse = "Pois eu bem sei os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro. Jeremias 29, versículo 11.";

  const handleSpeak = async () => {
    if (isNarrating) return;
    setIsNarrating(true);
    await speakText(dailyVerse, voiceGender);
    setIsNarrating(false);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="text-indigo-100 text-xs font-semibold uppercase tracking-widest">Versículo do Dia</span>
              <button 
                onClick={handleSpeak}
                disabled={isNarrating}
                className={`p-2 rounded-full backdrop-blur-md transition-all ${isNarrating ? 'bg-white text-indigo-600 animate-pulse' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                {isNarrating ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
              </button>
            </div>
            <h2 className="text-2xl mt-2 leading-relaxed serif-bible italic">
              "Pois eu bem sei os planos que tenho para vocês", diz o Senhor, "planos de fazê-los prosperar e não de causar dano..."
            </h2>
            <p className="mt-4 text-sm font-medium text-indigo-100">— Jeremias 29:11</p>
            <button 
              onClick={() => onNavigate('bible')}
              className="mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
            >
              Ler capítulo completo
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
             <BookOpen size={200} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('ai')}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-slate-800">Insights IA</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Analise contextos teológicos profundos.</p>
        </div>
        <div 
          onClick={() => onNavigate('devotional')}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-slate-800">Planos</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Jornadas espirituais guiadas pela palavra.</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Leituras Recentes</h3>
        <div className="space-y-3">
          {['Salmos 23', 'João 3', 'Romanos 8'].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <BookOpen size={14} />
                </div>
                <span className="font-medium text-slate-700">{item}</span>
              </div>
              <span className="text-xs text-slate-400">Há 2 horas</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default App;
