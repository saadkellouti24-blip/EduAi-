const API_KEY = "AIzaSyA0Dnoypy-VPbwdUJ8l7XYpHzGRgokHgnM";

export async function fetchWithRetry(url, options, maxRetries = 5) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

export async function callGemini(prompt, isJson = false, jsonSchema = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  
  if (isJson) {
    payload.generationConfig = { responseMimeType: "application/json" };
    if (jsonSchema) payload.generationConfig.responseSchema = jsonSchema;
  }

  const data = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}
