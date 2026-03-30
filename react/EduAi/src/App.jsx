import React, { useState, useEffect } from 'react';
import './index.css';
import LoginScreen from './components/auth/LoginScreen.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { api } from './services/api';
import TeacherDashboard from './components/dashboard/TeacherDashboard.jsx';
import StudentDashboard from './components/dashboard/StudentDashboard.jsx';
import ClassesManager from './components/dashboard/ClassesManager.jsx';
import CourseGrid from './components/course/CourseGrid.jsx';
import CourseViewer from './components/course/CourseViewer.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCourse, setActiveCourse] = useState(null);

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);

  // CHANGER ICI: Chargement des vraies données Laravel
  const loadData = async () => {
    try {
      const coursesData = await api.getCourses();
      setCourses(coursesData);
      const classesData = await api.getClasses();
      setClasses(classesData);
    } catch (err) { console.error("Erreur de chargement", err); }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadData(); // Charge les données si connecté
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    setActiveTab('dashboard');
    loadData(); // Charge les données au login
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); 
    localStorage.removeItem('token');
    setUser(null);
    setActiveCourse(null);
  };

  if (!user) return <LoginScreen onLoginSuccess={handleLogin} />;
  
  // Si l'utilisateur a cliqué sur un cours pour le lire, on affiche le CourseViewer
  if (activeCourse) return <CourseViewer course={activeCourse} onBack={() => setActiveCourse(null)} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* Espace Professeur */}
          {activeTab === 'dashboard' && user.role === 'teacher' && (
            <TeacherDashboard courses={courses} onCourseGenerated={c => setCourses([c, ...courses])} />
          )}

          {activeTab === 'classes' && user.role === 'teacher' && (
             <ClassesManager 
                classes={classes} 
                users={users} 
                onAddClass={(name) => setClasses([...classes, { id: Date.now(), name, students: [] }])} 
                onAddStudent={(name, email, classId) => console.log("Etudiant ajouté", name)} 
             />
          )}

          {/* Espace Étudiant */}
          {activeTab === 'dashboard' && user.role === 'student' && (
            <StudentDashboard courses={courses} user={user} classes={classes} onOpenCourse={setActiveCourse} />
          )}

          {/* Espace Commun */}
          {activeTab === 'catalog' && (
             <div>
               <h2 className="text-2xl font-bold mb-6 text-slate-800">Catalogue des cours</h2>
               {courses.length === 0 ? (
                 <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-500 shadow-sm">
                   Aucun cours n'a été généré pour le moment.
                 </div>
               ) : (
                 <CourseGrid courses={courses} onOpenCourse={setActiveCourse} />
               )}
             </div>
          )}

        </div>
      </main>
    </div>
  );
}