document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const previousExamplesInput = document.getElementById('previousExamples');
    const saveExamplesBtn = document.getElementById('saveExamplesBtn');
    
    const childFullNameInput = document.getElementById('var_childFullName'); // Get child's full name input

    const loadingIndicator = document.getElementById('loadingIndicator');
    const saveFeedback = document.getElementById('saveFeedback');
    const prepareDataBtn = document.getElementById('prepareDataBtn');
    const makeComDataOutputSection = document.getElementById('makeComDataOutputSection');
    const makeComDataOutput = document.getElementById('makeComDataOutput');

    const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/m6a9dcv6jvdpwsp9ca6nsxfvvryhetk5';

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

    function showUserFeedback(element, message, isSuccess) {
        element.textContent = message;
        element.className = 'save-feedback ' + (isSuccess ? 'success' : 'error');
        element.style.display = 'flex';
        setTimeout(() => {
            element.style.display = 'none';
        }, 4000);
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('reportGeneratorApiKey', apiKey);
                showUserFeedback(saveFeedback, 'API Key saved!', true);
            } else {
                showUserFeedback(saveFeedback, 'API Key cannot be empty to save.', false);
            }
        });
    }

    if (saveExamplesBtn) {
        saveExamplesBtn.addEventListener('click', () => {
            const examples = previousExamplesInput.value.trim();
            if (examples) {
                localStorage.setItem('reportGeneratorPreviousExamples', examples);
                showUserFeedback(saveFeedback, 'Report examples saved!', true);
            } else {
                showUserFeedback(saveFeedback, 'Report examples cannot be empty to save.', false);
            }
        });
    }

    loadSavedData();

    document.querySelectorAll('.generate-ai-text-btn').forEach(button => {
        const sectionName = button.dataset.sectionName;
        if (!document.getElementById(button.dataset.sourceId) || !document.getElementById(button.dataset.targetId)) {
            console.warn(`Skipping AI button for ${sectionName} due to missing source/target elements.`);
            return;
        }

        button.addEventListener('click', async () => {
            const apiKey = apiKeyInput.value.trim();
            const previousExamples = previousExamplesInput.value.trim();
            const childFullName = childFullNameInput.value.trim(); // Get child's full name
            const childFirstName = childFullName ? childFullName.split(' ')[0] : "the student"; // Extract first name, or use "the student" as fallback

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
             if (!childFullName) { // Also check if child's name is entered for better AI context
                alert("Please enter the Child's Full Name first.");
                childFullNameInput.focus();
                return;
            }
            if (!notes) {
                alert(`Please enter some shorthand/notes for "${sectionName}".`);
                notesInput.focus();
                return;
            }

            const originalButtonText = button.textContent;
            loadingIndicator.style.display = 'flex';
            button.disabled = true;
            button.textContent = 'Generating...';
            targetTextarea.value = "Generating professional text...";

            // --- MODIFIED PROMPT ---
            const sectionPrompt = `
You are an AI assistant helping a teacher expand shorthand notes into a professional, well-written section for a UK primary school report for a student named ${childFirstName}.
The tone MUST be consistent with the "PREVIOUS REPORT EXAMPLES" provided below.
Use UK English spelling and grammar. Ensure the generated text is an appropriate length for a school report section.
When referring to the student, use their first name, ${childFirstName}, where appropriate and natural.

The section to expand is: "${sectionName}"

Shorthand Notes provided by the teacher (expand these, keeping ${childFirstName} in mind):
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
            // --- END OF MODIFIED PROMPT ---

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
                button.textContent = originalButtonText;
            }
        });
    });

    prepareDataBtn.addEventListener('click', async () => {
        const reportData = {};
        const allInputs = document.querySelectorAll('input[name^="var_"], select[name^="var_"], textarea[name^="var_"]');

        let allRequiredFilled = true;
        const requiredFieldIds = [
            'var_academicYear', 'var_teacherName', 'var_childFullName',
            'var_teacherGeneralComments',
            'var_target1' 
        ];
        const requiredSelectFieldIds = [
            'var_readingAttainment', 'var_readingEffort',
            'var_writingAttainment', 'var_writingEffort',
            'var_mathematicsAttainment', 'var_mathematicsEffort',
            'var_scienceAttainment', 'var_scienceEffort',
            'var_artAttainment', 'var_artEffort',
            'var_computingAttainment', 'var_computingEffort',
            'var_designTechnologyAttainment', 'var_designTechnologyEffort',
            'var_geographyAttainment', 'var_geographyEffort',
            'var_historyAttainment', 'var_historyEffort',
            'var_musicAttainment', 'var_musicEffort',
            'var_physicalEducationAttainment', 'var_physicalEducationEffort',
            'var_religiousEducationAttainment', 'var_religiousEducationEffort',
        ];

        allInputs.forEach(input => {
            if (input.name) {
                const key = input.name.replace(/^var_/, '');
                reportData[key] = input.value; 

                input.style.borderColor = ''; 
                
                if (requiredFieldIds.includes(input.id) && !input.value.trim()) {
                    if (!(input.id.toLowerCase().includes('french') && input.value === "N/A")) {
                        allRequiredFilled = false;
                        input.style.borderColor = 'red';
                    }
                }
                if (requiredSelectFieldIds.includes(input.id) && !input.value) {
                     if (!(input.id.toLowerCase().includes('french') && (reportData['frenchAttainment'] === "N/A" || reportData['frenchEffort'] === "N/A"))) {
                        allRequiredFilled = false;
                        input.style.borderColor = 'red';
                    }
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

        const originalButtonText = prepareDataBtn.textContent;
        prepareDataBtn.disabled = true;
        prepareDataBtn.textContent = 'Sending to Make.com...';
        loadingIndicator.style.display = 'flex';

        try {
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (response.ok) {
                const responseText = await response.text();
                if (responseText.toLowerCase() === "accepted") {
                    showUserFeedback(saveFeedback, 'Data sent to Make.com successfully!', true);
                    makeComDataOutputSection.style.display = 'none';
                } else {
                     showUserFeedback(saveFeedback, `Make.com responded: ${responseText}. Data might not be fully processed. Check Make.com scenario.`, false);
                }
            } else {
                const errorText = await response.text();
                throw new Error(`Make.com webhook error: ${response.status} ${response.statusText}. Response: ${errorText}`);
            }
        } catch (error) {
            console.error('Error sending data to Make.com:', error);
            showUserFeedback(saveFeedback, `Failed to send data to Make.com: ${error.message}. Please copy the JSON below manually.`, false);
            makeComDataOutputSection.style.display = 'block';
            makeComDataOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } finally {
            prepareDataBtn.disabled = false;
            prepareDataBtn.textContent = originalButtonText;
            loadingIndicator.style.display = 'none';
        }
    });

    document.querySelectorAll('.subject-grid select.pt-input').forEach(select => {
        function updatePlaceholderClass() {
            if (select.value === "") {
                select.classList.add('placeholder-shown');
            } else {
                select.classList.remove('placeholder-shown');
            }
        }
        select.addEventListener('change', updatePlaceholderClass);
        updatePlaceholderClass();
    });
});
