import React, { useState } from 'react';
import { Users, PlusCircle, User } from 'lucide-react';

export default function ClassesManager({ classes, users, onAddClass, onAddStudent }) {
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [selectedClassForStudent, setSelectedClassForStudent] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Gestion des Classes</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-500" /> {cls.name}</h3>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">{cls.students.length} Étudiants</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cls.students.map(studentId => {
                  const student = users.find(u => u.id === studentId);
                  if(!student) return null;
                  return (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 font-bold border border-slate-200">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </div>
                    </div>
                  );
                })}
                {cls.students.length === 0 && <p className="text-slate-400 text-sm italic py-2">Aucun étudiant dans cette classe.</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-purple-500"/> Nouvelle Classe</h3>
            <input type="text" placeholder="Nom de la classe (ex: DevWeb)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
            <button onClick={() => { if(newClassName) { onAddClass(newClassName); setNewClassName(''); } }} className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-slate-800 transition-colors">Créer la classe</button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><User className="w-5 h-5 text-emerald-500"/> Inscrire un Étudiant</h3>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Nom complet" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
              <input type="email" placeholder="Email de connexion" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} />
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedClassForStudent} onChange={e => setSelectedClassForStudent(e.target.value)}>
                <option value="">Sélectionner une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={() => { if(newStudentName && newStudentEmail && selectedClassForStudent) { onAddStudent(newStudentName, newStudentEmail, parseInt(selectedClassForStudent)); setNewStudentName(''); setNewStudentEmail(''); setSelectedClassForStudent(''); } }} className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors">Ajouter l'étudiant</button>
          </div>
        </div>
      </div>
    </div>
  );
}