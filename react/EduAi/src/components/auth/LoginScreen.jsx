import React, { useState } from 'react';
import { Brain, Mail, Lock, Loader } from 'lucide-react';
import { api } from '../../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('prof@edtech.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      // VRAI APPEL VERS LARAVEL
      const data = await api.login(email, password);
      onLoginSuccess(data.user, data.token);
    } catch (err) { 
      setError(err.response?.data?.message || "Erreur de connexion au serveur Laravel"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-slate-100 p-4">
      <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md text-center border border-white/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5"><Brain className="w-48 h-48" /></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">EduAI</h2>
          <p className="text-slate-500 mb-8 font-medium">L'apprentissage propulsé par l'IA</p>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input type="email" required className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input type="password" required className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none backdrop-blur-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-semibold transition-all shadow-lg flex justify-center mt-6">
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Connexion Sécurisée"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
