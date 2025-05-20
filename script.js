document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const shorthandReportInput = document.getElementById('shorthandReport');
    const previousTemplatesInput = document.getElementById('previousTemplates');
    const personalNotesInput = document.getElementById('personalNotes');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const outputSection = document.getElementById('output-section');
    const generatedReportOutput = document.getElementById('generatedReportOutput');
    const copyReportBtn = document.getElementById('copyReportBtn');
    const copyFeedback = document.getElementById('copyFeedback');

    generateReportBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const shorthandReport = shorthandReportInput.value.trim();
        const previousTemplates = previousTemplatesInput.value.trim();
        const personalNotes = personalNotesInput.value.trim();

        if (!apiKey) {
            alert('Please enter your OpenAI API Key.');
            apiKeyInput.focus();
            return;
        }
        if (!shorthandReport) {
            alert('Please enter the shorthand notes for the child.');
            shorthandReportInput.focus();
            return;
        }
        if (!previousTemplates) {
            alert('Please provide previous report examples for tone and style. This helps the AI match your writing.');
            previousTemplatesInput.focus();
            return;
        }
        if (!personalNotes) {
            alert('Please enter your personal notes and experiences about the child.');
            personalNotesInput.focus();
            return;
        }

        loadingIndicator.style.display = 'flex'; // Changed to flex for spinner alignment
        generateReportBtn.disabled = true;
        generateReportBtn.style.opacity = '0.7';
        outputSection.style.display = 'none';
        generatedReportOutput.textContent = '';
        copyReportBtn.style.display = 'none';
        copyFeedback.style.display = 'none';


        const prompt = `
You are an expert AI assistant for a dedicated teacher. Your task is to help draft a student report.
The final report should be:
- Written in a tone, style, and structure highly consistent with the "PREVIOUS REPORT EXAMPLES" provided. Pay close attention to common phrases, sentence structure, and overall sentiment.
- Personalized using the "TEACHER'S PERSONAL INSIGHTS & EXPERIENCES" to reflect the unique qualities and experiences of the student.
- Factually based on the "CURRENT STUDENT'S SHORTHAND NOTES".
- Professionally worded, clear, constructive, and suitable for a school report.
- Well-structured, likely with paragraphs addressing different aspects (e.g., academic progress, social skills, specific subject performance, areas for development, concluding remarks), if this pattern is evident in the examples.

--- PREVIOUS REPORT EXAMPLES START ---
${previousTemplates}
--- PREVIOUS REPORT EXAMPLES END ---

--- CURRENT STUDENT'S SHORTHAND NOTES START ---
${shorthandReport}
--- CURRENT STUDENT'S SHORTHAND NOTES END ---

--- TEACHER'S PERSONAL INSIGHTS & EXPERIENCES (for this specific student) START ---
${personalNotes}
--- TEACHER'S PERSONAL INSIGHTS & EXPERIENCES END ---

Now, please generate the full student report based on ALL the information provided above.
The report should seamlessly blend the style of the examples with the specific details of the current student.
Ensure the language is "clean, sleek, and modern" while maintaining a professional and empathetic tone consistent with the examples.

Generated Report:
`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Or 'gpt-3.5-turbo', 'gpt-4-turbo' if preferred and API key supports it
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.5, // Lower for more deterministic output closer to examples
                    max_tokens: 1200, // Increased for potentially longer reports
                    top_p: 0.9,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = `OpenAI API Error: ${response.status} ${response.statusText}`;
                if (errorData.error && errorData.error.message) {
                    errorMessage += ` - ${errorData.error.message}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
                generatedReportOutput.textContent = data.choices[0].message.content.trim();
                outputSection.style.display = 'block';
                copyReportBtn.style.display = 'inline-flex'; // Show copy button
            } else {
                throw new Error('No response content received from OpenAI, or the response format was unexpected.');
            }

        } catch (error) {
            console.error('Error generating report:', error);
            generatedReportOutput.textContent = `An error occurred while generating the report:\n${error.message}\n\nPlease check your API key, internet connection, and the console for more details.`;
            outputSection.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
            generateReportBtn.disabled = false;
            generateReportBtn.style.opacity = '1';
        }
    });

    copyReportBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedReportOutput.textContent)
            .then(() => {
                copyFeedback.textContent = 'Copied!';
                copyFeedback.style.display = 'inline';
                setTimeout(() => {
                    copyFeedback.style.display = 'none';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy report: ', err);
                copyFeedback.textContent = 'Failed to copy!';
                copyFeedback.style.color = 'var(--error-color, #731D1D)';
                copyFeedback.style.display = 'inline';
                setTimeout(() => {
                    copyFeedback.style.display = 'none';
                    copyFeedback.style.color = 'var(--success-color, #B08D57)'; // Reset color
                }, 2000);
            });
    });
});
