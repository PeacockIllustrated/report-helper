document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const apiKeyInput = document.getElementById('apiKey');
    const childNameInput = document.getElementById('childName');
    const academicYearInput = document.getElementById('academicYear');
    const teacherNameInput = document.getElementById('teacherName');
    const academicPerformanceNotesInput = document.getElementById('academicPerformanceNotes');
    const attendanceRatingInput = document.getElementById('attendanceRating');
    const punctualityRatingInput = document.getElementById('punctualityRating');
    const attendancePunctualityNotesInput = document.getElementById('attendancePunctualityNotes');
    const teacherGeneralCommentsInput = document.getElementById('teacherGeneralComments');
    const targetsYearAheadInput = document.getElementById('targetsYearAhead');
    const pupilCommentsInput = document.getElementById('pupilComments');
    const headteacherCommentsInput = document.getElementById('headteacherComments');
    const previousExamplesInput = document.getElementById('previousExamples');

    // Action Elements
    const generateReportBtn = document.getElementById('generateReportBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const copyReportBtn = document.getElementById('copyReportBtn');
    const copyFeedback = document.getElementById('copyFeedback');

    // Output Display Elements
    const outputSectionContainer = document.getElementById('output-section-container');
    const outputAcademicYear = document.getElementById('outputAcademicYear');
    const outputTeacherName = document.getElementById('outputTeacherName');
    const outputChildName = document.getElementById('outputChildName');
    const outputSubjectNarrative = document.getElementById('outputSubjectNarrative');
    const outputAttendanceRatingText = document.getElementById('outputAttendanceRatingText');
    const outputPunctualityRatingText = document.getElementById('outputPunctualityRatingText');
    const outputAttendancePunctualityNotesText = document.getElementById('outputAttendancePunctualityNotesText');
    const outputTeacherComments = document.getElementById('outputTeacherComments');
    const outputTargetsList = document.getElementById('outputTargetsList');
    const outputPupilCommentsSection = document.getElementById('outputPupilCommentsSection');
    const outputPupilComments = document.getElementById('outputPupilComments');
    const outputHeadteacherCommentsSection = document.getElementById('outputHeadteacherCommentsSection');
    const outputHeadteacherComments = document.getElementById('outputHeadteacherComments');
    
    const reportOutputWrapper = document.getElementById('reportOutputWrapper'); // For copying text

    // Date for attendance/punctuality note
    const dateNoteElement = document.querySelector('.date-note');
    if (dateNoteElement) {
        const today = new Date();
        const formattedDate = `${today.getDate()}${getOrdinalSuffix(today.getDate())} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;
        dateNoteElement.textContent = `*Up to ${formattedDate}`;
    }

    function getOrdinalSuffix(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }


    generateReportBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        // Gather all inputs
        const childName = childNameInput.value.trim();
        const academicYear = academicYearInput.value.trim();
        const teacherName = teacherNameInput.value.trim();
        const academicPerformanceNotes = academicPerformanceNotesInput.value.trim();
        const attendanceRating = attendanceRatingInput.value;
        const punctualityRating = punctualityRatingInput.value;
        const attendancePunctualityNotes = attendancePunctualityNotesInput.value.trim();
        const teacherGeneralComments = teacherGeneralCommentsInput.value.trim();
        const targetsYearAhead = targetsYearAheadInput.value.trim();
        const pupilComments = pupilCommentsInput.value.trim();
        const headteacherComments = headteacherCommentsInput.value.trim();
        const previousExamples = previousExamplesInput.value.trim();

        // Basic Validation
        if (!apiKey) { alert('Please enter your OpenAI API Key.'); apiKeyInput.focus(); return; }
        if (!childName) { alert("Please enter the Child's Name."); childNameInput.focus(); return; }
        if (!teacherName) { alert("Please enter the Teacher's Name."); teacherNameInput.focus(); return; }
        if (!academicPerformanceNotes) { alert("Please enter Academic Performance Notes."); academicPerformanceNotesInput.focus(); return; }
        if (!teacherGeneralComments) { alert("Please enter Teacher's General Comments."); teacherGeneralCommentsInput.focus(); return; }
        if (!targetsYearAhead) { alert("Please enter Targets for the Year Ahead."); targetsYearAheadInput.focus(); return; }
        if (!previousExamples) { alert("Please provide Previous Report Examples for tone and style."); previousExamplesInput.focus(); return; }


        loadingIndicator.style.display = 'flex';
        generateReportBtn.disabled = true;
        generateReportBtn.style.opacity = '0.7';
        outputSectionContainer.style.display = 'none'; // Hide old output

        // Clear previous output fields
        outputAcademicYear.textContent = '';
        outputTeacherName.textContent = '';
        outputChildName.textContent = '';
        outputSubjectNarrative.textContent = '';
        outputAttendanceRatingText.textContent = '';
        outputPunctualityRatingText.textContent = '';
        outputAttendancePunctualityNotesText.textContent = '';
        outputTeacherComments.textContent = '';
        outputTargetsList.innerHTML = '';
        outputPupilComments.textContent = '';
        outputHeadteacherComments.textContent = '';
        outputPupilCommentsSection.style.display = 'none';
        outputHeadteacherCommentsSection.style.display = 'none';
        copyFeedback.style.display = 'none';

        // Pre-populate fixed parts of the output preview
        outputAcademicYear.textContent = academicYear;
        outputTeacherName.textContent = teacherName;
        outputChildName.textContent = childName;
        outputAttendanceRatingText.textContent = attendanceRating;
        outputPunctualityRatingText.textContent = punctualityRating;
        if(attendancePunctualityNotes) {
            outputAttendancePunctualityNotesText.textContent = attendancePunctualityNotes;
        }


        const prompt = `
You are an AI assistant helping a teacher write a UK primary school end-of-year report.
The report MUST be structured and formatted like the "REFERENCE LAYOUT DESCRIPTION" below.
The tone should be professional, constructive, empathetic, and consistent with the "PREVIOUS REPORT EXAMPLES".
Use UK English spelling and grammar.

--- REFERENCE LAYOUT DESCRIPTION START ---
The report has distinct sections. Generate content for each section clearly demarcated by "### Section Name Start ###" and "### Section Name End ###".

1.  **Subject Attainment and Effort Narrative:**
    Content between "### Subject Attainment Start ###" and "### Subject Attainment End ###".
    Based on the "ACADEMIC PERFORMANCE NOTES", write a comprehensive narrative summary. Discuss core subjects (Reading, Writing, Mathematics, Science) and relevant foundation subjects. Focus on achievements, progress, effort, and areas for development. Do NOT create a table or use specific grading codes like GDS/EXS. This is a purely narrative section.

2.  **Teacher's General Comments:**
    Content between "### Teacher Comments Start ###" and "### Teacher Comments End ###".
    Based on "TEACHER GENERAL COMMENTS INPUT", write a detailed overall summary of the child's year, including personality, social skills, attitude to learning, and general progress.

3.  **Targets for the Year Ahead:**
    Content between "### Targets Start ###" and "### Targets End ###".
    Based on "TARGETS INPUT", list 2-3 key targets. Each target should be on a new line starting with a bullet point (e.g., "- Target 1").

4.  **Pupil's Comments (Optional):**
    If "PUPIL COMMENTS INPUT" is provided, content between "### Pupil Comments Start ###" and "### Pupil Comments End ###".
    Present the pupil's comments.

5.  **Head Teacher's Comments (Optional):**
    If "HEADTEACHER COMMENTS INPUT" is provided, content between "### Headteacher Comments Start ###" and "### Headteacher Comments End ###".
    Present the Head Teacher's comments.

--- REFERENCE LAYOUT DESCRIPTION END ---

--- INPUT DATA START ---
Child's Name: ${childName}
Academic Year: ${academicYear}
Teacher's Name: ${teacherName}

ACADEMIC PERFORMANCE NOTES:
${academicPerformanceNotes}

TEACHER GENERAL COMMENTS INPUT:
${teacherGeneralComments}

TARGETS INPUT:
${targetsYearAhead}

PUPIL COMMENTS INPUT (Optional):
${pupilComments || "N/A"}

HEADTEACHER COMMENTS INPUT (Optional):
${headteacherComments || "N/A"}

PREVIOUS REPORT EXAMPLES (for tone and style):
${previousExamples}
--- INPUT DATA END ---

Generate the content for the specified sections. Ensure each piece of generated text is within its designated Start/End markers.
Example for a section:
### Subject Attainment Start ###
[Your narrative for subject attainment and effort here...]
### Subject Attainment End ###
`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Or gpt-3.5-turbo, gpt-4-turbo
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.6, // Balanced for creativity and adherence
                    max_tokens: 1500,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const aiContent = data.choices[0]?.message?.content;

            if (aiContent) {
                // Populate output fields based on parsed AI content
                outputSubjectNarrative.textContent = extractSection(aiContent, "Subject Attainment");
                outputTeacherComments.textContent = extractSection(aiContent, "Teacher Comments");
                
                const targetsText = extractSection(aiContent, "Targets");
                targetsText.split('\n').forEach(target => {
                    if (target.trim().startsWith('-') || target.trim().startsWith('*') || target.trim()) {
                        const li = document.createElement('li');
                        li.textContent = target.trim().replace(/^[-*]\s*/, ''); // Remove leading bullet
                        if (li.textContent) outputTargetsList.appendChild(li);
                    }
                });

                const pupilCommentsText = extractSection(aiContent, "Pupil Comments");
                if (pupilCommentsText && pupilCommentsText.toLowerCase() !== 'n/a') {
                    outputPupilComments.textContent = pupilCommentsText;
                    outputPupilCommentsSection.style.display = 'block';
                }

                const headteacherCommentsText = extractSection(aiContent, "Headteacher Comments");
                 if (headteacherCommentsText && headteacherCommentsText.toLowerCase() !== 'n/a') {
                    outputHeadteacherComments.textContent = headteacherCommentsText;
                    outputHeadteacherCommentsSection.style.display = 'block';
                }

                outputSectionContainer.style.display = 'block'; // Show the styled output
            } else {
                throw new Error('No content received from AI or unexpected format.');
            }

        } catch (error) {
            console.error('Error generating report:', error);
            // Display error in a user-friendly way inside the output area
            outputSubjectNarrative.textContent = `Error: ${error.message}. Please check console for details.`;
            outputSectionContainer.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
            generateReportBtn.disabled = false;
            generateReportBtn.style.opacity = '1';
        }
    });

    function extractSection(text, sectionName) {
        const startMarker = `### ${sectionName} Start ###`;
        const endMarker = `### ${sectionName} End ###`;
        const startIndex = text.indexOf(startMarker);
        const endIndex = text.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            return text.substring(startIndex + startMarker.length, endIndex).trim();
        }
        return `[AI failed to generate '${sectionName}' section or section markers not found]`;
    }

    copyReportBtn.addEventListener('click', () => {
        // Collect text from the structured output for a more "natural" copy
        let fullReportText = `End of Year Report\nYear ${outputAcademicYear.textContent}\n${outputTeacherName.textContent}\n\n`;
        fullReportText += `Name of child: ${outputChildName.textContent}\n\n`;
        fullReportText += `Subject Attainment and Effort\n${outputSubjectNarrative.textContent}\n\n`;
        fullReportText += `Attendance and Punctuality\nAttendance: ${outputAttendanceRatingText.textContent}\nPunctuality: ${outputPunctualityRatingText.textContent}\n`;
        if (outputAttendancePunctualityNotesText.textContent) {
            fullReportText += `${outputAttendancePunctualityNotesText.textContent}\n`;
        }
        fullReportText += `\nTeacher's general comments\n${outputTeacherComments.textContent}\n\n`;
        fullReportText += `Targets for the year ahead:\n`;
        outputTargetsList.querySelectorAll('li').forEach(li => {
            fullReportText += `- ${li.textContent}\n`;
        });
        fullReportText += `\n`;

        if (outputPupilCommentsSection.style.display === 'block') {
            fullReportText += `Pupil's comments\n${outputPupilComments.textContent}\n\n`;
        }
        if (outputHeadteacherCommentsSection.style.display === 'block') {
            fullReportText += `Head teacher's comments\n${outputHeadteacherComments.textContent}\n\n`;
        }
        fullReportText += `Signed: _________________________ (Class teacher)\n`;
        fullReportText += `Signed: _________________________ (Head teacher)\n`;


        navigator.clipboard.writeText(fullReportText)
            .then(() => {
                copyFeedback.textContent = 'Copied!';
                copyFeedback.style.display = 'inline';
                setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy report: ', err);
                copyFeedback.textContent = 'Copy Failed!';
                copyFeedback.style.display = 'inline';
                 setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
            });
    });
});
