import React from 'react';
import { BookOpen, ChevronRight, Trash2 } from 'lucide-react';

export default function CourseGrid({ courses, onOpenCourse, onDeleteCourse, userRole }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col transform hover:-translate-y-1 relative">

          {/* Bouton supprimer - Professeur seulement */}
          {userRole === 'teacher' && onDeleteCourse && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // empêche d'ouvrir le cours
                if (confirm(`Supprimer le cours "${course.title}" ?`)) {
                  onDeleteCourse(course.id);
                }
              }}
              className="absolute top-4 left-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="h-40 bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50/50 transition-colors relative" onClick={() => onOpenCourse(course)}>
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-100">
              {course.chapters?.length || 0} Chapitres
            </div>
            <BookOpen className="w-16 h-16 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" />
          </div>

          <div className="p-6 flex-1 flex flex-col" onClick={() => onOpenCourse(course)}>
            <h3 className="font-extrabold text-lg text-slate-800 mb-2 leading-tight">{course.title}</h3>
            <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1">{course.description}</p>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Commencer le cours <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}