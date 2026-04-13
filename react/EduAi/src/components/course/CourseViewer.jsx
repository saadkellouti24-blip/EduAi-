import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Brain, Loader, Check, X, MessageSquare, ArrowLeft, Upload } from 'lucide-react';
import { callGemini } from '../../services/gemini';

// 1. AJOUT : On ajoute `onQuizSuccess` dans les paramètres (props)
export default function CourseViewer({ course: initialCourse, onBack, userRole, onCourseImported, onQuizSuccess }) {
  const [course, setCourse] = useState(initialCourse);
  const [activeChapter, setActiveChapter] = useState(initialCourse.chapters?.[0]);

  // States Chat RAG
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: `Bonjour ! Je suis l'IA de ce cours. Que voulez-vous savoir sur le chapitre actuel ?` }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // States Quiz
  const [quizData, setQuizData] = useState(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // State Upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setQuizData(null); setSelectedAnswers({}); setQuizSubmitted(false); }, [activeChapter]);

  // ─── PARSING DU FICHIER IMPORTÉ ───────────────────────────────────────────

  const parseFileToChapters = (content, filename) => {
    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.chapters && Array.isArray(parsed.chapters)) return parsed;
        const chapters = Object.entries(parsed).map(([key, val]) => ({
          title: key,
          content: typeof val === 'string' ? val : JSON.stringify(val, null, 2),
        }));
        return { title: filename.replace(/\.[^.]+$/, ''), chapters };
      } catch {
        // fallback text
      }
    }

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
      if (/^#{1,2}\s+/.test(line)) {
        flush();
        currentTitle = line.replace(/^#{1,2}\s+/, '');
      } else if (/^={3,}$/.test(line.trim()) && currentContent.length > 0) {
        const prevTitle = currentContent.pop();
        flush();
        currentTitle = prevTitle;
      } else {
        currentContent.push(line);
      }
    }
    flush();

    if (chapters.length === 0) {
      chapters.push({ title: 'Contenu importé', content: content.trim() });
    }

    return {
      title: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      chapters,
    };
  };

  // ─── HANDLER UPLOAD ────────────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['txt', 'json', 'md', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExts.includes(ext)) {
      alert('Format non supporté. Veuillez importer un fichier .txt, .md, .json ou .pdf');
      return;
    }

    setIsUploading(true);

    try {
      let content = '';

      if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map(item => item.str).join(' ') + '\n\n';
        }
      } else {
        content = await file.text();
      }

      const parsed = parseFileToChapters(content, file.name);

      const response = await fetch('http://127.0.0.1:8000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: parsed.title,
          description: '',
          chapters: parsed.chapters
        })
      });

      const data = await response.json();

      setCourse(data.course || parsed);
      setActiveChapter((data.course || parsed).chapters?.[0]);
      setQuizData(null);
      setMessages([{ role: 'ai', text: `Cours "${parsed.title}" importé et sauvegardé ! ${parsed.chapters.length} chapitre(s). Que voulez-vous savoir ?` }]);

      if (onCourseImported) onCourseImported(data.course || parsed);

    } catch (err) {
      alert("Impossible de lire ce fichier. Vérifiez son format.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── FONCTIONS IA ─────────────────────────────────────────────────────────

  const sendChatMessage = async () => { /* ... identique à avant ... */ };

  // ─── GÉNÉRATION QCM ───────────────────────────────────────────────────────

  const generateQuiz = async () => {
    setIsQuizLoading(true);
    setQuizData(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    try {
      const maxLength = 5000;
      let safeContent = activeChapter.content;
      if (safeContent.length > maxLength) {
        safeContent = safeContent.substring(0, maxLength) + "\n...[texte tronqué car trop long]...";
      }

      const prompt = `
        À partir de ce contenu de cours, génère 5 questions QCM en français.
        Réponds UNIQUEMENT en JSON valide avec ce format exact :
        {
          "questions": [
            {
              "question": "Texte de la question ?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": 0
            }
          ]
        }
        "answer" est l'index (0-3) de la bonne réponse.
        Contenu du cours : """${safeContent}"""
      `;
      
      const responseText = await callGemini(prompt, true);
      
      const clean = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setQuizData(parsed);
    } catch (err) {
      console.error("Détail de l'erreur lors de la génération du QCM :", err);
      alert("Erreur lors de la génération du QCM. Le texte est peut-être encore trop complexe.");
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex, oIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  // 2. MODIFICATION : C'est ici qu'on déclenche le compteur si le score est bon !
  const handleSubmitQuiz = () => {
    if (Object.keys(selectedAnswers).length < quizData.questions.length) {
      alert("Veuillez répondre à toutes les questions.");
      return;
    }
    
    setQuizSubmitted(true);

    // On calcule le score
    const score = quizData.questions.filter((q, i) => selectedAnswers[i] === q.answer).length;
    
    // Si l'étudiant a la moyenne (ou plus), on déclenche la victoire !
    if (score >= quizData.questions.length / 2) {
      if (onQuizSuccess) {
        onQuizSuccess(); 
      }
    }
  };

  const getScore = () => {
    if (!quizData) return 0;
    return quizData.questions.filter((q, i) => selectedAnswers[i] === q.answer).length;
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

        {/* UPLOAD BUTTON - Professeur seulement */}
        {userRole === 'teacher' && (
          <div className="p-3 border-t border-slate-100">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,.pdf"
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
            <p className="text-xs text-slate-400 text-center mt-2">Formats : .txt · .md · .json · .pdf</p>
          </div>
        )}

      </div> {/* ← FIN SIDEBAR */}

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-12 relative bg-white">
        {activeChapter && (
          <div className="max-w-3xl mx-auto pb-20 animate-in fade-in">
            <h1 className="text-4xl font-black mb-8 text-slate-900">{activeChapter.title}</h1>

            {/* BOUTONS ACTIONS IA */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={generateQuiz}
                disabled={isQuizLoading}
                className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-2 text-sm"
              >
                {isQuizLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Brain className="w-4 h-4"/>}
                Générer QCM
              </button>
            </div>

            {/* AFFICHAGE DU QCM */}
            {quizData && (
              <div className="bg-white border border-slate-200 rounded-2xl mb-8 overflow-hidden animate-in slide-in-from-top-4">
                <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4"/> QCM — {activeChapter.title}
                  </h3>
                  {quizSubmitted && (
                    <span className="bg-white text-emerald-700 font-black px-3 py-1 rounded-full text-sm">
                      {getScore()} / {quizData.questions.length}
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {quizData.questions.map((q, qIndex) => (
                    <div key={qIndex}>
                      <p className="font-bold text-slate-800 mb-3 text-sm">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[qIndex] === oIndex;
                          const isCorrect = q.answer === oIndex;
                          let style = 'border-slate-200 bg-slate-50 text-slate-700';
                          if (quizSubmitted) {
                            if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                            else if (isSelected && !isCorrect) style = 'border-red-400 bg-red-50 text-red-800';
                          } else if (isSelected) {
                            style = 'border-indigo-400 bg-indigo-50 text-indigo-800';
                          }
                          return (
                            <button
                              key={oIndex}
                              onClick={() => handleSelectAnswer(qIndex, oIndex)}
                              className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${style}`}
                            >
                              <span>{option}</span>
                              {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                              {quizSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-red-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all"
                    >
                      Valider mes réponses
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="font-black text-2xl text-slate-800 mb-1">
                        {getScore() === quizData.questions.length ? '🎉 Parfait !' : getScore() >= quizData.questions.length / 2 ? '👍 Bien !' : '📚 Révisez !'}
                      </p>
                      <p className="text-slate-500 text-sm mb-4">
                        Score : {getScore()} / {quizData.questions.length}
                      </p>
                      <button
                        onClick={generateQuiz}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-xl text-sm transition-all"
                      >
                        Nouveau QCM
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activeChapter.content}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}