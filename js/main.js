import { initializeStocks, getStocks, getStockById, updateStockPrice } from './stock.js';
import { getPortfolioData, buyStock, sellStock, resetPortfolio } from './portfolio.js';
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
    closeStockModal
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

/**
 * Starts or restarts the game.
 */
async function startGame() {
    currentDay = 1;
    gameActive = true;
    difficulty = difficultySelect.value;

    await loadScenarios(difficulty);

    initializeStocks();
    resetPortfolio();
    resetAchievements();

    // **FIX #1:** Apply Day 1's price changes *during* startup.
    // This ensures the game state is already correct before the player sees it.
    const firstDayScenario = getScenarioForDay(1);
    if (firstDayScenario) {
        // Silently apply the effects for day 1
        firstDayScenario.effects.forEach(effect => {
            const stock = getStockById(effect.target);
            if (stock) {
                const newPrice = stock.price + effect.change;
                updateStockPrice(stock.id, newPrice);
            }
        });
        // Update the news feed for day 1
        updateNewsFeed({ description: firstDayScenario.news });
    }

    updateAllUI(); // Now update the UI with the correct day 1 data

    nextDayBtn.classList.remove('hidden');
    restartBtn.classList.add('hidden');
    difficultySelect.disabled = false;
    showNotification(`Let the trading begin on ${difficulty} mode!`, 'success');
}

/**
 * Advances the game by one day using the loaded scenario.
 */
function nextDay() {
    if (!gameActive || currentDay >= totalDays) {
        if(currentDay >= totalDays) endGame();
        return;
    }

    // **FIX #2:** Increment the day *before* getting the new scenario.
    // This ensures we are fetching the scenario for the day we are advancing TO.
    currentDay++;

    const scenario = getScenarioForDay(currentDay);

    if (scenario) {
        updateNewsFeed({ description: scenario.news });
        scenario.effects.forEach(effect => {
            const stock = getStockById(effect.target);
            if (stock) {
                const newPrice = stock.price + effect.change;
                updateStockPrice(stock.id, newPrice);
            }
        });
    } else {
        updateNewsFeed({ description: "The market is quiet today, with no significant news." });
    }
    
    getStocks().forEach(stock => {
        const todaysHistory = stock.history[stock.history.length - 1];
        if (todaysHistory) {
            todaysHistory.day = currentDay -1; // History records the day that just passed
        }
    });

    updateAllUI();
    checkAllAchievements();

    if (currentDay >= totalDays) {
        endGame();
    }
}

/**
 * Ends the game and shows the final results.
 */
function endGame() {
    if (!gameActive) return; // Prevent endGame from running multiple times
    gameActive = false;
    
    const { totalWealth } = getPortfolioData();

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

// --- UI Handlers (No changes needed here) ---

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
        handleStockSelect(stockId);
    }
}

function handleSellStock(stockId, quantity) {
    const portfolioStock = getPortfolioData().stocks.find(s => s.id === stockId);
    if (!portfolioStock) {
        showNotification("You don't own this stock.", "error");
        return;
    }
    
    const marketStock = getStockById(stockId);
    const costBasis = portfolioStock.price;
    
    if (sellStock(stockId, quantity)) {
        if (marketStock.price > costBasis) {
            unlockAchievement('first_profit');
        }
        updateAllUI();
        checkAllAchievements();
        handleStockSelect(stockId);
    } else {
        showNotification("You can't sell more shares than you own.", "error");
    }
}

// --- Helper Functions (No changes needed here) ---

function updateAllUI() {
    updatePortfolio(getPortfolioData());
    updateStockMarket(getStocks());
    updateDay(currentDay);
    updateAchievements();
}

function checkAllAchievements() {
    checkAchievements(getPortfolioData());
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// --- Initialization ---

nextDayBtn.addEventListener('click', () => {
    if (currentDay === 1) {
        difficultySelect.disabled = true;
    }
    nextDay();
});

restartBtn.addEventListener('click', startGame);

difficultySelect.addEventListener('change', (e) => {
    if (currentDay > 1) {
        e.target.value = difficulty;
    } else {
        difficulty = e.target.value;
    }
});

initializeUI(handleStockSelect, handleBuyStock, handleSellStock);
startGame();