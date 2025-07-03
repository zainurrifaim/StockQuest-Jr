// js/ui.js
import { getStockById } from './stock.js';
import { getAchievements } from './achievements.js';

let activeStockId = null; // To keep track of the stock in the modal
let transactionCallback = null; // To handle buy/sell actions
let chartInstance = null;

// --- DOM Elements ---
const cashEl = document.getElementById('portfolio-cash');
const totalWealthEl = document.getElementById('total-wealth');
const portfolioStocksEl = document.getElementById('portfolio-stocks');
const stockMarketListEl = document.getElementById('stock-market-list');
const newsFeedEl = document.getElementById('news-feed');
const currentDayEl = document.getElementById('current-day');
const achievementsListEl = document.getElementById('achievements-list');
const notificationEl = document.getElementById('notification');

// Modal Elements
const stockModal = document.getElementById('stock-modal');
const closeModalBtn = document.getElementById('close-stock-modal');
const stockModalName = document.getElementById('stock-modal-name');
const stockModalDesc = document.getElementById('stock-modal-desc');
const stockModalPrice = document.getElementById('stock-modal-price');
const stockModalOwned = document.getElementById('stock-modal-owned');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const transactionQuantityInput = document.getElementById('transaction-quantity');


// --- Main UI Initialization ---
function initializeUI(stockSelectHandler, buyHandler, sellHandler) {
    // When a stock card in the market is clicked
    stockMarketListEl.addEventListener('click', (e) => {
        const stockCard = e.target.closest('.stock-card');
        if (stockCard) {
            activeStockId = stockCard.dataset.id;
            stockSelectHandler(activeStockId); // Let main.js know which stock to open
        }
    });

    // Modal close button
    closeModalBtn.addEventListener('click', closeStockModal);

    // Modal transaction buttons
    buyBtn.addEventListener('click', () => {
        const quantity = parseInt(transactionQuantityInput.value, 10);
        if (quantity > 0) {
            buyHandler(activeStockId, quantity);
        }
    });

    sellBtn.addEventListener('click', () => {
        const quantity = parseInt(transactionQuantityInput.value, 10);
        if (quantity > 0) {
            sellHandler(activeStockId, quantity);
        }
    });
}

// --- UI Update Functions ---

function updatePortfolio(portfolioData) {
    cashEl.textContent = formatCurrency(portfolioData.cash);
    totalWealthEl.textContent = formatCurrency(portfolioData.totalWealth);

    portfolioStocksEl.innerHTML = '';
    if (portfolioData.stocks.length === 0) {
        portfolioStocksEl.innerHTML = '<p class="text-gray-500 p-2">Your portfolio is empty. Buy some stocks!</p>';
    } else {
        portfolioData.stocks.forEach(stock => {
            const stockEl = document.createElement('div');
            stockEl.className = 'portfolio-stock-item';
            stockEl.innerHTML = `
                <div>
                    <p class="font-bold">${stock.name} (${stock.ticker})</p>
                    <p class="text-sm text-gray-600">${stock.quantity} shares</p>
                </div>
                <div class="font-semibold">${formatCurrency(stock.price * stock.quantity)}</div>
            `;
            portfolioStocksEl.appendChild(stockEl);
        });
    }
}

function updateStockMarket(stocks) {
    stockMarketListEl.innerHTML = '';
    stocks.forEach(stock => {
        const stockEl = document.createElement('div');
        stockEl.className = 'stock-card';
        stockEl.dataset.id = stock.id; // Set data-id for click events

        // Determine price change indicator icon and color
        let priceIndicatorIcon = 'fa-minus';
        let priceIndicatorColor = 'price-neutral';
        if (stock.change > 0) {
            priceIndicatorIcon = 'fa-arrow-up';
            priceIndicatorColor = 'price-up';
        } else if (stock.change < 0) {
            priceIndicatorIcon = 'fa-arrow-down';
            priceIndicatorColor = 'price-down';
        }

        stockEl.innerHTML = `
            <div class="stock-card-header">
                <span class="stock-name">${stock.name}</span>
                <span class="stock-ticker">${stock.ticker}</span>
            </div>
            <div class="stock-price-container">
                <span>${formatCurrency(stock.price)}</span>
                <i class="fas ${priceIndicatorIcon} price-indicator ${priceIndicatorColor}"></i>
            </div>
            <div class="text-sm text-gray-500">${stock.industry}</div>
        `;
        stockMarketListEl.appendChild(stockEl);
    });
}

function updateNewsFeed(event) {
    newsFeedEl.innerHTML = '';
    if (event) {
        newsFeedEl.innerHTML = `<p><i class="fas fa-newspaper mr-2"></i>${event.description}</p>`;
    } else {
        newsFeedEl.innerHTML = '<p class="text-gray-500">No major news today. A calm day in the markets.</p>';
    }
}

function updateDay(day) {
    currentDayEl.textContent = day;
}

function updateAchievements() {
    const achievements = getAchievements();
    achievementsListEl.innerHTML = '';
    const unlockedAchievements = achievements.filter(a => a.unlocked);

    if (unlockedAchievements.length === 0) {
        achievementsListEl.innerHTML = '<li class="text-gray-500">No achievements unlocked yet!</li>';
    } else {
        unlockedAchievements.forEach(ach => {
            const li = document.createElement('li');
            li.innerHTML = `<strong><i class="fas fa-trophy"></i> ${ach.title}</strong> ${ach.description}`;
            achievementsListEl.appendChild(li);
        });
    }
}

// --- Modal and Notification Functions ---

function openStockModal(stock, portfolioStock) {
    // Populate info
    stockModalName.textContent = `${stock.name} (${stock.ticker})`;
    stockModalDesc.textContent = stock.description;
    stockModalPrice.textContent = formatCurrency(stock.price);
    stockModalOwned.textContent = portfolioStock ? portfolioStock.quantity : 0;
    transactionQuantityInput.value = '1';

    // Draw chart
    const chartCtx = document.getElementById('stock-chart').getContext('2d');
    if (chartInstance) {
        chartInstance.destroy();
    }
    chartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: stock.history.map(h => `Day ${h.day}`),
            datasets: [{
                label: 'Price History',
                data: stock.history.map(h => h.price),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Show modal
    stockModal.classList.remove('hidden');
}

function closeStockModal() {
    stockModal.classList.add('hidden');
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    activeStockId = null;
}

function showNotification(message, type = 'error') {
    notificationEl.textContent = message;
    notificationEl.className = type; // 'success' or 'error' class from style.css
    notificationEl.classList.remove('hidden');

    setTimeout(() => {
        notificationEl.classList.add('hidden');
    }, 3000);
}

// --- Helper Function ---
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}


export {
    initializeUI,
    updatePortfolio,
    updateStockMarket,
    updateNewsFeed,
    updateDay,
    updateAchievements,
    showNotification,
    openStockModal,
    closeStockModal
};