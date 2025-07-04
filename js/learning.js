document.addEventListener('DOMContentLoaded', () => {
    // Tab Elements
    const lessonsTab = document.getElementById('lessons-tab');
    const glossaryTab = document.getElementById('glossary-tab');

    // Panel Elements
    const lessonsPanel = document.getElementById('lessons-panel');
    const glossaryPanel = document.getElementById('glossary-panel');
    
    // Content Containers
    const lessonsContainer = document.getElementById('lessons-container');
    const glossaryContainer = document.getElementById('glossary-container');

    // Function to switch tabs
    const switchTab = (activeTab, activePanel) => {
        // Deactivate all tabs and hide all panels
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
        
        // Activate the selected tab and show the corresponding panel
        activeTab.classList.add('active-tab');
        activePanel.style.display = 'block';
    };

    // Event Listeners for Tabs
    lessonsTab.addEventListener('click', () => switchTab(lessonsTab, lessonsPanel));
    glossaryTab.addEventListener('click', () => switchTab(glossaryTab, glossaryPanel));

    /**
     * Fetches the learning lessons from the JSON file and displays them.
     */
    async function loadLessons() {
        try {
            const response = await fetch('data/learning_center.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            lessonsContainer.innerHTML = ''; // Clear loading message
            data.lessons.forEach(lesson => {
                const lessonElement = document.createElement('div');
                lessonElement.className = 'lesson-card';
                
                const contentParagraphs = lesson.content.map(p => `<p class="text-gray-600 mb-2">${p}</p>`).join('');
                const externalLink = lesson.external_links.length > 0 
                    ? `<a href="${lesson.external_links[0].url}" target="_blank" rel="noopener noreferrer" class="link-primary">Learn More: ${lesson.external_links[0].name}</a>`
                    : '';

                lessonElement.innerHTML = `
                    <h3 class="text-2xl font-bold text-gray-800 mb-3">${lesson.title}</h3>
                    ${contentParagraphs}
                    <div class="interactive-example">
                        <h4 class="font-bold">${lesson.interactive_example.title}</h4>
                        <p>${lesson.interactive_example.scenario}</p>
                    </div>
                    <div class="mt-4">${externalLink}</div>`;
                lessonsContainer.appendChild(lessonElement);
            });
        } catch (error) {
            console.error("Could not load lessons:", error);
            lessonsContainer.innerHTML = '<p class="text-red-500 text-center">Could not load the learning materials. Please try again later.</p>';
        }
    }

    /**
     * Fetches the glossary terms from the JSON file and displays them.
     */
    async function loadGlossary() {
        try {
            const response = await fetch('data/glossary.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            glossaryContainer.innerHTML = ''; // Clear loading message
            for (const term in data.glossary) {
                const termElement = document.createElement('div');
                termElement.className = 'bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300';
                termElement.innerHTML = `
                    <h4 class="text-xl font-bold text-gray-800">${term}</h4>
                    <p class="text-gray-600 mt-1">${data.glossary[term]}</p>`;
                glossaryContainer.appendChild(termElement);
            }
        } catch (error) {
            console.error("Could not load glossary:", error);
            glossaryContainer.innerHTML = '<p class="text-red-500 text-center col-span-full">Could not load the glossary. Please try again later.</p>';
        }
    }

    // Load content and set the initial view
    loadLessons();
    loadGlossary();
});