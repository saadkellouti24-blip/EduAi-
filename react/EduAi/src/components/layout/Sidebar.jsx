import React from 'react';
import { Brain, LayoutDashboard, Users, BookOpen, LogOut } from 'lucide-react';

// ✅ Déclaré EN DEHORS de Sidebar
const NavItem = ({ icon, label, id, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
      activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    {React.cloneElement(icon, {
      className: `w-5 h-5 ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`,
    })}
    <span>{label}</span>
  </button>
);

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">IntelliLearn</h1>
      </div>

      <div className="px-4 py-2 flex-1 space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        <NavItem icon={<LayoutDashboard />} label="Tableau de bord" id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
        {user?.role === 'teacher' && (
          <NavItem icon={<Users />} label="Gestion Classes" id="classes" activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        <NavItem icon={<BookOpen />} label="Catalogue Cours" id="catalog" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-bold text-sm text-slate-800 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.role === 'teacher' ? 'Professeur' : 'Étudiant'}</div>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}