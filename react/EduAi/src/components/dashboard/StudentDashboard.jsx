import React from 'react';
import { Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import CourseGrid from '../course/CourseGrid';

// 1. AJOUT : On ajoute `quizzesPassed` dans les paramètres (avec 0 par défaut pour éviter les erreurs)
export default function StudentDashboard({ courses, onOpenCourse, user, classes, quizzesPassed = 0 }) {
  const studentClass = classes.find(c => c.id === user.classId);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Bonjour, {user.name} 👋</h2>
          <p className="text-slate-500">Classe : <span className="font-semibold text-indigo-600">{studentClass?.name || "Non assigné"}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> Cours Disponibles</h3>
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{courses.length}</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col justify-center">
          <h3 className="text-slate-500 font-medium flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Quiz Réussis</h3>
          {/* 2. MODIFICATION : On remplace le "0" en dur par notre variable quizzesPassed */}
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{quizzesPassed}</div>
        </div>
        
      </div>

      <div>
        <h3 className="text-xl font-bold mb-6 text-slate-800">Reprendre l'apprentissage</h3>
        {courses.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 text-center text-slate-500">
            Vos professeurs n'ont pas encore généré de cours pour votre classe.
          </div>
        ) : (
          <CourseGrid courses={courses} onOpenCourse={onOpenCourse} />
        )}
      </div>
    </div>
  );
}