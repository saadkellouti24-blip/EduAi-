import React, { useState, useRef } from 'react';
import { Sparkles, BookOpen, Loader, PlusCircle, Save, Upload, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { callGemini } from '../../services/gemini';
import { api } from '../../services/api';

export default function TeacherDashboard({ onCourseGenerated, courses }) {
  const [activeMode, setActiveMode] = useState('ia');

  // States IA
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // States Manuel
  const [manualCourse, setManualCourse] = useState({ title: '', description: '' });
  const [chapters, setChapters] = useState([{ title: '', content: '', expanded: true }]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRefs = useRef([]);

  // ─── PARSING FICHIER → CONTENU CHAPITRE ───────────────────────────────────
  const parseFileContent = (content, filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'json') {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed.content === 'string') return { title: parsed.title || '', content: parsed.content };
        return { title: parsed.title || '', content: JSON.stringify(parsed, null, 2) };
      } catch { /* fallback */ }
    }
    return { title: '', content: content.trim() };
  };

  // ─── UPLOAD FICHIER POUR UN CHAPITRE ──────────────────────────────────────
  const handleChapterFileUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = ['txt', 'md', 'json', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExts.includes(ext)) {
      alert('Format non supporté. Utilisez .txt, .md, .json ou .pdf');
      return;
    }

    setUploadingIndex(index);

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

        setChapters(prev => prev.map((ch, i) => {
          if (i !== index) return ch;
          return {
            ...ch,
            title: ch.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
            content,
          };
        }));

      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const { title, content: parsedContent } = parseFileContent(event.target.result, file.name);
            setChapters(prev => prev.map((ch, i) => {
              if (i !== index) return ch;
              return {
                ...ch,
                title: title || ch.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                content: parsedContent,
              };
            }));
          } catch {
            alert("Impossible de lire ce fichier.");
          } finally {
            setUploadingIndex(null);
            if (fileInputRefs.current[index]) fileInputRefs.current[index].value = '';
          }
        };
        reader.onerror = () => { alert("Erreur de lecture."); setUploadingIndex(null); };
        reader.readAsText(file, 'UTF-8');
        return; 
      }

    } catch {
      alert("Impossible de lire ce fichier PDF.");
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) fileInputRefs.current[index].value = '';
    }
  };

  // ─── GESTION CHAPITRES ────────────────────────────────────────────────────
  const addChapter = () =>
    setChapters(prev => [...prev, { title: '', content: '', expanded: true }]);

  const removeChapter = (index) =>
    setChapters(prev => prev.filter((_, i) => i !== index));

  const toggleChapter = (index) =>
    setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, expanded: !ch.expanded } : ch));

  const updateChapter = (index, field, value) =>
    setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, [field]: value } : ch));

  // ─── GÉNÉRATION IA (CORRIGÉE POUR GROQ) ───────────────────────────────────
  const handleGenerateIA = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      // On demande explicitement à Groq de répondre avec notre structure JSON
      const prompt = `
        Génère un plan de cours structuré et le contenu détaillé pour le sujet : "${topic}". En français. Contenu pédagogique.
        Tu dois répondre UNIQUEMENT en JSON valide avec le format exact ci-dessous, sans aucun texte avant ou après :
        {
          "title": "Titre du cours",
          "description": "Description courte du cours",
          "chapters": [
            {
              "title": "Titre du chapitre 1",
              "content": "Contenu complet du chapitre 1"
            }
          ]
        }
      `;
      
      // On met "true" en 2ème argument pour forcer le mode JSON
      const response = await callGemini(prompt, true);
      
      // On nettoie les potentielles balises Markdown que l'IA pourrait rajouter
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanResponse);
      //  Filet de sécurité pour garantir que le format est toujours bon pour Laravel
      if (!data.chapters) data.chapters = [];
      data.chapters = data.chapters.map((ch, index) => ({
        title: ch.title || `Chapitre ${index + 1}`,
        // Si l'IA a mis le texte dans "texte" ou "body" au lieu de "content", on le rattrape
        content: ch.content || ch.texte || ch.body || "Contenu généré incomplet."
      }));
      
      const savedCourse = await api.createCourse(data);
      onCourseGenerated(savedCourse.course);
      setTopic('');
      alert("Cours généré par l'IA et sauvegardé !");
    } catch (err) { 
      console.error("Erreur lors de la génération IA:", err);
      alert("Erreur lors de la génération IA ou de la sauvegarde."); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  // ─── SAUVEGARDE MANUELLE ──────────────────────────────────────────────────
  const handleSaveManual = async () => {
    if (!manualCourse.title) return alert("Veuillez remplir le titre du cours.");
    const validChapters = chapters.filter(ch => ch.title.trim() || ch.content.trim());
    if (validChapters.length === 0) return alert("Ajoutez au moins un chapitre avec du contenu.");

    setIsSaving(true);
    try {
      const dataToSave = {
        title: manualCourse.title,
        description: manualCourse.description,
        chapters: validChapters.map(({ title, content }) => ({ title, content })),
      };
      const savedCourse = await api.createCourse(dataToSave);
      onCourseGenerated(savedCourse.course);
      setManualCourse({ title: '', description: '' });
      setChapters([{ title: '', content: '', expanded: true }]);
      alert("Cours créé avec succès !");
    } catch { alert("Erreur lors de la sauvegarde."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Création de Cours</h2>
        <p className="text-slate-500 font-medium">Choisissez votre méthode de création de contenu.</p>
      </div>

      {/* Onglets */}
      <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveMode('ia')} className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeMode === 'ia' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <Sparkles className="w-4 h-4" /> Génération IA
        </button>
        <button onClick={() => setActiveMode('manual')} className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeMode === 'manual' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
          <PlusCircle className="w-4 h-4" /> Création Manuelle
        </button>
      </div>

      {/* ── MODE IA ── */}
      {activeMode === 'ia' ? (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10 max-w-2xl">
            <label className="block text-sm font-bold text-slate-700 mb-3">Sujet du cours pour l'IA</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Ex: L'architecture Microservices..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
              <button onClick={handleGenerateIA} disabled={isGenerating || !topic} className="bg-slate-900 text-white px-8 py-4 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50">
                {isGenerating ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Générer
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ── MODE MANUEL ── */
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-5 max-w-3xl">

          {/* Infos cours */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Titre du cours</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={manualCourse.title} onChange={e => setManualCourse({ ...manualCourse, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description rapide</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" rows="2" value={manualCourse.description} onChange={e => setManualCourse({ ...manualCourse, description: e.target.value })} />
            </div>
          </div>

          {/* ── CHAPITRES ── */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-base">Chapitres <span className="text-indigo-500">({chapters.length})</span></h3>
              <button onClick={addChapter} className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                <PlusCircle className="w-4 h-4" /> Ajouter un chapitre
              </button>
            </div>

            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden">

                  {/* Header chapitre */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Titre du chapitre ${index + 1}`}
                      className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      value={chapter.title}
                      onChange={e => updateChapter(index, 'title', e.target.value)}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleChapter(index)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-all">
                        {chapter.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {chapters.length > 1 && (
                        <button onClick={() => removeChapter(index)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Corps chapitre (collapsible) */}
                  {chapter.expanded && (
                    <div className="p-4 space-y-3 bg-white">
                      {/* Bouton upload fichier */}
                      <div>
                        <input
                          type="file"
                          accept=".txt,.md,.jso,.pdf"
                          className="hidden"
                          ref={el => fileInputRefs.current[index] = el}
                          onChange={e => handleChapterFileUpload(e, index)}
                        />
                        <button
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-all disabled:opacity-60 w-full justify-center"
                        >
                          {uploadingIndex === index
                            ? <><Loader className="w-4 h-4 animate-spin" /> Chargement...</>
                            : <><Upload className="w-4 h-4" /> Importer depuis un fichier (.txt, .md, .json, .pdf)</>
                          }
                        </button>
                        {chapter.content && (
                          <p className="text-xs text-emerald-600 font-medium text-center mt-1.5">
                            ✓ Contenu chargé — {chapter.content.length} caractères
                          </p>
                        )}
                      </div>

                      {/* Textarea contenu */}
                      <textarea
                        placeholder="Ou écrivez le contenu du chapitre ici..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 h-40 outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-slate-700 resize-y"
                        value={chapter.content}
                        onChange={e => updateChapter(index, 'content', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={handleSaveManual}
            disabled={isSaving}
            className="w-full mt-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
          >
            {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Enregistrer le cours ({chapters.filter(c => c.title || c.content).length} chapitre{chapters.length > 1 ? 's' : ''})
          </button>
        </div>
      )}

    </div>
  );
}