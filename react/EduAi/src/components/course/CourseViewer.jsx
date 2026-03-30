import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Brain, Loader, Sparkles, Check, X, MessageSquare, FileText, ArrowLeft, Upload } from 'lucide-react';
import { callGemini } from '../../services/gemini';

export default function CourseViewer({ course: initialCourse, onBack }) {
  const [course, setCourse] = useState(initialCourse);
  const [activeChapter, setActiveChapter] = useState(initialCourse.chapters?.[0]);

  // States Chat RAG
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: `Bonjour ! Je suis l'IA de ce cours. Que voulez-vous savoir sur le chapitre actuel ?` }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // States Résumé et Quiz
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);

  // State Upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setSummary(null); setQuizData(null); }, [activeChapter]);

  // ─── PARSING DU FICHIER IMPORTÉ ───────────────────────────────────────────

  const parseFileToChapters = (content, filename) => {
    const ext = filename.split('.').pop().toLowerCase();

    // Cas JSON : structure déjà formée { title, chapters: [...] }
    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.chapters && Array.isArray(parsed.chapters)) return parsed;
        // JSON plat : chaque clé = un chapitre
        const chapters = Object.entries(parsed).map(([key, val]) => ({
          title: key,
          content: typeof val === 'string' ? val : JSON.stringify(val, null, 2),
        }));
        return { title: filename.replace(/\.[^.]+$/, ''), chapters };
      } catch {
        // fallback text
      }
    }

    // Cas TXT / MD : découpe sur les titres # ou === / ---
    const lines = content.split('\n');
    const chapters = [];
    let currentTitle = null;
    let currentContent = [];

    const flush = () => {
      if (currentTitle) {
        chapters.push({ title: currentTitle.trim(), content: currentContent.join('\n').trim() });
      }
      currentContent = [];
    };

    for (const line of lines) {
      // Titres Markdown niveau 1 ou 2
      if (/^#{1,2}\s+/.test(line)) {
        flush();
        currentTitle = line.replace(/^#{1,2}\s+/, '');
      }
      // Titres soulignés (===)
      else if (/^={3,}$/.test(line.trim()) && currentContent.length > 0) {
        const prevTitle = currentContent.pop();
        flush();
        currentTitle = prevTitle;
      }
      else {
        currentContent.push(line);
      }
    }
    flush();

    // Aucun titre trouvé → tout le fichier = un seul chapitre
    if (chapters.length === 0) {
      chapters.push({ title: 'Contenu importé', content: content.trim() });
    }

    return {
      title: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      chapters,
    };
  };

  // ─── HANDLER UPLOAD ────────────────────────────────────────────────────────

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'application/json', 'text/markdown', 'text/x-markdown'];
    const allowedExts = ['txt', 'json', 'md'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      alert('Format non supporté. Veuillez importer un fichier .txt, .md ou .json');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const parsed = parseFileToChapters(content, file.name);
        setCourse(parsed);
        setActiveChapter(parsed.chapters?.[0]);
        setSummary(null);
        setQuizData(null);
        setMessages([{ role: 'ai', text: `Cours "${parsed.title}" importé avec succès ! ${parsed.chapters.length} chapitre(s) trouvé(s). Que voulez-vous savoir ?` }]);
      } catch (err) {
        alert("Impossible de lire ce fichier. Vérifiez son format.");
      } finally {
        setIsUploading(false);
        // Reset input pour permettre le re-upload du même fichier
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert("Erreur lors de la lecture du fichier.");
      setIsUploading(false);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // ─── FONCTIONS IA ─────────────────────────────────────────────────────────

  const sendChatMessage = async () => { /* ... identique à avant ... */ };
  const generateQuiz = async () => { /* ... identique à avant ... */ };

  const generateSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const prompt = `Fais un résumé très concis et clair avec des tirets (points clés) de ce texte de cours : """${activeChapter.content}"""`;
      const responseText = await callGemini(prompt);
      setSummary(responseText);
    } catch { alert("Erreur lors de la génération du résumé."); }
    finally { setIsSummaryLoading(false); }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[90vh] bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">

      {/* SIDEBAR CHAPITRES */}
      <div className="w-72 border-r border-slate-100 flex flex-col bg-slate-50">

        {/* BACK BUTTON */}
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white px-3 py-2 rounded-xl transition-all w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux cours
          </button>
        </div>

        {/* COURSE TITLE */}
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900 text-lg leading-tight">{course.title}</h2>
        </div>

        {/* CHAPTER LIST */}
        <div className="flex-1 overflow-y-auto p-3">
          {course.chapters?.map((chapter, index) => (
            <button
              key={index}
              onClick={() => setActiveChapter(chapter)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 flex items-center gap-3 transition-all text-sm font-medium ${
                activeChapter?.title === chapter.title
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${activeChapter?.title === chapter.title ? 'rotate-90' : ''}`} />
              {chapter.title}
            </button>
          ))}
        </div>

        {/* UPLOAD BUTTON (bas de la sidebar) */}
        <div className="p-3 border-t border-slate-100">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading
              ? <><Loader className="w-4 h-4 animate-spin" /> Chargement...</>
              : <><Upload className="w-4 h-4" /> Importer un cours</>
            }
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">Formats : .txt · .md · .json</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-12 relative bg-white">
        {activeChapter && (
          <div className="max-w-3xl mx-auto pb-20 animate-in fade-in">
            <h1 className="text-4xl font-black mb-8 text-slate-900">{activeChapter.title}</h1>

            {/* BOUTONS ACTIONS IA */}
            <div className="flex gap-4 mb-8">
              <button onClick={generateSummary} disabled={isSummaryLoading} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 flex items-center gap-2 text-sm">
                {isSummaryLoading ? <Loader className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>} Résumé Rapide IA
              </button>
            </div>

            {/* AFFICHAGE DU RÉSUMÉ */}
            {summary && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4"/> Synthèse IA</h3>
                <div className="prose prose-sm text-amber-900 whitespace-pre-wrap">{summary}</div>
              </div>
            )}

            <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activeChapter.content}
            </div>
          </div>
        )}
      </div>

      {/* CHATBOT LATÉRAL ... (identique à avant) ... */}
    </div>
  );
}