document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const previousExamplesInput = document.getElementById('previousExamples');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const prepareDataBtn = document.getElementById('prepareDataBtn');
    const makeComDataOutputSection = document.getElementById('makeComDataOutputSection');
    const makeComDataOutput = document.getElementById('makeComDataOutput');

    // Event listeners for all "Generate AI Text" buttons
    document.querySelectorAll('.generate-ai-text-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            const previousExamples = previousExamplesInput.value.trim();
            const sourceId = button.dataset.sourceId;
            const targetId = button.dataset.targetId;
            const sectionName = button.dataset.sectionName;
            const notesInput = document.getElementById(sourceId); // Get the input element itself
            const notes = notesInput.value.trim();
            const targetTextarea = document.getElementById(targetId);

            if (!apiKey) {
                alert('Please enter your OpenAI API Key.');
                apiKeyInput.focus();
                return;
            }
            if (!previousExamples) {
                alert('Please provide "Previous Report Examples" for AI tone and style consistency.');
                previousExamplesInput.focus();
                return;
            }
            if (!notes) {
                alert(`Please enter some shorthand/notes for "${sectionName}".`);
                notesInput.focus();
                return;
            }

            loadingIndicator.style.display = 'flex';
            button.disabled = true;
            targetTextarea.value = "Generating professional text..."; // More descriptive placeholder

            const sectionPrompt = `
You are an AI assistant helping a teacher expand shorthand notes into a professional, well-written section for a UK primary school report.
The tone MUST be consistent with the "PREVIOUS REPORT EXAMPLES" provided below.
Use UK English spelling and grammar. Ensure the generated text is an appropriate length for a school report section.

The section to expand is: "${sectionName}"

Shorthand Notes provided by the teacher (expand these):
--- NOTES START ---
${notes}
--- NOTES END ---

PREVIOUS REPORT EXAMPLES (for tone and style):
--- EXAMPLES START ---
${previousExamples}
--- EXAMPLES END ---

Please expand the shorthand notes into a full, polished paragraph or set of paragraphs suitable for the specified report section.
If the section is "Targets for the Year Ahead", ensure each target is on a new line. Do not add extra conversational text before or after the generated content, just provide the expanded text for the section.
Generated Text:
`;
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini', // Consider 'gpt-3.5-turbo' for speed/cost or 'gpt-4-turbo' for quality
                        messages: [{ role: 'user', content: sectionPrompt }],
                        temperature: 0.6, // Slightly more deterministic for consistency
                        max_tokens: (sectionName.toLowerCase().includes("comment")) ? 450 : 250, // Adjusted token limits
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }
                const data = await response.json();
                let aiResponseText = data.choices[0]?.message?.content.trim() || "Error: No content received from AI.";
                
                // For targets, ensure newlines are preserved from AI output
                if (sectionName.toLowerCase().includes("targets")) {
                    // The AI should be prompted to return newlines directly.
                    // No additional processing needed here if prompt is good.
                }
                targetTextarea.value = aiResponseText;

            } catch (error) {
                console.error(`Error generating AI text for ${sectionName}:`, error);
                targetTextarea.value = `Error: ${error.message}. Please check notes and try again.`;
            } finally {
                loadingIndicator.style.display = 'none';
                button.disabled = false;
            }
        });
    });

    // Prepare data for Make.com
    prepareDataBtn.addEventListener('click', () => {
        const reportData = {};
        // Select all input, select, and textarea elements that have a 'name' attribute starting with 'var_'
        const allInputs = document.querySelectorAll('input[name^="var_"], select[name^="var_"], textarea[name^="var_"]');

        let allRequiredFilled = true;
        const requiredFields = [ // Add IDs of fields you consider mandatory for the JSON output
            'var_academicYear', 'var_teacherName', 'var_childFullName',
            'var_teacherGeneralComments', 'var_targetsYearAhead' // Example mandatory text fields
        ];

        allInputs.forEach(input => {
            if (input.name) {
                const key = input.name.replace(/^var_/, ''); // Remove "var_" prefix
                if (input.type === 'checkbox') { // Though not used in current HTML
                    reportData[key] = input.checked;
                } else {
                    reportData[key] = input.value; // Don't trim here, let Make.com or Google Docs handle if needed
                }

                // Basic check for required fields (can be expanded)
                if (requiredFields.includes(input.id) && !input.value.trim()) {
                    allRequiredFilled = false;
                    input.style.borderColor = 'red'; // Highlight missing required field
                } else {
                    input.style.borderColor = ''; // Reset border color
                }
            }
        });
        
        // Check core subject grades (example of more specific validation)
        const coreSubjects = ['reading', 'writing', 'mathematics', 'science'];
        coreSubjects.forEach(subject => {
            const attainmentEl = document.getElementById(`var_${subject}Attainment`);
            const effortEl = document.getElementById(`var_${subject}Effort`);
            if (attainmentEl && !attainmentEl.value) {
                allRequiredFilled = false;
                attainmentEl.style.borderColor = 'red';
            } else if (attainmentEl) {
                attainmentEl.style.borderColor = '';
            }
            if (effortEl && !effortEl.value) {
                allRequiredFilled = false;
                effortEl.style.borderColor = 'red';
            } else if (effortEl) {
                effortEl.style.borderColor = '';
            }
        });


        if (!allRequiredFilled) {
            alert('Please fill in all required fields (highlighted in red or missing subject grades).');
            makeComDataOutputSection.style.display = 'none'; // Hide output if validation fails
            return;
        }

        makeComDataOutput.textContent = JSON.stringify(reportData, null, 2);
        makeComDataOutputSection.style.display = 'block';
        makeComDataOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alert("Data prepared for Make.com! Scroll down to view and copy the JSON data.");
    });
});
