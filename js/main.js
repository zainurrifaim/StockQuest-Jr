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

    // Load scenarios first, as they are needed for day 1
    await loadScenarios(difficulty); //

    // Initialize stocks to their base state
    initializeStocks(); //
    resetPortfolio(); //
    resetAchievements(); //
    
    // **FIX:** Get the scenario for Day 1 to create initial price changes
    const firstDayScenario = getScenarioForDay(1); //

    // Apply Day 1's scenario effects
    if (firstDayScenario) {
        updateNewsFeed({ description: firstDayScenario.news }); //
        firstDayScenario.effects.forEach(effect => { //
            const stock = getStockById(effect.target); //
            if (stock) {
                const previousPrice = stock.price;
                const newPrice = previousPrice + effect.change;

                // Update the stock's price and record it in history for Day 1
                updateStockPrice(stock.id, newPrice, 1); //
                
                // Set the change property so it shows on the UI from the start
                stock.change = newPrice - previousPrice;
            }
        });
    }

    // Now update the UI with the initial changes visible
    updateAllUI(); 

    nextDayBtn.classList.remove('hidden');
    restartBtn.classList.add('hidden');
    difficultySelect.disabled = false;
    showNotification(`Let the trading begin on ${difficulty} mode!`, 'success');
}

function nextDay() {
    if (!gameActive || currentDay >= totalDays) {
        if(currentDay >= totalDays) endGame();
        return;
    }

    currentDay++;
    addInterest(); //

    const scenario = getScenarioForDay(currentDay); //
    const newsDescription = scenario ? scenario.news : "The market is quiet today, with no significant news."; //
    updateNewsFeed({ description: newsDescription }); //

    // Calculate the true final price and change for each stock
    getStocks().forEach(stock => { //
        const previousPrice = stock.price;

        // 1. Get the scenario effect for the day
        let scenarioChange = 0;
        if (scenario) {
            const effect = scenario.effects.find(e => e.target === stock.id); //
            if (effect) {
                scenarioChange = effect.change;
            }
        }
        
        // 2. Calculate the market noise based on the potential new price
        const noisePercentage = (Math.random() - 0.5) * 0.05; // +/- 2.5%
        const noise = (previousPrice + scenarioChange) * noisePercentage;
        
        // 3. Calculate the final new price including both effects
        const newPrice = previousPrice + scenarioChange + noise;

        // 4. Update the stock's price and record it in history for the new day
        updateStockPrice(stock.id, newPrice, currentDay); //

        // 5. Set the 'change' property to the TRUE difference for the UI
        stock.change = newPrice - previousPrice;
    });

    updateAllUI();
    checkAllAchievements();

    if (currentDay >= totalDays) {
        endGame();
    }
}

function endGame() {
    if (!gameActive) return; 
    gameActive = false;
    
    const { totalWealth } = getPortfolioData(); //
    unlockAchievement('game_complete'); //

    if (totalWealth >= 25000) {
        unlockAchievement('market_master'); //
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
    const stock = getStockById(stockId); //
    const portfolioData = getPortfolioData(); //
    const portfolioStock = portfolioData.stocks.find(s => s.id === stockId); //

    if (stock) {
        openStockModal(stock, portfolioStock); //
    }
}

function handleBuyStock(stockId, quantity) {
    const stock = getStockById(stockId); //
    if (stock && buyStock(stock, quantity)) { //
        updateAllUI();
        checkAllAchievements();
        handleStockSelect(stockId); // Refresh modal
    }
}

function handleSellStock(stockId, quantity) {
    const portfolioStock = getPortfolioData().stocks.find(s => s.id === stockId); //
    if (!portfolioStock) {
        showNotification("You don't own this stock.", "error");
        return;
    }
    
    const marketStock = getStockById(stockId); //
    const costBasis = portfolioStock.averageCost; 
    
    if (sellStock(stockId, quantity)) { //
        if (marketStock.price > costBasis) {
            unlockAchievement('first_profit'); //
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
    updatePortfolio(getPortfolioData()); //
    updateStockMarket(getStocks()); //
    updateDay(currentDay); //
    updateAchievements(); //
}

function checkAllAchievements() {
    checkAchievements(getPortfolioData(), getStocks()); //
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

initializeUI(handleStockSelect, handleBuyStock, handleSellStock); //
startGame();