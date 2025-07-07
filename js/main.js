import { initializeStocks, getStocks, getStockById, updateStockPrice } from './stock.js';
import { getPortfolioData, buyStock, sellStock, resetPortfolio, addInterest } from './portfolio.js';
import { loadScenarios, getScenarioForDay } from './scenario.js';
import {
    initializeUI,
    updatePortfolio,
    updateStockMarket,
    updateNewsFeed,
    updateDay,
    updateAchievements,
    showNotification,
    openStockModal,
    closeStockModal,
    formatCurrency
} from './ui.js';
import { checkAchievements, unlockAchievement, resetAchievements } from './achievements.js';
import { playSound } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Game State ---
    let currentDay = 1;
    const totalDays = 20;
    let gameActive = true;
    let difficulty = 'easy';

    // --- DOM Elements ---
    const nextDayBtn = document.getElementById('next-day-btn');
    const restartBtn = document.getElementById('restart-btn');
    const difficultySelect = document.getElementById('difficulty');

    // --- Game Logic ---

    async function startGame() {
        currentDay = 1;
        gameActive = true;
        difficulty = difficultySelect.value;
        
        // Clear the news feed for a new game
        const newsFeedEl = document.getElementById('news-feed');
        if(newsFeedEl) newsFeedEl.innerHTML = '';

        await loadScenarios(difficulty);

        initializeStocks();
        resetPortfolio();
        resetAchievements();
        
        const firstDayScenario = getScenarioForDay(1);

        if (firstDayScenario) {
            updateNewsFeed(firstDayScenario.news, 1);
            
            firstDayScenario.effects.forEach(effect => {
                const stock = getStockById(effect.target);
                if (stock) {
                    const previousPrice = stock.price;
                    const newPrice = previousPrice + effect.change;
                    updateStockPrice(stock.id, newPrice, 1);
                    stock.change = newPrice - previousPrice;
                }
            });
        }

        updateAllUI(); 

        nextDayBtn.classList.remove('hidden');
        restartBtn.classList.add('hidden');
        difficultySelect.disabled = false;
        showNotification(`Let the trading begin on ${difficulty} mode!`, 'success');
    }

    function nextDay() {
        if (!gameActive || currentDay >= totalDays) {
            if (currentDay >= totalDays) endGame();
            return;
        }

        currentDay++;
        addInterest();

        const scenario = getScenarioForDay(currentDay);
        if (scenario) {
            updateNewsFeed(scenario.news, currentDay);

            getStocks().forEach(stock => {
                const previousPrice = stock.price;
                let scenarioChange = 0;
                
                const effect = scenario.effects.find(e => e.target === stock.id);
                if (effect) {
                    scenarioChange = effect.change;
                }
                
                const noisePercentage = (Math.random() - 0.5) * 0.05; // +/- 2.5%
                const noise = (previousPrice + scenarioChange) * noisePercentage;
                const newPrice = previousPrice + scenarioChange + noise;

                updateStockPrice(stock.id, newPrice, currentDay);
                stock.change = newPrice - previousPrice;
            });
        } else {
            updateNewsFeed({ headline: "The market is quiet today, with no significant news." }, currentDay);
        }

        updateAllUI();
        checkAllAchievements();

        if (currentDay >= totalDays) {
            endGame();
        }
    }

    function endGame() {
        if (!gameActive) return; 
        gameActive = false;
        
        const { totalWealth } = getPortfolioData();
        // unlockAchievement('game_complete'); This seems to be missing from achievements.js

        if (totalWealth >= 25000) {
            unlockAchievement('market_master');
        }

        let finalMessage = `Game Over! Your final wealth is ${formatCurrency(totalWealth)}.`;
        showNotification(finalMessage, 'success');

        nextDayBtn.classList.add('hidden');
        restartBtn.classList.remove('hidden');
        difficultySelect.disabled = false;
        closeStockModal();
    }

    // --- UI Handlers ---

    function handleStockSelect(stockId) {
        const stock = getStockById(stockId);
        const portfolioData = getPortfolioData();
        const portfolioStock = portfolioData.stocks.find(s => s.id === stockId);

        if (stock) {
            openStockModal(stock, portfolioStock);
        }
    }


    function handleBuyStock(stockId, quantity) {
        const stock = getStockById(stockId);
        if (stock && buyStock(stock, quantity)) {
            updateAllUI();
            checkAllAchievements();
            handleStockSelect(stockId); // Refresh modal
        }
    }

    function handleSellStock(stockId, quantity) {
        const portfolioStock = getPortfolioData().stocks.find(s => s.id === stockId);
        if (!portfolioStock) {
            showNotification("You don't own this stock.", "error");
            return;
        }
        
        const marketStock = getStockById(stockId);
        const costBasis = portfolioStock.averageCost; 
        
        if (sellStock(stockId, quantity)) {
            if (marketStock.price > costBasis) {
                unlockAchievement('first_profit');
            }
            updateAllUI();
            checkAllAchievements();
            handleStockSelect(stockId); // Refresh modal
        } else {
            showNotification("You can't sell more shares than you own.", "error");
        }
    }

    // --- Helper Functions ---

    function updateAllUI() {
        updatePortfolio(getPortfolioData());
        updateStockMarket(getStocks());
        updateDay(currentDay);
        updateAchievements();
    }

    function checkAllAchievements() {
        checkAchievements(getPortfolioData());
    }

    // --- Initialization ---

    nextDayBtn.addEventListener('click', () => {
        if (gameActive && currentDay === 1) {
            difficultySelect.disabled = true;
        }
        nextDay();
    });

    restartBtn.addEventListener('click', startGame);

    difficultySelect.addEventListener('change', (e) => {
        if (currentDay > 1 && gameActive) {
            e.target.value = difficulty; // Prevent changing mid-game
        } else {
            difficulty = e.target.value;
        }
    });

    // Initialize UI handlers and start the game
    initializeUI(handleStockSelect, handleBuyStock, handleSellStock);
    startGame();

    // --- NEW: "HOW TO PLAY" MODAL LOGIC ---
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const tutorialContent = document.getElementById('tutorial-content');

    const populateAndShowTutorial = () => {
        fetch('data/tutorial.json')
            .then(response => response.json())
            .then(data => {
                let html = '';
                data.steps.forEach(step => {
                    html += `
                        <div class="mb-4">
                            <h3 class="font-bold text-lg text-gray-800">${step.title}</h3>
                            <p class="text-gray-600">${step.content}</p>
                        </div>
                    `;
                });
                tutorialContent.innerHTML = html;
                howToPlayModal.classList.remove('hidden');
            })
            .catch(error => {
                console.error("Error fetching tutorial data:", error);
                tutorialContent.innerHTML = "<p>Could not load the tutorial. Please try again later.</p>";
                howToPlayModal.classList.remove('hidden');
            });
    };

    const hideTutorial = () => {
        howToPlayModal.classList.add('hidden');
    };

    document.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'how-to-play-btn') {
            populateAndShowTutorial();
        }
    });

    closeModalBtn.addEventListener('click', hideTutorial);
    // --- END NEW ---
});