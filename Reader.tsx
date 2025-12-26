
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BIBLE_BOOKS } from './constants';
import { ChevronLeft, ChevronRight, Book, List, Search, X, Loader2, Sparkles, RefreshCw, Volume2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speakText, VoiceGender } from './AudioUtils';

interface ReaderProps {
  onAskAI?: (verse: string) => void;
  voiceGender?: VoiceGender;
}

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const Reader: React.FC<ReaderProps> = ({ onAskAI, voiceGender = 'female' }) => {
  const [currentBook, setCurrentBook] = useState(BIBLE_BOOKS[0]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  
  // Cache para capítulos: chave é "BookName-ChapterNumber"
  const [chapterCache, setChapterCache] = useState<Record<string, any[]>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);

  const translateViaAI = useCallback(async (englishVerses: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Traduza os seguintes versículos da Bíblia do inglês para o Português (Brasil), mantendo o estilo solene e fiel:
      ${JSON.stringify(englishVerses.map(v => ({ v: v.verse, t: v.text })))}
      Retorne apenas o JSON com a mesma estrutura.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const translated = JSON.parse(response.text);
      return englishVerses.map((v, i) => ({ ...v, text: translated[i]?.t || v.text }));
    } catch (e) {
      console.error("Erro na tradução via IA:", e);
      return englishVerses;
    }
  }, []);

  const fetchChapterData = useCallback(async (book: typeof BIBLE_BOOKS[0], chapter: number) => {
    const bookRef = encodeURIComponent(book.apiName);
    const url = `https://bible-api.com/${bookRef}+${chapter}?translation=almeida`;
    
    try {
      let response = await fetch(url);
      if (!response.ok) {
        const fallbackUrl = `https://bible-api.com/${bookRef}+${chapter}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (!fallbackRes.ok) return null;
        const data = await fallbackRes.json();
        return await translateViaAI(data.verses);
      }
      const data = await response.json();
      return data.verses;
    } catch (e) {
      return null;
    }
  }, [translateViaAI]);

  const prefetchNext = useCallback(async (currentBookIndex: number, currentChap: number) => {
    let nextBook = BIBLE_BOOKS[currentBookIndex];
    let nextChap = currentChap + 1;

    if (nextChap > nextBook.chapters) {
      if (currentBookIndex + 1 < BIBLE_BOOKS.length) {
        nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        nextChap = 1;
      } else {
        return; // Fim da Bíblia
      }
    }

    const cacheKey = `${nextBook.name}-${nextChap}`;
    if (chapterCache[cacheKey]) return;

    const data = await fetchChapterData(nextBook, nextChap);
    if (data) {
      setChapterCache(prev => ({ ...prev, [cacheKey]: data }));
    }
  }, [chapterCache, fetchChapterData]);

  const loadCurrentChapter = useCallback(async () => {
    const cacheKey = `${currentBook.name}-${currentChapter}`;
    
    if (chapterCache[cacheKey]) {
      setVerses(chapterCache[cacheKey]);
      setIsLoading(false);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      // Mesmo se carregar do cache, tenta prefetchar o próximo
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook.name);
      prefetchNext(bookIdx, currentChapter);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const data = await fetchChapterData(currentBook, currentChapter);
    if (data) {
      setVerses(data);
      setChapterCache(prev => ({ ...prev, [cacheKey]: data }));
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === currentBook.name);
      prefetchNext(bookIdx, currentChapter);
    } else {
      setError("Não conseguimos conectar à biblioteca sagrada.");
    }
    setIsLoading(false);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentBook, currentChapter, chapterCache, fetchChapterData, prefetchNext]);

  useEffect(() => {
    loadCurrentChapter();
  }, [currentBook, currentChapter]);

  const handleSpeak = async (verse: any) => {
    if (isSpeaking === verse.verse) return;
    setIsSpeaking(verse.verse);
    await speakText(verse.text, voiceGender);
    setIsSpeaking(null);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Encontre 10 versículos da Bíblia relacionados ao tema: "${searchQuery}". 
        REGRAS: Retorne APENAS um JSON. Use nomes da lista: ${BIBLE_BOOKS.map(b => b.name).join(', ')}. Texto em PT-BR.`,
        config: { responseMimeType: "application/json" },
      });
      const rawResults = JSON.parse(response.text);
      const results: SearchResult[] = Array.isArray(rawResults) ? rawResults : (rawResults.verses || rawResults.results || []);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const goToVerse = (bookName: string, chapter: number) => {
    const book = BIBLE_BOOKS.find(b => b.name.toLowerCase() === bookName.toLowerCase());
    if (book) {
      setCurrentBook(book);
      setCurrentChapter(chapter);
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FDFCFB] relative">
      <div className="px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors group"
        >
          <span className="font-bold text-slate-800 group-hover:text-indigo-600">
            {currentBook.name} {currentChapter}
          </span>
          <List size={16} className="text-indigo-400" />
        </button>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><Search size={20} /></button>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button disabled={currentChapter <= 1} onClick={() => setCurrentChapter(currentChapter - 1)} className="p-2 text-slate-600 disabled:opacity-30"><ChevronLeft size={20} /></button>
          <button disabled={currentChapter >= currentBook.chapters} onClick={() => setCurrentChapter(currentChapter + 1)} className="p-2 text-slate-600 disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full animate-pulse">
            <Book className="text-indigo-300 w-12 h-12 mb-4" />
            <p className="text-slate-400 text-sm">Buscando as palavras sagradas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <X size={32} className="text-rose-500" />
            <p className="text-sm text-slate-500">{error}</p>
            <button onClick={loadCurrentChapter} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">Tentar Novamente</button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="mb-10 text-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">{currentBook.name}</span>
              <h2 className="text-4xl font-black serif-bible text-slate-900">Capítulo {currentChapter}</h2>
              <div className="w-12 h-1 bg-indigo-100 mx-auto mt-4 rounded-full" />
            </div>

            {verses.map((v) => (
              <div key={v.verse} className="group relative py-2">
                <p className={`serif-bible text-xl leading-[1.8] transition-colors ${isSpeaking === v.verse ? 'text-indigo-600' : 'text-slate-800'}`}>
                  <sup className="text-indigo-500 font-bold mr-2 text-xs select-none">{v.verse}</sup>
                  {v.text}
                </p>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                     onClick={() => handleSpeak(v)}
                     className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking === v.verse ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
                   >
                      <Volume2 size={16} />
                   </button>
                   <button 
                     onClick={() => onAskAI?.(`${currentBook.name} ${currentChapter}:${v.verse} - ${v.text}`)}
                     className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:scale-110"
                   >
                      <Sparkles size={16} />
                   </button>
                </div>
              </div>
            ))}
            <div className="h-32" />
          </div>
        )}
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-[60] flex items-center justify-center">
          <div className="h-full w-full max-w-2xl bg-white flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <button onClick={() => setIsSearchOpen(false)}><X size={20} className="text-slate-400" /></button>
              <form onSubmit={handleSearch} className="flex-1 relative">
                <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Temas ou sentimentos..." className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-slate-800" />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isSearching ? <div className="h-full flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /><p className="text-sm mt-4 text-slate-500">Buscando...</p></div> : 
                searchResults.map((result, idx) => (
                  <button key={idx} onClick={() => goToVerse(result.book, result.chapter)} className="w-full text-left p-5 mb-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{result.book} {result.chapter}:{result.verse}</span>
                    <p className="serif-bible text-lg text-slate-700 mt-2 italic">"{result.text}"</p>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {isPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center" onClick={() => setIsPickerOpen(false)}>
          <div className="bg-white w-full max-w-xl md:rounded-3xl rounded-t-3xl h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold">Escolher Livro</h3><button onClick={() => setIsPickerOpen(false)}><X size={20} className="text-slate-400" /></button></div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BIBLE_BOOKS.map(book => (
                <button key={book.name} onClick={() => { setCurrentBook(book); setCurrentChapter(1); setIsPickerOpen(false); }} className={`p-4 rounded-2xl text-left border transition-all ${currentBook.name === book.name ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                  <span className={`block font-bold truncate ${currentBook.name === book.name ? 'text-indigo-700' : 'text-slate-700'}`}>{book.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase">{book.chapters} capítulos</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
