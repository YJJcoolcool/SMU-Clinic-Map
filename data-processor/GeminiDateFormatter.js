export default class GeminiDateFormatter {
    /**
     * @param {string} apiKey - Your Google AI Studio API Key.
     */
    constructor(apiKey) {
        if (!apiKey) throw new Error("Please enter a Gemini API key first!");

        this.apiKey = apiKey;
        this.model = "gemini-3.1-flash-lite";
        this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;
    }

    /**
     * Generates a text response from a text prompt
     * @param {string} prompt Text prompt
     * @returns A text response
     */
    async generateContent(prompt) {
        const requestBody = {
            contents: [
                {
                    parts: [{ text: prompt },
                    ],
                },
            ],
        };

        try {
            const response = await fetch(this.baseURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Extract the text response from Gemini's specific payload structure
            const generatedText = data.candidates[0].content.parts[0].text;

            if (!generatedText) {
                throw new Error("Unexpected API response structure or empty content!");
            }

            return generatedText;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return null;
        }
    }

    /**
     * Converts a series of raw strings into a clean OpenStreetMap opening_hours format.
     * @param {...string} args - The raw text chunks to combine and format.
     * @returns {Promise<string|null>} The clean OSM string, or null if it fails.
     */
    async formatOpeningHours(...args) {
        const joined = args.join(";");

        const prompt = `
            Convert the following raw text into a valid OpenStreetMap (OSM) "opening_hours" value. Return ONLY the final string value. Do not include conversational text, explanations, or markdown code block formatting (like \`\`\`).

            CRITICAL OSM SYNTAX RULES:
            1. Semicolons (;) separate completely different rules. If day ranges overlap across semicolons, the later rule OVERRIDES and deletes the earlier one.
            2. To specify multiple open intervals on the same day (e.g., morning and evening split shifts), use a comma (,) to chain the times or separate rules, NOT a semicolon.
            - WRONG: Mo-Fr 08:00-13:00; Mo,We,Fr 18:00-21:00 (Erases morning hours for Mo, We, Fr)
            - RIGHT: Mo,We,Fr 08:00-13:00,18:00-21:00; Tu,Th 08:00-13:00
            - ALSO RIGHT: Mo-Fr 08:00-13:00, Mo,We,Fr 18:00-21:00
            3. Use standard 2-letter day abbreviations: Mo, Tu, We, Th, Fr, Sa, Su, PH (Public Holidays).
            4. Use 24-hour time formatting (HH:MM-HH:MM).
            5. Use "off" for closed days.

            Text to format: "${joined}"
        `;

        return await this.generateContent(prompt);
    }
}
