/**
 * 
 * @param {string} apiKey 
 * @param {string} prompt 
 * @returns A string response
 */
async function generateGeminiContent(apiKey, prompt) {
  const model = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text response from Gemini's specific payload structure
    const generatedText = data.candidates[0].content.parts[0].text;
    console.log("Gemini Response:", generatedText);
    return generatedText;
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }
}