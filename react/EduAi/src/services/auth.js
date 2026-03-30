const MOCK_DB = [
  { id: 1, name: "Professeur Admin", email: "prof@edtech.com", password: "password123", role: "teacher" },
  { id: 2, name: "Étudiant Test", email: "etudiant@edtech.com", password: "password123", role: "student", xp: 120, classId: 1 }
];

export async function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_DB.find(u => u.email === email && u.password === password);
      if (user) {
        const { password: _password, ...safeUser } = user; // ✅ plus d'avertissement
        resolve({ user: safeUser, token: "mock_token_" + Date.now() });
      } else {
        reject(new Error("Identifiants incorrects"));
      }
    }, 800);
  });
}
