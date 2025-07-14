document.addEventListener("DOMContentLoaded", () => {
    
    // This function will set up the interactivity for the navbar
    const setupNavbar = () => {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (hamburgerBtn && mobileMenu) {
            hamburgerBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    };

    /**
     * Sets up all the event listeners and logic for the chatbot.
     * This function is called only after the chatbot's HTML is loaded.
     */
    const setupChatbot = () => {
        // --- DOM Element References ---
        const toggleButton = document.getElementById('chatbot-toggle-button');
        const panel = document.getElementById('chatbot-panel');
        const closeButton = document.getElementById('chatbot-close-button');
        const messagesContainer = document.getElementById('chatbot-messages');
        const form = document.getElementById('chatbot-form');
        const input = document.getElementById('chatbot-input');
        const typingIndicator = document.getElementById('chatbot-typing-indicator');

        // Check if all elements are found
        if (!toggleButton || !panel || !closeButton || !messagesContainer || !form || !input || !typingIndicator) {
            console.error("Chatbot elements not found. Make sure the HTML is loaded correctly.");
            return;
        }

        // --- State Management ---
        const baseSystemPrompt = {
          role: "system",
          content: `You are Piggy, a friendly and helpful financial assistant for the StockQuest Jr. game. Your goal is to explain finance and stock market concepts in a simple, encouraging, and easy-to-understand way for kids. If you are asked about non-financial topics, politely decline.`
        };
        let chatHistory = []; 

        // --- Context-Aware Functions ---
        const getPageContext = () => {
            const pathname = window.location.pathname;
            let context = 'The user is interacting with the StockQuest Jr. game.';
            if (pathname.includes('/index.html') || pathname === '/') {
                const currentDay = document.getElementById('current-day')?.textContent;
                context = `The user is on the main game page, currently on day ${currentDay}. They might ask about game mechanics, specific stocks, or what to do next.`;
            } else if (pathname.includes('/learning.html')) {
                context = 'The user is in the Learning Center. They might have questions about the financial concepts explained in the articles.';
            } else if (pathname.includes('/quiz.html')) {
                const questionText = document.getElementById('question-text')?.textContent;
                if (questionText && !questionText.includes('Loading')) {
                     context = `The user is on the Quiz page, looking at the question: "${questionText}". They might be asking for a hint or clarification.`;
                } else {
                     context = 'The user is on the Quiz page.';
                }
            } else if (pathname.includes('/about.html')) {
                context = 'The user is on the "About" page.';
            }
            return context;
        };

        const initializeChat = () => {
            chatHistory = [baseSystemPrompt, { role: "system", content: getPageContext() }];
            messagesContainer.innerHTML = `
                <div class="flex">
                  <div class="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-xs">
                    Hi there! I'm Piggy, your financial guide. Ask me anything about saving or the stock market!
                  </div>
                </div>`;
        };

        // --- Core Functions ---
        const togglePanel = (show) => {
          if (show) {
            initializeChat();
            panel.classList.remove('hidden');
            setTimeout(() => {
              panel.classList.remove('opacity-0', 'translate-y-4');
              input.focus();
            }, 10);
          } else {
            panel.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => panel.classList.add('hidden'), 300);
          }
        };

        const addMessage = (content, role) => {
          const messageWrapper = document.createElement('div');
          messageWrapper.className = 'flex mb-2';
          const messageBubble = document.createElement('div');
          if (role === 'user') {
            messageWrapper.classList.add('justify-end');
            messageBubble.className = 'bg-blue-500 text-white p-3 rounded-lg rounded-br-none max-w-xs break-words';
            messageBubble.textContent = content;
          } else {
            messageBubble.className = 'bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-xs break-words';
            messageBubble.textContent = content;
          }
          messageWrapper.appendChild(messageBubble);
          messagesContainer.appendChild(messageWrapper);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const sendMessage = async (userInput) => {
          addMessage(userInput, 'user');
          input.value = '';
          typingIndicator.classList.remove('hidden');
          chatHistory.push({ role: "user", content: userInput });
          chatHistory[1].content = getPageContext(); 

          // Placeholder for a real AI API call
          setTimeout(() => {
              typingIndicator.classList.add('hidden');
              const lowerCaseInput = userInput.toLowerCase();
              let botReply = "I'm still learning! Try asking me what a 'stock' or 'portfolio' is.";
              if (lowerCaseInput.includes('stock')) {
                  botReply = "A stock is like a tiny piece of a company. When you own a stock, you're a part-owner, or a 'shareholder'!";
              } else if (lowerCaseInput.includes('portfolio')) {
                  botReply = "A portfolio is a collection of all the different stocks you own. It's like a treasure chest for your investments!";
              }
              chatHistory.push({ role: "assistant", content: botReply });
              addMessage(botReply, 'bot');
          }, 1000);
        };

        // --- Event Listeners ---
        toggleButton.addEventListener('click', () => togglePanel(true));
        closeButton.addEventListener('click', () => togglePanel(false));
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const userInput = input.value.trim();
          if (userInput) {
            if (chatHistory.length === 0) initializeChat();
            sendMessage(userInput);
          }
        });
    };

    // This function fetches and injects the HTML for a component
    const loadComponent = (componentPath, targetElementId, callback) => {
        fetch(componentPath)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load component: ${componentPath}`);
                return response.text();
            })
            .then(data => {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.innerHTML = data;
                    if (callback) callback();
                }
            })
            .catch(error => console.error(error));
    };

    // Load Navbar, Footer, and the new Chatbot component with its setup function
    loadComponent('components/navbar.html', 'navbar-container', setupNavbar);
    loadComponent('components/footer.html', 'footer-container');
    loadComponent('components/chatbot.html', 'chatbot-container', setupChatbot);
});
