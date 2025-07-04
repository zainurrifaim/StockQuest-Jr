// js/stock.js

const initialStocks = [
    {
        id: 'TECH',
        name: 'Innovate Corp',
        ticker: 'INVT',
        price: 150,
        history: [],
        industry: 'Technology',
        change: 0,
        description: 'A leading technology company known for its innovative software solutions and cutting-edge artificial intelligence research.'
    },
    {
        id: 'HEALTH',
        name: 'Vitality Inc',
        ticker: 'VITA',
        price: 120,
        history: [],
        industry: 'Healthcare',
        change: 0,
        description: 'A major pharmaceutical firm that develops and markets life-saving drugs and medical devices worldwide.'
    },
    {
        id: 'ENERGY',
        name: 'Power Grid Co',
        ticker: 'GRID',
        price: 80,
        history: [],
        industry: 'Energy',
        change: 0,
        description: 'A large utility company that generates and distributes electricity to millions of homes and businesses.'
    },
    {
        id: 'FIN',
        name: 'Secure Bank',
        ticker: 'SBNK',
        price: 200,
        history: [],
        industry: 'Finance',
        change: 0,
        description: 'A trusted financial institution offering a wide range of banking, investment, and insurance services.'
    },
    {
        id: 'RETAIL',
        name: 'MegaMart',
        ticker: 'MMRT',
        price: 60,
        history: [],
        industry: 'Retail',
        change: 0,
        description: 'A massive chain of superstores that sells everything from groceries to electronics at competitive prices.'
    },
    {
        id: 'AUTO',
        name: 'AutoMakers',
        ticker: 'AUTO',
        price: 180,
        history: [],
        industry: 'Automotive',
        change: 0,
        description: 'A global car manufacturer famous for its reliable vehicles and its pioneering work in electric cars.'
    }
];

let stocks = [];

function initializeStocks() {
    stocks = JSON.parse(JSON.stringify(initialStocks));
    stocks.forEach(stock => {
        stock.history = [{ day: 0, price: stock.price }];
        stock.change = 0;
    });
}

function getStocks() {
    return stocks;
}

function getStockById(id) {
    return stocks.find(stock => stock.id === id);
}

/**
 * Updates a stock's price and records its history. The 'change' property
 * is now calculated and set directly in the main game loop (main.js).
 * @param {string} id - The stock's ID.
 * @param {number} newPrice - The new current price.
 * @param {number} day - The current day to record in history.
 */
function updateStockPrice(id, newPrice, day) {
    const stock = getStockById(id);
    if (stock) {
        stock.price = Math.max(1, newPrice); // Price cannot go below $1
        
        // Add a new entry to the history for the daily chart
        stock.history.push({ day: day, price: stock.price });
    }
}

export { initializeStocks, getStocks, getStockById, updateStockPrice };