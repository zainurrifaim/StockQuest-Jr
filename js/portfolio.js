import { showNotification } from './ui.js';
import { playSound } from './audio.js';
// NEW: Import getStockById to fetch the latest stock data
import { getStockById } from './stock.js';

const INITIAL_CASH = 10000;
let cash = INITIAL_CASH;
const portfolioStocks = new Map();

function resetPortfolio() {
    cash = INITIAL_CASH;
    portfolioStocks.clear();
}

/**
 * FIX: This function now calculates total wealth based on the CURRENT market price.
 */
function getPortfolioData() {
    const portfolioEntries = Array.from(portfolioStocks.values());
    let stockValue = 0;
    
    // Create a new array of stocks with their current market prices
    const stocksWithCurrentPrices = portfolioEntries.map(ownedStock => {
        // Get the most up-to-date stock data from the market
        const currentMarketData = getStockById(ownedStock.id);
        if (currentMarketData) {
            // Calculate the value of this holding with the current price
            stockValue += currentMarketData.price * ownedStock.quantity;
            
            // Return a new object with the current price for the UI
            return {
                ...ownedStock,
                price: currentMarketData.price, // Use the current market price
                ticker: currentMarketData.ticker // Ensure ticker is included
            };
        }
        return ownedStock; // Fallback, though should always be found
    });

    const totalWealth = cash + stockValue;
    return { cash, stocks: stocksWithCurrentPrices, totalWealth };
}


function buyStock(stock, quantity) {
    const cost = stock.price * quantity;
    if (cash >= cost) {
        cash -= cost;
        const existingStock = portfolioStocks.get(stock.id);
        if (existingStock) {
            existingStock.quantity += quantity;
        } else {
            // Only store the ID and quantity, as price and other data will be fetched live.
            portfolioStocks.set(stock.id, { id: stock.id, name: stock.name, quantity: quantity });
        }
        playSound('buy-sound');
        return true;
    } else {
        showNotification("Not enough cash to make this purchase!");
        return false;
    }
}

function sellStock(stockId, quantityToSell) {
    const ownedStock = portfolioStocks.get(stockId);
    
    if (ownedStock && quantityToSell > 0 && quantityToSell <= ownedStock.quantity) {
        // Get the current market price for the sale
        const currentMarketData = getStockById(stockId);
        if (!currentMarketData) return false; // Should not happen

        const revenue = currentMarketData.price * quantityToSell;
        cash += revenue;
        ownedStock.quantity -= quantityToSell;

        if (ownedStock.quantity <= 0) {
            portfolioStocks.delete(stockId);
        }
        playSound('sell-sound');
        return true;
    }
    return false;
}

export { getPortfolioData, buyStock, sellStock, resetPortfolio };