import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function CourseGrid({ courses, onOpenCourse }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer group flex flex-col transform hover:-translate-y-1" onClick={() => onOpenCourse(course)}>
          <div className="h-40 bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50/50 transition-colors relative">
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-100">
              {course.chapters?.length || 0} Chapitres
            </div>
            <BookOpen className="w-16 h-16 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" />
          </div>
          <div className="p-6 flex-1 flex flex-col">
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
