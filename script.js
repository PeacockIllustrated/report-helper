document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const previousExamplesInput = document.getElementById('previousExamples');
    const saveExamplesBtn = document.getElementById('saveExamplesBtn');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const saveFeedback = document.getElementById('saveFeedback'); // For API key/examples save feedback
    const prepareDataBtn = document.getElementById('prepareDataBtn');
    const makeComDataOutputSection = document.getElementById('makeComDataOutputSection');
    const makeComDataOutput = document.getElementById('makeComDataOutput');

    // --- Local Storage Functions ---
    function loadSavedData() {
        const savedApiKey = localStorage.getItem('reportGeneratorApiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
        }
        const savedExamples = localStorage.getItem('reportGeneratorPreviousExamples');
        if (savedExamples) {
            previousExamplesInput.value = savedExamples;
        }
    }

    function showSaveFeedback(message, isSuccess) {
        saveFeedback.textContent = message;
        saveFeedback.className = 'save-feedback ' + (isSuccess ? 'success' : 'error');
        saveFeedback.style.display = 'flex';
        setTimeout(() => {
            saveFeedback.style.display = 'none';
        }, 3000);
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('reportGeneratorApiKey', apiKey);
                showSaveFeedback('API Key saved!', true);
            } else {
                showSaveFeedback('API Key cannot be empty.', false);
            }
        });
    }

    if (saveExamplesBtn) {
        saveExamplesBtn.addEventListener('click', () => {
            const examples = previousExamplesInput.value.trim();
            if (examples) {
                localStorage.setItem('reportGeneratorPreviousExamples', examples);
                showSaveFeedback('Report examples saved!', true);
            } else {
                showSaveFeedback('Report examples cannot be empty.', false);
            }
        });
    }

    // Load data when DOM is ready
    loadSavedData();

    // --- AI Generation for applicable sections ---
    document.querySelectorAll('.generate-ai-text-btn').forEach(button => {
        const sectionName = button.dataset.sectionName;
        // Pupil comments AI is removed, this check ensures no listener is added if button was missed in HTML
        if (sectionName && sectionName.toLowerCase().includes("pupil's comments")) {
            return; 
        }

        button.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            const previousExamples = previousExamplesInput.value.trim();
            const sourceId = button.dataset.sourceId;
            const targetId = button.dataset.targetId;
            const notesInput = document.getElementById(sourceId);
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
            targetTextarea.value = "Generating professional text...";

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
Do not add extra conversational text before or after the generated content, just provide the expanded text for the section.
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
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'user', content: sectionPrompt }],
                        temperature: 0.6,
                        max_tokens: (sectionName.toLowerCase().includes("comment")) ? 450 : 250,
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }
                const data = await response.json();
                let aiResponseText = data.choices[0]?.message?.content.trim() || "Error: No content received from AI.";
                
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

    // --- Prepare data for Make.com ---
    prepareDataBtn.addEventListener('click', () => {
        const reportData = {};
        const allInputs = document.querySelectorAll('input[name^="var_"], select[name^="var_"], textarea[name^="var_"]');

        let allRequiredFilled = true;
        const requiredFieldIds = [
            'var_academicYear', 'var_teacherName', 'var_childFullName',
            'var_teacherGeneralComments', // AI generated part, but field should have content
            'var_target1' 
        ];
         const requiredSelectFieldIds = [
            'var_readingAttainment', 'var_readingEffort',
            'var_writingAttainment', 'var_writingEffort',
            'var_mathematicsAttainment', 'var_mathematicsEffort',
            'var_scienceAttainment', 'var_scienceEffort',
             // Foundation subjects are generally optional in terms of being *always* graded,
             // but if a selection is made for attainment, effort might also be expected, and vice-versa.
             // For simplicity, making core subjects mandatory for grades.
        ];

        allInputs.forEach(input => {
            if (input.name) {
                const key = input.name.replace(/^var_/, '');
                reportData[key] = input.value; 

                input.style.borderColor = ''; 
                
                if (requiredFieldIds.includes(input.id) && !input.value.trim()) {
                    allRequiredFilled = false;
                    input.style.borderColor = 'red';
                }
                if (requiredSelectFieldIds.includes(input.id) && !input.value) {
                    allRequiredFilled = false;
                    input.style.borderColor = 'red';
                }
            }
        });
        
        if (!allRequiredFilled) {
            alert('Please fill in all required fields (highlighted in red or missing subject grades/details).');
            makeComDataOutputSection.style.display = 'none';
            const firstInvalidField = document.querySelector('[style*="border-color: red"]');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        makeComDataOutput.textContent = JSON.stringify(reportData, null, 2);
        makeComDataOutputSection.style.display = 'block';
        makeComDataOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alert("Data prepared for Make.com! Scroll down to view and copy the JSON data.");
    });

    // Initial styling for select placeholders (if browser supports :placeholder-shown or similar)
    document.querySelectorAll('.subject-grid select.pt-input').forEach(select => {
        function styleSelectPlaceholder() {
            if (select.value === "") {
                select.classList.add('placeholder-shown');
            } else {
                select.classList.remove('placeholder-shown');
            }
        }
        select.addEventListener('change', styleSelectPlaceholder);
        styleSelectPlaceholder(); // Call on load
    });
});
