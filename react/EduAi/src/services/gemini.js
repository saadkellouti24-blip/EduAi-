const GROQ_API_KEY=import.meta.env.VITE_GROQ_API_KEY
export async function fetchWithRetry(url, options, maxRetries = 5) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

// On garde le nom callGemini pour ne pas casser tes autres fichiers, 
// mais ça appelle Groq en réalité !
export async function callGemini(prompt, isJson = false) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const payload = {
    model: "llama-3.1-8b-instant", // Modèle très rapide de Groq
    messages: [
      { role: "user", content: prompt }
    ]
  };
  
  // Si on demande du JSON (pour le QCM)
  if (isJson) {
    payload.response_format = { type: "json_object" };
  }

  const data = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  
  return data.choices?.[0]?.message?.content;
}